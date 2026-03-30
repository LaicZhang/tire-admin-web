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
    changeSetting<K extends keyof setType>({
      key,
      value
    }: {
      key: K;
      value: setType[K];
    }) {
      if (Reflect.has(this.$state, key)) {
        this.$state[key] = value;
      }
    }
  }
});

export function useSettingStoreHook() {
  return useSettingStore(store);
}
