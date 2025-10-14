import React, {useEffect, useRef, useState} from "react";
import {api} from "./lib/api.js";
import {useAuth} from "./auth.jsx";
import closeIcon from "./assets/close.png";
import axios from "axios";


const CameraFeed = () => {
    const [showMap, setShowMap] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState(null);
    const [isKakaoMapLoaded, setIsKakaoMapLoaded] = useState(false);
    const [camList, setCamList] = useState([]);

    const [isFullscreen, setIsFullscreen] = useState(false);

    const containerRef = useRef(null);
    // 전체 화면 일 때 전체화면 안 보이게 & 전체 화면 아닐 때 종료 안 보이게
    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFsChange);
        return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

    const KAKAO_MAP_API_KEY = import.meta.env.VITE_REACT_KAKAO_MAP_API_KEY;

    const getCamList = async () => {
        if (!me?.id) return;
        try {
            const res = await axios.get(`/api/cam/list-byUserId?userId=${me.id}`);
            setCamList(res.data);
        } catch (err) {
        }
    };

    const {me, loading} = useAuth();
    useEffect(() => {
        if (me?.id && !loading) {
            getCamList();
        }
    }, [me, loading]);


    const [menu, setMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        channel:-1,
    });

    const imgRef = useRef(null);

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

    useEffect(() => {
        if (showMap && selectedCoords && isKakaoMapLoaded) {
            const container = document.getElementById("map-canvas");
            if (!container) return;

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


    const wsRef = useRef(null);

    const [focusedArea, setFocusedArea] = useState(null);
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
    const loadMap = (cam) => {
        setSelectedCoords({lat: cam?.coordy, lng: cam?.coordx});
        setShowMap(true);
    };
    const onOverlayClick = () => setShowMap(false);
    const stopPropagation = (e) => e.stopPropagation();


    useEffect(() => {
        if (!imgRef.current || !me?.id) return;
        if (wsRef.current) return;

        const ws = new WebSocket("ws://localhost:8080/ws/rtsp");
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(`${me.id}`);
        };

        ws.onmessage = (event) => {
            if (imgRef.current) {
                imgRef.current.src = "data:image/jpeg;base64," + event.data;
            }
        };

        ws.onclose = () => console.log("WebSocket closed");
        ws.onerror = (e) => console.log("WebSocket error", e);

        return () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
            wsRef.current = null; // ref 초기화
        };
    }, [me]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);


    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                setMenu((prev) => ({ ...prev, visible: false }));
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    const handleContextMenu = (e) => {
        e.preventDefault();

        const offsetX = isFullscreen ? 0 : 314;
        const offsetY = isFullscreen ? 0 : 60;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const nx = x / rect.width;
        const ny = y / rect.height;

        const col = Math.min(2, Math.max(0, Math.floor(nx * 3)));
        const row = Math.min(2, Math.max(0, Math.floor(ny * 3)));

        focusedArea ? setMenu({
            visible: true,
            x: e.pageX - offsetX,
            y: e.pageY - offsetY,
            channel: 3*focusedArea.row+focusedArea.col,
        }) : setMenu({
            visible: true,
            x: e.pageX - offsetX,
            y: e.pageY - offsetY,
            channel: 3*row+col,
        });
    };

    const handleClick = () => {
        if (menu.visible) setMenu({ ...menu, visible: false });
    };


    const handleDoubleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const nx = x / rect.width;
        const ny = y / rect.height;

        const col = Math.min(2, Math.max(0, Math.floor(nx * 3)));
        const row = Math.min(2, Math.max(0, Math.floor(ny * 3)));

        setFocusedArea({row, col});
    };

    const resetZoom = () => setFocusedArea(null);


    const enterFullscreen = () => {
        const videoFrame = document.getElementById("videoFrame0");
        if (containerRef.current) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if (containerRef.current.webkitRequestFullscreen) { // Safari 지원
                containerRef.current.webkitRequestFullscreen();
            }
            videoFrame.style.width = "100%";
            videoFrame.style.height = "100%";
        }
    };

    const exitFullscreen = () => {
        const videoFrame = document.getElementById("videoFrame0");
        if (document.fullscreenElement) {
            document.exitFullscreen();
            videoFrame.style.width = "calc(100% - 18px)";
            videoFrame.style.height = "calc(100% - 60px)";
        }
    };


    return (
        <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
            <img
                ref={imgRef}
                id="videoFrame0"
                alt="camera feed"
                style={{
                    width: "calc(100% - 18px)",
                    height: "calc(100% - 60px)",
                    transition: "transform 0.3s ease",
                    transform: focusedArea
                        ? `scale(3) translate(-${focusedArea.col * (100 / 3)}%, -${focusedArea.row * (100 / 3)}%)`
                        : "scale(1)",
                    transformOrigin: "top left",
                    cursor: "pointer",
                }}
                onDoubleClick={focusedArea ? resetZoom : handleDoubleClick}
                onContextMenu={handleContextMenu}
                onClick={handleClick}
            />
            {menu.visible && (
                <div
                    style={{
                        position: "absolute",
                        top: menu.y,
                        left: menu.x,
                        background: "#333",
                        border: "1px solid #2E2E2E",
                        borderRadius: "6px",
                        boxShadow: "2px 2px 8px rgba(0,0,0,0.2)",
                        minWidth: "120px",
                        zIndex: 1000,
                    }}
                >
                    <ul style={{ listStyle: "none", margin: 0, padding: "6px 0" }}>
                        {!isFullscreen && (
                            <li
                                style={{
                                    padding: "8px 16px",
                                    cursor: "pointer",
                                    color: "#d9d9d9",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#ffffff";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#d9d9d9";
                                }}
                                onClick={() => {
                                    enterFullscreen();
                                    setMenu({ ...menu, visible: false });
                                }}
                            >
                                영상 전체화면
                            </li>
                        )}
                        {isFullscreen && (
                            <li
                                style={{
                                    padding: "8px 16px",
                                    cursor: "pointer",
                                    color: "#d9d9d9",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#ffffff";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#d9d9d9";
                                }}
                                onClick={() => {
                                    exitFullscreen();
                                    setMenu({ ...menu, visible: false });
                                }}
                            >
                                영상 전체화면 종료
                            </li>
                        )}
                        <li
                            style={{
                                padding: "8px 16px",
                                cursor: "pointer",
                                color: "#d9d9d9",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#ffffff";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = "#d9d9d9";
                            }}
                            onClick={() => {
                                loadMap(camList[menu.channel]);
                                setMenu({ ...menu, visible: false });
                            }}
                        >
                            지도 보기
                        </li>
                    </ul>
                </div>
            )}
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
        </div>
    );
};
export default CameraFeed;

