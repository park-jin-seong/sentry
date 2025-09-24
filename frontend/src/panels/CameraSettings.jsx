import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function CameraSettings() {
    const [items, setItems] = useState([]);
    const [showAdd, setShowAdd] = useState(false);

    const addBySelection = (selected) => {
        const id = selected.cctvurl ?? `tmp-${Date.now()}`;
        setItems((prev) => [{ id, name: selected.name ?? selected.cctvname, ...selected }, ...prev]);
        setShowAdd(false);
    };

    const onDelete = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

    return (
        <div className="camera-settings">
            <h2 className="settings-subtitle">카메라 설정</h2>

            <div className="settings-block">
                <div className="settings-block-head">
                    <div>
                        <div className="settings-block-title">카메라 목록</div>
                        <div className="settings-block-desc">ITS에서 검색해 추가할 수 있습니다.</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAdd(true)}>추가</button>
                </div>

                <div className="camera-table">
                    <div className="camera-row camera-row-head">
                        <div className="col-name">카메라명</div>
                        <div className="col-actions" />
                    </div>
                    <div className="camera-body">
                        {items.length === 0 && (
                            <div className="camera-empty">카메라가 없습니다. 오른쪽 위 “추가”로 검색하세요.</div>
                        )}
                        {items.map((it) => (
                            <div className="camera-row" key={it.id}>
                                <div className="col-name">
                                    <span className="camera-name">{it.name ?? it.cctvname}</span>
                                </div>
                                <div className="col-actions">
                                    <button className="btn btn-danger" onClick={() => onDelete(it.id)}>삭제</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showAdd && (
                <AddCameraModal onClose={() => setShowAdd(false)} onPick={addBySelection} />
            )}
        </div>
    );
}

/** 추가 모달 */
function AddCameraModal({ onClose, onPick }) {
    // 탭(고속/국도) -> cctvType = 1 | 2
    const [cctvType, setCctvType] = useState(1);
    const [minX, setMinX] = useState("126");
    const [maxX, setMaxX] = useState("127");
    const [minY, setMinY] = useState("34");
    const [maxY, setMaxY] = useState("35");

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
            const qs = new URLSearchParams({
                cctvType: String(cctvType),
                minX: String(minX),
                maxX: String(maxX),
                minY: String(minY),
                maxY: String(maxY),
            }).toString();

            const r = await api(`/api/its/cctv?${qs}`, { credentials: "include" });
            if (!r.ok) throw new Error("검색에 실패했어요.");
            const json = await r.json();
            const rows = (json?.response?.data ?? []).map((d, i) => ({
                id: d.cctvurl ?? i,
                name: d.cctvname,
                cctvurl: d.cctvurl,
                coordx: d.coordx,
                coordy: d.coordy,
                cctvformat: d.cctvformat,
            }));
            setList(rows);
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
                            className={`tab ${cctvType === 1 ? "is-active" : ""}`}
                            onClick={() => setCctvType(1)}
                            type="button"
                        >
                            고속
                        </button>
                        <button
                            className={`tab ${cctvType === 2 ? "is-active" : ""}`}
                            onClick={() => setCctvType(2)}
                            type="button"
                        >
                            국도
                        </button>
                    </div>
                    <button className="modal-x" onClick={onClose} aria-label="닫기">×</button>
                </div>

                <div className="modal-body">
                    {/* 왼쪽 사이드바 */}
                    <aside className="add-left">


                        {/* 위도 */}
                        <div className="pair">
                            <div className="pair-item">
                                <label className="lbl">최소 위도</label>
                                <input
                                    className="inp"
                                    value={minY}
                                    onChange={(e) => setMinY(e.target.value)}
                                    placeholder="예: 34"
                                />
                            </div>
                            <div className="pair-sep">~</div>
                            <div className="pair-item">
                                <label className="lbl">최대 위도</label>
                                <input
                                    className="inp"
                                    value={maxY}
                                    onChange={(e) => setMaxY(e.target.value)}
                                    placeholder="예: 35"
                                />
                            </div>
                        </div>

                        {/* 경도 */}
                        <div className="pair">
                            <div className="pair-item">
                                <label className="lbl">최소 경도</label>
                                <input
                                    className="inp"
                                    value={minX}
                                    onChange={(e) => setMinX(e.target.value)}
                                    placeholder="예: 126"
                                />
                            </div>
                            <div className="pair-sep">~</div>
                            <div className="pair-item">
                                <label className="lbl">최대 경도</label>
                                <input
                                    className="inp"
                                    value={maxX}
                                    onChange={(e) => setMaxX(e.target.value)}
                                    placeholder="예: 127"
                                />
                            </div>
                        </div>

                        <button className="btn btn-primary wide" onClick={search} disabled={loading}>
                            검색하기
                        </button>
                        {err && <div className="settings-error" style={{ marginTop: 8 }}>{err}</div>}
                    </aside>

                    {/* 오른쪽 결과 리스트 */}
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
                                                lat: it.coordy, // 위도
                                                lon: it.coordx, // 경도
                                                cctvurl: it.cctvurl,
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
