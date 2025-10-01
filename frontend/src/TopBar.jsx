import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { api } from "./lib/api.js";
import sentryLogo from "./assets/sentryLogo.png";
import downloadIcon from "./assets/download.png";

export default function TopBar() {
    const navigate = useNavigate();
    const { me } = useAuth();
    const isObserver = !!me?.roles?.includes?.("ROLE_OBSERVER");
    const [showHelp, setShowHelp] = useState(false);

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
                />
            </div>

            <nav className="nav-menu">
                <NavLink to="/home" className="nav-item">관제</NavLink>
                <NavLink to="/search" className="nav-item">검색</NavLink>

                {/* 도움말 */}
                <span
                    className={`nav-item ${showHelp ? "active" : ""}`}
                    onClick={() => setShowHelp((prev) => !prev)}
                >
                    도움말
                </span>

                {showHelp && (
                    <div className="help-dropdown">
                        <a href="/files/help.pdf" download="도움말.pdf">
                            <img
                                src={downloadIcon}
                                alt="다운로드"
                                style={{
                                    width: "16px",
                                    height: "16px",
                                    marginRight: "6px",
                                    verticalAlign: "middle",
                                }}
                            />
                            PDF 다운로드 하기
                        </a>
                    </div>
                )}

                <NavLink
                    to={isObserver ? "/settings?tab=chat" : "/settings"}
                    className="nav-item"
                >
                    {isObserver ? "채팅 설정" : "설정"}
                </NavLink>

                <a href="#" className="nav-item" onClick={onLogout}>
                    로그아웃
                </a>
            </nav>
        </header>
    );
}
