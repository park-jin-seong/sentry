// src/panels/AnalysisSettings.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import "../Settings.css";

export default function AnalysisSettings() {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [targetServer, setTargetServer] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                // 백엔드 컨트롤러를 /api/serverinfos 로 맞춘 경우
                const res = await api("/api/serverinfos");
                if (res.ok) setServers(await res.json());
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="st-card" style={{ maxWidth: 900 }}>
            <h3 className="st-h3">분석 서버 리스트</h3>
            <p className="st-label">각 분석 서버에 분석할 카메라를 할당합니다.</p>

            {loading ? (
                <div>불러오는 중...</div>
            ) : servers.length === 0 ? (
                <div>등록된 서버가 없습니다.</div>
            ) : (
                <table style={{ width: "100%", marginTop: 16 }}>
                    <thead>
                    <tr style={{ textAlign: "left", opacity: .8 }}>
                        <th style={{ padding: 8 }}>분석 서버 IP</th>
                        <th style={{ padding: 8 }}>포트</th>
                        <th style={{ padding: 8 }}>타입</th>
                        <th style={{ padding: 8, textAlign: "right" }}>액션</th>
                    </tr>
                    </thead>
                    <tbody>
                    {servers.map(s => (
                        <tr key={s.serverId} style={{ borderTop: "1px solid #444" }}>
                            <td style={{ padding: 8 }}>{s.serverIp}</td>
                            <td style={{ padding: 8 }}>{s.serverPort}</td>
                            <td style={{ padding: 8 }}>{s.serverType}</td>
                            <td style={{ padding: 8, textAlign: "right" }}>
                                <button className="st-btn" onClick={() => setTargetServer(s)}>할당</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {targetServer && (
                <AssignCamerasModal
                    server={targetServer}
                    onClose={() => setTargetServer(null)}
                    onSaved={() => setTargetServer(null)}
                />
            )}
        </div>
    );
}

function AssignCamerasModal({ server, onClose, onSaved }) {
    const [rows, setRows] = useState([]);
    const [checked, setChecked] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        (async () => {
            setErr("");
            setLoading(true);
            try {
                // 해당 서버 기준으로 (NULL or same) 카메라만 조회
                const r = await api(`/api/analysis/cameras?serverId=${server.serverId}`);
                if (!r.ok) throw new Error("카메라 조회 실패");
                const list = await r.json();
                setRows(list);

                // 이미 이 서버에 배정된 카메라는 초기선택
                const init = {};
                for (const c of list) {
                    if (Number(c.analysisServerId) === Number(server.serverId)) {
                        init[c.cameraId] = true;
                    }
                }
                setChecked(init);
            } catch (e) {
                setErr(e.message || "조회 실패");
                setRows([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [server.serverId]);

    const toggle = (id) => setChecked(s => ({ ...s, [id]: !s[id] }));
    const selectedIds = Object.entries(checked).filter(([,v]) => v).map(([k]) => Number(k));

    const save = async () => {
        if (saving) return;
        setSaving(true);
        setErr("");
        try {
            const res = await api("/api/analysis/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ serverId: server.serverId, cameraIds: selectedIds })
            });
            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(t || "저장 실패");
            }
            alert(`총 ${selectedIds.length}개 카메라가 ${server.serverIp} 에 배정되었습니다.`);
            onSaved?.();
        } catch (e) {
            setErr(e.message || "저장 실패");
        } finally {
            setSaving(false);
        }
    };

    const stop = (e) => e.stopPropagation();

    return (
        <div className="modal-backdrop" onMouseDown={onClose}>
            <div className="modal-sheet" onMouseDown={stop} style={{ maxWidth: 700 }}>
                <div className="modal-head">
                    <div className="st-h3">카메라명</div>
                    <button className="modal-x" onClick={onClose} aria-label="닫기">×</button>
                </div>

                {loading ? (
                    <div className="st-label">불러오는 중…</div>
                ) : rows.length === 0 ? (
                    <div className="st-label">표시할 카메라가 없습니다.</div>
                ) : (
                    <div className="chip-list-wrap">
                        <div className="chip-list-title">카메라명</div>
                        <div className="chip-sep" />
                        <div className="chip-list">
                            {rows.map(c => {
                                const id = c.cameraId;
                                const selected = !!checked[id];
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        className={`chip ${selected ? "is-selected" : ""}`}
                                        onClick={() => toggle(id)}
                                        title={`cameraId: ${id}`}
                                    >
                                        <span className="chip-text">{c.cameraName}</span>
                                        {selected && <span className="chip-check">✔</span>}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="chip-sep" />
                    </div>
                )}

                {err && <div className="st-label" style={{ color: "#f66", marginTop: 8 }}>{err}</div>}

                <div className="cam-actions" style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="st-btn" onClick={onClose}>취소</button>
                    <button className="st-primary" onClick={save} disabled={saving || loading}>
                        {saving ? "저장 중…" : "저장"}
                    </button>
                </div>
            </div>
        </div>
    );
}
