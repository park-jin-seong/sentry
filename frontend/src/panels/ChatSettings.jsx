// src/panels/ChatSettings.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";   // ★ 경로 주의: panels -> lib
import "../Settings.css";

const LS_KEYS = { opacity: "chat.opacity", width: "chat.widthPct" };
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const DEFAULTS = { opacity: 70, widthPct: 70 };

function applyCssVars(opacityPct, widthPct) {
    const root = document.documentElement;
    if (Number.isFinite(opacityPct))
        root.style.setProperty("--chat-bg-alpha", String(opacityPct / 100));
    if (Number.isFinite(widthPct))
        root.style.setProperty("--chat-width-pct", String(widthPct));
}

export default function ChatSettings() {
    // 1) 초깃값: 로컬스토리지 → 즉시 CSS 적용 (UX 빠름)
    const [applied, setApplied] = useState(() => ({
        opacity: clamp(Number(localStorage.getItem(LS_KEYS.opacity)) || DEFAULTS.opacity, 0, 100),
        widthPct: clamp(Number(localStorage.getItem(LS_KEYS.width))   || DEFAULTS.widthPct, 20, 100),
    }));
    const [draft, setDraft] = useState(applied);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 2) 마운트 시: 저장된 로컬 값으로 한번 적용
    useEffect(() => {
        applyCssVars(applied.opacity, applied.widthPct);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 3) 서버에서 내 UI 설정 불러와서 덮어쓰기 (있으면)
    useEffect(() => {
        (async () => {
            try {
                const res = await api("/api/me/ui");
                if (!res.ok) throw new Error("pref load fail");
                const data = await res.json();
                const srv = {
                    opacity: clamp(Number(data.chatOpacity ?? DEFAULTS.opacity), 0, 100),
                    widthPct: clamp(Number(data.chatWidthPct ?? DEFAULTS.widthPct), 20, 100),
                };
                setApplied(srv);
                setDraft(srv);
                // CSS & 로컬에도 반영
                applyCssVars(srv.opacity, srv.widthPct);
                localStorage.setItem(LS_KEYS.opacity, String(srv.opacity));
                localStorage.setItem(LS_KEYS.width, String(srv.widthPct));
            } catch (e) {
                console.warn("[ChatSettings] 서버 UI 설정 조회 실패, 로컬값 유지", e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // 핸들러
    const onOpacityRange = (e) =>
        setDraft((s) => ({ ...s, opacity: clamp(Number(e.target.value || 0), 0, 100) }));
    const onOpacityNum = (e) =>
        setDraft((s) => ({ ...s, opacity: clamp(Number(e.target.value || 0), 0, 100) }));
    const onWidth = (e) =>
        setDraft((s) => ({ ...s, widthPct: clamp(Number(e.target.value || 0), 20, 100) }));

    const onApply = async () => {
        // 1) 즉시 화면 반영 & 로컬 저장
        applyCssVars(draft.opacity, draft.widthPct);
        localStorage.setItem(LS_KEYS.opacity, String(draft.opacity));
        localStorage.setItem(LS_KEYS.width, String(draft.widthPct));
        setApplied(draft);

        // 2) 서버에도 저장
        try {
            setSaving(true);
            const res = await api("/api/me/ui", {
                method: "PATCH",
                body: JSON.stringify({
                    chatOpacity: draft.opacity,
                    chatWidthPct: draft.widthPct,
                }),
            });
            if (!res.ok) {
                const msg = (await res.json().catch(() => ({})))?.error || "저장 실패";
                alert(msg);
                return;
            }
            // 서버 응답으로 다시 확정해도 되고, 이미 state에 반영되었으니 생략 가능
        } finally {
            setSaving(false);
        }
    };

    const onResetToDefault = () => setDraft(DEFAULTS);
    const onCancel = () => setDraft(applied);

    return (
        <section className="st-panel">
            <div className="st-card" style={{ maxWidth: 640 }}>
                <h3 className="st-h3">채팅 설정</h3>

                {loading ? (
                    <div className="st-label">불러오는 중…</div>
                ) : (
                    <>
                        {/* 투명도 */}
                        <div style={{ marginTop: 8 }}>
                            <div className="st-label">채팅 화면 투명도</div>
                            <div className="st-help">채팅 화면의 배경 투명도를 조절합니다.</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                                <input
                                    type="range" min="0" max="100" step="1"
                                    value={draft.opacity}
                                    onChange={onOpacityRange}
                                    className="st-range" style={{ flex: 1 }}
                                />
                                <div className="st-percentbox">
                                    <input
                                        className="st-input" type="number" min="0" max="100"
                                        value={draft.opacity} onChange={onOpacityNum}
                                        style={{ width: 64, textAlign: "right" }}
                                    />
                                    <span style={{ marginLeft: 6, opacity: 0.8 }}>%</span>
                                </div>
                            </div>
                        </div>

                        {/* 화면 너비 */}
                        <div style={{ marginTop: 24 }}>
                            <div className="st-label">채팅 화면 너비</div>
                            <div className="st-help">오른쪽 채팅 패널의 너비를 조절합니다.</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                                <input
                                    type="range" min="20" max="100" step="1"
                                    value={draft.widthPct}
                                    onChange={onWidth}
                                    className="st-range" style={{ flex: 1 }}
                                />
                                <div className="st-percentbox">
                                    <div className="st-input" style={{ width: 64, textAlign: "right" }}>
                                        {draft.widthPct}
                                    </div>
                                    <span style={{ marginLeft: 6, opacity: 0.8 }}>%</span>
                                </div>
                            </div>
                        </div>

                        {/* 버튼 */}
                        <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
                            <button type="button" className="st-btn" onClick={onResetToDefault}>
                                기본값
                            </button>
                            <button type="button" className="st-btn" onClick={onCancel}>
                                취소
                            </button>
                            <button type="button" className="st-primary" onClick={onApply} style={{ marginLeft: "auto" }} disabled={saving}>
                                {saving ? "저장 중…" : "적용"}
                            </button>
                        </div>

                        <div className="st-help" style={{ marginTop: 12 }}>
                            현재 적용값 · 투명도 <b>{applied.opacity}%</b>, 너비 <b>{applied.widthPct}%</b>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
