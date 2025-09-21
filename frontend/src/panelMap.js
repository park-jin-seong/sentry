import MyAccount from "./panels/MyAccount.jsx";
import AccountManage from "./panels/AccountManage.jsx";
import ChatSettings from "./panels/ChatSettings.jsx";
import CameraSettings from "./panels/CameraSettings.jsx";
import AnalysisSettings from "./panels/AnalysisSettings.jsx";

export const PANEL_MAP = {
    my: MyAccount,
    account: AccountManage,
    chat: ChatSettings,
    camera: CameraSettings,
    analysis: AnalysisSettings,
};
