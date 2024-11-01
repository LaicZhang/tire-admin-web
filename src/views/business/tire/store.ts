import { localForage } from "@/utils";

const COVERS = "uploadedImagesList:covers";

export async function setUploadedImages(image) {
  let images: any[] = (await getUploadedImages()) || [];
  images.push(image);
  images = Array.from(new Set(images));
  await localForage().setItem(COVERS, images);
  return images;
}

export async function getUploadedImages(): Promise<any[]> {
  return (await localForage().getItem(COVERS)) || [];
}

export async function clearUploadedImages() {
  return await localForage().setItem(COVERS, []);
}
