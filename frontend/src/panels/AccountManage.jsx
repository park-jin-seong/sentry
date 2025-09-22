// src/panels/AccountManage.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import "../Settings.css";

const ENDPOINTS = {
    list: "/api/accounts", // GET: [{ username, nickname?, role? }, ...]
    create: "/api/accounts/create", // POST body: { username, userpassword, nickname? }
    resetPw: (username) => `/api/accounts/${encodeURIComponent(username)}/userpassword`, // PATCH body: { userpassword }
    remove: (username) => `/api/accounts/${encodeURIComponent(username)}`, // DELETE
};

export default function AccountManage() {
    // 생성 폼
    const [form, setForm] = useState({
        username: "",
        userpassword: "",
        nickname: "",
        showPw: false,
    });
    const [busy, setBusy] = useState(false);

    // 목록
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // 생성 가능 역할 안내 (서버가 최종 강제하지만 UI 안내용)
    const [myRole, setMyRole] = useState("-");
    const nextCreatableRole = useMemo(() => {
        if (myRole === "MASTER") return "OWNER";
        if (myRole === "OWNER") return "OBSERVER";
        return "-";
    }, [myRole]);

    // 내 권한 + 목록 로드
    useEffect(() => {
        (async () => {
            try {
                // 내 정보
                const meRes = await api("/api/me");
                if (meRes.ok) {
                    const me = await meRes.json();
                    const role =
                        Array.isArray(me.roles) && me.roles.length
                            ? me.roles[0].replace(/^ROLE_/, "")
                            : me.role || "-";
                    setMyRole(role);
                }

                // 목록
                await fetchList();
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchList = async () => {
        const res = await api(ENDPOINTS.list);
        if (!res.ok) {
            console.error("계정 목록 조회 실패");
            setItems([]);
            return;
        }
        const data = await res.json().catch(() => []);
        // 서버가 배열을 돌려준다고 가정: [{username, nickname?, role?}]
        setItems(Array.isArray(data) ? data : data.items || []);
    };

    const onChange = (k) => (e) =>
        setForm((s) => ({ ...s, [k]: e.target.value }));

    const onCreate = async (e) => {
        e.preventDefault();
        if (busy) return;
        if (!form.username.trim() || form.userpassword.length < 8) {
            alert("아이디는 필수, 비밀번호는 8자 이상이어야 합니다.");
            return;
        }
        setBusy(true);
        try {
            const res = await api(ENDPOINTS.create, {
                method: "POST",
                body: JSON.stringify({
                    username: form.username.trim(),
                    userpassword: form.userpassword,
                    ...(form.nickname.trim()
                        ? { nickname: form.nickname.trim() }
                        : {}),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(data?.error || "생성 실패");
                return;
            }
            alert(
                `생성 완료: ${data.username || form.username} (${data.role || nextCreatableRole})`
            );
            setForm({ username: "", userpassword: "", nickname: "", showPw: false });
            await fetchList();
        } finally {
            setBusy(false);
        }
    };

    const onResetPw = async (username) => {
        const pw = prompt(`새 비밀번호를 입력하세요 (8자 이상)\n계정: ${username}`);
        if (!pw) return;
        if (pw.length < 8) {
            alert("8자 이상 입력하세요.");
            return;
        }
        const res = await api(ENDPOINTS.resetPw(username), {
            method: "PATCH",
            body: JSON.stringify({ userpassword: pw }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(data?.error || "비밀번호 변경 실패");
            return;
        }
        alert("비밀번호가 변경되었습니다.");
        await fetchList();
    };

    const onRemove = async (username) => {
        if (!window.confirm(`정말 삭제할까요?\n계정: ${username}`)) return;
        const res = await api(ENDPOINTS.remove(username), { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(data?.error || "삭제 실패");
            return;
        }
        await fetchList();
    };

    return (
        <section className="st-panel">

            {/* 생성 폼 */}
            <div className="st-card" style={{ marginBottom: 16, maxWidth: 560 }}>
                <h3 className="st-h3">계정 생성</h3>
                <p className="st-label" style={{ marginBottom: 8 }}>
                    내 역할: <b>{myRole}</b>{" "}
                    {nextCreatableRole !== "-" && (
                        <>
                            · 생성 가능한 역할: <b>{nextCreatableRole}</b>
                        </>
                    )}
                </p>

                <form className="st-form" onSubmit={onCreate}>
                    <label className="st-label">아이디</label>
                    <input
                        className="st-input"
                        value={form.username}
                        onChange={onChange("username")}
                        placeholder="새 아이디"
                    />

                    <label className="st-label">비밀번호</label>
                    <div className="st-pwbox">
                        <input
                            className="st-input pw"
                            type={form.showPw ? "text" : "userpassword"}
                            value={form.userpassword}
                            onChange={onChange("userpassword")}
                            placeholder="초기 비밀번호 (8자 이상)"
                            autoComplete="new-userpassword"
                        />
                        <button
                            type="button"
                            className="st-eye"
                            onClick={() =>
                                setForm((s) => ({ ...s, showPw: !s.showPw }))
                            }
                        >
                            {form.showPw ? "notshow" : "show"}
                        </button>
                    </div>

                    <label className="st-label">닉네임(선택)</label>
                    <input
                        className="st-input"
                        value={form.nickname}
                        onChange={onChange("nickname")}
                        placeholder="닉네임"
                    />

                    <button className="st-primary" type="submit" disabled={busy}>
                        {busy ? "생성 중..." : "생성하기"}
                    </button>
                </form>
            </div>

            {/* 목록 테이블 */}
            <div className="st-card" style={{ maxWidth: 760 }}>
                <h3 className="st-h3">계정 목록</h3>

                {loading ? (
                    <div className="st-label">불러오는 중…</div>
                ) : items.length === 0 ? (
                    <div className="st-label">계정이 없습니다.</div>
                ) : (
                    <div
                        style={{
                            background: "#ffffff10",
                            borderRadius: 12,
                            padding: 8,
                            overflow: "auto",
                        }}
                    >
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                            <tr style={{ textAlign: "left", opacity: 0.8 }}>
                                <th style={{ padding: "8px 10px" }}>아이디</th>
                                <th style={{ padding: "8px 10px" }}>비밀번호</th>
                                <th style={{ padding: "8px 10px", width: 220 }}>액션</th>
                            </tr>
                            </thead>
                            <tbody>
                            {items.map((u) => (
                                <tr key={u.username} style={{ borderTop: "1px solid #ffffff14" }}>
                                    <td style={{ padding: "10px" }}>{u.username}</td>
                                    <td style={{ padding: "10px" }}>••••••••</td>
                                    <td style={{ padding: "10px" }}>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                type="button"
                                                className="st-btn"
                                                onClick={() => onResetPw(u.username)}
                                            >
                                                수정
                                            </button>
                                            <button
                                                type="button"
                                                className="st-btn danger"
                                                onClick={() => onRemove(u.username)}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}
