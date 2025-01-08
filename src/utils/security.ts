import { formatTimeOnlyNumber } from "@/utils/time";
import CryptoJS from "crypto-js";

export function getMD5(data: string) {
  return CryptoJS.MD5(data).toString().toLowerCase();
  // return CryptoJS.MD5(CryptoJS.lib.WordArray.create(data)).toString();
}

export function getFileMd5(lastModified: number, size: number) {
  try {
    return getMD5(`${lastModified}${size}`);
  } catch (e) {
    throw new Error(e);
  }
}

export function getUsernameOfOnlyNumber() {
  return formatTimeOnlyNumber() + Math.trunc(Math.random() * 100);
}
