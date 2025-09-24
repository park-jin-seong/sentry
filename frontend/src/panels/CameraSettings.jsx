// src/components/settings/CameraSettings.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js"; // 경로 확인

export default function CameraSettings() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [saving, setSaving] = useState(false);
    const [showAdd, setShowAdd] = useState(false);

    // 목록 로드
    useEffect(() => {
        (async () => {
            setLoading(true); setErr("");
            try {
                const r = await api("/api/cameras", { credentials: "include" });
                if (!r.ok) throw new Error("목록을 불러올 수 없어요.");
                const list = await r.json();
                setItems(Array.isArray(list) ? list : []);
            } catch (e) {
                setErr(e.message || "오류가 발생했어요.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // 추가 실행 (모달에서 항목 선택 시 호출)
    const addBySelection = async (selected) => {
        // selected 예시: { name, lat, lon, roadType, ... }
        const tempId = `tmp-${Date.now()}`;
        const optimistic = { id: tempId, name: selected.name, ...selected };
        setItems((prev) => [optimistic, ...prev]);

        try {
            setSaving(true);
            // 실제 생성 API로 변경하세요.
            const r = await api("/api/cameras", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(selected),
            });
            if (!r.ok) throw new Error("추가 실패");
            const created = await r.json();
            setItems((prev) => prev.map((it) => (it.id === tempId ? created : it)));
        } catch (e) {
            alert(e.message || "추가에 실패했습니다.");
            setItems((prev) => prev.filter((it) => it.id !== tempId));
        } finally {
            setSaving(false);
            setShowAdd(false);
        }
    };

    const onDelete = async (id) => {
        if (!confirm("정말 삭제하시겠어요?")) return;
        const snapshot = items;
        setItems((prev) => prev.filter((it) => it.id !== id));
        try {
            const r = await api(`/api/cameras/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!r.ok) throw new Error("삭제 실패");
        } catch (e) {
            alert(e.message || "삭제에 실패했습니다.");
            setItems(snapshot);
        }
    };

    return (
        <div className="camera-settings">
            <h2 className="settings-subtitle">카메라 설정</h2>

            <div className="settings-block">
                <div className="settings-block-head">
                    <div>
                        <div className="settings-block-title">카메라 목록</div>
                        <div className="settings-block-desc">카메라 추가와 수정 및 삭제가 가능합니다.</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAdd(true)}>추가</button>
                </div>

                <div className="camera-table">
                    <div className="camera-row camera-row-head">
                        <div className="col-name">카메라명</div>
                        <div className="col-actions" />
                    </div>
                    <div className="camera-body">
                        {loading && <div className="camera-empty">불러오는 중…</div>}
                        {!loading && items.length === 0 && (
                            <div className="camera-empty">카메라가 없습니다.</div>
                        )}
                        {!loading &&
                            items.map((it) => (
                                <div className="camera-row" key={it.id}>
                                    <div className="col-name">
                                        <span className="camera-name">{it.name}</span>
                                    </div>
                                    <div className="col-actions">
                                        <button className="btn btn-danger" onClick={() => onDelete(it.id)}>
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {err && <div className="settings-error">{err}</div>}
            </div>

            {showAdd && (
                <AddCameraModal
                    onClose={() => setShowAdd(false)}
                    onPick={addBySelection}
                />
            )}
        </div>
    );
}

/** 추가 모달 */
function AddCameraModal({ onClose, onPick }) {
    const [tab, setTab] = useState("EXP"); // EXP=고속, NAT=국도
    const [lat1, setLat1] = useState("");
    const [lat2, setLat2] = useState("");
    const [lon1, setLon1] = useState("");
    const [lon2, setLon2] = useState("");
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState([]);
    const [err, setErr] = useState("");

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const search = async () => {
        setLoading(true); setErr(""); setList([]);
        try {
            // 필요한 파라미터/엔드포인트에 맞게 변경하세요.
            // 예: POST /api/roads/search  { roadType, lat1, lat2, lon1, lon2 }
            const r = await api("/api/roads/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    roadType: tab,   // "EXP" | "NAT"
                    lat1, lat2, lon1, lon2,
                }),
            });
            if (!r.ok) throw new Error("검색에 실패했어요.");
            const data = await r.json();
            // data 예시: [{ id, name, lat, lon }, ...]
            setList(Array.isArray(data) ? data : []);
        } catch (e) {
            setErr(e.message || "검색 오류");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onMouseDown={onClose}>
            <div className="modal-sheet" onMouseDown={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <div className="tabs">
                        <button
                            className={`tab ${tab === "EXP" ? "is-active" : ""}`}
                            onClick={() => setTab("EXP")}
                        >
                            고속
                        </button>
                        <button
                            className={`tab ${tab === "NAT" ? "is-active" : ""}`}
                            onClick={() => setTab("NAT")}
                        >
                            국도
                        </button>
                    </div>
                    <button className="modal-x" onClick={onClose} aria-label="닫기">×</button>
                </div>

                <div className="modal-body">
                    <aside className="add-left">
                        <label className="lbl">위도</label>
                        <input className="inp" value={lat1} onChange={(e)=>setLat1(e.target.value)} />
                        <label className="lbl">위도</label>
                        <input className="inp" value={lat2} onChange={(e)=>setLat2(e.target.value)} />
                        <label className="lbl">경도</label>
                        <input className="inp" value={lon1} onChange={(e)=>setLon1(e.target.value)} />
                        <label className="lbl">경도</label>
                        <input className="inp" value={lon2} onChange={(e)=>setLon2(e.target.value)} />
                        <button className="btn btn-primary wide" onClick={search} disabled={loading}>
                            검색하기
                        </button>
                        {err && <div className="settings-error" style={{marginTop:8}}>{err}</div>}
                    </aside>

                    <section className="add-right">
                        {loading && <div className="camera-empty">검색 중…</div>}
                        {!loading && list.length === 0 && (
                            <div className="camera-empty">검색 결과가 없습니다.</div>
                        )}
                        {!loading && list.length > 0 && (
                            <ul className="result-list">
                                {list.map((it, i) => (
                                    <li
                                        key={it.id ?? i}
                                        className="result-item"
                                        onClick={() =>
                                            onPick({
                                                name: it.name,
                                                lat: it.lat, lon: it.lon,
                                                roadType: tab,
                                                // 필요시 백엔드가 요구하는 추가 필드 포함
                                            })
                                        }
                                        title="클릭하면 추가됩니다"
                                    >
                                        <span className="idx">{String(i + 1).padStart(2, "0")}.</span>{" "}
                                        <span className="nm">{it.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
