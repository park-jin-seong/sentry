// src/lib/api.js
let accessToken = null;
let refreshingPromise = null;

// 토큰 변경 이벤트 리스너
const listeners = new Set();

/** 세션 복구 허용 플래그(로그인 성공 이후에만 refresh 허용) */
const ACCESS_KEY = "ACCESS_TOKEN";
const ALLOW_REFRESH = "ALLOW_REFRESH";

/** HMR/새로고침 후에도 access, allowRefresh 유지 */
try {
    const t = sessionStorage.getItem(ACCESS_KEY);
    if (t) accessToken = t;
} catch {}

/** ===== 유틸 ===== */
function isAuthPath(path) {
    return (
        typeof path === "string" &&
        (path.startsWith("/api/auth/login") ||
            path.startsWith("/api/auth/refresh") ||
            path.startsWith("/api/auth/logout"))
    );
}

/** 절대/상대 입력을 pathname으로 통일 */
function pathFromInput(input) {
    if (typeof input === "string") {
        if (input.startsWith("http://") || input.startsWith("https://")) {
            try {
                return new URL(input).pathname;
            } catch {
                return input;
            }
        }
        return input;
    }
    if (input && typeof input.url === "string") {
        try {
            return new URL(input.url, window.location.origin).pathname;
        } catch {
            return input.url;
        }
    }
    return "";
}

/** JWT payload 디코더 (옵션) */
function decodeJwtPayload(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/** ===== 토큰 세터/클리어 ===== */
function notifyTokenChange() {
    listeners.forEach((fn) => {
        try {
            fn(accessToken);
        } catch {}
    });
}

function setAccessToken(token) {
    accessToken = token || null;
    try {
        if (token) {
            sessionStorage.setItem(ACCESS_KEY, token);
            sessionStorage.setItem(ALLOW_REFRESH, "1"); // 로그인 성공 후부터 refresh 허용
        } else {
            sessionStorage.removeItem(ACCESS_KEY);
        }
    } catch {}
    notifyTokenChange(); // ✅ 변경 알림
}

function clearAccessToken() {
    setAccessToken(null); // 내부에서 notify 호출됨
    try {
        sessionStorage.removeItem(ALLOW_REFRESH);
    } catch {}
}

/** ===== refresh 1회 동시성 보장 ===== */
async function refreshTokenOnce() {
    if (refreshingPromise) return refreshingPromise;

    // 로그인 이전엔 호출하지 않도록 상위에서 막지만, 혹시 몰라 가드
    if (!sessionStorage.getItem(ALLOW_REFRESH) && !accessToken) {
        throw new Error("refresh not allowed before first login");
    }

    refreshingPromise = (async () => {
        // console.debug("[api] POST /api/auth/refresh");
        const r = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });

        if (!r.ok) {
            // console.debug("[api] refresh 실패:", r.status);
            clearAccessToken();
            throw new Error("refresh failed");
        }

        const data = await r.json().catch(() => null);
        if (!data?.accessToken) {
            clearAccessToken();
            throw new Error("no accessToken");
        }

        setAccessToken(data.accessToken);
        // console.debug("[api] refresh OK");
        return data.accessToken;
    })();

    try {
        return await refreshingPromise;
    } finally {
        refreshingPromise = null;
    }
}

/** Content-Type 자동 세팅 (FormData면 설정하지 않음) */
function ensureContentType(headers, body) {
    if (headers.has("Content-Type")) return;
    if (body instanceof FormData) return; // 브라우저가 boundary 포함해 자동 설정
    headers.set("Content-Type", "application/json");
}

/** 요청용 헤더 구성 (Authorization/Content-Type 포함) */
function buildHeaders(init, useAuth = true) {
    const headers = new Headers(init.headers || {});
    ensureContentType(headers, init.body);
    if (useAuth && accessToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }
    return headers;
}

/** ===== 공통 fetch =====
 * - 비인증 경로 제외 & access 있으면 Authorization 부착
 * - 401이면: 로그인 전엔 refresh 시도하지 않음(조용히 통과)
 *            로그인 후에만 refresh→재시도 1회
 */
async function api(input, init = {}) {
    const reqPath = pathFromInput(input);
    const isAuth = isAuthPath(reqPath);

    // 1차 요청
    const firstHeaders = buildHeaders(init, !isAuth);
    const base = { credentials: "include" }; // HttpOnly refresh 쿠키 사용
    const first = await fetch(input, { ...base, ...init, headers: firstHeaders });

    // 재시도 필요 없음
    const alreadyRetried = !!init.__retried;
    const allowRefresh =
        !!accessToken || sessionStorage.getItem(ALLOW_REFRESH) === "1";

    if (first.status !== 401 || isAuth || alreadyRetried || !allowRefresh) {
        // 로그인 전 401은 정상이므로 조용히 반환
        return first;
    }

    // 여기부터는 로그인 후 401 → refresh 시도
    try {
        await refreshTokenOnce();
    } catch {
        return first; // refresh 실패 → 그대로 401 반환
    }

    // 원요청 1회 재시도 (최신 토큰으로 헤더 재구성)
    const retryHeaders = buildHeaders(init, true);
    return fetch(input, {
        ...base,
        ...init,
        headers: retryHeaders,
        __retried: true,
    });
}

/** ===== 외부 노출 ===== */
api.setAccessToken = setAccessToken;
api.clearAccessToken = clearAccessToken;
api.peekAccessToken = () => accessToken;
api.decodeJwtPayload = decodeJwtPayload;
api.refreshNow = () => refreshTokenOnce();
api.onAccessTokenChange = (cb) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
};

/** 원하는 경우: 앱 첫 로드시 '한 번만' 세션 복구 시도 (조용히) */
let triedBootRestore = false;
api.trySessionRestoreOnce = async () => {
    if (triedBootRestore) return;
    triedBootRestore = true;
    try {
        await refreshTokenOnce(); // 쿠키 있으면 access 갱신
    } catch {
        /* 쿠키 없으면 무시 */
    }
};

if (typeof window !== "undefined") window.api = api;
export { api };
