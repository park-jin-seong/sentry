// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login.jsx";

// 보호 라우트: 토큰 없으면 로그인으로
function RequireAuth({ children }) {
    const authed = !!localStorage.getItem("accessToken");
    return authed ? children : <Navigate to="/login" replace />;
}

function Dashboard() {
    return <h1>대시보드</h1>;
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            <Route
                path="/dashboard"
                element={
                    <RequireAuth>
                        <Dashboard />
                    </RequireAuth>
                }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}
