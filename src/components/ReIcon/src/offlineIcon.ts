// 这里存放本地图标，在 src/layout/index.vue 文件中加载，避免在首启动加载
import { getSvgInfo } from "@pureadmin/utils";
import { addIcon } from "@iconify/vue/dist/offline";

// ========== Element Plus Icons ==========
// https://icon-sets.iconify.design/ep/?keyword=ep
import EpHomeFilled from "~icons/ep/home-filled?raw";
import EpUser from "~icons/ep/user?raw";
import EpUserFilled from "~icons/ep/user-filled?raw";
import EpSetting from "~icons/ep/setting?raw";
import EpTools from "~icons/ep/tools?raw";
import EpMenu from "~icons/ep/menu?raw";
import EpGrid from "~icons/ep/grid?raw";
import EpList from "~icons/ep/list?raw";
import EpDocument from "~icons/ep/document?raw";
import EpFolder from "~icons/ep/folder?raw";
import EpFolderOpened from "~icons/ep/folder-opened?raw";
import EpFiles from "~icons/ep/files?raw";
import EpEdit from "~icons/ep/edit?raw";
import EpDelete from "~icons/ep/delete?raw";
import EpPlus from "~icons/ep/plus?raw";
import EpMinus from "~icons/ep/minus?raw";
import EpSearch from "~icons/ep/search?raw";
import EpRefresh from "~icons/ep/refresh?raw";
import EpUpload from "~icons/ep/upload?raw";
import EpDownload from "~icons/ep/download?raw";
import EpPicture from "~icons/ep/picture?raw";
import EpLink from "~icons/ep/link?raw";
import EpNotification from "~icons/ep/notification?raw";
import EpMessage from "~icons/ep/message?raw";
import EpBell from "~icons/ep/bell?raw";
import EpLock from "~icons/ep/lock?raw";
import EpUnlock from "~icons/ep/unlock?raw";
import EpKey from "~icons/ep/key?raw";
import EpStar from "~icons/ep/star?raw";
import EpStarFilled from "~icons/ep/star-filled?raw";
import EpClock from "~icons/ep/clock?raw";
import EpCalendar from "~icons/ep/calendar?raw";
import EpView from "~icons/ep/view?raw";
import EpHide from "~icons/ep/hide?raw";
import EpPosition from "~icons/ep/position?raw";
import EpLocation from "~icons/ep/location?raw";
import EpPhone from "~icons/ep/phone?raw";
import EpChatDotRound from "~icons/ep/chat-dot-round?raw";
import EpVideoCamera from "~icons/ep/video-camera?raw";
import EpMonitor from "~icons/ep/monitor?raw";
import EpPrinter from "~icons/ep/printer?raw";
import EpHelp from "~icons/ep/help?raw";
import EpInfoFilled from "~icons/ep/info-filled?raw";
import EpWarning from "~icons/ep/warning?raw";
import EpSuccessFilled from "~icons/ep/success-filled?raw";
import EpCircleCheck from "~icons/ep/circle-check?raw";
import EpCircleClose from "~icons/ep/circle-close?raw";
import EpClose from "~icons/ep/close?raw";
import EpCheck from "~icons/ep/check?raw";
import EpCpu from "~icons/ep/cpu?raw";
import EpOfficeBuilding from "~icons/ep/office-building?raw";
import EpManagement from "~icons/ep/management?raw";
import EpDataAnalysis from "~icons/ep/data-analysis?raw";
import EpMoney from "~icons/ep/money?raw";

// ========== Remix Icons ==========
// https://icon-sets.iconify.design/ri/?keyword=ri
import RiSearchLine from "~icons/ri/search-line?raw";
import RiInformationLine from "~icons/ri/information-line?raw";
import RiShieldKeyholeLine from "~icons/ri/shield-keyhole-line?raw";
import RiAdminLine from "~icons/ri/admin-line?raw";
import RiHistoryFill from "~icons/ri/history-fill?raw";
import RiAdminFill from "~icons/ri/admin-fill?raw";
import RiToolsLine from "~icons/ri/tools-line?raw";
import RiCheckboxCircleLine from "~icons/ri/checkbox-circle-line?raw";
import RiDashboardLine from "~icons/ri/dashboard-line?raw";
import RiHomeLine from "~icons/ri/home-line?raw";
import RiUserLine from "~icons/ri/user-line?raw";
import RiSettingsLine from "~icons/ri/settings-line?raw";
import RiFileListLine from "~icons/ri/file-list-line?raw";
import RiFolderLine from "~icons/ri/folder-line?raw";
import RiAddLine from "~icons/ri/add-line?raw";
import RiDeleteBinLine from "~icons/ri/delete-bin-line?raw";
import RiEditLine from "~icons/ri/edit-line?raw";
import RiSaveLine from "~icons/ri/save-line?raw";
import RiRefreshLine from "~icons/ri/refresh-line?raw";
import RiUploadLine from "~icons/ri/upload-line?raw";
import RiDownloadLine from "~icons/ri/download-line?raw";
import RiImageLine from "~icons/ri/image-line?raw";
import RiLink from "~icons/ri/link?raw";
import RiNotificationLine from "~icons/ri/notification-line?raw";
import RiMessageLine from "~icons/ri/message-line?raw";
import RiMailLine from "~icons/ri/mail-line?raw";
import RiLockLine from "~icons/ri/lock-line?raw";
import RiKeyLine from "~icons/ri/key-line?raw";
import RiStarLine from "~icons/ri/star-line?raw";
import RiTimeLine from "~icons/ri/time-line?raw";
import RiCalendarLine from "~icons/ri/calendar-line?raw";
import RiEyeLine from "~icons/ri/eye-line?raw";
import RiEyeOffLine from "~icons/ri/eye-off-line?raw";
import RiMapPinLine from "~icons/ri/map-pin-line?raw";
import RiPhoneLine from "~icons/ri/phone-line?raw";
import RiChat1Line from "~icons/ri/chat-1-line?raw";
import RiVideoLine from "~icons/ri/video-line?raw";
import RiComputerLine from "~icons/ri/computer-line?raw";
import RiQuestionLine from "~icons/ri/question-line?raw";
import RiErrorWarningLine from "~icons/ri/error-warning-line?raw";
import RiCloseCircleLine from "~icons/ri/close-circle-line?raw";
import RiCloseLine from "~icons/ri/close-line?raw";
import RiCheckLine from "~icons/ri/check-line?raw";

