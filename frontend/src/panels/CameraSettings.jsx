// src/panels/CameraSettings.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

/** 메인: 카메라 설정 */
export default function CameraSettings() {
    const [items, setItems] = useState([]);
    const [showAdd, setShowAdd] = useState(false);

    // TODO: 실제 로그인 유저 ID로 대체
    const userId = 1;

    //  서버에서 내 카메라 목록 불러오기
    const loadAssigned = async () => {
        const r = await api(`/api/camera/assigned?userId=${userId}`);
        if (!r.ok) return; // 에러 처리 원하면 alert 등 추가
        const rows = await r.json(); // ← CameraInfosDTO[] 가정
        // 프론트에서 쓰기 편한 형태로 매핑
        setItems(
            rows.map((d) => ({
                id: d.cameraId,
                name: d.cameraName,
                cctvurl: d.cctvUrl,
                coordx: d.coordx,
                coordy: d.coordy,
            }))
        );
    };

    //  마운트 시 1회 로드
    useEffect(() => {
        loadAssigned();
    }, []);

    /** CCTV 선택 시 서버에 저장 요청 */
    const addBySelection = async (selected) => {
        try {
            const r = await api(`/api/camera/assign?userId=${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cctvname: selected.name,
                    cctvurl: selected.cctvurl,
                    coordx: selected.lon,
                    coordy: selected.lat,
                    cctvformat: selected.cctvformat,
                }),
                credentials: "include",
            });

            if (!r.ok) {
                const ejson = await r.json().catch(() => null);
                throw new Error(ejson?.message || "카메라 저장 실패");
            }

            //  저장 성공 후 서버 목록을 다시 가져와 동기화
            await loadAssigned();
            setShowAdd(false);
        } catch (e) {
            alert(e.message);
        }
    };

    const onDelete = (id) =>
        setItems((prev) => prev.filter((it) => it.id !== id));

    return (
        <div className="camera-settings">
            <h2 className="settings-subtitle">카메라 설정</h2>

            <div className="settings-block">
                <div className="settings-block-head">
                    <div>
                        <div className="settings-block-title">카메라 목록</div>
                        <div className="settings-block-desc">
                            ITS에서 검색해 추가할 수 있습니다.
                        </div>
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
                        {items.length === 0 && (
                            <div className="camera-empty">
                                카메라가 없습니다. 오른쪽 위 “추가”로 검색하세요.
                            </div>
                        )}
                        {items.map((it) => (
                            <div className="camera-row" key={it.id}>
                                <div className="col-name">
                                    <span className="camera-name">{it.name}</span>
                                </div>
                                <div className="col-actions">
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => onDelete(it.id)}
                                    >
                                        삭제
                                    </button>
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

/** 추가 모달: 고속/국도만 구분해서 검색 */
function AddCameraModal({ onClose, onPick }) {
    // 도로 타입(ex=고속, its=국도)만 전환
    const [roadType, setRoadType] = useState("its"); // 기본 국도
    // 좌표 입력값
    const [minX, setMinX] = useState("126");
    const [maxX, setMaxX] = useState("127");
    const [minY, setMinY] = useState("34");
    const [maxY, setMaxY] = useState("35");

    const [loading, setLoading] = useState(false);
    const [list, setList] = useState([]);
    const [err, setErr] = useState("");

    // ESC로 닫기
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
                type: roadType,
                cctvType: "1",
                minX: String(minX),
                maxX: String(maxX),
                minY: String(minY),
                maxY: String(maxY),
            }).toString();

            const r = await api(`/api/its/cctv?${qs}`, { credentials: "include" });
            if (!r.ok) {
                const ejson = await r.json().catch(() => null);
                throw new Error(ejson?.message || "검색에 실패했어요.");
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

    // 외부 영역 클릭으로 닫기
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
                                                lat: toNum(it.coordy, 0),
                                                lon: toNum(it.coordx, 0),
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
