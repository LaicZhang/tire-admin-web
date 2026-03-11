import { v7 as uuidv7 } from "uuid";

type CryptoLike = { randomUUID?: () => string };

export function createUid(): string {
  const cryptoLike = (globalThis as unknown as { crypto?: CryptoLike }).crypto;
  if (typeof cryptoLike?.randomUUID === "function")
    return cryptoLike.randomUUID();
  return uuidv7();
}
