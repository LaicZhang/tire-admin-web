import { localForage } from "@/utils";

const COVERS = "uploadedImagesList:covers";

type ImageRecord = Record<string, unknown>;

export async function setUploadedImages(image: Record<string, unknown>) {
  let images: ImageRecord[] = await getUploadedImages();
  images.push(image);
  images = Array.from(new Set(images));
  await localForage().setItem(COVERS, images);
  return images;
}

export async function getUploadedImages(): Promise<ImageRecord[]> {
  return (await localForage().getItem(COVERS)) || [];
}

export async function clearUploadedImages() {
  return await localForage().setItem(COVERS, []);
}
