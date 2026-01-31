/**
 * useOptions Composable
 * 提供响应式的选项数据访问，统一下拉数据的获取和刷新
 */

import { computed, onMounted } from "vue";
import {
  useOptionsStoreHook,
  type OptionItem,
  type OptionType
} from "@/store/modules/options";

/**
 * 选项数据 Composable
 *
 * @example
 * ```ts
 * const { employees, customers, isLoading, refresh } = useOptions();
 *
 * // 在模板中使用
 * <el-select>
 *   <el-option
 *     v-for="item in employees"
 *     :key="item.uid"
 *     :label="item.name"
 *     :value="item.uid"
 *   />
 * </el-select>
 * ```
 */
export function useOptions() {
  const store = useOptionsStoreHook();

  // 确保数据已加载
  onMounted(() => {
    store.ensureLoaded();
  });

  return {
    /** 员工列表 */
    employees: computed<OptionItem[]>(() => store.employees),

    /** 经理列表 */
    managers: computed<OptionItem[]>(() => store.managers),

    /** 客户列表 */
    customers: computed<OptionItem[]>(() => store.customers),

    /** 供应商列表 */
    providers: computed<OptionItem[]>(() => store.providers),

    /** 仓库列表 */
    repos: computed<OptionItem[]>(() => store.repos),

    /** 轮胎列表 */
    tires: computed<OptionItem[]>(() => store.tires),

    /** 职位列表 */
    positions: computed<OptionItem[]>(() => store.positions),

    /** 是否正在加载 */
    isLoading: computed(() => store.isLoading),

    /** 是否已加载 */
    isLoaded: computed(() => store.isLoaded),

    /** 根据类型获取选项列表 */
    getOptions: (type: OptionType): OptionItem[] =>
      store.getOptionsByType(type),

    /** 根据 uid 查找选项项 */
    findOption: (type: OptionType, uid: string): OptionItem | undefined =>
      store.findOptionByUid(type, uid),

    /** 刷新特定类型的数据 */
    refresh: store.refresh,

    /** 刷新所有数据 */
    refreshAll: store.refreshAll,

    /** 确保数据已加载 */
    ensureLoaded: store.ensureLoaded
  };
}

/**
 * 仅获取特定类型的选项数据
 *
 * @example
 * ```ts
 * const { options, isLoading } = useOptionsByType('employees');
 * ```
 */
export function useOptionsByType(type: OptionType) {
  const store = useOptionsStoreHook();

  onMounted(() => {
    store.ensureLoaded();
  });

  return {
    options: computed<OptionItem[]>(() => store[type]),
    isLoading: computed(() => store.isLoading),
    refresh: () => store.refresh(type)
  };
}
