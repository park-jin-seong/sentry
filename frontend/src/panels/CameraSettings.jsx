// src/panels/CameraSettings.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import toggleOn from "../assets/toggleon.png";
import toggleOff from "../assets/toggleoff.png";
import { useAuth } from "../auth.jsx";



/** 안전 숫자 변환 */
const toNum = (v, fb = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fb;
};

export default function CameraSettings() {
    const [items, setItems] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null);
    const [infoTarget, setInfoTarget] = useState(null);
    const { me } = useAuth();
    const USER_ID = me?.id ?? null;

    /** 전체 목록 로드 */
    const loadAll = async () => {
        setLoading(true);
        try {
            const r = await api(`/api/cam/all`);
            if (!r.ok) throw new Error("목록 조회 실패");
            const rows = await r.json();

            setItems(
                rows.map((d) => {
                    const ownerUserId = d.ownerUserId ?? null;
                    // 서버가 isOwner를 내려주면 그대로, 아니면 ownerUserId 비교로 결정
                    const isOwner =
                        typeof d.isOwner === "boolean"
                            ? d.isOwner
                            : ownerUserId === USER_ID;

                    return {
                        id: d.cameraId,
                        name: d.cameraName,
                        cctvurl: d.cctvUrl,
                        coordx: d.coordx,
                        coordy: d.coordy,
                        isAnalisis: !!d.isAnalisis,
                        isOwner,
                        ownerUserId,
                        ownerName: d.ownerName ?? null,
                    };
                })
            );
        } catch (e) {
            console.warn(e);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    // 로그인(토큰) 생기면 호출
    useEffect(() => {
        api.trySessionRestoreOnce?.();

        const off = api.onAccessTokenChange((t) => {
            if (t) loadAll();
            else setItems([]);
        });

        if (api.peekAccessToken()) loadAll();

        return off;
    }, []);

    /** ITS 검색에서 선택 → 추가 (백엔드: POST /api/cam/add) */
    const addBySelection = async (selected) => {
        if (!api.peekAccessToken()) {
            alert("로그인 후 사용하세요.");
            return;
        }
        try {
            const r = await api(`/api/cam/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cameraName: selected.name,
                    cctvUrl: selected.cctvurl,
                    coordx: toNum(selected.lon, 0),
                    coordy: toNum(selected.lat, 0),
                    isAnalisis: false,
                    ownerUserId: USER_ID,
                }),
            });
            if (!r.ok) {
                const ejson = await r.json().catch(() => null);
                throw new Error(ejson?.message || "카메라 저장 실패");
            }
            await loadAll();
            setShowAdd(false);
        } catch (e) {
            alert(e.message || "추가 실패");
        }
    };

    /** 수정 누르면 모달 */
    const onEdit = (it) => setEditing(it);

    /** 삭제(내 소유만) — 필요 시 엔드포인트 경로만 교체 */
    const onDelete = async (cameraId) => {
        if (!api.peekAccessToken()) {
            alert("로그인 후 사용하세요.");
            return;
        }
        if (!window.confirm("정말 삭제할까요? (모든 사용자 매핑 포함 하드 삭제)")) return;
        try {
            const r = await api(`/api/cam/${cameraId}`, { method: "DELETE" });
            if (!r.ok) throw new Error("삭제 실패");
            await loadAll();
        } catch (e) {
            alert(e.message || "삭제 실패");
        }
    };

    return (
        <div className="camera-settings">
            <div className="settings-block">
                <div className="settings-block-head">
                    <div>
                        <div className="settings-block-title">카메라 목록</div>
                        <div className="settings-block-desc">
                            카메라 추가와 수정 및 삭제가 가능합니다.
                        </div>
                    </div>

                </div>

                <div className="camera-table">
                    <div className="camera-row camera-row-head">
                        <div className="col-name">카메라명</div>
                        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                            추가
                        </button>
                        <div className="col-actions" />
                    </div>

                    <div className="camera-body">
                        {loading && <div className="camera-empty">불러오는 중…</div>}
                        {!loading && items.length === 0 && (
                            <div className="camera-empty">
                                카메라가 없습니다. “추가” 버튼으로 검색해 보세요.
                            </div>
                        )}
                        {!loading &&
                            items.map((it) => (
                                <div className="camera-row" key={it.id}>
                                    <div className="col-name">
                                        <span className="camera-name">{it.name}</span>
                                        {!it.isOwner && (
                                            <span
                                                className="tag"
                                                style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}
                                            >
                        (업로더: {it.ownerName || it.ownerUserId || "알 수 없음"})
                      </span>
                                        )}
                                    </div>
                                    <div className="col-actions" style={{ display: "flex", gap: 8 }}>
                                        {it.isOwner ? (
                                            <>
                                                <button className="btn" onClick={() => onEdit(it)}>
                                                    수정
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => onDelete(it.id)}
                                                >
                                                    삭제
                                                </button>
                                            </>
                                        ) : (
                                            <button className="btn" onClick={() => setInfoTarget(it)}>
                                                정보
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {showAdd && (
                <AddCameraModal onClose={() => setShowAdd(false)} onPick={addBySelection} />
            )}

            {editing && (
                <EditCameraModal
                    camera={editing}
                    onClose={() => setEditing(null)}
                    onSaved={async () => {
                        setEditing(null);
                        await loadAll();
                    }}
                />
            )}

            {infoTarget && (
                <InfoModal camera={infoTarget} onClose={() => setInfoTarget(null)} />
            )}
        </div>
    );
}

/** ====== 수정 모달(오너 전용) ====== */
function EditCameraModal({ camera, onClose, onSaved }) {
    const [name, setName] = useState(camera.name || "");
    const [lat, setLat] = useState(String(camera.coordy ?? ""));
    const [lon, setLon] = useState(String(camera.coordx ?? ""));
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
            isAnalisis: !!isAnalisis,
        };

        try {
            setSaving(true);
            const r = await api(`/api/cam/${camera.id}`, {
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

/** ====== 비오너용 정보 모달 ====== */
function InfoModal({ camera, onClose }) {
    const stop = (e) => e.stopPropagation();
    return (
        <div className="modal-backdrop" onMouseDown={onClose}>
            <div className="modal-sheet cam-info" onMouseDown={stop}>
                <div className="modal-head">
                    <div className="cam-edit-title">카메라 정보</div>
                    <button className="modal-x" onClick={onClose} aria-label="닫기">
                        ×
                    </button>
                </div>

                <div className="cam-section">
                    <div className="cam-label">카메라 이름</div>
                    <div className="cam-read">{camera.name}</div>
                </div>

                <div className="cam-divider" />

                <div className="cam-section">
                    <div className="cam-label">업로더</div>
                    <div className="cam-read">
                        {camera.ownerName || camera.ownerUserId || "알 수 없음"}
                    </div>
                </div>

                <div className="cam-divider" />

                <div className="cam-section">
                    <div className="cam-label">위치</div>
                    <div className="cam-read">
                        위도: {camera.coordy ?? "-"} / 경도: {camera.coordx ?? "-"}
                    </div>
                </div>

                <div className="cam-divider" />

                <div className="cam-section">
                    <div className="cam-label">분석 상태</div>
                    <div className="cam-read">{camera.isAnalisis ? "ON" : "OFF"}</div>
                </div>
            </div>
        </div>
    );
}

/** ====== ITS 검색 모달 ====== */
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
