import React, { useState, useEffect } from "react";
import "./Search.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { api } from "./lib/api.js";
import sentryLogo from "./assets/sentryLogo.png";
import axios from "axios";

const Home = () => {
    const { me, loading } = useAuth();
    const [camList, setCamList] = useState([]);
    const navigate = useNavigate();
    const [cameraName, setCameraName] = useState('');
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');
    const [selectedClass, setSelectedClass] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    const [timeError, setTimeError] = useState('');

    const isObserver = !!me?.roles?.includes?.("ROLE_OBSERVER");

    const onLogout = async () => {
        try {
            await api("/api/auth/logout", { method: "POST" });
        } finally {
            api.clearAccessToken?.();
            navigate("/login", { replace: true });
        }
    };

    useEffect(() => {
        if (loading || !me?.id) {
            return;
        }

        const getCamList = async () => {
            if (!cameraName) {
                setCamList([]);
                return;
            }
            const timeoutId = setTimeout(async () => {
                try {
                    const response = await axios.get(`/api/cam/list-byName?cameraName=${cameraName}`);
                    setCamList(response.data);
                } catch (err) {
                    console.error("API 호출 실패", err);
                }
            }, 250);

            return () => clearTimeout(timeoutId);
        };
        getCamList();
    }, [me, loading, cameraName]);

    const handleObjectClick = (objectType) => {
        setSelectedClass(prevSelected => {
            if (prevSelected.includes(objectType)) {
                return prevSelected.filter(item => item !== objectType);
            } else {
                return [...prevSelected, objectType];
            }
        });
    };

    const handleApplyClick = () => {
        if (startDateTime && endDateTime) {
            const start = new Date(startDateTime);
            const end = new Date(endDateTime);

            if (start >= end) {
                setTimeError("종료 시간은 시작 시간보다 늦어야 합니다.");
                return;
            }
        }

        setTimeError("");

        console.log("선택된 카메라 ID:", selectedCameraId);
        console.log("객체 선택:", selectedClass);
        console.log("시작 시간:", startDateTime);
        console.log("종료 시간:", endDateTime);
    };

    return (
        <div className="app-container">
            {/*<header className="top-bar">*/}
            {/*    <div className="logo-container">*/}
            {/*        <img*/}
            {/*            src={sentryLogo}*/}
            {/*            alt="SENTRY Logo"*/}
            {/*            className="logo-img"*/}
            {/*            onClick={() => navigate("/home")}*/}
            {/*            style={{ cursor: "pointer" }}*/}
            {/*        />*/}
            {/*    </div>*/}
            {/*    <nav className="nav-menu">*/}
            {/*        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate("/search"); }}>검색</a>*/}
            {/*        <a href="#" className="nav-item">도움말</a>*/}
            {/*        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate(isObserver ? "/settings?tab=chat" : "/settings"); }}>{isObserver ? "채팅 설정" : "설정"}</a>*/}
            {/*        <a href="#" className="nav-item" onClick={onLogout}>로그아웃</a>*/}
            {/*    </nav>*/}
            {/*</header>*/}

            <div className="main-content">
                <aside className="sidebar">
                    <div className="search-container">
                        <label className="search-label">카메라 검색</label>
                        <input type="text" className="search-input" value={cameraName} onChange={(e) => setCameraName(e.target.value)} />
                    </div>
                    <ul className="sidebar-menu">
                        {camList.map((cam, index) => (
                            <li
                                key={cam.cameraId || index}
                                className={`sidebar-item ${selectedCameraId === cam.cameraId ? 'active' : ''}`}
                                onClick={() => { setSelectedCameraId(cam.cameraId); console.log("카메라 id: ", cam.cameraId); }}
                            >
                                {cam.cameraName}
                            </li>
                        ))}
                    </ul>

                    <div className="filter-section">
                        <label className="filter-label">객체 선택</label>
                        <div className="filter-buttons">
                            <button className={`filter-btn ${selectedClass.includes('차량') ? 'active' : ''}`} onClick={() => handleObjectClick('차량')}>차량</button>
                            <button className={`filter-btn ${selectedClass.includes('인물') ? 'active' : ''}`} onClick={() => handleObjectClick('인물')}>인물</button>
                        </div>
                    </div>
                    <div className="date-time-section">
                        <label className="date-time-label">시작 날짜 및 시간</label>
                        <input type="datetime-local" value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} className="datetime-input" />
                        <label className="date-time-label">종료 날짜 및 시간</label>
                        <input type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} className="datetime-input" />
                    </div>
                    <div className="apply-btn-container">
                        {timeError && <p className="error-message">{timeError}</p>}
                        <button className="apply-btn" onClick={handleApplyClick}>적용</button>
                    </div>
                </aside>
                <main className="content-area"></main>
            </div>
        </div>
    );
};

export default Home;