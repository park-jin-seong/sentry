// src/panels/MyAccount.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import "../Settings.css";

import eyeIcon from "../assets/eye.png";
import hideIcon from "../assets/hide.png";

export default function MyAccount() {
    const navigate = useNavigate();

    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        username: "",
        nickname: "",
        userpassword: "",
        showPw: false,
    });

    // 프로필 로드
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
                // noop
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

                    <button className="st-primary" type="submit" disabled={saving}>
                        {saving ? "변경 중..." : "변경하기"}
                    </button>
                </form>
            </div>
        </section>
    );
}
