// App.jsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth.jsx"; // 확장자 맞추기!
import Home from "./Home.jsx";
import Settings from "./Settings.jsx";
import Login from "./Login.jsx";

function RequireAuth() {
    const { me, loading } = useAuth();
    if (loading) return <div style={{ padding: 24 }}>확인 중…</div>;
    if (!me) return <Navigate to="/login" replace />;
    return <Outlet />;
}

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<RequireAuth />}>
                    <Route path="/home" element={<Home />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </AuthProvider>
    );
}
