import { createStorage } from "unstorage";
import indexedDbDriver from "unstorage/drivers/indexedb";

const storage = createStorage({
  driver: indexedDbDriver({ base: "app:" })
});

export async function setItems(key, value) {
  await storage.setItems(key, value);
}

export async function getItems(key) {
  await storage.getItems(key);
}

export async function setItem(key, value) {
  await storage.setItems(key, value);
}

export async function getItem(key) {
  await storage.getItems(key);
}
