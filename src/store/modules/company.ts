import { defineStore } from "pinia";
import { store } from "@/store";
import type { currentCompanyType } from "./types";
import { storageLocal } from "@pureadmin/utils";
import type { CurrentCompanyInfo } from "@/utils";
import { determineCurrentCompanyApi, getCurrentCompanyApi } from "@/api";
import { isObject } from "@/utils/type-guards";

export const currentCompanyKey = "current-company";

export type CompanyOption = { uid: string; name: string };

export const useCurrentCompanyStore = defineStore("pure-company", {
  state: (): currentCompanyType & { availableCompanies: CompanyOption[] } => {
    const stored =
      storageLocal().getItem<CurrentCompanyInfo>(currentCompanyKey);
    return {
      companyName: stored?.companyName ?? "",
      companyId: stored?.companyId ?? "",
      availableCompanies: []
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
    setAvailableCompanies(companies: CompanyOption[]) {
      this.availableCompanies = companies;
    },
    /** 设置当前公司信息 */
    setCurrentCompany(company: CurrentCompanyInfo) {
      this.setName(company?.companyName ?? "");
      this.setId(company?.companyId ?? "");
      storageLocal().setItem(currentCompanyKey, {
        ...company
      });
    },
    clearCurrentCompany() {
      this.setCurrentCompany({
        companyName: "",
        companyId: ""
      });
      storageLocal().removeItem(currentCompanyKey);
      this.setAvailableCompanies([]);
    },
    /** 获取公司列表；单公司则自动写入当前公司 */
    async fetchAvailableCompanies() {
      const res = await getCurrentCompanyApi();
      const data = Array.isArray(res.data)
        ? res.data.filter(
            (item): item is CompanyOption =>
              isObject(item) &&
              typeof item.uid === "string" &&
              typeof item.name === "string"
          )
        : [];

      this.setAvailableCompanies(data);
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
    },
    /** 兼容旧调用：获取并设置当前公司信息 */
    async handleCurrentCompany() {
      return await this.fetchAvailableCompanies();
    },
    /** 切换当前公司（同步服务端上下文 + 本地 store） */
    async determineCurrentCompany(companyId: string) {
      if (!companyId) throw new Error("companyId is required");
      await determineCurrentCompanyApi({ companyId });
      const companies =
        this.availableCompanies.length > 0
          ? this.availableCompanies
          : await this.fetchAvailableCompanies();
      const hit = companies.find(c => c.uid === companyId);
      this.setCurrentCompany({
        companyId,
        companyName: hit?.name ?? ""
      });
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
