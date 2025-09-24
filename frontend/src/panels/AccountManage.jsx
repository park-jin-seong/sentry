import {useEffect, useMemo, useState} from "react";
import {api} from "../lib/api.js";               // ← 프로젝트 구조에 맞게 조정
import "../Settings.css";

// 아이콘 이미지
import eyeIcon from "../assets/eye.png";
import hideIcon from "../assets/hide.png";

/**
 * 서버 규약
 * - 비밀번호 필드명은 userpassword
 * - 목록 조회는 role 쿼리 파라미터로 대상 역할 지정
 */
const ENDPOINTS = {
    list: (role) => `/api/accounts${role ? `?role=${encodeURIComponent(role)}` : ""}`,
    create: "/api/accounts/create",
    resetPw: (username) => `/api/accounts/${encodeURIComponent(username)}/userpassword`,
    remove: (username) => `/api/accounts/${encodeURIComponent(username)}`,
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
    const [errorMsg, setErrorMsg] = useState("");

    // 내 역할 & 생성 가능 역할 안내
    const [myRole, setMyRole] = useState("-");
    const nextCreatableRole = useMemo(() => {
        if (myRole === "MASTER") return "OWNER";
        if (myRole === "OWNER") return "OBSERVER";
        return "-";
    }, [myRole]);

    // 내가 볼 수 있는 대상 역할(목록 필터)
    const viewRole = useMemo(() => {
        if (myRole === "MASTER") return "OWNER";
        if (myRole === "OWNER") return "OBSERVER";
        return null; // OBSERVER 등은 조회 대상 없음
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
                } else {
                    setErrorMsg("내 정보 조회 실패");
                }
                await fetchListOnce();
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 역할이 정해지면 목록 다시 로드
    useEffect(() => {
        if (!loading) fetchListOnce();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewRole]);

    const fetchListOnce = async () => {
        setErrorMsg("");
        try {
            const res = await api(ENDPOINTS.list(viewRole));
            const status = res.status;
            const text = await res.text();
            let data = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                console.error("JSON parse error", e, text);
            }

            if (!res.ok) {
                console.error("계정 목록 조회 실패", status, data);
                setItems([]);
                setErrorMsg(
                    status === 401 ? "로그인이 필요합니다."
                        : status === 403 ? "권한이 없습니다."
                            : "계정 목록을 불러오지 못했습니다."
                );
                return;
            }

            // 다양한 응답 형태 수용
            const list =
                Array.isArray(data) ? data
                    : Array.isArray(data?.items) ? data.items
                        : Array.isArray(data?.content) ? data.content
                            : Array.isArray(data?.data) ? data.data
                                : [];

            setItems(list);
        } catch (err) {
            console.error("계정 목록 조회 예외", err);
            setItems([]);
            setErrorMsg("네트워크 오류가 발생했습니다.");
        }
    };

    const onChange = (k) => (e) => setForm((s) => ({...s, [k]: e.target.value}));

    const onCreate = async (e) => {
        e.preventDefault();
        if (busy) return;

        const username = form.username.trim();
        const pw = form.userpassword;

        if (!username || pw.length < 8) {
            alert("아이디는 필수, 비밀번호는 8자 이상이어야 합니다.");
            return;
        }

        setBusy(true);
        try {
            const body = {username, userpassword: pw}; // 서버 필드명 userpassword
            const nick = form.nickname.trim();
            if (nick) body.nickname = nick;

            const res = await api(ENDPOINTS.create, {method: "POST", body: JSON.stringify(body)});
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(data?.error || "생성 실패");
                return;
            }

            alert(`생성 완료: ${data.username || username} (${data.role || nextCreatableRole})`);
            setForm({username: "", userpassword: "", nickname: "", showPw: false});
            await fetchListOnce();
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
            body: JSON.stringify({userpassword: pw}), // 서버 필드명 userpassword
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(data?.error || "비밀번호 변경 실패");
            return;
        }
        alert("비밀번호가 변경되었습니다.");
        await fetchListOnce();
    };

    const onRemove = async (username) => {
        if (!window.confirm(`정말 삭제할까요?\n계정: ${username}`)) return;
        const res = await api(ENDPOINTS.remove(username), {method: "DELETE"});
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(data?.error || "삭제 실패");
            return;
        }
        await fetchListOnce();
    };

    return (
        <section className="st-panel">
            {/* 생성 폼 */}
            <div className="st-card" style={{marginBottom: 16, maxWidth: 560}}>
                <h3 className="st-h3">계정 생성</h3>
                <p className="st-label" style={{marginBottom: 8}}>
                    내 역할: <b>{myRole}</b>{" "}
                    {nextCreatableRole !== "-" && <> · 생성 가능한 역할: <b>{nextCreatableRole}</b></>}
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
                            type={form.showPw ? "text" : "password"}
                            value={form.userpassword}
                            onChange={onChange("userpassword")}
                            placeholder="비밀번호"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="st-eye"
                            onClick={() => setForm(s => ({...s, showPw: !s.showPw}))}
                            aria-label={form.showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                        >
                            <img src={form.showPw ? hideIcon : eyeIcon} alt=""/>
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
            <div className="st-card" style={{maxWidth: 760}}>
                <h3 className="st-h3">계정 목록</h3>
                <p className="st-label" style={{marginBottom: 8}}>
                    {viewRole ? <>보는 대상: <b>{viewRole}</b></> : "조회 대상 없음"}
                </p>
                {errorMsg && (
                    <div className="st-label" style={{color: "#f66", marginBottom: 8}}>
                        {errorMsg}
                    </div>
                )}

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
                        <table style={{width: "100%", borderCollapse: "collapse"}}>
                            <thead>
                            <tr style={{textAlign: "left", opacity: 0.8}}>
                                <th style={{padding: "8px 10px"}}>아이디</th>
                                <th style={{padding: "8px 10px"}}>닉네임</th>
                                <th style={{padding: "8px 10px"}}>역할</th>
                                <th style={{padding: "8px 10px", width: 220}}>액션</th>
                            </tr>
                            </thead>
                            <tbody>
                            {items.map((u) => (
                                <tr key={u.username} style={{borderTop: "1px solid #ffffff14"}}>
                                    <td style={{padding: "10px"}}>{u.username}</td>
                                    <td style={{padding: "10px"}}>{u.nickname || "-"}</td>
                                    <td style={{padding: "10px"}}>{(u.role || "").toString()}</td>
                                    <td style={{padding: "10px"}}>
                                        <div style={{display: "flex", gap: 8}}>
                                            <button
                                                type="button"
                                                className="st-btn"
                                                onClick={() => onResetPw(u.username)}
                                            >
                                                비밀번호 변경
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
