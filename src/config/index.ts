import type { App } from "vue";
import axios from "axios";

let config: Record<string, unknown> = {};
const { VITE_PUBLIC_PATH } = import.meta.env;

const setConfig = (cfg?: unknown) => {
  config = Object.assign(config, cfg);
};

function getConfig<T = PlatformConfigs>(): T;
function getConfig<T = unknown>(key: string): T;

// Dynamic property access requires any for nested path traversal
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getConfig<T = any>(key?: string): T {
  if (typeof key === "string") {
    const arr = key.split(".");
    if (arr.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = config;
      arr.forEach(v => {
        if (data && typeof data[v] !== "undefined") {
          data = data[v];
        } else {
          data = null;
        }
      });
      return data;
    }
  }
  return config as T;
}

/** 获取项目动态全局配置 */
export const getPlatformConfig = async (app: App): Promise<PlatformConfigs> => {
  app.config.globalProperties.$config = getConfig();
  return axios({
    method: "get",
    url: `${VITE_PUBLIC_PATH}platform-config.json`
  })
    .then(({ data: config }) => {
      let $config = app.config.globalProperties.$config;
      // 自动注入项目配置
      if (app && $config && typeof config === "object") {
        $config = Object.assign($config, config);
        app.config.globalProperties.$config = $config;
        // 设置全局配置
        setConfig($config);
      }
      return $config;
    })
    .catch(() => {
      throw new Error("请在public文件夹下添加platform-config.json配置文件");
    });
};

/** 本地响应式存储的命名空间 */
const responsiveStorageNameSpace = () => getConfig().ResponsiveStorageNameSpace;

export { getConfig, setConfig, responsiveStorageNameSpace };
