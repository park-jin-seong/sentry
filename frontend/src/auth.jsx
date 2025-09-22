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
    // peekAccessToken → api.js에 구현되어 있다면 현재 토큰 확인

    async function loadMe() {
        setLoading(true);
        try {
            const r = await api("/api/me", {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                // credentials: "include", // 세션/쿠키 기반이면 활성화
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

    // mount 시
    useEffect(() => { loadMe(); }, [token]);

    // api.js에서 토큰이 변경되면 자동 반영
    useEffect(() => {
        const unsub = api.onAccessTokenChange?.((newToken) => {
            setToken(newToken);
            loadMe();
        });
        return () => unsub?.();
    }, []);

    const logout = async () => {
        try { await api("/api/auth/logout", { method: "POST" }); } catch {}
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
                setToken
            }}
        >
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);