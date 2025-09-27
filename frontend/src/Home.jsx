import React, { useState, useEffect, useRef } from "react";
import "./Home.css";
import Chat from "./Chat";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { api } from "./lib/api.js";
import sentryLogo from "./assets/sentryLogo.png";
import axios from "axios";
import CameraFeed from "./CameraFeed.jsx";

const Home = () => {
    const KAKAO_MAP_API_KEY = import.meta.env.VITE_REACT_KAKAO_MAP_API_KEY;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { me, loading } = useAuth();
    const [camList, setCamList] = useState([]);
    const navigate = useNavigate();

    const [showMap, setShowMap] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState(null);
    const [isKakaoMapLoaded, setIsKakaoMapLoaded] = useState(false);

    const isObserver = !!me?.roles?.includes?.("ROLE_OBSERVER");

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const onLogout = async () => {
        try {
            await api("/api/auth/logout", { method: "POST" });
        } finally {
            api.clearAccessToken?.();
            navigate("/login", { replace: true });
        }
    };

    useEffect(() => {
        const script = document.createElement('script');
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services,clusterer,drawing&autoload=false`;
        script.async = true;

        script.onload = () => {
            if (window.kakao && window.kakao.maps) {
                window.kakao.maps.load(() => {
                    setIsKakaoMapLoaded(true);
                });
            }
        };

        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    useEffect(() => {
        if (me?.id && !loading) {
            getCamList();
        }
    }, [me, loading]);

    useEffect(() => {
        if (showMap && selectedCoords && isKakaoMapLoaded) {
            const container = document.getElementById('map');
            if (!container) return;

            const options = {
                center: new window.kakao.maps.LatLng(selectedCoords.x, selectedCoords.y),
                level: 3,
            };

            const map = new window.kakao.maps.Map(container, options);
            const markerPosition = new window.kakao.maps.LatLng(selectedCoords.x, selectedCoords.y);
            const marker = new window.kakao.maps.Marker({
                position: markerPosition,
            });

            marker.setMap(map);
        }
    }, [showMap, selectedCoords, isKakaoMapLoaded]);

    const getCamList = async () => {
        if (!me?.id) return;
        try {
            const response = await axios.get(`/api/cam/list-byUserId?userId=${me.id}`);
            setCamList(response.data);
            console.log("카메라 목록:", response.data);
        } catch (err) {
            console.error("API 호출 실패", err);
        }
    };

    const loadMap = (cam) => {
        setSelectedCoords({ x: cam.coordx, y: cam.coordy });
        setShowMap(true);
    };

    return (
        <div className="app-container">
            <header className="top-bar">
                <div className="logo-container">
                    <img src={sentryLogo} alt="SENTRY" className="logo-img" />
                </div>

                <nav className="nav-menu">
                    <a
                        href="#"
                        className="nav-item"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate("/search");
                        }}
                    >
                        검색
                    </a>
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
                        {camList.map((cam, index) => {
                            const camIndex = (index + 1).toString().padStart(2, '0');
                            return (
                                <li
                                    key={cam.id || index}
                                    className="sidebar-item"
                                    onClick={() => loadMap(cam)}
                                >
                                    {`${camIndex}_${cam.cameraName}`}
                                </li>
                            );
                        })}
                    </ul>
                </aside>

                <main className="content-area">
                    <CameraFeed />
                    {showMap && (
                        <div
                            id="map"
                            style={{
                                position: 'absolute',
                                top: '50px',
                                left: '50px',
                                width: '1500px',
                                height: '750px',
                                zIndex: 100,
                                border: '1px solid black'
                            }}
                        >
                            <button
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    zIndex: 200,
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    border: '1px solid #ccc',
                                    color: "black"
                                }}
                                onClick={() => setShowMap(false)}
                            >
                                ✕
                            </button>
                        </div>

                    )}
                </main>
            </div>

            <div className={`collapsible-bar ${isSidebarOpen ? "open" : ""}`}>
                <button className="toggle-btn" onClick={toggleSidebar}>
                    <div className="toggle-icon">...</div>
                </button>
                <div className="bar-content">
                    <div className="chat-content-area">{isSidebarOpen && <Chat />}</div>
                </div>
            </div>
        </div>
    );
};

export default Home;