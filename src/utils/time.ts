import dayjs from "dayjs";

export const formatDate = (date: Date) => {
  if (!date) return "";
  return dayjs(date).format("YYYY-MM-DD");
};

export const formatDateTime = (date: Date) => {
  if (!date) return "";
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

export const formatTimeOnlyNumber = () => {
  return dayjs().format("YYYYMMDDHHmmss");
};
