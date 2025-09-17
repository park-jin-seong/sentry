import { useEffect } from "react";

export default function Home() {
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        console.log("[Home.jsx] 현재 저장된 토큰:", token);
    }, []);

    return (
        <div style={{ padding: 24 }}>
            <h1>홈</h1>
            <p>로그인 성공!</p>

            <button type="submit" className="login-btn">
                로그아웃 (아직 기능 안 됨)
            </button>
        </div>
    );
}
