// src/panels/CameraSettings.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

// 토글 이미지
import toggleOn from "../assets/toggleon.png";
import toggleOff from "../assets/toggleoff.png";

// 실제 로그인 사용자 ID로 교체
const USER_ID = 1;

/** 숫자 보정 */
const toNum = (v, fb = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fb;
};

export default function CameraSettings() {
    const [items, setItems] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(false); // ← 초기엔 불러오지 않음
    const [editing, setEditing] = useState(null);

    /** 서버 목록 */
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
                    isAnalisis: !!d.analisis || !!d.isAnalisis,
                }))
            );
        } catch (e) {
            console.warn(e);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ 로그인(토큰) 생긴 뒤에만 서버 호출
    useEffect(() => {
        // 세션 복구(있으면 access만 갱신, 없으면 조용히 무시)
        api.trySessionRestoreOnce?.();

        // 토큰 바뀔 때 반응
        const off = api.onAccessTokenChange((t) => {
            if (t) {
                loadAssigned();
            } else {
                // 로그아웃 등 → 목록 비우기
                setItems([]);
            }
        });

        // 이미 토큰이 있다면 즉시 로드
        if (api.peekAccessToken()) {
            loadAssigned();
        }

        return off;
    }, []);

    /** ITS에서 추가 (토큰 없으면 로그인 요구) */
    const addBySelection = async (selected) => {
        if (!api.peekAccessToken()) {
            alert("로그인 후 사용하세요.");
            return;
        }
        try {
            const r = await api(`/api/camera/assign?userId=${USER_ID}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cctvname: selected.name,
                    cctvurl: selected.cctvurl,
                    coordx: selected.lon,
                    coordy: selected.lat,
                    cctvformat: selected.cctvformat,
                }),
            });
            if (!r.ok) {
                const ejson = await r.json().catch(() => null);
                throw new Error(ejson?.message || "카메라 저장 실패");
            }
            await loadAssigned();
            setShowAdd(false);
        } catch (e) {
            alert(e.message || "추가 실패");
        }
    };

    /** 수정 모달 띄우기 */
    const onEdit = (it) => setEditing(it);

    /** 하드 삭제(매핑+마스터까지 전부) */
    const onDelete = async (cameraId) => {
        if (!api.peekAccessToken()) {
            alert("로그인 후 사용하세요.");
            return;
        }
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

            {editing && (
                <EditCameraModal
                    camera={editing}
                    onClose={() => setEditing(null)}
                    onSaved={async () => {
                        setEditing(null);
                        await loadAssigned();
                    }}
                />
            )}
        </div>
    );
}

/** ====== 수정 모달 ====== */
function EditCameraModal({ camera, onClose, onSaved }) {
    const [name, setName] = useState(camera.name || "");
    const [lat, setLat] = useState(String(camera.coordy ?? "")); // 위도(coordy)
    const [lon, setLon] = useState(String(camera.coordx ?? "")); // 경도(coordx)
    const [isAnalisis, setIsAnalisis] = useState(!!camera.isAnalisis);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    const save = async () => {
        if (!api.peekAccessToken()) {
            alert("로그인 후 사용하세요.");
            return;
        }
        setErr("");
        const payload = {
            cameraName: name?.trim() || "",
            coordx: toNum(lon, 0),
            coordy: toNum(lat, 0),
            isAnalisis: !!isAnalisis, // true→1, false→0
        };

        try {
            setSaving(true);
            const r = await api(`/api/camera/${camera.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!r.ok) {
                const ejson = await r.json().catch(() => null);
                throw new Error(ejson?.message || "저장 실패");
            }
            onSaved?.();
        } catch (e) {
            setErr(e.message || "저장 실패");
        } finally {
            setSaving(false);
        }
    };

    const closeByBackdrop = () => onClose?.();
    const stop = (e) => e.stopPropagation();

    return (
        <div className="modal-backdrop" onMouseDown={closeByBackdrop}>
            <div className="modal-sheet cam-edit" onMouseDown={stop}>
                <div className="modal-head cam-edit-head">
                    <div className="cam-edit-title">카메라 설정</div>
                    <button className="modal-x" onClick={onClose} aria-label="닫기">
                        ×
                    </button>
                </div>

                <div className="cam-divider" />

                <div className="cam-section">
                    <div className="cam-label">카메라 이름</div>
                    <input
                        className="cam-inp"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="카메라 이름"
                    />
                </div>

                <div className="cam-divider" />

                <div className="cam-section">
                    <div className="cam-label">위치 설정</div>
                    <div className="cam-grid">
                        <div className="cam-field">
                            <div className="cam-sublabel">위도</div>
                            <input
                                className="cam-inp"
                                value={lat}
                                onChange={(e) => setLat(e.target.value)}
                                inputMode="decimal"
                                placeholder="예: 35.12345"
                            />
                        </div>
                        <div className="cam-field">
                            <div className="cam-sublabel">경도</div>
                            <input
                                className="cam-inp"
                                value={lon}
                                onChange={(e) => setLon(e.target.value)}
                                inputMode="decimal"
                                placeholder="예: 127.12345"
                            />
                        </div>
                    </div>
                </div>

                <div className="cam-divider" />

                <div className="cam-section">
                    <div className="cam-label">영상분석 설정</div>
                    <div className="cam-help">카메라 영상분석 on/off</div>
                    <button
                        type="button"
                        className="cam-toggle-btn"
                        onClick={() => setIsAnalisis((v) => !v)}
                        aria-pressed={isAnalisis}
                        aria-label={isAnalisis ? "분석 ON" : "분석 OFF"}
                        title={isAnalisis ? "분석 ON" : "분석 OFF"}
                    >
                        <img
                            className="cam-toggle-img"
                            src={isAnalisis ? toggleOn : toggleOff}
                            alt={isAnalisis ? "ON" : "OFF"}
                        />
                    </button>
                </div>

                {err && <div className="cam-error">{err}</div>}

                <div className="cam-actions">
                    <button className="cam-save" onClick={save} disabled={saving}>
                        {saving ? "저장 중…" : "저장"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/** ====== 추가 모달(ITS 검색) ====== */
function AddCameraModal({ onClose, onPick }) {
    const [roadType, setRoadType] = useState("its");
    const [minX, setMinX] = useState("126");
    const [maxX, setMaxX] = useState("127");
    const [minY, setMinY] = useState("34");
    const [maxY, setMaxY] = useState("35");

    const [loading, setLoading] = useState(false);
    const [list, setList] = useState([]);
    const [err, setErr] = useState("");

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

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

    const closeByBackdrop = () => onClose();
    const stop = (e) => e.stopPropagation();

    return (
        <div className="modal-backdrop" onMouseDown={closeByBackdrop}>
            <div className="modal-sheet" onMouseDown={stop}>
                <div className="modal-head">
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
                    <aside className="add-left">
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
                        {err && <div className="settings-error" style={{ marginTop: 8 }}>{err}</div>}
                        <div className="settings-hint" style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
                            동일 범위에서 고속/국도가 겹칠 수 있습니다. 범위를 좁혀 비교해 보세요.
                        </div>
                    </aside>

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
