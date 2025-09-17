// src/Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./lib/api.js";

export default function Home() {
    const [me, setMe] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        console.log("[Home] 현재 저장된 accessToken:", token);

        (async () => {
            const res = await api("/api/me");
            if (res.status === 401) {
                console.warn("[Home] 401 → 로그인 페이지 이동");
                navigate("/login");
                return;
            }
            const data = await res.json();
            console.log("[Home] /api/me 응답:", data);
            setMe(data);
        })();
    }, [navigate]);

    const onLogout = async () => {
        console.log("[Home] 로그아웃 요청");
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        localStorage.removeItem("accessToken");
        navigate("/login");
    };

    return (
        <div style={{ padding: 24 }}>
            <h1>홈</h1>
            <p>로그인 성공!</p>
            {me && <pre>{JSON.stringify(me, null, 2)}</pre>}
            <button type="button" className="login-btn" onClick={onLogout}>
                로그아웃
            </button>
        </div>
    );
}
