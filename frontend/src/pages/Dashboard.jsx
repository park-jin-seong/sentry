import { useState } from "react";
import { SettingsModal } from "../components/settings";

export default function Dashboard() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button onClick={() => setOpen(true)}>설정</button>
            {open && <SettingsModal onClose={() => setOpen(false)} />}
        </>
    );
}
