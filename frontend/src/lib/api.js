// src/lib/api.js
let accessToken = null;
let refreshingPromise = null;

/** 새로고침/HMR 후에도 토큰 유지 */
const ACCESS_KEY = "ACCESS_TOKEN";
try {
    const t = sessionStorage.getItem(ACCESS_KEY);
    if (t) accessToken = t;
} catch {}

/** 토큰 저장/삭제 시 세션에도 반영 */
function setAccessToken(token) {
    accessToken = token || null;
    try {
        if (token) sessionStorage.setItem(ACCESS_KEY, token);
        else sessionStorage.removeItem(ACCESS_KEY);
    } catch {}
}
function clearAccessToken() {
    setAccessToken(null);
}

function isAuthPath(path) {
    return typeof path === "string" && (
        path.startsWith("/api/auth/login") ||
        path.startsWith("/api/auth/refresh") ||
        path.startsWith("/api/auth/logout")
    );
}

/** 절대 URL 문자열도 pathname으로 변환해서 isAuthPath가 정확히 동작 */
function pathFromInput(input) {
    if (typeof input === "string") {
        if (input.startsWith("http://") || input.startsWith("https://")) {
            try { return new URL(input).pathname; } catch { return input; }
        }
        return input; // 상대 경로
    }
    if (input && typeof input.url === "string") {
        try { return new URL(input.url, window.location.origin).pathname; }
        catch { return input.url; }
    }
    return "";
}

// JWT payload 디코더 (Settings에서 사용)
function decodeJwtPayload(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
        );
        return JSON.parse(json);
    } catch { return null; }
}

/** refresh를 동시에 1번만, 그리고 로그로 흐름 확인 */
async function refreshTokenOnce() {
    if (refreshingPromise) return refreshingPromise;
    console.warn("[api] 401 -> POST /api/auth/refresh 시도");
    refreshingPromise = (async () => {
        const r = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        if (!r.ok) {
            console.error("[api] refresh 응답 실패:", r.status);
            clearAccessToken();
            throw new Error("refresh failed");
        }
        const data = await r.json().catch(() => null);
        if (!data?.accessToken) {
            console.error("[api] refresh 응답에 accessToken 없음");
            clearAccessToken();
            throw new Error("no accessToken");
        }
        setAccessToken(data.accessToken);
        console.log("[api] refresh OK. new access =", data.accessToken.slice(0, 20) + "…");
        return data.accessToken;
    })();
    try { return await refreshingPromise; }
    finally { refreshingPromise = null; }
}

/** 공통 fetch: 401이면 refresh 후 1회 재시도 */
async function api(input, init = {}) {
    const headers = new Headers(init.headers || {});
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const reqPath = pathFromInput(input);

    // 인증 경로가 아니고 메모리 토큰이 있으면 Authorization 부착
    if (!isAuthPath(reqPath) && accessToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const base = { credentials: "include" }; // refresh HttpOnly 쿠키 사용

    const first = await fetch(input, { ...base, ...init, headers });
    if (first.status !== 401 || isAuthPath(reqPath) || init.__retried) {
        if (first.status === 401) {
            console.warn("[api]", reqPath, "401(재시도 안 함): auth-path거나 이미 재시도됨");
        }
        return first;
    }

    // 401 → refresh 시도
    try {
        await refreshTokenOnce();
    } catch {
        return first; // refresh 실패 → 그대로 401 반환
    }

    // 원요청 재시도
    const retryHeaders = new Headers(init.headers || {});
    if (init.body && !retryHeaders.has("Content-Type")) retryHeaders.set("Content-Type", "application/json");
    if (accessToken) retryHeaders.set("Authorization", `Bearer ${accessToken}`);

    console.log("[api] 재시도:", reqPath);
    return fetch(input, { ...base, ...init, headers: retryHeaders, __retried: true });
}

// 외부 노출
api.setAccessToken = setAccessToken;
api.clearAccessToken = clearAccessToken;
api.peekAccessToken = () => accessToken;
api.decodeJwtPayload = decodeJwtPayload;
api.refreshNow = () => refreshTokenOnce();

// 토큰 변경 구독 훅이 필요하면 아래 주석 해제
// const tokenListeners = new Set();
// function emitTokenChange(){ for (const f of tokenListeners) try{ f(accessToken); } catch{} }
// api.onTokenChange = (cb)=>{ tokenListeners.add(cb); return ()=>tokenListeners.delete(cb); };
// setAccessToken = (t)=>{ accessToken=t||null; /* sessionStorage... */ emitTokenChange(); };
// clearAccessToken = ()=>{ setAccessToken(null); };

if (typeof window !== "undefined") window.api = api;
export { api };
