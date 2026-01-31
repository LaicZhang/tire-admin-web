import { defineStore } from "pinia";
import { store } from "@/store";
import { ALL_LIST, localForage } from "@/utils";

/** 选项数据项类型 */
export interface OptionItem {
  uid: string;
  name: string;
  [key: string]: unknown;
}

/** Options Store 状态类型 */
export interface OptionsState {
  employees: OptionItem[];
  managers: OptionItem[];
  customers: OptionItem[];
  providers: OptionItem[];
  repos: OptionItem[];
  tires: OptionItem[];
  positions: OptionItem[];
  isLoaded: boolean;
  isLoading: boolean;
}

/** 选项类型键 */
export type OptionType =
  | "employees"
  | "managers"
  | "customers"
  | "providers"
  | "repos"
  | "tires"
  | "positions";

/** 选项类型到 ALL_LIST 的映射 */
const OPTION_KEY_MAP: Record<OptionType, ALL_LIST> = {
  employees: ALL_LIST.employee,
  managers: ALL_LIST.manager,
  customers: ALL_LIST.customer,
  providers: ALL_LIST.provider,
  repos: ALL_LIST.repo,
  tires: ALL_LIST.tire,
  positions: ALL_LIST.position
};

/**
 * 统一选项数据 Store
 * 集中管理下拉数据（员工、经理、客户、供应商、仓库、轮胎、职位）
 */
export const useOptionsStore = defineStore("pure-options", {
  state: (): OptionsState => ({
    employees: [],
    managers: [],
    customers: [],
    providers: [],
    repos: [],
    tires: [],
    positions: [],
    isLoaded: false,
    isLoading: false
  }),

  getters: {
    /**
     * 根据类型获取选项列表
     */
    getOptionsByType:
      state =>
      (type: OptionType): OptionItem[] => {
        return state[type];
      },

    /**
     * 根据 uid 查找选项项
     */
    findOptionByUid:
      state =>
      (type: OptionType, uid: string): OptionItem | undefined => {
        return state[type].find(item => item.uid === uid);
      }
  },

  actions: {
    /**
     * 从 localForage 加载所有选项数据
     */
    async loadAll(): Promise<void> {
      if (this.isLoading) return;

      this.isLoading = true;
      try {
        const storage = localForage();
        const [
          employees,
          managers,
          customers,
          providers,
          repos,
          tires,
          positions
        ] = await Promise.all([
          storage.getItem<OptionItem[]>(ALL_LIST.employee),
          storage.getItem<OptionItem[]>(ALL_LIST.manager),
          storage.getItem<OptionItem[]>(ALL_LIST.customer),
          storage.getItem<OptionItem[]>(ALL_LIST.provider),
          storage.getItem<OptionItem[]>(ALL_LIST.repo),
          storage.getItem<OptionItem[]>(ALL_LIST.tire),
          storage.getItem<OptionItem[]>(ALL_LIST.position)
        ]);

        this.employees = employees || [];
        this.managers = managers || [];
        this.customers = customers || [];
        this.providers = providers || [];
        this.repos = repos || [];
        this.tires = tires || [];
        this.positions = positions || [];
        this.isLoaded = true;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 刷新特定类型的选项数据
     */
    async refresh(type: OptionType): Promise<void> {
      const forageKey = OPTION_KEY_MAP[type];
      const storage = localForage();
      const data = await storage.getItem<OptionItem[]>(forageKey);
      this[type] = data || [];
    },

    /**
     * 刷新所有选项数据
     */
    async refreshAll(): Promise<void> {
      this.isLoaded = false;
      await this.loadAll();
    },

    /**
     * 确保数据已加载（如果未加载则加载）
     */
    async ensureLoaded(): Promise<void> {
      if (!this.isLoaded && !this.isLoading) {
        await this.loadAll();
      }
    }
  }
});

/**
 * 在组件外使用 options store
 */
export function useOptionsStoreHook() {
  return useOptionsStore(store);
}
