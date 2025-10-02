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

const PAGE_SIZE = 9;

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

    const [pageHistory, setPageHistory] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastCursor, setLastCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

    const fetchEventResults = async (cursorId, cursorTime, direction = "next") => {
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

        if (cursorId && cursorTime) {
            params.append('cursorId', cursorId);
            params.append('cursorTime', cursorTime);
        }

        params.append('direction', direction);

        const url = `/api/image/list-by-criteria?${params.toString()}`;

        try {
            const response = await axios.get(url);
            const results = response.data;
            const hasNextPage = results.length > PAGE_SIZE;

            setHasMore(hasNextPage);

            const displayResults = results.slice(0, PAGE_SIZE);
            setEventResults(displayResults);

            if (displayResults.length > 0) {
                const lastItem = displayResults[displayResults.length - 1];
                setLastCursor({
                    id: lastItem.eventResultId,
                    time: lastItem.eventOccurTime
                });
            } else {
                setLastCursor(null);
            }

            return displayResults.length > 0;

        } catch (err) {
            console.error("API 호출 실패", err);
            setEventResults([]);
            setLastCursor(null);
            setHasMore(false);
            return false;
        }
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

        setIsLoading(true);
        try {
            const success = await fetchEventResults(null, null, "next");
            if(success) {
                setCurrentPage(1);
                setPageHistory([{ id: null, time: null }]);
            } else {
                setCurrentPage(1);
                setPageHistory([]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = async (direction) => {
        if (isLoading) return;

        setIsLoading(true);

        try {
            if (direction === 'next') {
                if (!hasMore || !lastCursor) return;
                const nextCursor = lastCursor;
                const success = await fetchEventResults(nextCursor.id, nextCursor.time, "next");

                if(success) {
                    setPageHistory(prev => [...prev, nextCursor]);
                    setCurrentPage(prev => prev + 1);
                }

            } else if (direction === 'prev') {
                if (currentPage <= 1) return;

                const targetPageIndex = currentPage - 2;
                const prevCursor = pageHistory[targetPageIndex];

                if (!prevCursor) {
                    setCurrentPage(1);
                    return;
                }

                const success = await fetchEventResults(prevCursor.id, prevCursor.time, "next");

                if(success) {
                    setPageHistory(prev => prev.slice(0, currentPage - 1));
                    setCurrentPage(prev => prev - 1);
                }
            }
        } finally {
            setIsLoading(false);
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
                        <button className="apply-btn" onClick={handleApplyClick} disabled={isLoading}>
                            {isLoading ? '검색 중...' : '검색'}
                        </button>
                    </div>
                </aside>
                <main className="content-area">
                    <div className="image-grid">
                        {eventResults.length > 0 ? (
                            eventResults.map((result, index) => {
                                const eventResultTime = result.eventOccurTime.substring(0, 19).replace('T', ' ');

                                return (
                                    <div key={index} className="event-result-item">
                                        <div className="image-id-info">
                                            {result.cameraName}
                                        </div>
                                        <img
                                            src={`/api/image/stream/${result.eventResultId}`}
                                            alt="Event Thumbnail"
                                        />
                                        <div className="image-info">
                                            <p>{eventResultTime}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="no-results-message">검색 결과가 없습니다.</p>
                        )}
                    </div>
                    {eventResults.length > 0 && (
                        <div className="pagination-controls">
                            <button
                                onClick={() => handlePageChange('prev')}
                                disabled={currentPage === 1 || isLoading}
                            >
                                이전
                            </button>
                            <span>페이지 {currentPage}</span>
                            <button
                                onClick={() => handlePageChange('next')}
                                disabled={!hasMore || isLoading}
                            >
                                다음
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Search;