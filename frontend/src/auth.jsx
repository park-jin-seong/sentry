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

    const onLoginPage =
        typeof window !== "undefined" && window.location.pathname.startsWith("/login");

    async function loadMe() {
        setLoading(true);
        try {
            if (onLoginPage && !api.peekAccessToken?.()) {
                setMe(null);
                return null;
            }
            if (!api.peekAccessToken?.()) {
                setMe(null);
                return null;
            }

            const r = await api("/api/me");
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

    useEffect(() => {
        if (!onLoginPage) loadMe();
        else setLoading(false);
    }, [token, onLoginPage]);

    useEffect(() => {
        const unsub = api.onAccessTokenChange?.((newToken) => {
            setToken(newToken);
            if (!onLoginPage) loadMe();
        });
        return () => unsub?.();
    }, [onLoginPage]);

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
