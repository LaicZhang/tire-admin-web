import { formatTimeOnlyNumber } from "@/utils/time";
import CryptoJS from "crypto-js";

export function getMD5(data: string) {
  return CryptoJS.MD5(data).toString().toLowerCase();
  // return CryptoJS.MD5(CryptoJS.lib.WordArray.create(data)).toString();
}

export function getFileMd5(lastModified: number, size: number): string {
  try {
    return getMD5(`${lastModified}${size}`);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
}

export function getUsernameOfOnlyNumber(): string {
  const randomPart = crypto.getRandomValues(new Uint32Array(1))[0] % 100;
  return formatTimeOnlyNumber() + randomPart;
}
