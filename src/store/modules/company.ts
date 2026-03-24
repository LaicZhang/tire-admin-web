import { defineStore } from "pinia";
import { store } from "@/store";
import type { currentCompanyType } from "./types";
import { storageLocal } from "@pureadmin/utils";
import type { CurrentCompanyInfo } from "@/utils";
import {
  determineCurrentCompanyApi,
  determineCurrentStoreApi,
  getCurrentCompanyApi,
  getCurrentStoreApi,
  type CurrentStoreOption
} from "@/api";
import { isObject } from "@/utils/type-guards";

export const currentCompanyKey = "current-company";

export type CompanyOption = { uid: string; name: string };
export type StoreOption = CurrentStoreOption;

export const useCurrentCompanyStore = defineStore("pure-company", {
  state: (): currentCompanyType & {
    availableCompanies: CompanyOption[];
    availableStores: StoreOption[];
  } => {
    const stored =
      storageLocal().getItem<CurrentCompanyInfo>(currentCompanyKey);
    return {
      companyName: stored?.companyName ?? "",
      companyId: stored?.companyId ?? "",
      storeName: stored?.storeName ?? "",
      storeId: stored?.storeId ?? "",
      availableCompanies: [],
      availableStores: []
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
    setStoreName(name: string) {
      this.storeName = name;
    },
    setStoreId(id: string) {
      this.storeId = id;
    },
    setAvailableCompanies(companies: CompanyOption[]) {
      this.availableCompanies = companies;
    },
    setAvailableStores(stores: StoreOption[]) {
      this.availableStores = stores;
    },
    /** 设置当前公司信息 */
    setCurrentCompany(company: CurrentCompanyInfo) {
      this.setName(company?.companyName ?? "");
      this.setId(company?.companyId ?? "");
      this.setStoreName(company?.storeName ?? "");
      this.setStoreId(company?.storeId ?? "");
      storageLocal().setItem(currentCompanyKey, {
        ...company
      });
    },
    clearCurrentCompany() {
      this.setCurrentCompany({
        companyName: "",
        companyId: "",
        storeName: "",
        storeId: ""
      });
      storageLocal().removeItem(currentCompanyKey);
      this.setAvailableCompanies([]);
      this.setAvailableStores([]);
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
    async fetchAvailableStores() {
      const res = await getCurrentStoreApi();
      const data = Array.isArray(res.data)
        ? res.data.filter(
            (item): item is StoreOption =>
              isObject(item) &&
              typeof item.uid === "string" &&
              typeof item.name === "string" &&
              typeof item.defaultRepositoryId === "string"
          )
        : [];

      this.setAvailableStores(data);
      if (data.length === 0) {
        throw new Error("当前公司没有门店信息");
      }
      if (data.length === 1) {
        this.setCurrentCompany({
          companyName: this.companyName,
          companyId: this.companyId,
          storeName: data[0].name,
          storeId: data[0].uid
        });
      }
      return data;
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
        companyName: hit?.name ?? "",
        storeId: "",
        storeName: ""
      });
      this.setAvailableStores([]);
    },
    async determineCurrentStore(storeId: string) {
      if (!storeId) throw new Error("storeId is required");
      await determineCurrentStoreApi({ storeId });
      const stores =
        this.availableStores.length > 0
          ? this.availableStores
          : await this.fetchAvailableStores();
      const hit = stores.find(item => item.uid === storeId);
      this.setCurrentCompany({
        companyId: this.companyId,
        companyName: this.companyName,
        storeId,
        storeName: hit?.name ?? ""
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
