import { defineStore } from "pinia";
import { store } from "@/store";
import type { currentCompanyType } from "./types";
import { storageLocal } from "@pureadmin/utils";
import { type currentCompanyInfo, currentCompanyKey } from "@/utils/auth";
import { getCurrentCompanyAPi } from "@/api/user";

export const useCurrentCompanyStore = defineStore({
  id: "pure-company",
  state: (): currentCompanyType => ({
    companyName:
      storageLocal().getItem<currentCompanyInfo>(currentCompanyKey)
        ?.companyName ?? "",
    companyId:
      storageLocal().getItem<currentCompanyInfo>(currentCompanyKey)
        ?.companyId ?? ""
  }),
  actions: {
    SET_NAME(companyName: string) {
      this.companyName = companyName;
    },
    SET_ID(id: string) {
      this.companyId = id;
    },
    async handleCurrentCompany() {
      return new Promise((resolve, reject) => {
        getCurrentCompanyAPi()
          .then(
            (
              data: {
                uid: string;
                name: string;
              }[]
            ) => {
              if (data.length === 1) {
                this.SET_NAME(data[0].name);
                this.SET_ID(data[0].uid);
                resolve(data);
              } else {
                resolve(data);
                return;
              }
            }
          )
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
