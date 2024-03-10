export const baseUrlApi = (url: string) => {
  if (url.startsWith("/"))
    return `/api${url}`
  return `/api/${url}`
};
