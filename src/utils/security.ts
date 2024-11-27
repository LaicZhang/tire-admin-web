// import CryptoJS from "crypto-js";
import crypto from "crypto";
import { formatTimeOnlyNumber } from "@/utils/time";

const hash =
  crypto.hash ??
  ((
    algorithm: string,
    data: crypto.BinaryLike,
    outputEncoding: crypto.BinaryToTextEncoding
  ) => crypto.createHash(algorithm).update(data).digest(outputEncoding));

export function getMD5(data: Buffer | string): string {
  // return CryptoJS.MD5(data).toString().toLowerCase();
  // return CryptoJS.MD5(CryptoJS.lib.WordArray.create(data)).toString();
  return hash("md5", data, "hex");
}

export function getFileMd5(lastModified: number, size: number): string {
  try {
    return getMD5(`${lastModified}${size}`).toLowerCase();
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
