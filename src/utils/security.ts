import { formatTimeOnlyNumber } from "@/utils/time";

export async function getMD5(message: string) {
  // return CryptoJS.MD5(data).toString().toLowerCase();
  // return CryptoJS.MD5(CryptoJS.lib.WordArray.create(data)).toString();
  // return hash("md5", data, "hex");
  try {
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("MD5", messageBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  } catch (error) {
    console.error("MD5 hashing error:", error);
    throw new Error(error);
  }
}

export async function getFileMd5(lastModified: number, size: number) {
  try {
    const md5 = await getMD5(`${lastModified}${size}`);
    return md5.toLowerCase();
  } catch (e) {
    throw new Error(e);
  }
}

export async function compareMD5(hash: string, data: string) {
  const fileHash = await getMD5(data);
  if (hash !== fileHash)
    throw new Error(
      `the parma ${hash} and real hash ${fileHash} hash not match`
    );
}

export function getUsernameOfOnlyNumber() {
  return formatTimeOnlyNumber() + Math.trunc(Math.random() * 100);
}