// Icon tuple: [icon-name, raw SVG module]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const icons: Array<[string, any]> = [
  // ========== Element Plus Icons ==========
  ["ep/home-filled", EpHomeFilled],
  ["ep/user", EpUser],
  ["ep/user-filled", EpUserFilled],
  ["ep/setting", EpSetting],
  ["ep/tools", EpTools],
  ["ep/menu", EpMenu],
  ["ep/grid", EpGrid],
  ["ep/list", EpList],
  ["ep/document", EpDocument],
  ["ep/folder", EpFolder],
  ["ep/folder-opened", EpFolderOpened],
  ["ep/files", EpFiles],
  ["ep/edit", EpEdit],
  ["ep/delete", EpDelete],
  ["ep/plus", EpPlus],
  ["ep/minus", EpMinus],
  ["ep/search", EpSearch],
  ["ep/refresh", EpRefresh],
  ["ep/upload", EpUpload],
  ["ep/download", EpDownload],
  ["ep/picture", EpPicture],
  ["ep/link", EpLink],
  ["ep/notification", EpNotification],
  ["ep/message", EpMessage],
  ["ep/bell", EpBell],
  ["ep/lock", EpLock],
  ["ep/unlock", EpUnlock],
  ["ep/key", EpKey],
  ["ep/star", EpStar],
  ["ep/star-filled", EpStarFilled],
  ["ep/clock", EpClock],
  ["ep/calendar", EpCalendar],
  ["ep/view", EpView],
  ["ep/hide", EpHide],
  ["ep/position", EpPosition],
  ["ep/location", EpLocation],
  ["ep/phone", EpPhone],
  ["ep/chat-dot-round", EpChatDotRound],
  ["ep/video-camera", EpVideoCamera],
  ["ep/monitor", EpMonitor],
  ["ep/printer", EpPrinter],
  ["ep/help", EpHelp],
  ["ep/info-filled", EpInfoFilled],
  ["ep/warning", EpWarning],
  ["ep/success-filled", EpSuccessFilled],
  ["ep/circle-check", EpCircleCheck],
  ["ep/circle-close", EpCircleClose],
  ["ep/close", EpClose],
  ["ep/check", EpCheck],
  ["ep/cpu", EpCpu],
  ["ep/office-building", EpOfficeBuilding],
  ["ep/management", EpManagement],
  ["ep/data-analysis", EpDataAnalysis],
  ["ep/money", EpMoney],

  // ========== Remix Icons ==========
  ["ri/search-line", RiSearchLine],
  ["ri/information-line", RiInformationLine],
  ["ri/shield-keyhole-line", RiShieldKeyholeLine],
  ["ri/admin-line", RiAdminLine],
  ["ri/history-fill", RiHistoryFill],
  ["ri/admin-fill", RiAdminFill],
  ["ri/tools-line", RiToolsLine],
  ["ri/checkbox-circle-line", RiCheckboxCircleLine],
  ["ri/dashboard-line", RiDashboardLine],
  ["ri/home-line", RiHomeLine],
  ["ri/user-line", RiUserLine],
  ["ri/settings-line", RiSettingsLine],
  ["ri/file-list-line", RiFileListLine],
  ["ri/folder-line", RiFolderLine],
  ["ri/add-line", RiAddLine],
  ["ri/delete-bin-line", RiDeleteBinLine],
  ["ri/edit-line", RiEditLine],
  ["ri/save-line", RiSaveLine],
  ["ri/refresh-line", RiRefreshLine],
  ["ri/upload-line", RiUploadLine],
  ["ri/download-line", RiDownloadLine],
  ["ri/image-line", RiImageLine],
  ["ri/link", RiLink],
  ["ri/notification-line", RiNotificationLine],
  ["ri/message-line", RiMessageLine],
  ["ri/mail-line", RiMailLine],
  ["ri/lock-line", RiLockLine],
  ["ri/key-line", RiKeyLine],
  ["ri/star-line", RiStarLine],
  ["ri/time-line", RiTimeLine],
  ["ri/calendar-line", RiCalendarLine],
  ["ri/eye-line", RiEyeLine],
  ["ri/eye-off-line", RiEyeOffLine],
  ["ri/map-pin-line", RiMapPinLine],
  ["ri/phone-line", RiPhoneLine],
  ["ri/chat-1-line", RiChat1Line],
  ["ri/video-line", RiVideoLine],
  ["ri/computer-line", RiComputerLine],
  ["ri/question-line", RiQuestionLine],
  ["ri/error-warning-line", RiErrorWarningLine],
  ["ri/close-circle-line", RiCloseCircleLine],
  ["ri/close-line", RiCloseLine],
  ["ri/check-line", RiCheckLine]
];

// 本地菜单图标，后端在路由的 icon 中返回对应的图标字符串并且前端在此处使用 addIcon 添加即可渲染菜单图标
icons.forEach(([name, icon]) => {
  addIcon(name, getSvgInfo(icon));
});
