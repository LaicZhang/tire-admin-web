import { defineStore } from "pinia";
import { store } from "@/store";
import type { currentCompanyType } from "./types";
import { storageLocal } from "@pureadmin/utils";
import type { CurrentCompanyInfo } from "@/utils";
import { getCurrentCompanyApi } from "@/api";

export const currentCompanyKey = "current-company";

export const useCurrentCompanyStore = defineStore("pure-company", {
  state: (): currentCompanyType => {
    // 一次性读取 localStorage 并解构
    const stored =
      storageLocal().getItem<CurrentCompanyInfo>(currentCompanyKey);
    return {
      companyName: stored?.companyName ?? "",
      companyId: stored?.companyId ?? ""
    };
  },
  actions: {
    /** 设置公司名称 */
    setName(name: string) {
      this.companyName = name;
    },
    /** 设置公司 ID */
    setId(id: string) {
      this.companyId = id;
    },
    /** 设置当前公司信息 */
    setCurrentCompany(company: CurrentCompanyInfo) {
      this.setName(company?.companyName ?? "");
      this.setId(company?.companyId ?? "");
      storageLocal().setItem(currentCompanyKey, {
        ...company
      });
    },
    /** 获取并设置当前公司信息 */
    async handleCurrentCompany() {
      const res = await getCurrentCompanyApi();
      const data = res.data as Array<{ uid: string; name: string }>;
      if (data.length === 0) {
        throw new Error("当前用户没有公司信息");
      }
      if (data.length === 1) {
        this.setCurrentCompany({
          companyName: data[0].name,
          companyId: data[0].uid
        });
      }
      return data;
    }
  }
});

/** 设置当前公司信息 (使用 store action 代理) */
export function setCurrentCompanyKey(company: CurrentCompanyInfo) {
  useCurrentCompanyStoreHook().setCurrentCompany(company);
}

export function useCurrentCompanyStoreHook() {
  return useCurrentCompanyStore(store);
}
