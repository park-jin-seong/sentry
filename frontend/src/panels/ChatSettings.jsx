// src/panels/CameraSettings.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

/** 메인: 카메라 설정 */
export default function CameraSettings() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [showAdd, setShowAdd] = useState(false);

    // ✅ 마운트 시: 서버에서 내 카메라 목록 불러오기
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setErr("");
                const r = await api("/api/camera/assigned", { credentials: "include" });
                if (!r.ok) {
                    const ejson = await r.json().catch(() => null);
                    throw new Error(ejson?.message || "목록을 불러오지 못했습니다.");
                }
                const arr = await r.json();
                setItems(
                    (arr ?? []).map((c) => ({
                        id: c.cameraId,
                        name: c.cameraName,
                        cctvurl: c.cctvUrl,
                        coordx: c.coordx,
                        coordy: c.coordy,
                    }))
                );
            } catch (e) {
                setErr(e.message || "목록 조회 오류");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // 추가(선택 결과 받아 저장 → 서버 POST → state 반영)
    const addBySelection = async (selected) => {
        try {
            // ItsCctvResponse.CctvItem에 맞춰 키 사용(cctvurl/cctvname/coordx/coordy)
            const body = JSON.stringify({
                cctvurl: selected.cctvurl,
                cctvname: selected.name ?? selected.cctvname,
                coordx: selected.lon ?? selected.coordx ?? 0,
                coordy: selected.lat ?? selected.coordy ?? 0,
            });

            // NOTE: 백엔드가 userId 쿼리를 받는다면 "/api/camera/assign?userId=123" 로 바꾸세요.
            const r = await api("/api/camera/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
                credentials: "include",
            });
            if (!r.ok) {
                const ejson = await r.json().catch(() => null);
                throw new Error(ejson?.message || "추가에 실패했습니다.");
            }
            // 백엔드가 CameraInfos를 반환하도록 구현해두면 아래가 그대로 동작합니다.
            const cam = await r.json();
            const newItem = {
                id: cam.cameraId,
                name: cam.cameraName,
                cctvurl: cam.cctvUrl,
                coordx: cam.coordx,
                coordy: cam.coordy,
            };
            setItems((prev) => [newItem, ...prev]);
            setShowAdd(false);
        } catch (e) {
            alert(e.message || "추가 오류");
        }
    };

    // 삭제(서버 DELETE → state 반영)
    const onDelete = async (id) => {
        try {
            // NOTE: 백엔드가 userId 필요하면 쿼리로 추가하세요.
            const r = await api(`/api/camera/unassign/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!r.ok) {
                const ejson = await r.json().catch(() => null);
                throw new Error(ejson?.message || "삭제에 실패했습니다.");
            }
            setItems((prev) => prev.filter((it) => it.id !== id));
        } catch (e) {
            alert(e.message || "삭제 오류");
        }
    };

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
                        {loading && <div className="camera-empty">불러오는 중…</div>}
                        {!loading && err && (
                            <div className="settings-error" style={{ marginTop: 8 }}>
                                {err}
                            </div>
                        )}
                        {!loading && !err && items.length === 0 && (
                            <div className="camera-empty">
                                카메라가 없습니다. 오른쪽 위 “추가”로 검색하세요.
                            </div>
                        )}
                        {!loading &&
                            !err &&
                            items.map((it) => (
                                <div className="camera-row" key={it.id}>
                                    <div className="col-name">
                    <span className="camera-name">
                      {it.name ?? it.cctvname}
                    </span>
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
    // 도로 타입(ex=고속, its=국도) 전환
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

    // 숫자 보정(문자열 입력이라도 안전하게 변환)
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
                // 반드시 포함: 고속/국도 구분
                type: roadType, // ex | its
                // cctvType은 화면에 보이지 않지만 1로 고정(실시간)
                cctvType: "1",
                // 좌표는 문자열이어도 백엔드에서 double로 받으므로 그대로 전달
                minX: String(minX),
                maxX: String(maxX),
                minY: String(minY),
                maxY: String(maxY),
            }).toString();

            // 인증/리프레시 로직을 포함한 공통 api 사용
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
                                                // 위/경도는 숫자로 보정해서 넘겨두면 이후 계산에 안전
                                                lat: toNum(it.coordy, 0),
                                                lon: toNum(it.coordx, 0),
                                                cctvurl: it.cctvurl,
                                                // 필요시 포맷도 전달
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
