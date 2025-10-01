import {useEffect, useRef} from "react";

import {useAuth} from "./auth.jsx";


const CameraFeed = () => {

    const imgRef = useRef(null);

    const {me, loading} = useAuth();

    const wsRef = useRef(null);



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
        const img = e.currentTarget;                 // 클릭된 <img>
        const rect = img.getBoundingClientRect();
        const x = e.clientX - rect.left;             // 표시된 이미지 기준 X(px)
        const y = e.clientY - rect.top;              // 표시된 이미지 기준 Y(px)
        console.log("이미지 기준 좌표:", x, y);
    };


    return (
        <img
            ref={imgRef}
            id="videoFrame0"
            alt="camera feed"
            style={{ width: "100%", height: "100%" }}
            onDoubleClick={handleDoubleClick}
            draggable="false"
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