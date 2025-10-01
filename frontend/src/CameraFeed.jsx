import {useEffect, useRef, useState} from "react";

import {useAuth} from "./auth.jsx";


const CameraFeed = () => {

    const [menu, setMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
    });

    const [isFullscreen, setIsFullscreen] = useState(false);

    const containerRef = useRef(null);

    const imgRef = useRef(null);

    const {me, loading} = useAuth();

    const wsRef = useRef(null);

    const [focusedArea, setFocusedArea] = useState(null);

// 전체 화면 일 때 전체화면 안 보이게 & 전체 화면 아닐 때 종료 안 보이게
 useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFsChange);
        return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

    useEffect(() => {

        if (!imgRef.current || !me?.id) return;

        if (wsRef.current) return; // 이미 연결되어 있으면 재생성 방지


        const ws = new WebSocket("ws://localhost:8080/ws/rtsp");

        wsRef.current = ws;


        ws.onopen = () => {

            ws.send(`${me.id}`);

            console.log("WebSocket connected");

        };


        ws.onmessage = (event) => {

            if (imgRef.current) {

//console.log(event);

                imgRef.current.src = "data:image/jpeg;base64," + event.data;

            }

        };


        ws.onclose = () => console.log("WebSocket closed");

        ws.onerror = (e) => console.log("WebSocket error", e);


        return () => {

            if (ws.readyState === WebSocket.OPEN) ws.close();

        };



    }, [me]);

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
        // 전체화면 여부에 따라 보정값 다르게
            const offsetX = isFullscreen ? 0 : 314;
            const offsetY = isFullscreen ? 0 : 60;

            setMenu({
                visible: true,
                x: e.pageX - offsetX,
                y: e.pageY - offsetY,
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

        console.log(`선택된 카메라 위치: row=${row}, col=${col}`);
        setFocusedArea({row, col});
    };

    const resetZoom = () => setFocusedArea(null);


    /** 전체화면 진입 */
    const enterFullscreen = () => {
        if (containerRef.current) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if (containerRef.current.webkitRequestFullscreen) { // Safari 지원
                containerRef.current.webkitRequestFullscreen();
            }
        }
    };

    /** 전체화면 종료 */
    const exitFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    };

    return (
        <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
            <img
                ref={imgRef}
                id="videoFrame0"
                alt="camera feed"
                style={{
                    width: "calc(100% - 18px)",
                    height: "100%",
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
                        background: "white",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        boxShadow: "2px 2px 8px rgba(0,0,0,0.2)",
                        minWidth: "120px",
                        zIndex: 1000,
                    }}
                >
                    <ul style={{ listStyle: "none", margin: 0, padding: "6px 0" }}>
                                                {!isFullscreen && (
                                                    <li
                                                        style={{ padding: "8px 16px", cursor: "pointer", color: "#333" }}
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
                                                        style={{ padding: "8px 16px", cursor: "pointer", color: "#333" }}
                                                        onClick={() => {
                                                            exitFullscreen();
                                                            setMenu({ ...menu, visible: false });
                                                        }}
                                                    >
                                                        영상 전체화면 종료
                                                    </li>
                                                )}

                        <li
                            style={{ padding: "8px 16px", cursor: "pointer", color: "#333"}}
                            onClick={() => alert("메뉴 3 실행")}
                        >
                            지도 보기
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};
export default CameraFeed;


// import { useEffect, useRef, useState } from "react"; // useState import
// import { useAuth } from "./auth.jsx";
//
// const CameraFeed = () => {
//     const imgRef = useRef(null);
//     const { me, loading } = useAuth();
//     const wsRef = useRef(null);
//     const [isStreaming, setIsStreaming] = useState(false); // 스트리밍 상태 추가
//
//     useEffect(() => {
//         if (!imgRef.current || !me?.id) return;
//         if (wsRef.current) return;
//
//         const ws = new WebSocket("ws://localhost:8080/ws/rtsp");
//         wsRef.current = ws;
//
//         ws.onopen = () => {
//             ws.send(`${me.id}`);
//             setIsStreaming(true); // 연결 성공 시 스트리밍 시작 상태로 변경
//             console.log("WebSocket connected");
//         };
//
//         ws.onmessage = (event) => {
//             if (imgRef.current) {
//                 imgRef.current.src = "data:image/jpeg;base64," + event.data;
//             }
//         };
//
//         ws.onclose = () => {
//             console.log("WebSocket closed");
//             setIsStreaming(false); // 연결 끊어짐 시 스트리밍 종료 상태로 변경
//         };
//
//         ws.onerror = (e) => {
//             console.log("WebSocket error", e);
//             setIsStreaming(false); // 에러 발생 시 스트리밍 종료
//         };
//
//         return () => {
//             if (ws.readyState === WebSocket.OPEN) ws.close();
//             setIsStreaming(false); // 컴포넌트 언마운트 시 스트리밍 종료
//         };
//     }, [me]);
//
//     // 조건부 렌더링을 사용하여 상태에 따라 다른 화면을 표시합니다.
//     return (
//         <div style={{ position: "relative", width: "100%", height: "100%" }}>
//             {isStreaming ? (
//                 <img ref={imgRef} id="videoFrame0" alt="camera feed" style={{ width: "100%", height: "100%" }} />
//             ) : (
//                 <div style={{
//                     position: "absolute",
//                     top: "50%",
//                     left: "50%",
//                     transform: "translate(-50%, -50%)",
//                     color: "red",
//                     fontSize: "24px",
//                     fontWeight: "bold"
//                 }}>
//                     서버 대기중
//                 </div>
//             )}
//         </div>
//     );
// };
//
// export default CameraFeed;