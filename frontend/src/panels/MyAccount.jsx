// src/components/settings/panels/MyAccount.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import "../Settings.css";
import { useAuth } from "../auth.jsx";

// 타임스탬프(초) → 로컬 문자열
function fmt(tsSec) {
    if (!tsSec) return "-";
    const d = new Date(tsSec * 1000);
    return d.toLocaleString();
}

// JWT payload 디코더 (fallback)
function decodeJwtLocal(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export default function MyAccount() {
    const { reload } = useAuth();
    const navigate = useNavigate();

    // 프로필 상태
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        username: "",
        nickname: "",
        userpassword: "",
        showPw: false,
    });

    // 토큰 표시 상태
    const [tokVer, setTokVer] = useState(0);
    const [showToken, setShowToken] = useState(false);
    const [refreshBusy, setRefreshBusy] = useState(false);

    // 현재 accessToken / payload
    const token = useMemo(() => api.peekAccessToken?.(), [tokVer]);
    const decode = api.decodeJwtPayload || decodeJwtLocal;
    const payload = useMemo(() => (token ? decode(token) : null), [token]);

    const nowSec = Math.floor(Date.now() / 1000);
    const expLeft = payload?.exp ? Math.max(payload.exp - nowSec, 0) : null;

    // 초기 내 정보 로드
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await api("/api/me");
                if (!res.ok) {
                    if (res.status === 401) navigate("/login", { replace: true });
                    return;
                }
                const me = await res.json().catch(() => ({}));
                if (!mounted) return;
                setForm((s) => ({
                    ...s,
                    username: me?.username ?? "",
                    nickname: me?.nickname ?? me?.username ?? "",
                }));
            } catch {}
        })();
        return () => {
            mounted = false;
        };
    }, [navigate]);

    // 프로필 입력
    const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

    // 프로필 저장
    const onSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        try {
            const body = {
                nickname: form.nickname,
                ...(form.userpassword ? { userpassword: form.userpassword } : {}),
            };
            const res = await api("/api/me/profile", {
                method: "PATCH",
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const msg = (await res.json().catch(() => ({})))?.error || "변경 실패";
                alert(msg);
                if (res.status === 401) navigate("/login", { replace: true });
                return;
            }
            alert("변경되었습니다.");
            setForm((s) => ({ ...s, userpassword: "" }));
        } finally {
            setSaving(false);
        }
    };

    // 토큰 관련 액션
    const logToken = () => {
        const t = api.peekAccessToken?.();
        console.log("[MyAccount] accessToken:", t || "<none>");
        if (t) console.log("[MyAccount] payload:", decode(t));
    };

    const onRefreshToken = async () => {
        if (refreshBusy) return;
        setRefreshBusy(true);
        try {
            if (api.refreshNow) {
                const newT = await api.refreshNow();
                console.log("[MyAccount] refreshed (helper):", newT?.slice(0, 20) + "…");
            } else {
                const r = await fetch("/api/auth/refresh", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });
                if (!r.ok) throw new Error("refresh failed");
                const data = await r.json().catch(() => ({}));
                if (!data?.accessToken) throw new Error("no accessToken in refresh");
                api.setAccessToken?.(data.accessToken);
                console.log("[MyAccount] refreshed (manual):", data.accessToken.slice(0, 20) + "…");
            }
            setTokVer((v) => v + 1);
            alert("토큰이 갱신되었습니다.");
        } catch (e) {
            console.error(e);
            alert("리프레시 실패. 다시 로그인해주세요.");
            navigate("/login", { replace: true });
        } finally {
            setRefreshBusy(false);
        }
    };

    // === 여기부터는 패널 내용만 ===
    return (
        <section className="st-panel">

            {/* 프로필 카드 */}
            <div className="st-card" style={{ marginBottom: 16 }}>
                <h3 className="st-h3">프로필</h3>
                <form className="st-form" onSubmit={onSubmit}>
                    <label className="st-label">아이디</label>
                    <input className="st-input" value={form.username} readOnly />

                    <label className="st-label">닉네임</label>
                    <input
                        className="st-input"
                        value={form.nickname}
                        onChange={onChange("nickname")}
                        placeholder="닉네임을 입력하세요"
                    />

                    <label className="st-label">비밀번호</label>
                    <div className="st-pwbox">
                        <input
                            className="st-input pw"
                            type={form.showPw ? "text" : "password"}
                            value={form.userpassword}
                            onChange={onChange("userpassword")}
                            placeholder="새 비밀번호(선택)"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="st-eye"
                            onClick={() => setForm((s) => ({ ...s, showPw: !s.showPw }))}
                            aria-label="비밀번호 보기 전환"
                        >
                            {form.showPw ? "notshow" : "show"}
                        </button>
                    </div>

                    <button className="st-primary" type="submit" disabled={saving}>
                        {saving ? "변경 중..." : "변경하기"}
                    </button>
                </form>
            </div>

            {/* 토큰 카드 */}
            <div className="st-card">
                <h3 className="st-h3">토큰</h3>

                <ul style={{ margin: "0 0 12px 0", paddingLeft: 16 }}>
                    <li>보유 여부: <b>{token ? "있음" : "없음"}</b></li>
                    <li>토큰 앞자리: {token ? token.slice(0, 20) + "…" : "-"}</li>
                    <li>발급(iat): {fmt(payload?.iat)}</li>
                    <li>만료(exp): {fmt(payload?.exp)}</li>
                    <li>남은 시간: {expLeft != null ? `${expLeft}s` : "-"}</li>
                    <li>roles: {payload?.roles ? JSON.stringify(payload.roles) : "-"}</li>
                    <li>subject(sub): {payload?.sub ?? "-"}</li>
                    <li>issuer(iss): {payload?.iss ?? "-"}</li>
                </ul>

                <div style={{ display: "grid", gap: 8 }}>
                    {showToken && (
                        <textarea
                            className="st-input"
                            readOnly
                            value={token || ""}
                            rows={4}
                            style={{ fontFamily: "monospace" }}
                        />
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="st-primary" type="button" onClick={() => setShowToken((s) => !s)}>
                            {showToken ? "토큰 숨기기" : "토큰 보기"}
                        </button>
                        <button className="st-primary" type="button" onClick={onRefreshToken} disabled={refreshBusy}>
                            {refreshBusy ? "리프레시 중..." : "수동 리프레시"}
                        </button>
                        <button className="st-primary" type="button" onClick={logToken}>
                            콘솔로 보기
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
