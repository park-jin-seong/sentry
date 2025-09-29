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
                // 백엔드 컨트롤러 /api/serverinfos
                const res = await api("/api/serverinfos/Analysis");
                if (res.ok) setServers(await res.json());
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="st-card" style={{ maxWidth: 900 }}>
            <h3 className="settings-block-title">분석 서버 리스트</h3>
            <p className="settings-block-desc">각 분석 서버에 분석할 카메라를 할당합니다.</p>

            <div className="camera-table">
                {/* 헤더 라인 (CameraSettings의 스타일 맞춤) */}
                <div className="camera-row camera-row-head">
                    <div className="col-name">분석 서버 IP</div>
                    <div className="col-actions" />
                </div>

                <div className="camera-body">
                    {loading && <div className="camera-empty">불러오는 중…</div>}

                    {!loading && servers.length === 0 && (
                        <div className="camera-empty">등록된 서버가 없습니다.</div>
                    )}

                    {!loading &&
                        servers.length > 0 &&
                        servers.map((s) => (
                            <div className="camera-row" key={s.serverId}>
                                <div className="col-name">
                                    {/* 굵은 제목톤 재사용 */}
                                    <span className="camera-name">{s.serverIp}</span>
                                    {/* 서브 정보는 연한 회색으로 (CameraSettings의 tag 톤 재사용) */}
                                    <span
                                        className="tag"
                                        style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}
                                    >
                    포트 {s.serverPort} • {s.serverType}
                  </span>
                                </div>

                                <div className="col-actions" style={{ display: "flex", gap: 8 }}>
                                    <button className="btn btn-primary" onClick={() => setTargetServer(s)}>
                                        할당
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

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

    const toggle = (id) => setChecked((s) => ({ ...s, [id]: !s[id] }));

    const save = async () => {
        if (saving) return;
        setSaving(true);
        setErr("");

        try {
            // 현재 선택된 카메라
            const selectedIds = Object.entries(checked)
                .filter(([, v]) => v)
                .map(([k]) => Number(k));

            // 원래 이 서버에 배정돼 있던 카메라
            const prevAssignedIds = rows
                .filter((c) => Number(c.analysisServerId) === Number(server.serverId))
                .map((c) => c.cameraId);

            // 추가/해제 계산
            const toAssign = selectedIds.filter((id) => !prevAssignedIds.includes(id));
            const toUnassign = prevAssignedIds.filter((id) => !selectedIds.includes(id));

            // 1) 배정 요청
            if (toAssign.length > 0) {
                const res = await api("/api/analysis/assign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ serverId: server.serverId, cameraIds: toAssign }),
                });
                if (!res.ok) throw new Error("배정 실패");
            }

            // 2) 해제 요청
            if (toUnassign.length > 0) {
                const res = await api("/api/analysis/assign", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ serverId: server.serverId, cameraIds: toUnassign }),
                });
                if (!res.ok) throw new Error("해제 실패");
            }

            alert(`✔ 배정 ${toAssign.length}건, 해제 ${toUnassign.length}건 완료`);
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
                    <button className="modal-x" onClick={onClose} aria-label="닫기">
                        ×
                    </button>
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
                            {rows.map((c) => {
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

                {err && (
                    <div className="st-label" style={{ color: "#f66", marginTop: 8 }}>
                        {err}
                    </div>
                )}

                <div
                    className="cam-actions"
                    style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}
                >
                    <button className="btn" onClick={onClose}>
                        취소
                    </button>
                    <button className="btn btn-primary" onClick={save} disabled={saving || loading}>
                        {saving ? "저장 중…" : "저장"}
                    </button>
                </div>
            </div>
        </div>
    );
}
