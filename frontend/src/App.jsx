// App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth.jsx";
import Home from "./Home.jsx";
import SettingsPage from "./SettingsPage.jsx";
import Login from "./Login.jsx";
import Chat from "./Chat.jsx";
import { loadAndApplyChatTheme } from "./lib/chatTheme.js";
import Search from "./Search.jsx";
import TopBar from "./TopBar.jsx";

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


function LayoutWithTopBar() {
    return (
        <>
            <TopBar />
            <Outlet />
        </>
    );
}

function LayoutBare() {
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
                    {/* TopBar 보이는 구간 */}
                    <Route element={<LayoutWithTopBar />}>
                        <Route path="/home" element={<Home />} />
                        <Route path="/search" element={<Search />} />
                        {/* 도움말 임시페이지임 */}
                        <Route path="/help" element={<div className="content-area">도움말</div>} />
                        <Route path="/chat" element={<Chat />} />
                    </Route>

                    {/* TopBar 숨기는 구간 (설정) */}
                    <Route element={<LayoutBare />}>
                        <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                </Route>

                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </AuthProvider>
    );
}
