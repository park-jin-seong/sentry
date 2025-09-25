import { useEffect, useRef, useState } from "react"; // useState import
import { useAuth } from "./auth.jsx";

const CameraFeed = () => {
    const imgRef = useRef(null);
    const { me, loading } = useAuth();
    const wsRef = useRef(null);
    const [isStreaming, setIsStreaming] = useState(false);

    useEffect(() => {
        if (!imgRef.current || !me?.id) return;
        if (wsRef.current) return;

        const ws = new WebSocket("ws://localhost:8080/ws/rtsp");
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(`${me.id}`);
            setIsStreaming(true);
            console.log("WebSocket connected");
        };

        ws.onmessage = (event) => {
            if (imgRef.current) {
                imgRef.current.src = "data:image/jpeg;base64," + event.data;
            }
        };

        ws.onclose = () => {
            console.log("WebSocket closed");
            setIsStreaming(false);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) ws.close();
            setIsStreaming(false);
        };
    }, [me]);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {isStreaming ? (
                <img ref={imgRef} id="videoFrame0" alt="camera feed" style={{ width: "100%", height: "100%" }} />
            ) : (
                <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "white",
                    fontSize: "24px",
                    fontWeight: "bold"
                }}>
                    서버 대기중
                </div>
            )}
        </div>
    );
};

export default CameraFeed;