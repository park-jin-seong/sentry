// TopBar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { api } from "./lib/api.js";
import sentryLogo from "./assets/sentryLogo.png";

export default function TopBar() {
    const navigate = useNavigate();
    const { me } = useAuth();
    const isObserver = !!me?.roles?.includes?.("ROLE_OBSERVER");

    const onLogout = async () => {
        try {
            await api("/api/auth/logout", { method: "POST" });
        } finally {
            api.clearAccessToken?.();
            navigate("/login", { replace: true });
        }
    };

    return (
        <header className="top-bar">
            <div className="logo-container">
                <img
                    src={sentryLogo}
                    alt="SENTRY"
                    className="logo-img"
                    onClick={() => navigate("/home")}
                    style={{ cursor: "pointer" }}
                    role="button"
                />
            </div>

            <nav className="nav-menu">
                <NavLink
                    to="/home"
                    className={({isActive}) => `nav-item ${isActive ? "active" : ""}`}
                >
                    관제
                </NavLink>

                <NavLink
                    to="/search"
                    className={({isActive}) => `nav-item ${isActive ? "active" : ""}`}
                >
                    검색
                </NavLink>

                {/* 도움말: 항상 기본 스타일(회색), active 적용하지 않음 */}
                <NavLink to="/help" className="nav-item">
                    도움말
                </NavLink>

                <NavLink
                    to={isObserver ? "/settings?tab=chat" : "/settings"}
                    className={({isActive}) => `nav-item ${isActive ? "active" : ""}`}
                >
                    {isObserver ? "채팅 설정" : "설정"}
                </NavLink>

                <a href="#" className="nav-item" onClick={onLogout}>로그아웃</a>
            </nav>
        </header>
    );
}
