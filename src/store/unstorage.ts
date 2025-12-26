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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setItems(key: any, value: any) {
    this.indexedDbStorage.setItems(key, value);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getItems(key: any) {
    return this.indexedDbStorage.getItems(key);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setItem(key: string, value: any) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setItems(key: any, value: any) {
    this.lStorage.setItems(key, value);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getItems(key: any) {
    return this.lStorage.getItems(key);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setItem(key: string, value: any) {
    return this.lStorage.setItem(key, value);
  }

  getItem(key: string) {
    return this.lStorage.getItem(key);
  }
}
