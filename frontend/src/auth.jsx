// src/auth.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./lib/api.js";

const AuthCtx = createContext({
    me: null,
    loading: true,
    reload: async () => {},
    logout: async () => {},
});

export function AuthProvider({ children }) {
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);

    async function loadMe() {
        try {
            const r = await api("/api/me");
            if (!r.ok) {
                setMe(null);
                return null;
            }
            const data = await r.json();
            setMe(data);
            return data;
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMe();
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
