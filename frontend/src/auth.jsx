// src/auth.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./lib/api.js";

const AuthCtx = createContext({
    me: null,
    loading: true,
    isAuthenticated: false,
    reload: async () => {},
    logout: async () => {},
});

export function AuthProvider({ children }) {
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);

    async function loadMe() {
        setLoading(true);                 // 매 호출마다 로딩 시작
        try {
            const r = await api("/api/me", {
                // 쿠키 기반 리프레시/세션을 쓴다면 필요
                // credentials: "include",
            });
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

    // 첫 마운트 시 1회
    useEffect(() => { loadMe(); }, []);

    // 토큰이 바뀌면 자동 재조회 (api.js에 onAccessTokenChange가 있어야 함)
    useEffect(() => {
        const unsub = api.onAccessTokenChange?.(() => {
            loadMe();
        });
        return () => unsub?.();
    }, []);

    const logout = async () => {
        try { await api("/api/auth/logout", { method: "POST" }); } catch {}
        api.clearAccessToken?.();
        window.location.replace("/login");
    };

    return (
        <AuthCtx.Provider value={{ me, loading, reload: loadMe, logout }}>
            {children}
        </AuthCtx.Provider>
    );
}


export const useAuth = () => useContext(AuthCtx);
