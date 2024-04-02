const cachedResults = {};

export const baseUrlApi = (url: string): string => {
  // 如果结果已经缓存，则直接返回缓存的结果
  if (cachedResults[url]) {
    return cachedResults[url];
  }
  const result = url.startsWith("/") ? `/api${url}` : `/api/${url}`;
  cachedResults[url] = result;
  return result;
};
