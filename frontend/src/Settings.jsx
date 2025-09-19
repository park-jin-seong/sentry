import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./lib/api.js";
import "./Settings.css";

export default function Settings() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        username: "",     // 아이디 (read-only)
        nickname: "",     // 닉네임
        password: "",     // 새 비밀번호
        showPw: false,
    });

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
            } catch {
                // 네트워크 에러 등은 조용히 무시
            }
        })();
        return () => { mounted = false; };
    }, [navigate]);

    const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        try {
            const body = {
                nickname: form.nickname,
                // 비밀번호를 비우면 변경 안 함
                ...(form.password ? { password: form.password } : {}),
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
            setForm((s) => ({ ...s, password: "" }));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="st-wrap">
            <aside className="st-aside">
                <div className="st-logo">SENTRY</div>

                <div className="st-sec-title">사용자 설정</div>
                <nav className="st-nav">
                    <button className="st-nav-item active">내 계정</button>
                    <button className="st-nav-item" disabled>계정관리</button>
                    <button className="st-nav-item" disabled>채널 설정</button>
                </nav>

                <div className="st-sec-title mt24">연 설정</div>
                <nav className="st-nav">
                    <button className="st-nav-item" disabled>카메라 설정</button>
                    <button className="st-nav-item" disabled>분석설정</button>
                </nav>
            </aside>

            <main className="st-main">
                <button
                    className="st-close"
                    aria-label="닫기"
                    title="닫기"
                    onClick={() => navigate("/home")}
                >
                    ×
                </button>

                <section className="st-panel">
                    <h1 className="st-h1">내 계정</h1>

                    <div className="st-card">
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
                                    value={form.password}
                                    onChange={onChange("password")}
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
                </section>
            </main>
        </div>
    );
}
