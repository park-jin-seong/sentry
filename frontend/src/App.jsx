// App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth.jsx";
import Home from "./Home.jsx";
import SettingsPage from "./SettingsPage.jsx";
import Login from "./Login.jsx";
import Chat from "./Chat.jsx";
import { loadAndApplyChatTheme } from "./lib/chatTheme.js";


function InitCssVars() {
    useEffect(() => {
        loadAndApplyChatTheme(); // ★ 한 번만
    }, []);
    return null;
}

function RequireAuth() {
    const { me, loading } = useAuth();
    if (loading) return <div style={{ padding: 24 }}>확인 중…</div>;
    if (!me) return <Navigate to="/login" replace />;
    return <Outlet />;
}

export default function App() {
    return (
        <AuthProvider>
            {/* 앱 시작 시 한 번 CSS 변수 초기화 */}
            <InitCssVars />

            <Routes>
                <Route path="/login" element={<Login />} />

                <Route element={<RequireAuth />}>
                    <Route path="/home" element={<Home />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/chat" element={<Chat />} /> {/* 필요하면 보호된 채팅 라우트 */}
                </Route>

                {/* 기본/예외 라우팅 */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </AuthProvider>
    );
}
