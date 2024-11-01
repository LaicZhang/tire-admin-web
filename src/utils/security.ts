import CryptoJS from "crypto-js";
import { formatTimeOnlyNumber } from "@/utils/time";

export function getMD5(data: Buffer | string): string {
  // return CryptoJS.MD5(data).toString().toLowerCase();
  return CryptoJS.MD5(CryptoJS.lib.WordArray.create(data)).toString();
}

export function getFileMd5(lastModified: number, size: number): string {
  try {
    return CryptoJS.MD5(`${lastModified}${size}`).toString().toLowerCase();
  } catch (e) {
    throw new Error(e);
  }
}

export function compareMD5(hash: string, data: Buffer) {
  const fileHash = getMD5(data);
  if (hash !== fileHash)
    throw new Error(
      `the parma ${hash} and real hash ${fileHash} hash not match`
    );
}

export function getUsernameOfOnlyNumber() {
  return formatTimeOnlyNumber() + Math.trunc(Math.random() * 100);
}
