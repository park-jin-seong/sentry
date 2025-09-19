import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "./lib/api.js";

/** /api/me 로 실제 인증 확인 (localStorage 절대 사용 X) */
export default function RequireAuth({ children }) {
    const [state, setState] = useState("checking"); // "checking" | "ok" | "fail"

    useEffect(() => {
        let on = true;
        (async () => {
            try {
                const res = await api("/api/me");
                if (!on) return;
                setState(res.ok ? "ok" : "fail");
            } catch {
                if (!on) return;
                setState("fail");
            }
        })();
        return () => { on = false; };
    }, []);

    if (state === "checking") return <p style={{padding:24}}>인증 확인 중…</p>;
    if (state === "fail") return <Navigate to="/login" replace />;
    return children;
}
