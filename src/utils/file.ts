export function compressImage(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const image = new Image();
    image.src = e.target.result as string;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0, image.width, image.height);
      const compressedFile = dataURLtoFile(
        canvas.toDataURL("image/jpeg", 0.8),
        file.name
      );
      getImageWH(compressedFile);
    };
  };
  reader.readAsDataURL(file);
}

export function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]); // Buffer.from(arr[1], "base64");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export async function getImageWH(file) {
  const reader = new FileReader();
  let width = 0,
    height = 0;
  reader.onload = e => {
    const image = new Image();
    image.src = e.target.result as string;
    image.onload = () => {
      width = image.width;
      height = image.height;
    };
  };
  reader.readAsDataURL(file);
  return { width, height };
}
