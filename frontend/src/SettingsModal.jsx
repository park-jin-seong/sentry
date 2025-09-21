import { useEffect, useMemo, useState } from "react";
import { TABS } from "./tabs.js";
import { PANEL_MAP } from "./panelMap.js";
import "./settings.css";

export default function SettingsModal({ onClose }) {
    // URL ?tab= 동기화(선택)
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
        <div className="settings-backdrop" role="dialog" aria-modal="true">
            <div className="settings-modal">
                <header className="settings-header">
                    <h1>SENTRY</h1>
                    <button onClick={onClose} aria-label="닫기">✕</button>
                </header>

                <div className="settings-body">
                    <nav className="settings-sidebar" role="tablist" aria-orientation="vertical">
                        {TABS.map(tab => {
                            const selected = tab.key === active;
                            return (
                                <button
                                    key={tab.key}
                                    role="tab"
                                    aria-selected={selected}
                                    aria-controls={`panel-${tab.key}`}
                                    className={`sidebar-item ${selected ? "is-active" : ""}`}
                                    onClick={() => setActive(tab.key)}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>

                    <section
                        className="settings-panel"
                        role="tabpanel"
                        id={`panel-${active}`}
                    >
                        <ActivePanel />
                    </section>
                </div>
            </div>
        </div>
    );
}
