import {useEffect, useRef, useState} from "react";

import {useAuth} from "./auth.jsx";


const CameraFeed = () => {

    const imgRef = useRef(null);

    const {me, loading} = useAuth();

    const wsRef = useRef(null);

    const [focusedArea, setFocusedArea] = useState(null);


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

    return (
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
            />
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