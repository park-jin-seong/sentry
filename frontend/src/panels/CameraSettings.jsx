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

    const { me, loading: authLoading } = useAuth();
    const USER_ID = me?.id ?? null;

    /** 전체 목록 로드 */
    const loadAll = async () => {
        if (!api.peekAccessToken() || !USER_ID) return; // 로그인/프로필 준비 전에는 호출 안 함
        setLoading(true);
        try {
            const r = await api(`/api/cam/all`);
            if (!r.ok) throw new Error("목록 조회 실패");
            const rows = await r.json();

            setItems(
                rows.map((d) => {
                    const ownerUserId = d.ownerUserId ?? null;
                    const isOwner =
                        typeof d.isOwner === "boolean" ? d.isOwner : ownerUserId === USER_ID;

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

    // 토큰/프로필 준비되면 목록 로드
    useEffect(() => {
        api.trySessionRestoreOnce?.();
    }, []);

    useEffect(() => {
        const off = api.onAccessTokenChange((t) => {
            if (t && USER_ID) loadAll();
            else setItems([]);
        });
        return off;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [USER_ID]);

    useEffect(() => {
        if (!authLoading && api.peekAccessToken() && USER_ID) {
            loadAll();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, USER_ID]);

    /** 단건 추가 (기존 유지) */
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
                    isAnalisis: true,
                }),
            });
            if (!r.ok) {
                const ejson = await r.json().catch(() => null);
                throw new Error(ejson?.message || "카메라 저장 실패");
            }
        } catch (e) {
            throw e;
        }
    };

    /** 다중 추가 (새로 추가) */
    const addBySelections = async (selectedList) => {
        if (!api.peekAccessToken()) {
            alert("로그인 후 사용하세요.");
            return;
        }
        // 순차 저장(중간 실패 메시지 보기 쉬움) — 원하면 Promise.allSettled로 병렬도 가능
        const results = [];
        for (const sel of selectedList) {
            try {
                await addBySelection(sel);
                results.push({ ok: true, name: sel.name });
            } catch (e) {
                results.push({ ok: false, name: sel.name, msg: e.message || "저장 실패" });
            }
        }
        // 요약 알림
        const okCount = results.filter(r => r.ok).length;
        const fail = results.filter(r => !r.ok);
        if (fail.length) {
            alert(`총 ${selectedList.length}개 중 ${okCount}개 저장됨\n실패: ${fail.map(f => `${f.name}(${f.msg})`).join(", ")}`);
        } else {
            alert(`총 ${okCount}개 저장 완료`);
        }
        await loadAll();
        setShowAdd(false);
    };

    /** 수정 모달 띄우기 (오너만) */
    const onEdit = (it) => setEditing(it);

    /** 삭제 (오너면 하드삭제 / 비오너면 매핑 해제는 백엔드 로직에 따름) */
    const onDelete = async (cameraId) => {
        if (!api.peekAccessToken()) {
            alert("로그인 후 사용하세요.");
            return;
        }
        if (!window.confirm("정말 삭제할까요?")) return;
        try {
            const r = await api(`/api/camera/${cameraId}?userId=${USER_ID}`, {
                method: "DELETE",
            });
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
                        {(authLoading || loading) && (
                            <div className="camera-empty">불러오는 중…</div>
                        )}
                        {!authLoading && !loading && items.length === 0 && (
                            <div className="camera-empty">
                                카메라가 없습니다. “추가” 버튼으로 검색해 보세요.
                            </div>
                        )}
                        {!authLoading &&
                            !loading &&
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
                <AddCameraModal
                    onClose={() => setShowAdd(false)}
                    onPick={addBySelection}         // 단건(더블클릭/빠른추가 용)
                    onPickMany={addBySelections}    // 다중 선택 저장
                />
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
            const r = await api(`/api/camera/${camera.id}?userId=${camera.ownerUserId}`, {
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

/** ====== ITS 검색 모달 (다중 선택 지원) ====== */
function AddCameraModal({ onClose, onPick, onPickMany }) {
    const [roadType, setRoadType] = useState("its");
    const [minX, setMinX] = useState("126");
    const [maxX, setMaxX] = useState("127");
    const [minY, setMinY] = useState("34");
    const [maxY, setMaxY] = useState("35");

    const [loading, setLoading] = useState(false);
    const [list, setList] = useState([]);
    const [err, setErr] = useState("");

    // 다중 선택 상태: { id: true }
    const [selected, setSelected] = useState({});
    const selectedCount = Object.values(selected).filter(Boolean).length;

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const search = async () => {
        setLoading(true);
        setErr("");
        setList([]);
        setSelected({});
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

    const toggle = (row) => {
        setSelected((s) => ({ ...s, [row.id]: !s[row.id] }));
    };

    const addSelectedAll = async () => {
        const picks = list
            .filter((row) => selected[row.id])
            .map((row) => ({
                name: row.name,
                lat: toNum(row.coordy, 0),
                lon: toNum(row.coordx, 0),
                cctvurl: row.cctvurl,
                cctvformat: row.cctvformat,
            }));

        if (picks.length === 0) {
            alert("추가할 항목을 선택해 주세요.");
            return;
        }

        if (onPickMany) {
            await onPickMany(picks);
        } else {
            // (호환) onPick만 넘어온 경우에도 최소 동작 보장
            for (const p of picks) {
                await onPick(p);
            }
            onClose();
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

                        {/* 선택 개수 + 추가 버튼 */}
                        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="st-label">선택: <b>{selectedCount}</b> 개</div>
                            <button
                                className="btn btn-primary"
                                onClick={addSelectedAll}
                                disabled={loading || selectedCount === 0}
                                title={selectedCount === 0 ? "항목을 선택하세요" : "선택된 항목 모두 추가"}
                            >
                                선택 추가
                            </button>
                        </div>
                    </aside>

                    <section className="add-right">
                        {loading && <div className="camera-empty">검색 중…</div>}
                        {!loading && list.length === 0 && (
                            <div className="camera-empty">검색 결과가 없습니다.</div>
                        )}
                        {!loading && list.length > 0 && (
                            <ul className="result-list">
                                {list.map((it, i) => {
                                    const isSel = !!selected[it.id];
                                    return (
                                        <li
                                            key={it.id ?? i}
                                            className="result-item"
                                            onClick={() => toggle(it)}             // 클릭으로 토글(다중선택)
                                            onDoubleClick={() =>                   // 더블클릭: 단건 바로 추가(빠른 동작)
                                                onPick?.({
                                                    name: it.name,
                                                    lat: toNum(it.coordy, 0),
                                                    lon: toNum(it.coordx, 0),
                                                    cctvurl: it.cctvurl,
                                                    cctvformat: it.cctvformat,
                                                }).then(() => {
                                                    // 단건 추가 후 리스트에서 체크 해제(선택 흐름 깔끔)
                                                    setSelected(s => ({ ...s, [it.id]: false }));
                                                }).catch((e) => {
                                                    alert(e?.message || "추가 실패");
                                                })
                                            }
                                            title={isSel ? "선택됨 (클릭하여 해제) / 더블클릭: 바로 추가" : "클릭하여 선택 / 더블클릭: 바로 추가"}
                                            style={{
                                                background: isSel ? "rgba(32,117,144,.35)" : undefined,
                                                borderRadius: 8
                                            }}
                                        >
                                            <span className="idx">{String(i + 1).padStart(2, "0")}.</span>{" "}
                                            <span className="nm">{it.name}</span>
                                            <span style={{ marginLeft: "auto", opacity: .8 }}>
                                                {isSel ? "✓" : ""}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
