import { useEffect, useRef } from "react";
import { useAuth } from "./auth.jsx";

const CameraFeed = () => {
    const imgRef = useRef(null);
    const { me, loading } = useAuth();
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
                console.log(event);
                imgRef.current.src = "data:image/jpeg;base64," + event.data;
            }
        };

        ws.onclose = () => console.log("WebSocket closed");
        ws.onerror = (e) => console.log("WebSocket error", e);

        return () => {
            if (ws.readyState === WebSocket.OPEN) ws.close();
        };
    }, [me]);

    return <img ref={imgRef} id="videoFrame0" alt="camera feed" style={{ width: "100%", height: "100%" }} />;
};

export default CameraFeed;
