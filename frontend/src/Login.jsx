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
            console.log("[Login] 요청 전송 /api/auth/login", { username });
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // refresh 쿠키 수신
                body: JSON.stringify({ username, userpassword }),
            });

            const ct = res.headers.get("content-type");
            const data = ct?.includes("application/json") ? await res.json() : null;

            if (!res.ok) {
                console.error("[Login] 실패 상태코드:", res.status, data);
                throw new Error(data?.error || "로그인 실패");
            }
            if (!data?.accessToken) throw new Error("토큰이 응답에 없습니다.");

            localStorage.setItem("accessToken", data.accessToken);
            console.log("[Login] 저장된 accessToken:", localStorage.getItem("accessToken"));

            navigate(next, { replace: true });
        } catch (e) {
            console.error("[Login] 에러:", e);
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
                        <input id="username" className="login-input" value={username}
                               onChange={(e) => setUsername(e.target.value)} placeholder="아이디를 입력하세요" autoComplete="username" />
                        <label htmlFor="userpassword" className="login-label">비밀번호</label>
                        <input id="userpassword" type="password" className="login-input" value={userpassword}
                               onChange={(e) => setUserPassword(e.target.value)} placeholder="비밀번호를 입력하세요" autoComplete="current-password" />
                        {err && <p className="login-error">{err}</p>}
                        <button type="submit" className="login-btn">로그인</button>
                        <button type="button" className="login-btn" onClick={() => {}}>회원가입</button>
                    </form>
                </div>
                <div className="login-right">
                    <img src={loginImg} alt="" className="login-illustration" />
                </div>
            </div>
        </div>
    );
}
