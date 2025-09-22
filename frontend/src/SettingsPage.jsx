import { useEffect, useMemo, useState } from "react";
import { TABS } from "./tabs.js";
import { PANEL_MAP } from "./panelMap.js";
import "./settings.css";

export default function SettingsPage() {
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
                    <h1 className="settings-h1">{TABS.find(t => t.key === active)?.label}</h1>
                </header>

                <section className="settings-panel">
                    <ActivePanel />
                </section>
            </main>
        </div>
    );
}
