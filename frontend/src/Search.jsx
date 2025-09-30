import React, { useState, useEffect } from "react";
import "./Search.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { api } from "./lib/api.js";
import sentryLogo from "./assets/sentryLogo.png";
import axios from "axios";

const classMap = {
    '인물': 0,
    '차량': 1
};
const Search = () => {
    const { me, loading } = useAuth();
    const [camList, setCamList] = useState([]);
    const [eventResults, setEventResults] = useState([]);
    const navigate = useNavigate();
    const [cameraName, setCameraName] = useState('');
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');
    const [selectedClass, setSelectedClass] = useState([]);
    const [selectedCameraIds, setSelectedCameraIds] = useState([]);
    const [timeError, setTimeError] = useState('');

    const isObserver = !!me?.roles?.includes?.("ROLE_OBSERVER");

    const onLogout = async () => {
        try {
            // 이 부분은 인증 관련 로직이므로 api 객체를 사용합니다.
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
                    // 데이터 조회는 axios를 직접 사용합니다. (이전 오류 해결 경로)
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

    const handleObjectClick = (objectName) => {
        const objectId = classMap[objectName];
        if (objectId === undefined) return;

        setSelectedClass(prevSelected => {
            if (prevSelected.includes(objectId)) {
                return prevSelected.filter(item => item !== objectId);
            } else {
                return [...prevSelected, objectId];
            }
        });
    };

    const handleCameraClick = (cameraId) => {
        setSelectedCameraIds(prevSelected => {
            if (prevSelected.includes(cameraId)) {
                return prevSelected.filter(id => id !== cameraId);
            } else {
                return [...prevSelected, cameraId];
            }
        });
    };

    const handleApplyClick = async () => {
        if (startDateTime && endDateTime) {
            const start = new Date(startDateTime);
            const end = new Date(endDateTime);

            if (start >= end) {
                setTimeError("종료 시간은 시작 시간보다 늦어야 합니다.");
                return;
            }
        }
        setTimeError("");

        const params = new URLSearchParams();

        selectedCameraIds.forEach(id => {
            params.append('cameraIds', id);
        });

        selectedClass.forEach(id => {
            params.append('classIds', id);
        });

        if (startDateTime) {
            params.append('startDateTime', startDateTime);
        }
        if (endDateTime) {
            params.append('endDateTime', endDateTime);
        }

        const url = `/api/image/list-by-criteria?${params.toString()}`;
        console.log("생성된 API URL:", url);

        try {
            const response = await axios.get(url);
            console.log("EventResult 목록:", response.data);
            setEventResults(response.data);
        } catch (err) {
            console.error("API 호출 실패", err);
            setEventResults([]);
        }
    };

    return (
        <div className="app-container">
            <header className="top-bar">
                <div className="logo-container">
                    <img src={sentryLogo} alt="SENTRY" className="logo-img" onClick={() => navigate('/home')}/>
                </div>
                <nav className="nav-menu">
                    <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate("/search"); }}>검색</a>
                    <a href="#" className="nav-item">도움말</a>
                    <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate(isObserver ? "/settings?tab=chat" : "/settings"); }}>{isObserver ? "채팅 설정" : "설정"}</a>
                    <a href="#" className="nav-item" onClick={onLogout}>로그아웃</a>
                </nav>
            </header>

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
                                className={`sidebar-item ${selectedCameraIds.includes(cam.cameraId) ? 'active' : ''}`}
                                onClick={() => { handleCameraClick(cam.cameraId); }}
                            >
                                {cam.cameraName}
                            </li>
                        ))}
                    </ul>

                    <div className="filter-section">
                        <label className="filter-label">객체 선택</label>
                        <div className="filter-buttons">
                            <button
                                className={`filter-btn ${selectedClass.includes(classMap['차량']) ? 'active' : ''}`}
                                onClick={() => handleObjectClick('차량')}
                            >
                                차량
                            </button>
                            <button
                                className={`filter-btn ${selectedClass.includes(classMap['인물']) ? 'active' : ''}`}
                                onClick={() => handleObjectClick('인물')}
                            >
                                인물
                            </button>
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
                <main className="content-area">
                    <div className="image-grid">
                        {eventResults.length > 0 ? (
                            eventResults.map((result) => (
                                <div key={result.eventResultId} className="image-card">
                                    <img
                                        src={`/api/image/stream/${result.eventResultId}`}
                                        alt={`Thumbnail for event ${result.eventResultId}`}
                                        className="thumbnail-img"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://placehold.co/150x100/CCCCCC/333333?text=No+Image";
                                        }}
                                    />
                                    <div className="image-info">
                                        <p>시간: {new Date(result.eventOccurTime).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        {`ID: ${result.eventResultId}`}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-results-message">검색 결과가 없습니다.</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Search;