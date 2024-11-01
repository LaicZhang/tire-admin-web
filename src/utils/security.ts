import CryptoJS from "crypto-js";

export function getMD5(data: Buffer | string): string {
  return CryptoJS.MD5(data).toString().toLowerCase();
}

export function compareMD5(hash: string, data: Buffer) {
  const fileHash = getMD5(data);
  if (hash !== fileHash)
    throw new Error(
      `the parma ${hash} and real hash ${fileHash} hash not match`
    );
}
