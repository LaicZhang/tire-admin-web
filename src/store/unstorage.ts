import { createStorage } from "unstorage";
import indexedDbDriver from "unstorage/drivers/indexedb";
import localStorageDriver from "unstorage/drivers/localstorage";

export class IndexedDbStorage {
  private indexedDbStorage;
  constructor(base: string) {
    this.indexedDbStorage = createStorage({
      driver: indexedDbDriver({ base })
    });
  }

  setItems(key: unknown, value: unknown) {
    this.indexedDbStorage.setItems(key, value);
  }

  getItems(key: unknown) {
    return this.indexedDbStorage.getItems(key);
  }

  setItem(key: string, value: unknown) {
    return this.indexedDbStorage.setItem(key, value);
  }

  getItem(key: string) {
    return this.indexedDbStorage.getItem(key);
  }
}

export class LStorage {
  private lStorage;
  constructor(base: string) {
    this.lStorage = createStorage({
      driver: localStorageDriver({ base })
    });
  }

  setItems(key: unknown, value: unknown) {
    this.lStorage.setItems(key, value);
  }

  getItems(key: unknown) {
    return this.lStorage.getItems(key);
  }

  setItem(key: string, value: unknown) {
    return this.lStorage.setItem(key, value);
  }

  getItem(key: string) {
    return this.lStorage.getItem(key);
  }
}
