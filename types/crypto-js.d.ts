declare module "crypto-js" {
  export interface WordArray {
    toString(encoder?: unknown): string;
  }

  export interface CryptoJsStatic {
    MD5: (message: string | WordArray) => WordArray;
    lib: {
      WordArray: {
        create: (
          words?: number[] | Uint8Array | ArrayBuffer,
          sigBytes?: number
        ) => WordArray;
      };
    };
  }

  const CryptoJS: CryptoJsStatic;
  export default CryptoJS;
}
