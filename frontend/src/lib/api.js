// lib/api.js
let accessToken = null;
let refreshingPromise = null;

function setAccessToken(token) { accessToken = token || null; }
function clearAccessToken() { accessToken = null; }

function isAuthPath(path) {
    return typeof path === "string" && (
        path.startsWith("/api/auth/login") ||
        path.startsWith("/api/auth/refresh") ||
        path.startsWith("/api/auth/logout")
    );
}

function pathFromInput(input) {
    if (typeof input === "string") return input;
    if (input && typeof input.url === "string") {
        try { return new URL(input.url, window.location.origin).pathname; }
        catch { return input.url; }
    }
    return "";
}

// JWT payload 디코더
function decodeJwtPayload(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

// refresh를 동시에 한 번만 수행
async function refreshTokenOnce() {
    if (refreshingPromise) return refreshingPromise;
    refreshingPromise = (async () => {
        const r = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        if (!r.ok) { clearAccessToken(); throw new Error("refresh failed"); }
        const data = await r.json().catch(() => null);
        if (!data?.accessToken) { clearAccessToken(); throw new Error("no accessToken"); }
        setAccessToken(data.accessToken);
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
    if (!isAuthPath(reqPath) && accessToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }
    const base = { credentials: "include" };

    const first = await fetch(input, { ...base, ...init, headers });
    if (first.status !== 401 || isAuthPath(reqPath) || init.__retried) return first;

    try { await refreshTokenOnce(); }
    catch { return first; } // refresh 실패 → 상위에서 처리

    const retryHeaders = new Headers(init.headers || {});
    if (init.body && !retryHeaders.has("Content-Type")) retryHeaders.set("Content-Type", "application/json");
    if (accessToken) retryHeaders.set("Authorization", `Bearer ${accessToken}`);

    return fetch(input, { ...base, ...init, headers: retryHeaders, __retried: true });
}

// api 선언 "이후"에 프로퍼티를 붙이세요
api.setAccessToken = setAccessToken;
api.clearAccessToken = clearAccessToken;
api.peekAccessToken = () => accessToken;
api.decodeJwtPayload = decodeJwtPayload;      // ← Settings.jsx에서 사용
api.refreshNow = () => refreshTokenOnce();    // ← Settings.jsx에서 사용

if (typeof window !== "undefined") window.api = api; // 디버깅 편의
export { api };
