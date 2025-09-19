// Home.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { api } from "./lib/api.js";

export default function Home() {
    const { me, loading } = useAuth();
    const navigate = useNavigate();

    const onLogout = async () => {
        try { await api("/api/auth/logout", { method: "POST" }); }
        finally {
            api.clearAccessToken?.();
            navigate("/login", { replace: true });
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <h1>홈</h1>
            {loading ? (
                <p>불러오는 중…</p>
            ) : (
                <div>hello, {me?.username}</div> // ← 여기!
            )}

            <button className="login-btn" onClick={onLogout}>로그아웃</button>
            <div>
                <button className="setting" onClick={() => navigate("/settings")}>setting</button>
            </div>
        </div>
    );
}
