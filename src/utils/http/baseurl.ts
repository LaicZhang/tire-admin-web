export type ViteEnvSubset = {
  VITE_SERVER_URL?: string;
  DEV: boolean;
  PROD: boolean;
};

export const resolveBaseURLFromViteEnv = (
  env: ViteEnvSubset
): { baseURL: string; fatalError?: string } => {
  // 开发环境：使用相对路径，通过 Vite proxy 将 /api 转发到后端
  if (env.DEV) return { baseURL: "" };

  const serverUrl = (env.VITE_SERVER_URL ?? "").trim();
  if (serverUrl) return { baseURL: serverUrl };

  return {
    baseURL: "",
    fatalError:
      `[HTTP] ${env.PROD ? "生产" : "非开发"}环境缺少 VITE_SERVER_URL，` +
      "请在对应的 .env.* 中配置后重新构建部署（例如：VITE_SERVER_URL=https://api.your-domain.com）"
  };
};

