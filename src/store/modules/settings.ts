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
    CHANGE_SETTING({ key, value }: { key: keyof setType; value: unknown }) {
      if (Reflect.has(this, key)) {
        (this as unknown as Record<string, unknown>)[key] = value;
      }
    },

    changeSetting(data: { key: keyof setType; value: unknown }) {
      this.CHANGE_SETTING(data);
    }
  }
});

export function useSettingStoreHook() {
  return useSettingStore(store);
}
