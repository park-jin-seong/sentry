// src/panels/AccountManage.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import "../Settings.css";
import eyeIcon from "../assets/eye.png";
import hideIcon from "../assets/hide.png";

/** 서버 규약 */
const ENDPOINTS = {
    list: (role) => `/api/accounts${role ? `?role=${encodeURIComponent(role)}` : ""}`,
    create: "/api/accounts/create",
    resetPw: (username) => `/api/accounts/${encodeURIComponent(username)}/userpassword`,
    remove: (username) => `/api/accounts/${encodeURIComponent(username)}`,
    camAll: "/api/cam/all",
    assignOne: "/api/camera/assign",                // POST ?userId=&cameraId=
    assignBatch: "/api/camera/assign/batch",        // POST JSON { userId, cameraIds: [] }
    assignedIds: (userId) => `/api/camera/assigned/ids?userId=${encodeURIComponent(userId)}`, // GET -> [id...]
    assignedIdsByUsername: (username) =>
        `/api/camera/assigned/ids/by-username?username=${encodeURIComponent(username)}`,       // GET -> [id...]
};

export default function AccountManage() {
    // 생성 폼
    const [form, setForm] = useState({ username: "", userpassword: "", nickname: "", showPw: false });
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
        return null;
    }, [myRole]);

    // 카메라 할당 모달 상태
    const [assignTargetUser, setAssignTargetUser] = useState(null);

    // 내 권한 + 목록 로드
    useEffect(() => {
        (async () => {
            try {
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
                    status === 401
                        ? "로그인이 필요합니다."
                        : status === 403
                            ? "권한이 없습니다."
                            : "계정 목록을 불러오지 못했습니다."
                );
                return;
            }
            const list =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.items)
                        ? data.items
                        : Array.isArray(data?.content)
                            ? data.content
                            : Array.isArray(data?.data)
                                ? data.data
                                : [];
            setItems(list);
        } catch (err) {
            console.error("계정 목록 조회 예외", err);
            setItems([]);
            setErrorMsg("네트워크 오류가 발생했습니다.");
        }
    };

    const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

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
            const body = { username, userpassword: pw };
            const nick = form.nickname.trim();
            if (nick) body.nickname = nick;

            const res = await api(ENDPOINTS.create, { method: "POST", body: JSON.stringify(body) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(data?.error || "생성 실패");
                return;
            }

            alert(`생성 완료: ${data.username || username} (${data.role || nextCreatableRole})`);
            setForm({ username: "", userpassword: "", nickname: "", showPw: false });
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
            body: JSON.stringify({ userpassword: pw }),
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
        const res = await api(ENDPOINTS.remove(username), { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(data?.error || "삭제 실패");
            return;
        }
        await fetchListOnce();
    };

    const canAssign = myRole === "OWNER" && viewRole === "OBSERVER";

    return (
        <section className="st-panel">
            {/* 생성 폼 */}
            <div className="st-card" style={{ marginBottom: 16, maxWidth: 560 }}>
                <h3 className="st-h3">계정 생성</h3>
                <p className="st-label" style={{ marginBottom: 8 }}>
                    내 역할: <b>{myRole}</b>{" "}
                    {nextCreatableRole !== "-" && <> · 생성 가능한 역할: <b>{nextCreatableRole}</b></>}
                </p>

                <form className="st-form" onSubmit={onCreate}>
                    <label className="st-label">아이디</label>
                    <input className="st-input" value={form.username} onChange={onChange("username")} placeholder="새 아이디" />

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
                            onClick={() => setForm((s) => ({ ...s, showPw: !s.showPw }))}
                            aria-label={form.showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                        >
                            <img src={form.showPw ? hideIcon : eyeIcon} alt="" />
                        </button>
                    </div>

                    <label className="st-label">닉네임(선택)</label>
                    <input className="st-input" value={form.nickname} onChange={onChange("nickname")} placeholder="닉네임" />

                    <button className="st-primary" type="submit" disabled={busy}>
                        {busy ? "생성 중..." : "생성하기"}
                    </button>
                </form>
            </div>

            {/* 목록 테이블 */}
            <div className="st-card" style={{ maxWidth: 900 }}>
                <h3 className="st-h3">계정 목록</h3>
                <p className="st-label" style={{ marginBottom: 8 }}>
                    {viewRole ? <>보는 대상: <b>{viewRole}</b></> : "조회 대상 없음"}
                </p>
                {errorMsg && (
                    <div className="st-label" style={{ color: "#f66", marginBottom: 8 }}>
                        {errorMsg}
                    </div>
                )}

                {loading ? (
                    <div className="st-label">불러오는 중…</div>
                ) : items.length === 0 ? (
                    <div className="st-label">계정이 없습니다.</div>
                ) : (
                    <div style={{ background: "#ffffff10", borderRadius: 12, padding: 8, overflow: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                            <tr style={{ textAlign: "left", opacity: 0.8 }}>
                                <th style={{ padding: "8px 10px" }}>아이디</th>
                                <th style={{ padding: "8px 10px" }}>닉네임</th>
                                <th style={{ padding: "8px 10px" }}>역할</th>
                                <th style={{ padding: "8px 10px", width: 360 }}>액션</th>
                            </tr>
                            </thead>
                            <tbody>
                            {items.map((u) => (
                                <tr key={u.username} style={{ borderTop: "1px solid #ffffff14" }}>
                                    <td style={{ padding: "10px" }}>{u.username}</td>
                                    <td style={{ padding: "10px" }}>{u.nickname || "-"}</td>
                                    <td style={{ padding: "10px" }}>{(u.role || "").toString()}</td>
                                    <td style={{ padding: "10px" }}>
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                            <button type="button" className="st-btn" onClick={() => onResetPw(u.username)}>
                                                비밀번호 변경
                                            </button>
                                            <button type="button" className="st-btn danger" onClick={() => onRemove(u.username)}>
                                                삭제
                                            </button>

                                            {canAssign && (
                                                <button type="button" className="st-btn" onClick={() => setAssignTargetUser(u)}>
                                                    카메라 할당
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {assignTargetUser && (
                <AssignCameraModal
                    user={assignTargetUser}
                    onClose={() => setAssignTargetUser(null)}
                    onAssigned={async () => {
                        setAssignTargetUser(null);
                    }}
                />
            )}
        </section>
    );
}

/** 카메라 할당 모달 */
/** 카메라 할당 모달 */
function AssignCameraModal({ user, onClose, onAssigned }) {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);        // 전체 카메라
    const [checked, setChecked] = useState({});  // { [cameraId]: true }
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    // ✅ 추가: 최초 배정 상태를 저장해서 비교에 사용
    const [initialAssigned, setInitialAssigned] = useState([]); // number[]

    useEffect(() => {
        (async () => {
            setErr("");
            setLoading(true);
            try {
                // 1) 전체 카메라
                const allRes = await api("/api/cam/all");
                if (!allRes.ok) throw new Error("카메라 목록 조회 실패");
                const allList = await allRes.json();

                // 2) 해당 유저에게 이미 배정된 카메라 ID
                const targetUserId = user.id ?? user.userId ?? null;
                let assignedIds = [];

                if (targetUserId) {
                    const asgIdsRes = await api(`/api/camera/assigned/ids?userId=${encodeURIComponent(targetUserId)}`);
                    if (asgIdsRes.ok) {
                        const arr = await asgIdsRes.json();
                        assignedIds = Array.isArray(arr) ? arr.map(Number).filter(Boolean) : [];
                    }
                } else {
                    // (선택) username 기반 ID 조회 엔드포인트가 있다면 여기서 사용
                    // 예: /api/camera/assigned/ids/by-username?username=...
                    const byName = await api(`/api/camera/assigned/ids/by-username?username=${encodeURIComponent(user.username)}`);
                    if (byName.ok) {
                        const arr = await byName.json();
                        assignedIds = Array.isArray(arr) ? arr.map(Number).filter(Boolean) : [];
                    }
                }

                setRows(allList || []);

                // ✅ 최초 상태 저장
                setInitialAssigned(assignedIds);

                // 선택 상태 초기화
                const initChecked = {};
                for (const id of assignedIds) initChecked[id] = true;
                setChecked(initChecked);
            } catch (e) {
                setErr(e.message || "목록을 불러오지 못했습니다.");
                setRows([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    const toggle = (id) => setChecked((s) => ({ ...s, [id]: !s[id] }));
    const allSelectedIds = Object.entries(checked)
        .filter(([, v]) => v)
        .map(([k]) => Number(k));

    const save = async () => {
        if (saving) return;

        const targetUserId = user.id ?? user.userId;
        if (!targetUserId) {
            alert("userId를 찾을 수 없어 저장할 수 없습니다. 계정 목록 API에서 id를 내려주세요.");
            return;
        }

        // ✅ 추가/삭제 분리
        const selected = new Set(allSelectedIds);
        const initial = new Set(initialAssigned);

        const toAdd = [...selected].filter((id) => !initial.has(id));
        const toRemove = [...initial].filter((id) => !selected.has(id));

        if (toAdd.length === 0 && toRemove.length === 0) {
            alert("변경 사항이 없습니다.");
            return;
        }

        setSaving(true);
        setErr("");
        try {
            // 1) 추가(배정)
            if (toAdd.length > 0) {
                const res = await api("/api/camera/assign/batch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: targetUserId, cameraIds: toAdd }),
                });

                if (!res.ok) {
                    // 배치 실패 시 단건으로 폴백
                    for (const cid of toAdd) {
                        const r1 = await api(`/api/camera/assign?userId=${encodeURIComponent(targetUserId)}&cameraId=${encodeURIComponent(cid)}`, {
                            method: "POST",
                        });
                        if (!r1.ok) throw new Error("일부 할당(추가) 실패");
                    }
                }
            }

            // 2) 삭제(할당 해제)
            if (toRemove.length > 0) {
                // NOTE: 이미 구현된 엔드포인트 사용:
                // DELETE /api/camera/{cameraId}?userId={targetUserId}
                const results = await Promise.all(
                    toRemove.map((cid) =>
                        api(`/api/camera/${encodeURIComponent(cid)}?userId=${encodeURIComponent(targetUserId)}`, {
                            method: "DELETE",
                        })
                    )
                );

                const anyFail = results.some((r) => !r.ok);
                if (anyFail) throw new Error("일부 할당 해제(삭제) 실패");
            }

            alert(
                `완료!\n추가: ${toAdd.length}개, 삭제: ${toRemove.length}개\n대상: '${user.username}'`
            );

            // 저장 후 모달 닫기/콜백
            onAssigned?.();
        } catch (e) {
            setErr(e.message || "저장 실패");
        } finally {
            setSaving(false);
        }
    };

    const stop = (e) => e.stopPropagation();

    return (
        <div className="modal-backdrop" onMouseDown={onClose}>
            <div className="modal-sheet" onMouseDown={stop} style={{ maxWidth: 720 }}>
                <div className="modal-head">
                    <div className="st-h3">카메라 할당</div>
                    <button className="modal-x" onClick={onClose} aria-label="닫기">×</button>
                </div>

                <div style={{ marginBottom: 8, opacity: 0.8 }}>
                    대상 사용자: <b>{user.username}</b> (id: {user.id ?? user.userId ?? "?"})
                </div>

                {loading ? (
                    <div className="st-label">불러오는 중…</div>
                ) : rows.length === 0 ? (
                    <div className="st-label">카메라가 없습니다.</div>
                ) : (
                    <div className="chip-list-wrap">
                        <div className="chip-list-title">카메라명</div>
                        <div className="chip-sep" />
                        <div className="chip-list">
                            {rows.map((c) => {
                                const id = c.cameraId;
                                const selected = !!checked[id];
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        className={`chip ${selected ? "is-selected" : ""}`}
                                        title={c.cctvUrl || ""}
                                        onClick={() => toggle(id)}
                                    >
                                        <span className="chip-text">{c.cameraName}</span>
                                        {selected && <span className="chip-check">✔</span>}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="chip-sep" />
                    </div>
                )}

                {err && <div className="st-label" style={{ color: "#f66", marginTop: 8 }}>{err}</div>}

                <div className="cam-actions" style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="st-btn" onClick={onClose}>취소</button>
                    <button className="st-primary" onClick={save} disabled={saving || loading}>
                        {saving ? "저장 중…" : "저장"}
                    </button>
                </div>
            </div>
        </div>
    );
}
