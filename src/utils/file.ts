/**
 * 图片尺寸信息
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * 压缩图片并返回压缩后的文件及其尺寸
 * @param file 原始图片文件
 * @param quality 压缩质量 (0-1)，默认0.8
 * @returns 压缩后的文件及尺寸信息
 */
export function compressImage(
  file: File,
  quality: number = 0.8
): Promise<{ file: File; dimensions: ImageDimensions }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = e => {
      const image = new Image();
      image.onerror = () => reject(new Error("Failed to load image"));
      image.src = e.target?.result as string;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const compressedFile = dataURLtoFile(
          canvas.toDataURL("image/jpeg", quality),
          file.name
        );
        resolve({
          file: compressedFile,
          dimensions: { width: image.width, height: image.height }
        });
      };
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 将 Data URL 转换为 File 对象
 * @param dataurl Data URL 字符串
 * @param filename 文件名
 * @returns File 对象
 */
export function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * 获取图片的宽高尺寸
 * @param file 图片文件
 * @returns 包含宽高的 Promise
 */
export function getImageWH(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = e => {
      const image = new Image();
      image.onerror = () => reject(new Error("Failed to load image"));
      image.src = e.target?.result as string;
      image.onload = () => {
        resolve({
          width: image.width,
          height: image.height
        });
      };
    };
    reader.readAsDataURL(file);
  });
}
