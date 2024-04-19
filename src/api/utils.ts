const cachedResults = {};

export const baseUrlApi = (url: string): string => {
  if (cachedResults[url]) {
    return cachedResults[url];
  }
  const result = url[0] === "/" ? `/api${url}` : `/api/${url}`;
  cachedResults[url] = result;
  return result;
};
