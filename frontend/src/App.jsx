// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login.jsx";
import Home from "./Home.jsx";
import Settings from "./Settings.jsx";


export default function App() {
    return (

        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            <Route
                path="/home"
                element={
                        <Home />
                }
            />

            <Route path="/settings" element={<Settings />} />



            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

    );
}
