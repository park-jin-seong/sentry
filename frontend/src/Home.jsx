import React, {useState, useEffect} from "react";
import "./Home.css";
import Chat from "./Chat";
import {useNavigate} from "react-router-dom";
import {useAuth} from "./auth.jsx";
import {api} from "./lib/api.js";
import sentryLogo from "./assets/sentryLogo.png";
import axios from "axios";
import CameraFeed from "./CameraFeed.jsx";
import closeIcon from "./assets/close.png"; 

const Home = () => {
    const KAKAO_MAP_API_KEY = import.meta.env.VITE_REACT_KAKAO_MAP_API_KEY;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const {me, loading} = useAuth();
    const [camList, setCamList] = useState([]);
    const navigate = useNavigate();

    const [showMap, setShowMap] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState(null);
    const [isKakaoMapLoaded, setIsKakaoMapLoaded] = useState(false);

    const isObserver = !!me?.roles?.includes?.("ROLE_OBSERVER");

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const onLogout = async () => {
        try {
            await api("/api/auth/logout", {method: "POST"});
        } finally {
            api.clearAccessToken?.();
            navigate("/login", {replace: true});
        }
    };

    /* Kakao Map SDK 로드 */
    useEffect(() => {
        const script = document.createElement("script");
        const appkey = KAKAO_MAP_API_KEY || "215819b4115f72be72f45137965dbc9e";
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&libraries=services,clusterer,drawing&autoload=false`;
        script.async = true;

        script.onload = () => {
            if (window.kakao && window.kakao.maps) {
                window.kakao.maps.load(() => setIsKakaoMapLoaded(true));
            }
        };

        document.head.appendChild(script);
        return () => {
            document.head.removeChild(script);
        };
    }, [KAKAO_MAP_API_KEY]);

    /* 로그인 후 카메라 목록 */
    useEffect(() => {
        if (me?.id && !loading) {
            getCamList();
        }
    }, [me, loading]);

    /* 맵 초기화/업데이트: selectedCoords 변경 시 */
    useEffect(() => {
        if (showMap && selectedCoords && isKakaoMapLoaded) {
            const container = document.getElementById("map-canvas");
            if (!container) return;

            // Kakao LatLng: (lat, lng) = (위도, 경도)
            const center = new window.kakao.maps.LatLng(
                selectedCoords.lat,
                selectedCoords.lng
            );

            const options = {center, level: 3};
            const map = new window.kakao.maps.Map(container, options);

            const marker = new window.kakao.maps.Marker({position: center});
            marker.setMap(map);
        }
    }, [showMap, selectedCoords, isKakaoMapLoaded]);

    const getCamList = async () => {
        if (!me?.id) return;
        try {
            const res = await axios.get(`/api/cam/list-byUserId?userId=${me.id}`);
            setCamList(res.data);
            console.log("카메라 목록:", res.data);
        } catch (err) {
            console.error("API 호출 실패", err);
        }
    };

    const loadMap = (cam) => {
        // (lat=coordy, lng=coordx)로 교정
        setSelectedCoords({lat: cam?.coordy, lng: cam?.coordx});
        setShowMap(true);
    };

    // 오버레이 클릭 시 닫힘 (모달 내부 클릭은 유지)
    const onOverlayClick = () => setShowMap(false);
    const stopPropagation = (e) => e.stopPropagation();

    return (
        <div className="app-container">
            <header className="top-bar">
                <div className="logo-container">
                    <img src={sentryLogo} alt="SENTRY" className="logo-img"/>
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
                            const camIndex = (index + 1).toString().padStart(2, "0");
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
                    {/* CameraFeed 전체 화면으로 덮음 (CSS에서 absolute inset:0) */}
                    <CameraFeed/>

                    {/* 지도 모달 오버레이 */}
                    {showMap && (
                        <div className="map-overlay" onClick={onOverlayClick}>
                            <div className="map-modal" onClick={stopPropagation}>
                                <div className="map-box">
                                    <div id="map-canvas" className="map-canvas"/>
                                </div>
                                <button
                                    className="map-close"
                                    onClick={() => setShowMap(false)}
                                    aria-label="지도 닫기"
                                    title="닫기"
                                >
                                    <img src={closeIcon} alt="닫기" draggable="false"/>
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* 우측 챗 패널 */}
            <div className={`collapsible-bar ${isSidebarOpen ? "open" : ""}`}>
                <button className="toggle-btn" onClick={toggleSidebar}>
                    <div className="toggle-icon">...</div>
                </button>
                <div className="bar-content">
                    <div className="chat-content-area">
                        {isSidebarOpen && <Chat/>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
