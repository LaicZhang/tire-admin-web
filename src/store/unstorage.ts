import {
  createStorage,
  type StorageValue,
  type TransactionOptions
} from "unstorage";
import indexedDbDriver from "unstorage/drivers/indexedb";
import localStorageDriver from "unstorage/drivers/localstorage";

type SetItemsInput = {
  key: string;
  value: StorageValue;
  options?: TransactionOptions;
}[];
type GetItemsInput = (string | { key: string; options?: TransactionOptions })[];

export class IndexedDbStorage {
  private indexedDbStorage;
  constructor(base: string) {
    this.indexedDbStorage = createStorage({
      driver: indexedDbDriver({ base })
    });
  }

  setItems(items: SetItemsInput) {
    return this.indexedDbStorage.setItems(items);
  }

  getItems(keys: GetItemsInput) {
    return this.indexedDbStorage.getItems(keys);
  }

  setItem(key: string, value: StorageValue) {
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

  setItems(items: SetItemsInput) {
    return this.lStorage.setItems(items);
  }

  getItems(keys: GetItemsInput) {
    return this.lStorage.getItems(keys);
  }

  setItem(key: string, value: StorageValue) {
    return this.lStorage.setItem(key, value);
  }

  getItem(key: string) {
    return this.lStorage.getItem(key);
  }
}
