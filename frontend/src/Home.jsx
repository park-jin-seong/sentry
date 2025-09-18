import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./lib/api.js";

export default function Home() {
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;

        const peek = api.peekAccessToken?.();
        console.log("[Home] mount. accessToken?", !!peek, peek ? peek.slice(0, 20) + "…" : null);

        (async () => {
            try {
                console.log("[Home] call /api/me");
                const res = await api("/api/me");
                console.log("[Home] /api/me status:", res.status, "ok:", res.ok);

                // 응답 바디 한 번 미리 찍어보기 (원본은 clone이라 소비 안 됨)
                let preview;
                try { preview = await res.clone().json(); }
                catch { try { preview = await res.clone().text(); } catch { preview = "<no body>"; } }
                console.log("[Home] /api/me body(preview):", preview);

                if (!res.ok) {
                    console.warn("[Home] /api/me not ok -> go /login");
                    navigate("/login", { replace: true });
                    return;
                }

                const data = await res.json();
                console.log("[Home] /api/me parsed:", data);
                if (mounted) setMe(data);
            } catch (e) {
                console.error("[Home] fetch error (network only):", e);
                // navigate("/login", { replace: true });
            } finally {
                if (mounted) {
                    setLoading(false);
                    console.log("[Home] loading=false");
                }
            }
        })();

        return () => {
            mounted = false;
            console.log("[Home] unmount");
        };
    }, [navigate]);

    const onLogout = async () => {
        try {
            console.log("[Home] logout start");
            await api("/api/auth/logout", { method: "POST" });
        } finally {
            api.clearAccessToken?.();
            console.log("[Home] logout -> cleared token, go /login");
            navigate("/login", { replace: true });
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <h1>홈</h1>
            {loading && <p>불러오는 중…</p>}
            {!loading && me && (
                <pre style={{ background: "#f6f7f9", padding: 12, borderRadius: 8 }}>
{JSON.stringify(me, null, 2)}
        </pre>
            )}
            <button type="button" className="login-btn" onClick={onLogout}>
                로그아웃
            </button>
        </div>
    );
}
