import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import closeImg from "./assets/close.png";
import { TABS } from "./tabs.js";
import { PANEL_MAP } from "./panelMap.js";
import "./settings.css";
import { useAuth } from "./auth.jsx";
import sentryLogo from "./assets/sentryLogo.png";

export default function SettingsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { me } = useAuth();
    const isObserver = !!me?.roles?.includes?.("ROLE_OBSERVER");

    // URL ?tab=... → 초기 탭 결정 (observer면 chat 강제)
    const initial = (() => {
        const sp = new URLSearchParams(window.location.search);
        const fromUrl = sp.get("tab");
        if (isObserver) return "chat";
        return fromUrl || "my";
    })();

    const [active, setActive] = useState(initial);

    // 활성 패널 선택 (observer면 chat 외 접근해도 chat로 고정)
    const ActivePanel = useMemo(() => {
        const key = isObserver ? "chat" : active;
        return PANEL_MAP[key] ?? PANEL_MAP.chat ?? PANEL_MAP.my;
    }, [active, isObserver]);

    // URL 동기화 (?tab=active)
    useEffect(() => {
        const sp = new URLSearchParams(location.search);
        sp.set("tab", isObserver ? "chat" : active);
        const url = `${window.location.pathname}?${sp.toString()}`;
        window.history.replaceState({}, "", url);
    }, [active, isObserver, location.search]);

    // observer가 URL로 다른 탭을 넣어도 강제로 chat 선택
    useEffect(() => {
        if (isObserver && active !== "chat") {
            setActive("chat");
        }
    }, [isObserver, active]);

    const onClose = () => {
        navigate("/home", { replace: true });
    };

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // 탭 버튼 렌더러: observer면 chat 외 탭은 disabled + 클릭 막기
    const renderTabButton = (tab) => {
        const selected = tab.key === (isObserver ? "chat" : active);
        const disabled = isObserver && tab.key !== "chat";

        return (
            <button
                key={tab.key}
                className={
                    `sidebar-list ${selected ? "is-active" : ""} ${disabled ? "is-disabled" : ""}`
                }
                onClick={() => {
                    if (!disabled) setActive(tab.key);
                }}
                disabled={disabled}
                title={disabled ? "권한이 없습니다" : tab.label}
                aria-disabled={disabled ? "true" : "false"}
            >
                {tab.label}{disabled ? " " : ""}
            </button>
        );
    };

    const title = TABS.find((t) => t.key === (isObserver ? "chat" : active))?.label || "설정";

    return (
        <div className="settings-page">
            {/* 왼쪽 사이드바 */}
            <aside className="settings-sidebar">
                <div className="settings-logo">
                    <img
                        src={sentryLogo}
                        alt="SENTRY Logo"
                        className="settings-logo-img"
                        onClick={() => navigate("/home")}
                        style={{ cursor: "pointer" }}
                    />
                </div>

                <div className="sidebar-section-title">사용자 설정</div>
                {TABS.slice(0, 3).map(renderTabButton)}

                <div className="sidebar-divider" />

                <div className="sidebar-section-title">앱 설정</div>
                {TABS.slice(3).map(renderTabButton)}
            </aside>

            {/* 오른쪽 본문 */}
            <main className="settings-main">
                <header className="settings-header">
                    <h1 className="settings-h1">{title}</h1>

                    {/* 우상단 닫기(이미지 + ESC 라벨) */}
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
