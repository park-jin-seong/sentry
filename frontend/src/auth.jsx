import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./lib/api.js";

const AuthCtx = createContext({
    me: null,
    loading: true,
    isAuthenticated: false,
    token: null,
    reload: async () => {},
    logout: async () => {},
    setToken: () => {},
});

export function AuthProvider({ children }) {
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(api.peekAccessToken?.() ?? null);

    // 현재 경로가 /login 인지 여부
    const onLoginPage =
        typeof window !== "undefined" && window.location.pathname.startsWith("/login");

    async function loadMe() {
        setLoading(true);
        try {
            // ✅ 로그인 페이지에서, 그리고 토큰이 없으면 /api/me 호출하지 않음 (불필요한 401 방지)
            if (onLoginPage && !api.peekAccessToken?.()) {
                setMe(null);
                return null;
            }
            // ✅ 토큰이 없으면 조회 스킵 (초기화 단계/로그아웃 직후)
            if (!api.peekAccessToken?.()) {
                setMe(null);
                return null;
            }

            const r = await api("/api/me"); // api()가 Authorization을 자동 부착
            if (!r.ok) {
                setMe(null);
                return null;
            }
            const data = await r.json();
            setMe(data);
            return data;
        } catch {
            setMe(null);
            return null;
        } finally {
            setLoading(false);
        }
    }

    // mount & 토큰 변경 시: 로그인 페이지가 아닐 때만 me 조회
    useEffect(() => {
        if (!onLoginPage) loadMe();
        else setLoading(false); // /login에서는 바로 로딩 false
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, onLoginPage]);

    // api.js에서 토큰이 변경되면 자동 반영
    useEffect(() => {
        const unsub = api.onAccessTokenChange?.((newToken) => {
            setToken(newToken);
            // 로그인 페이지에서는 중복 호출하지 않음
            if (!onLoginPage) loadMe();
        });
        return () => unsub?.();
    }, [onLoginPage]); // onLoginPage 변화 시 구독 재설정

    const logout = async () => {
        try {
            await api("/api/auth/logout", { method: "POST" });
        } catch {}
        api.clearAccessToken?.();
        setToken(null);
        setMe(null);
        window.location.replace("/login");
    };

    return (
        <AuthCtx.Provider
            value={{
                me,
                loading,
                isAuthenticated: !!me,
                token,
                reload: loadMe,
                logout,
                setToken,
            }}
        >
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);
