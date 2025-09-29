import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function AnalysisSettings() {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api("/api/serverinfos");
                if (res.ok) {
                    const data = await res.json();
                    setServers(data);
                }
            } catch (err) {
                console.error("서버 목록 조회 실패", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="st-card">
            <h3 className="st-h3">분석 서버 리스트</h3>
            <p className="st-label">각 분석 서버에 분석할 카메라를 할당합니다.</p>

            {loading ? (
                <div>불러오는 중...</div>
            ) : servers.length === 0 ? (
                <div>등록된 서버가 없습니다.</div>
            ) : (
                <table style={{ width: "100%", marginTop: 16 }}>
                    <thead>
                    <tr>
                        <th style={{ textAlign: "left", padding: 8 }}>분석 서버 IP</th>
                        <th style={{ textAlign: "left", padding: 8 }}>포트</th>
                        <th style={{ textAlign: "left", padding: 8 }}>타입</th>
                        <th style={{ textAlign: "right", padding: 8 }}>액션</th>
                    </tr>
                    </thead>
                    <tbody>
                    {servers.map((s) => (
                        <tr key={s.serverId} style={{ borderTop: "1px solid #444" }}>
                            <td style={{ padding: 8 }}>{s.serverIp}</td>
                            <td style={{ padding: 8 }}>{s.serverPort}</td>
                            <td style={{ padding: 8 }}>{s.serverType}</td>
                            <td style={{ padding: 8, textAlign: "right" }}>
                                <button className="st-btn">할당</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
