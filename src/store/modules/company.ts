import { defineStore } from "pinia";
import { store } from "@/store";
import type { currentCompanyType } from "./types";
import { storageLocal } from "@pureadmin/utils";
import type { CurrentCompanyInfo } from "@/utils";
import { getCurrentCompanyAPi } from "@/api";

export const currentCompanyKey = "current-company";

export const useCurrentCompanyStore = defineStore("pure-company", {
  state: (): currentCompanyType => ({
    companyName:
      storageLocal().getItem<CurrentCompanyInfo>(currentCompanyKey)
        ?.companyName ?? "",
    companyId:
      storageLocal().getItem<CurrentCompanyInfo>(currentCompanyKey)
        ?.companyId ?? ""
  }),
  actions: {
    SET_NAME(name: string) {
      this.companyName = name;
    },
    SET_ID(id: string) {
      this.companyId = id;
    },
    SET_CURRENT_COMPANY(company: CurrentCompanyInfo) {
      console.log("company", company);
      this.SET_NAME(company?.companyName);
      this.SET_ID(company?.companyId);
      storageLocal().setItem(currentCompanyKey, {
        ...company
      });
    },
    async handleCurrentCompany() {
      return new Promise((resolve, reject) => {
        getCurrentCompanyAPi()
          .then(res => {
            console.log("res", res);
            const data = res.data;
            if (data.length === 0) {
              reject("当前用户没有公司信息");
            } else if (data.length === 1) {
              this.SET_CURRENT_COMPANY({
                companyName: data[0].name,
                companyId: data[0].uid
              });
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

export function setCurrentCompanyKey(company: CurrentCompanyInfo) {
  const store = useCurrentCompanyStoreHook();
  store.SET_NAME(company?.companyName);
  store.SET_ID(company?.companyId);
  storageLocal().setItem(currentCompanyKey, {
    ...company
  });
}

export function useCurrentCompanyStoreHook() {
  return useCurrentCompanyStore(store);
}
