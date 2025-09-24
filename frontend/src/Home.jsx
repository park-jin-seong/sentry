import React, { useState } from 'react';
import './Home.css';
import Chat from './Chat';
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { api } from "./lib/api.js";
import sentryLogo from "./assets/sentryLogo.png"

const Home = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { me, loading } = useAuth();
    const navigate = useNavigate();

    const isObserver = !!me?.roles?.includes?.("ROLE_OBSERVER");

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const onLogout = async () => {
        try { await api("/api/auth/logout", { method: "POST" }); }
        finally {
            api.clearAccessToken?.();
            navigate("/login", { replace: true });
        }
    };

    return (
        <div className="app-container">
            <header className="top-bar">
                <div className="logo-container">
                    <img src={sentryLogo} alt="SENTRY" className="logo-img" />
                </div>

                <nav className="nav-menu">
                    <a href="#" className="nav-item">검색</a>
                    <a href="#" className="nav-item">도움말</a>
                    <a
                        href="#"
                        className="nav-item"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(isObserver ? "/settings?tab=chat" : "/settings");
                        }}
                    >
                        {isObserver ? "채팅 설정" : "설정"}
                    </a>
                    <a href="#" className="nav-item" onClick={onLogout}>로그아웃</a>
                </nav>
            </header>

            <div className="main-content">
                <aside className="sidebar">
                    <ul className="sidebar-menu">
                        <li className="sidebar-item">01. [화재진압] 영상</li>
                        <li className="sidebar-item">02. [심박수] 공동터널 외부(영상)</li>
                        <li className="sidebar-item">03. [심박수] 공동터널 외부(소리)</li>
                        <li className="sidebar-item">04. [화재진압] 목표영상소</li>
                        <li className="sidebar-item">05. [화재진압] 목표영상소#1</li>
                        <li className="sidebar-item">06. [화재진압] 병원휴게소</li>
                    </ul>
                </aside>

                <main className="content-area">
                    <div className="content-header" />
                    <div className="video-grid" />
                </main>
            </div>

            {/* 우측 접이식 채팅 패널 */}
            <div className={`collapsible-bar ${isSidebarOpen ? 'open' : ''}`}>
                <button className="toggle-btn" onClick={toggleSidebar}>
                    <div className="toggle-icon">...</div>
                </button>
                <div className="bar-content">
                    <div className="chat-content-area">
                        {isSidebarOpen && <Chat />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
