let accessToken = null;

function setAccessToken(token) {
    accessToken = token || null;
}
function clearAccessToken() {
    accessToken = null;
}

function isAuthPath(path) {
    // 인증 관련 엔드포인트는 Authorization 헤더를 붙이지 않음
    return (
        typeof path === "string" &&
        (path.startsWith("/api/auth/login") ||
            path.startsWith("/api/auth/refresh") ||
            path.startsWith("/api/auth/logout"))
    );
}

api.peekAccessToken = () => accessToken;   // 메모리 토큰 들여다보기용
if (typeof window !== "undefined") window.api = api;  // 콘솔에서 window.api로 접근


/** 공통 fetch: 401이면 /api/auth/refresh 시도 후 원요청 1회 재시도 */
async function api(input, init = {}) {
    const headers = new Headers(init.headers || {});

    // body 있을 때만 Content-Type 기본값 설정
    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    // 인증 경로가 아니고, 메모리 토큰이 있으면 Authorization 부착
    if (!isAuthPath(input) && accessToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const base = { credentials: "include" }; // refresh HttpOnly 쿠키 사용

    const first = await fetch(input, { ...base, ...init, headers });
    if (first.status !== 401 || isAuthPath(input)) {
        return first; // 로그인/리프레시/로그아웃은 재시도 불필요
    }

    // 401 → refresh
    const r = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    if (!r.ok) {
        clearAccessToken();
        return first;
    }

    const data = await r.json().catch(() => null);
    if (!data?.accessToken) {
        clearAccessToken();
        return first;
    }

    // 새 access 토큰 갱신(메모리)
    accessToken = data.accessToken;

    // 원요청 재시도
    const retryHeaders = new Headers(init.headers || {});
    if (init.body && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
    }
    retryHeaders.set("Authorization", `Bearer ${accessToken}`);

    return fetch(input, { ...base, ...init, headers: retryHeaders });
}

api.setAccessToken = setAccessToken;
api.clearAccessToken = clearAccessToken;

export { api };
