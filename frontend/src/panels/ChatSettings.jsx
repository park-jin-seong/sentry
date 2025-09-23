// src/components/settings/panels/ChatSettings.jsx
import { useEffect, useState } from "react";
import "../Settings.css";

const LS_KEYS = { opacity: "chat.opacity", width: "chat.widthPct" };
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const DEFAULTS = { opacity: 70, widthPct: 70 };

function applyCssVars(opacityPct, widthPct) {
    const root = document.documentElement;
    root.style.setProperty("--chat-bg-alpha", String(opacityPct / 100)); // 0~1
    root.style.setProperty("--chat-width-pct", String(widthPct));        // 숫자만 (vw는 CSS에서 계산)
}

export default function ChatSettings() {
    const [applied, setApplied] = useState(() => ({
        opacity: clamp(Number(localStorage.getItem(LS_KEYS.opacity)) || DEFAULTS.opacity, 0, 100),
        widthPct: clamp(Number(localStorage.getItem(LS_KEYS.width)) || DEFAULTS.widthPct, 20, 100), // ✅ 20~100
    }));
    const [draft, setDraft] = useState(applied);

    useEffect(() => { applyCssVars(applied.opacity, applied.widthPct); }, []); // 초기 1회

    const onOpacityRange = (e) => setDraft(s => ({ ...s, opacity: clamp(+e.target.value || 0, 0, 100) }));
    const onOpacityNum   = (e) => setDraft(s => ({ ...s, opacity: clamp(+e.target.value || 0, 0, 100) }));
    const onWidth        = (e) => setDraft(s => ({ ...s, widthPct: clamp(+e.target.value || 0, 20, 100) })); // ✅ 20~

    const onApply = () => {
        applyCssVars(draft.opacity, draft.widthPct);
        localStorage.setItem(LS_KEYS.opacity, String(draft.opacity));
        localStorage.setItem(LS_KEYS.width,   String(draft.widthPct));
        setApplied(draft);
    };

    const onResetToDefault = () => setDraft(DEFAULTS);
    const onCancel = () => setDraft(applied);

    return (
        <section className="st-panel">
            <div className="st-card" style={{ maxWidth: 640 }}>
                <h3 className="st-h3">채팅 설정</h3>

                {/* 투명도 */}
                <div style={{ marginTop: 8 }}>
                    <div className="st-label">채팅 화면 투명도</div>
                    <div className="st-help">채팅 화면의 배경 투명도를 조절합니다.</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                        <input
                            type="range" min="0" max="100" step="1"
                            value={draft.opacity}
                            onChange={onOpacityRange}
                            className="st-range"
                            style={{ flex: 1 }}
                            aria-label="채팅 화면 투명도"
                        />
                        <div className="st-percentbox">
                            <input
                                className="st-input"
                                type="number" min="0" max="100"
                                value={draft.opacity}
                                onChange={onOpacityNum}
                                style={{ width: 64, textAlign: "right" }}
                            />
                            <span style={{ marginLeft: 6, opacity: 0.8 }}>%</span>
                        </div>
                    </div>
                </div>

                {/* 화면 너비 */}
                <div style={{ marginTop: 24 }}>
                    <div className="st-label">채팅 화면 너비</div>
                    <div className="st-help">오버레이 채팅 패널의 너비를 조절합니다.</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                        <input
                            type="range" min="20" max="100" step="1"  // ✅ 최소 20으로
                            value={draft.widthPct}
                            onChange={onWidth}
                            className="st-range"
                            style={{ flex: 1 }}
                            aria-label="채팅 화면 너비"
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
                    <button type="button" className="st-btn" onClick={onResetToDefault}>기본값</button>
                    <button type="button" className="st-btn" onClick={onCancel}>취소</button>
                    <button type="button" className="st-primary" onClick={onApply} style={{ marginLeft: "auto" }}>
                        적용
                    </button>
                </div>

                <div className="st-help" style={{ marginTop: 12 }}>
                    현재 적용값 · 투명도 <b>{applied.opacity}%</b>, 너비 <b>{applied.widthPct}%</b>
                </div>
            </div>
        </section>
    );
}
