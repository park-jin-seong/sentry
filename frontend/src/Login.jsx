import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";
import sentryLogo from "./assets/sentryLogo.jpg";
import loginImg from "./assets/loginImg.jpg";

export default function Login() {
    const [username, setUsername] = useState("");
    const [userpassword, setUserPassword] = useState("");
    const [err, setErr] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const next = location.state?.from?.pathname || "/home";

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, userpassword }),
            });

            let data;
            const ct = res.headers.get("content-type");
            if (ct && ct.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(text || "서버가 JSON을 반환하지 않았습니다.");
            }

            if (!res.ok) {
                const message = data?.error || "로그인 실패";
                throw new Error(message);
            }

            if (!data?.accessToken) {
                throw new Error("토큰이 응답에 없습니다.");
            }

            localStorage.setItem("accessToken", data.accessToken);
            navigate(next, { replace: true });
        } catch (e) {
            setErr(e.message || "로그인 실패");
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-left">
                    <img src={sentryLogo} alt="SENTRY" className="login-logo" />

                    <form onSubmit={onSubmit} className="login-form">
                        <label htmlFor="username" className="login-label">
                            아이디
                        </label>
                        <input
                            id="username"
                            className="login-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="아이디를 입력하세요"
                            autoComplete="username"
                        />

                        <label htmlFor="userpassword" className="login-label">
                            비밀번호
                        </label>
                        <input
                            id="userpassword"
                            type="password"
                            className="login-input"
                            value={userpassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                            placeholder="비밀번호를 입력하세요"
                            autoComplete="current-password"
                        />

                        {err && (
                            <p className="login-error">아이디 또는 비밀번호가 올바르지 않습니다.</p>
                        )}

                        <button type="submit" className="login-btn">
                            로그인
                        </button>
                        {/* 회원가입은 submit 아님 (중복 submit 방지) */}
                        <button
                            type="button"
                            className="login-btn"
                            onClick={() => {}}
                        >
                            회원가입
                        </button>
                    </form>
                </div>

                <div className="login-right">
                    <img src={loginImg} alt="" className="login-illustration" />
                </div>
            </div>
        </div>
    );
}
