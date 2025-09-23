import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";             // ⬅ 추가
import closeImg from "./assets/close.png";                  // ⬅ 경로 확인!
import { TABS } from "./tabs.js";
import { PANEL_MAP } from "./panelMap.js";
import "./settings.css";

export default function SettingsPage() {
    const navigate = useNavigate();                           // ⬅ 추가

    const initial = (() => {
        const sp = new URLSearchParams(window.location.search);
        return sp.get("tab") || "my";
    })();

    const [active, setActive] = useState(initial);
    const ActivePanel = useMemo(() => PANEL_MAP[active] ?? PANEL_MAP.my, [active]);

    useEffect(() => {
        const sp = new URLSearchParams(window.location.search);
        sp.set("tab", active);
        const url = `${window.location.pathname}?${sp.toString()}`;
        window.history.replaceState({}, "", url);
    }, [active]);

    // 닫기(ESC 포함)
    const onClose = () => {
        // 히스토리 뒤로 가도 되고, 고정으로 홈으로 가도 됨. 취향대로 한 줄만 남겨도 OK.
        // navigate(-1);
        navigate("/home", { replace: true });
    };

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div className="settings-page">
            {/* 왼쪽 사이드바 */}
            <aside className="settings-sidebar">
                <div className="settings-logo">SENTRY</div>

                <div className="sidebar-section-title">사용자 설정</div>
                {TABS.slice(0, 3).map((tab) => {
                    const selected = tab.key === active;
                    return (
                        <button
                            key={tab.key}
                            className={`sidebar-item ${selected ? "is-active" : ""}`}
                            onClick={() => setActive(tab.key)}
                        >
                            {tab.label}
                        </button>
                    );
                })}

                <div className="sidebar-divider" />

                <div className="sidebar-section-title">앱 설정</div>
                {TABS.slice(3).map((tab) => {
                    const selected = tab.key === active;
                    return (
                        <button
                            key={tab.key}
                            className={`sidebar-item ${selected ? "is-active" : ""}`}
                            onClick={() => setActive(tab.key)}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </aside>

            {/* 오른쪽 본문 */}
            <main className="settings-main">
                <header className="settings-header">
                    <h1 className="settings-h1">{TABS.find((t) => t.key === active)?.label}</h1>

                    {/* ⬇ 우상단 닫기(이미지 + ESC 라벨) */}
                    <button
                        className="esc-close"
                        onClick={onClose}
                        title="닫기 (ESC)"
                        aria-label="설정 닫기"
                    >
                        <img src={closeImg} alt="닫기" draggable="false" />
                        <span>ESC</span>
                    </button>
                </header>

                <section className="settings-panel">
                    <ActivePanel />
                </section>
            </main>
        </div>
    );
}
