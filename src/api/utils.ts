const cachedResults: Record<string, string> = {};

const MAX_CACHE_SIZE = 1000;

export const baseUrlApi = (url: string): string => {
  if (cachedResults[url]) {
    return cachedResults[url];
  }

  // Simple memory leak protection
  if (Object.keys(cachedResults).length >= MAX_CACHE_SIZE) {
    for (const key in cachedResults) delete cachedResults[key];
  }

  const result = url[0] === "/" ? `/api${url}` : `/api/${url}`;
  cachedResults[url] = result;
  return result;
};
