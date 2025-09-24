import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "./lib/api.js";
import { useAuth } from "./auth.jsx";
import "./Login.css";
import sentryLogo from "./assets/sentryLogo.jpg";
import loginImg from "./assets/loginImg.jpg";

export default function Login() {
    const [username, setUsername] = useState("");
    const [userpassword, setUserPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const next = location.state?.from?.pathname || "/home";
    const { reload, me } = useAuth();

    // ✅ 로그인 페이지 진입 시 잔여 토큰/리프레시 쿠키 정리 (자동 재로그인/401 루프 방지)
    useEffect(() => {
        api.clearAccessToken?.();
        fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    }, []);

    useEffect(() => {
        console.log("[Login] mount. next =", next);
        return () => console.log("[Login] unmount");
    }, [next]);

    // 로그인 상태면 홈으로
    useEffect(() => {
        if (me) {
            navigate("/home", { replace: true });
        }
    }, [me, navigate]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);

        console.group("[Login] 폼 제출");
        console.log("payload =", { username, pwLen: userpassword.length });
        console.time("[Login] 로그인 요청 소요");

        try {
            const res = await api("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // 백엔드는 password/pw/userpassword 모두 허용하도록 해두어도,
                // 프런트는 일반적으로 "password" 키를 쓰는 것을 권장합니다.
                body: JSON.stringify({ username, password: userpassword }),
                credentials: "include",
            });

            console.log("응답 status =", res.status, "ok =", res.ok);

            let data = null;
            try {
                data = await res.clone().json();
                console.log("응답 JSON =", data);
            } catch (parseErr) {
                console.warn("JSON 파싱 실패:", parseErr);
            }

            if (!res.ok) {
                const msg = data?.error || "로그인 실패";
                console.warn("로그인 실패(res.ok=false):", msg);
                throw new Error(msg);
            }
            if (!data?.accessToken) {
                console.warn("accessToken 없음");
                throw new Error("토큰이 응답에 없습니다.");
            }

            // 1) 토큰 저장
            api.setAccessToken(data.accessToken);
            console.log("accessToken length =", data.accessToken.length);
            console.log("peekAccessToken 존재? =", !!api.peekAccessToken?.());

            // 2) 토큰 기준으로 /api/me 재조회 완료까지 대기
            await reload();

            // 3) 보호 라우트로 이동
            console.log("navigate →", next);
            navigate(next, { replace: true });
        } catch (e2) {
            console.error("[Login] 에러:", e2?.message, e2);
            setErr(e2.message || "로그인 실패");
        } finally {
            setLoading(false);
            console.timeEnd("[Login] 로그인 요청 소요");
            console.groupEnd();
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
                        <label htmlFor="userpassword" className="login-label">비밀번호</label>
                        <input
                            id="userpassword"
                            type="password"
                            className="login-input"
                            value={userpassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                            placeholder="비밀번호를 입력하세요"
                            autoComplete="current-password"
                        />
                        {err && <p className="login-error">아이디와 비밀번호를 다시 입력해주세요</p>}
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? "로그인 중..." : "로그인"}
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
