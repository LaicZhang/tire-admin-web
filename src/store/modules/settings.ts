import { defineStore } from "pinia";
import { store } from "@/store";
import { getConfig } from "@/config";
import type { setType } from "./types";

export const useSettingStore = defineStore("pure-setting", {
  state: (): setType => ({
    title: getConfig().Title ?? "",
    fixedHeader: getConfig().FixedHeader ?? false,
    hiddenSideBar: getConfig().HiddenSideBar ?? false
  }),
  getters: {
    getTitle(state) {
      return state.title;
    },
    getFixedHeader(state) {
      return state.fixedHeader;
    },
    getHiddenSideBar(state) {
      return state.hiddenSideBar;
    }
  },
  actions: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CHANGE_SETTING({ key, value }: { key: keyof setType; value: any }) {
      if (Reflect.has(this, key)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)[key] = value;
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    changeSetting(data: { key: keyof setType; value: any }) {
      this.CHANGE_SETTING(data);
    }
  }
});

export function useSettingStoreHook() {
  return useSettingStore(store);
}
