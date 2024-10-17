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

  setItems(key, value) {
    this.indexedDbStorage.setItems(key, value);
  }

  getItems(key) {
    this.indexedDbStorage.getItems(key);
  }

  setItem(key, value) {
    this.indexedDbStorage.setItems(key, value);
  }

  getItem(key) {
    this.indexedDbStorage.getItems(key);
  }
}

export class LStorage {
  private lStorage;
  constructor(base: string) {
    this.lStorage = createStorage({
      driver: localStorageDriver({ base })
    });
  }

  setItems(key, value) {
    this.lStorage.setItems(key, value);
  }

  getItems(key) {
    this.lStorage.getItems(key);
  }

  setItem(key, value) {
    this.lStorage.setItems(key, value);
  }

  getItem(key) {
    this.lStorage.getItems(key);
  }
}
