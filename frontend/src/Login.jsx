import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";
import sentryLogo from "./assets/sentryLogo.jpg";
import loginImg from "./assets/loginImg.jpg";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const next = location.state?.from?.pathname || "/dashboard";

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            if (!res.ok) {
                const msg = (await res.text()) || "로그인 실패";
                throw new Error(msg);
            }
            const data = await res.json(); // { token: "JWT..." }
            localStorage.setItem("accessToken", data.token);
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
                        <label htmlFor="username" className="login-label">아이디</label>
                        <input
                            id="username"
                            className="login-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="아이디를 입력하세요"
                            autoComplete="username"
                        />

                        <label htmlFor="password" className="login-label">비밀번호</label>
                        <input
                            id="password"
                            type="password"
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호를 입력하세요"
                            autoComplete="current-password"
                        />

                        {err && <p className="login-error">{"아이디 또는 비밀번호가 올바르지 않습니다."}</p>}

                        <button type="submit" className="login-btn">로그인</button>
                    </form>
                </div>

                <div className="login-right">
                    <img src={loginImg} alt="" className="login-illustration" />
                </div>
            </div>
        </div>
    );
}
