import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import Chat from './Chat'; // 1. Chat 컴포넌트 임포트
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { api } from "./lib/api.js";
import axios from 'axios';
import CameraFeed from "./CameraFeed.jsx";

const Home = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { me, loading } = useAuth();
    const [camList, setCamList] = useState([]);
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    const onLogout = async () => {
        try { await api("/api/auth/logout", { method: "POST" }); }
        finally {
            api.clearAccessToken?.();
            navigate("/login", { replace: true });
        }
    };

    const getCamList = async () => {
        if (!me?.id) return; // me 객체가 없으면 API 호출을 막습니다.
        try {
            const response = await axios.get(`/api/cam/list/${me.id}`);
            setCamList(response.data);
            console.log("카메라 목록:", response.data);
        } catch (err) {
            console.error("API 호출 실패", err);
        }
    };
    const getCamInfo = async () => {
        console.log(me);
        try {
            await axios.get(`/api/cam/${me.id}`);
        } catch (err) {
            console.error("API 호출 실패", err);
        }
    };

    return (
        <div className="app-container">

            <header className="top-bar">
                <div className="logo-container">
                    <span className="logo">SENTRY</span>
                </div>
                <nav className="nav-menu">
                    <a href="#" className="nav-item">검색</a>
                    <a href="#" className="nav-item active">도움말</a>
                    <a href="#" className="nav-item" onClick={() => navigate("/settings")}>설정</a>
                    <a href="#" className="nav-item" onClick={onLogout} >로그아웃</a>
                    <button onClick={getCamInfo}>요청 버튼(나중에 바꾸기)</button>
                </nav>
            </header>


            <div className="main-content">

                <aside className="sidebar">
                    <ul className="sidebar-menu">
                        {camList.map((cam, index) => (
                            <li key={cam.id || index} className="sidebar-item">
                                {`${index + 1}. [${cam.cameraName}]`}
                            </li>
                        ))}
                    </ul>
                </aside>


                <main className="content-area">
                    <div className="content-header">

                    </div>
                    <div className="video-grid">
                        <CameraFeed></CameraFeed>
                    </div>
                </main>
            </div>


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