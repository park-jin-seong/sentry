// src/panels/CameraSettings.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

/** 실제 로그인 유저 ID로 교체하세요 */
const USER_ID = 1;

/** 메인: 카메라 설정 */
export default function CameraSettings() {
    const [items, setItems] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(true);

    /** 서버 목록 로드 */
    const loadAssigned = async () => {
        setLoading(true);
        try {
            const r = await api(`/api/camera/assigned?userId=${USER_ID}`);
            if (!r.ok) throw new Error("목록 조회 실패");
            const rows = await r.json();
            setItems(
                rows.map((d) => ({
                    id: d.cameraId,
                    name: d.cameraName,
                    cctvurl: d.cctvUrl,
                    coordx: d.coordx,
                    coordy: d.coordy,
                    isAnalisis: d.isAnalisis,
                }))
            );
        } catch (e) {
            console.warn(e);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAssigned();
    }, []);

    /** 추가(ITS에서 선택 → 서버 저장/할당) */
    const addBySelection = async (selected) => {
        try {
            const r = await api(`/api/camera/assign?userId=${USER_ID}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cctvname: selected.name,
                    cctvurl: selected.cctvurl,
                    coordx: selected.lon, // 경도 → coordx
                    coordy: selected.lat, // 위도 → coordy
                    cctvformat: selected.cctvformat,
                }),
            });
            if (!r.ok) {
                const ejson = await r.json().catch(() => null);
                throw new Error(ejson?.message || "카메라 저장 실패");
            }
            await loadAssigned(); // 서버 기준 동기화
            setShowAdd(false);
        } catch (e) {
            alert(e.message || "추가 실패");
        }
    };

    /** 수정(간단히 이름만) */
    const onEdit = async (it) => {
        const name = window.prompt("카메라명 수정", it.name || "");
        if (name == null) return;
        try {
            const r = await api(`/api/camera/${it.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cameraName: name }),
            });
            if (!r.ok) throw new Error("수정 실패");
            await loadAssigned();
        } catch (e) {
            alert(e.message || "수정 실패");
        }
    };

    /** ✅ 삭제 = 항상 하드 삭제(매핑 지우고 camerainfos까지 삭제) */
    const onDelete = async (cameraId) => {
        if (!window.confirm("정말 삭제할까요?\n(DB에서 완전히 삭제됩니다)")) return;
        try {
            const r = await api(`/api/camera/${cameraId}`, { method: "DELETE" });
            if (!r.ok) throw new Error("삭제 실패");
            await loadAssigned();
        } catch (e) {
            alert(e.message || "삭제 실패");
        }
    };

    return (
        <div className="camera-settings">
            <h2 className="settings-subtitle">카메라 설정</h2>

            <div className="settings-block">
                <div className="settings-block-head">
                    <div>
                        <div className="settings-block-title">카메라 목록</div>
                        <div className="settings-block-desc">ITS에서 검색해 추가할 수 있습니다.</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                        추가
                    </button>
                </div>

                <div className="camera-table">
                    <div className="camera-row camera-row-head">
                        <div className="col-name">카메라명</div>
                        <div className="col-actions" />
                    </div>
                    <div className="camera-body">
                        {loading && <div className="camera-empty">불러오는 중…</div>}

                        {!loading && items.length === 0 && (
                            <div className="camera-empty">카메라가 없습니다. “추가” 버튼으로 검색해 보세요.</div>
                        )}

                        {!loading &&
                            items.map((it) => (
                                <div className="camera-row" key={it.id}>
                                    <div className="col-name">
                                        <span className="camera-name">{it.name}</span>
                                    </div>
                                    <div className="col-actions" style={{ display: "flex", gap: 8 }}>
                                        <button className="btn" onClick={() => onEdit(it)}>
                                            수정
                                        </button>
                                        <button className="btn btn-danger" onClick={() => onDelete(it.id)}>
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {showAdd && <AddCameraModal onClose={() => setShowAdd(false)} onPick={addBySelection} />}
        </div>
    );
}

/** 추가 모달: 고속/국도만 구분해서 검색 */
function AddCameraModal({ onClose, onPick }) {
    const [roadType, setRoadType] = useState("its"); // 기본 국도
    const [minX, setMinX] = useState("126");
    const [maxX, setMaxX] = useState("127");
    const [minY, setMinY] = useState("34");
    const [maxY, setMaxY] = useState("35");

    const [loading, setLoading] = useState(false);
    const [list, setList] = useState([]);
    const [err, setErr] = useState("");

    // ESC 닫기
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    // 숫자 보정
    const toNum = (v, fallback = 0) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
    };

    const search = async () => {
        setLoading(true);
        setErr("");
        setList([]);
        try {
            const qs = new URLSearchParams({
                type: roadType, // ex | its
                cctvType: "1",
                minX: String(minX),
                maxX: String(maxX),
                minY: String(minY),
                maxY: String(maxY),
            }).toString();

            const r = await api(`/api/its/cctv?${qs}`);
            if (!r.ok) {
                const ejson = await r.json().catch(() => null);
                throw new Error(ejson?.message || "검색 실패");
            }
            const json = await r.json();
            const rows = (json?.response?.data ?? []).map((d, i) => ({
                id: d.cctvurl ?? `${i}`,
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

    const onBackdropMouseDown = () => onClose();
    const stop = (e) => e.stopPropagation();

    return (
        <div className="modal-backdrop" onMouseDown={onBackdropMouseDown}>
            <div className="modal-sheet" onMouseDown={stop}>
                <div className="modal-head">
                    {/* 고속/국도 탭 */}
                    <div className="tabs">
                        <button
                            className={`tab ${roadType === "ex" ? "is-active" : ""}`}
                            onClick={() => setRoadType("ex")}
                            type="button"
                        >
                            고속
                        </button>
                        <button
                            className={`tab ${roadType === "its" ? "is-active" : ""}`}
                            onClick={() => setRoadType("its")}
                            type="button"
                        >
                            국도
                        </button>
                    </div>
                    <button className="modal-x" onClick={onClose} aria-label="닫기">
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    {/* 왼쪽: 조건 */}
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
                                    inputMode="decimal"
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
                                    inputMode="decimal"
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
                                    inputMode="decimal"
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
                                    inputMode="decimal"
                                />
                            </div>
                        </div>

                        <button className="btn btn-primary wide" onClick={search} disabled={loading}>
                            검색하기
                        </button>
                        {err && (
                            <div className="settings-error" style={{ marginTop: 8 }}>
                                {err}
                            </div>
                        )}
                        <div className="settings-hint" style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
                            동일 범위에서 고속/국도가 겹칠 수 있습니다. 범위를 좁혀 비교해 보세요.
                        </div>
                    </aside>

                    {/* 오른쪽: 결과 리스트 */}
                    <section className="add-right">
                        {loading && <div className="camera-empty">검색 중…</div>}
                        {!loading && list.length === 0 && <div className="camera-empty">검색 결과가 없습니다.</div>}
                        {!loading && list.length > 0 && (
                            <ul className="result-list">
                                {list.map((it, i) => (
                                    <li
                                        key={it.id ?? i}
                                        className="result-item"
                                        onClick={() =>
                                            onPick({
                                                name: it.name,
                                                lat: toNum(it.coordy, 0), // 위도
                                                lon: toNum(it.coordx, 0), // 경도
                                                cctvurl: it.cctvurl,
                                                cctvformat: it.cctvformat,
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
