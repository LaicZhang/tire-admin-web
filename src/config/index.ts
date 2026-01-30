import type { App } from "vue";
import axios from "axios";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Config");

const PLATFORM_CONFIG_CACHE_KEY = "__platform_config__";
const DEFAULT_PLATFORM_CONFIG: PlatformConfigs = {
  Version: "5.2.0",
  Title: "PureAdmin",
  FixedHeader: true,
  HiddenSideBar: false,
  MultiTagsCache: false,
  KeepAlive: true,
  Layout: "vertical",
  Theme: "light",
  DarkMode: false,
  OverallStyle: "light",
  Grey: false,
  Weak: false,
  HideTabs: false,
  HideFooter: false,
  Stretch: false,
  SidebarStatus: true,
  EpThemeColor: "#409EFF",
  ShowLogo: true,
  ShowModel: "smart",
  MenuArrowIconNoTransition: false,
  CachingAsyncRoutes: false,
  TooltipEffect: "light",
  ResponsiveStorageNameSpace: "responsive-",
  MenuSearchHistory: 6
};

function readCachedPlatformConfig(): Partial<PlatformConfigs> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PLATFORM_CONFIG_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Partial<PlatformConfigs>;
  } catch {
    return {};
  }
}

function writeCachedPlatformConfig(cfg: PlatformConfigs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLATFORM_CONFIG_CACHE_KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

let config: PlatformConfigs = Object.assign(
  {},
  DEFAULT_PLATFORM_CONFIG,
  readCachedPlatformConfig()
);
const { VITE_PUBLIC_PATH } = import.meta.env;

const setConfig = (cfg?: unknown) => {
  config = Object.assign(config, cfg);
};

function getConfig<T = PlatformConfigs>(): T;
function getConfig<T = unknown>(key: string): T;

function getConfig<T = PlatformConfigs>(key?: string): T {
  if (typeof key === "string") {
    const arr = key.split(".");
    if (arr.length) {
      let data: unknown = config;
      arr.forEach(v => {
        if (data && typeof data === "object" && v in data) {
          data = (data as Record<string, unknown>)[v];
        } else {
          data = null;
        }
      });
      return data as T;
    }
  }
  return config as unknown as T;
}

/** 获取项目动态全局配置 */
export const getPlatformConfig = async (app: App): Promise<PlatformConfigs> => {
  app.config.globalProperties.$config = getConfig();
  try {
    const { data: remoteConfig } = await axios({
      method: "get",
      url: `${VITE_PUBLIC_PATH}platform-config.json`
    });
    let $config = app.config.globalProperties.$config;
    // 自动注入项目配置
    if (app && $config && typeof remoteConfig === "object") {
      $config = Object.assign($config, remoteConfig);
      app.config.globalProperties.$config = $config;
      // 设置全局配置
      setConfig($config);
      writeCachedPlatformConfig($config);
    }
    return $config;
  } catch (error) {
    logger.warn(
      "platform-config.json load failed, falling back to defaults/cache:",
      error
    );
    return getConfig();
  }
};

/** 本地响应式存储的命名空间 */
const responsiveStorageNameSpace = () => getConfig().ResponsiveStorageNameSpace;

export { getConfig, setConfig, responsiveStorageNameSpace };
