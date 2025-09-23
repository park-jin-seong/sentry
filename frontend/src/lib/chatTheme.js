// src/lib/chatTheme.js
const VAR_OPACITY = "--chat-bg-alpha"; // 0~1
const VAR_WIDTH   = "--chat-width-pct"; // 40~100 (%)
const KEY_OPACITY = "chat.opacity";    // 0~100
const KEY_WIDTH   = "chat.widthPct";   // 40~100

function toNumber(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

// 앱 시작 시: 저장된 값 있으면 적용
export function loadAndApplyChatTheme() {
    const op = toNumber(localStorage.getItem(KEY_OPACITY), 70);
    const wd = toNumber(localStorage.getItem(KEY_WIDTH), 70);
    applyChatTheme(op, wd);
    return { opacity: op, widthPct: wd };
}

// 설정에서 즉시 적용 + 저장
export function applyChatTheme(opacityPct, widthPct) {
    const root = document.documentElement;
    if (Number.isFinite(opacityPct)) {
        root.style.setProperty(VAR_OPACITY, String(opacityPct / 100));
        localStorage.setItem(KEY_OPACITY, String(opacityPct));
    }
    if (Number.isFinite(widthPct)) {
        root.style.setProperty(VAR_WIDTH, String(widthPct));
        localStorage.setItem(KEY_WIDTH, String(widthPct));
    }
}
