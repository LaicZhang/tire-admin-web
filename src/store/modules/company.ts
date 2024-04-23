import { defineStore } from "pinia";
import { store } from "@/store";
import type { currentCompanyType } from "./types";
import { storageLocal } from "@pureadmin/utils";
import { type currentCompanyInfo, currentCompanyKey } from "@/utils/auth";
import { getCurrentCompanyAPi } from "@/api/auth";

export const useCurrentCompanyStore = defineStore({
  id: "pure-company",
  state: (): currentCompanyType => ({
    companyName:
      storageLocal().getItem<currentCompanyInfo>(currentCompanyKey)
        ?.companyName,
    companyId:
      storageLocal().getItem<currentCompanyInfo>(currentCompanyKey)?.companyId
  }),
  actions: {
    SET_NAME(companyName: string) {
      this.companyName = companyName;
    },
    SET_ID(id: string) {
      this.companyId = id;
    },
    CURRENT_COMPANY(companyName: string, companyId: string) {
      this.SET_NAME(companyName);
      this.SET_ID(companyId);
      storageLocal().setItem(currentCompanyKey, {
        companyName: companyName,
        companyId: companyId
      });
    },
    async handleCurrentCompany() {
      return new Promise((resolve, reject) => {
        getCurrentCompanyAPi()
          .then(res => {
            const data = res.data;
            if (data.length === 0) {
              resolve([]);
              return;
            } else if (data.length === 1) {
              this.SET_NAME(data[0].name);
              this.SET_ID(data[0].uid);
              resolve(data);
              return data[0];
            } else {
              resolve(data);
              return data;
            }
          })
          .catch(error => {
            reject(error);
          });
      });
    }
  }
});

export function useCurrentCompanyStoreHook() {
  return useCurrentCompanyStore(store);
}
