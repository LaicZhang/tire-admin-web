declare module "qrcode" {
  export interface QRCodeRenderersOptions {
    [key: string]: unknown;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    width?: number;
    scale?: number;
  }

  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: QRCodeRenderersOptions
  ): Promise<HTMLCanvasElement> | HTMLCanvasElement;

  export function toDataURL(
    text: string,
    options?: QRCodeRenderersOptions
  ): Promise<string>;

  const QRCode: {
    toCanvas: typeof toCanvas;
    toDataURL: typeof toDataURL;
  };

  export default QRCode;
}
