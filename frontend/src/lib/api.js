// src/api.js (React)
export async function api(path, options = {}) {
    const token = localStorage.getItem("accessToken");
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    // refresh 쿠키 사용 시
    const base = { credentials: "include" };

    console.log("[api] 요청:", path, { headers: Object.fromEntries(headers.entries()) });

    let res = await fetch(path, { ...base, ...options, headers });
    if (res.status !== 401) return res;

    console.warn("[api] 401 발생 → /api/auth/refresh 시도");
    const r = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    if (!r.ok) {
        console.error("[api] refresh 실패 → 로그아웃 처리");
        localStorage.removeItem("accessToken");
        return res; // 호출부에서 401 처리(라우팅 등)
    }

    const data = await r.json();
    if (!data?.accessToken) {
        console.error("[api] refresh 응답에 accessToken 없음");
        localStorage.removeItem("accessToken");
        return res;
    }

    localStorage.setItem("accessToken", data.accessToken);
    console.log("[api] 새 accessToken 저장:", data.accessToken.slice(0, 12), "...");

    // 원 요청 재시도
    headers.set("Authorization", `Bearer ${data.accessToken}`);
    return fetch(path, { ...base, ...options, headers });
}
