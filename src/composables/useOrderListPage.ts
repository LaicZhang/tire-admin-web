/**
 * 订单列表页通用 Composable
 * 封装采购/销售/调拨订单列表页的通用逻辑
 */

import { ref, onMounted, computed } from "vue";
import type { Ref, ComputedRef } from "vue";
import { handleApiError, message } from "@/utils";
import { useOptionsStoreHook, type OptionItem } from "@/store/modules/options";

// OptionItem 从 store 导入，这里重新导出以保持向后兼容
export type { OptionItem } from "@/store/modules/options";

/** 分页状态类型 */
export interface PaginationState {
  total: number;
  pageSize: number;
  currentPage: number;
  background: boolean;
}

/** API 响应格式 */
export interface ListApiResponse<T> {
  code: number;
  msg?: string;
  data?:
    | {
        list: T[];
        count: number;
      }
    | T[]
    | { list?: T[]; count?: number };
}

/** 下拉数据键类型 */
type SelectDataKey =
  | "employee"
  | "manager"
  | "customer"
  | "provider"
  | "repo"
  | "tire"
  | "position";

/** 配置选项 */
export interface UseOrderListPageOptions<T, Q> {
  /** 列表 API 函数 */
  listApi: (page: number, query: Q) => Promise<ListApiResponse<T>>;

  /** 要加载的下拉数据 key 列表 */
  selectDataKeys: SelectDataKey[];

  /** 初始查询参数 */
  initialQuery: Q;

  /** 分页大小，默认 10 */
  pageSize?: number;

  /** 获取列表失败时的错误消息 */
  listErrorMessage?: string;

  /** 搜索表单 ref，用于重置 */
  searchFormRef?: Ref<{ resetFields?: () => void } | null>;
}

/** 返回值类型 */
export interface UseOrderListPageReturn<T, Q> {
  /** 列表数据 */
  dataList: Ref<T[]>;
  /** 加载状态 */
  loading: Ref<boolean>;
  /** 分页状态 */
  pagination: Ref<PaginationState>;
  /** 搜索表单数据 */
  searchForm: Ref<Q>;

  /** 下拉数据 - 按 key 存储 (响应式 computed) */
  selectData: {
    employee: ComputedRef<OptionItem[]>;
    manager: ComputedRef<OptionItem[]>;
    customer: ComputedRef<OptionItem[]>;
    provider: ComputedRef<OptionItem[]>;
    repo: ComputedRef<OptionItem[]>;
    tire: ComputedRef<OptionItem[]>;
    position: ComputedRef<OptionItem[]>;
  };

  /** 获取列表数据 */
  getList: () => Promise<void>;
  /** 搜索 */
  onSearch: () => void;
  /** 重置 */
  onReset: () => void;
  /** 翻页 */
  handlePageChange: (page: number) => void;
  /** 加载下拉数据 */
  loadSelectData: () => Promise<void>;
}

// Note: SELECT_KEY_TO_STORE_MAP 保留以备将来扩展使用

/**
 * 订单列表页通用 Composable
 *
 * @example
 * ```ts
 * const {
 *   dataList,
 *   loading,
 *   pagination,
 *   searchForm,
 *   selectData,
 *   getList,
 *   onSearch,
 *   onReset,
 *   handlePageChange
 * } = useOrderListPage({
 *   listApi: getSalesOrderListApi,
 *   selectDataKeys: ['employee', 'manager', 'customer'],
 *   initialQuery: { customerId: undefined, operatorId: undefined }
 * });
 * ```
 */
export function useOrderListPage<T, Q>(
  options: UseOrderListPageOptions<T, Q>
): UseOrderListPageReturn<T, Q> {
  const {
    listApi,
    // selectDataKeys 保留以备将来扩展使用
    selectDataKeys: _selectDataKeys,
    initialQuery,
    pageSize = 10,
    listErrorMessage = "获取列表失败",
    searchFormRef
  } = options;

  // 状态
  const dataList = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const pagination = ref<PaginationState>({
    total: 0,
    pageSize,
    currentPage: 1,
    background: true
  });
  const searchForm = ref<Q>({ ...initialQuery }) as Ref<Q>;

  // 获取 options store
  const optionsStore = useOptionsStoreHook();

  // 下拉数据 - 使用 computed 从 store 获取响应式数据
  const selectData = {
    employee: computed(() => optionsStore.employees),
    manager: computed(() => optionsStore.managers),
    customer: computed(() => optionsStore.customers),
    provider: computed(() => optionsStore.providers),
    repo: computed(() => optionsStore.repos),
    tire: computed(() => optionsStore.tires),
    position: computed(() => optionsStore.positions)
  };

  /**
   * 加载下拉数据 - 现在使用 options store
   */
  async function loadSelectData(): Promise<void> {
    try {
      await optionsStore.ensureLoaded();
    } catch (error) {
      handleApiError(error, "加载下拉数据失败");
    }
  }

  /**
   * 获取列表数据
   */
  async function getList(): Promise<void> {
    try {
      loading.value = true;
      const res = await listApi(pagination.value.currentPage, searchForm.value);

      if (res.code === 200) {
        const data = res.data as
          | { list?: T[]; count?: number }
          | T[]
          | undefined;
        if (Array.isArray(data)) {
          dataList.value = data;
          pagination.value.total = data.length;
        } else if (data && "list" in data) {
          dataList.value = data.list ?? [];
          pagination.value.total = data.count ?? 0;
        } else {
          dataList.value = [];
          pagination.value.total = 0;
        }
      } else {
        message(res.msg || listErrorMessage, { type: "error" });
      }
    } catch (error) {
      handleApiError(error, listErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 搜索
   */
  function onSearch(): void {
    pagination.value.currentPage = 1;
    getList();
  }

  /**
   * 重置
   */
  function onReset(): void {
    searchFormRef?.value?.resetFields?.();
    // 重置为初始值
    Object.assign(searchForm.value as object, initialQuery);
    pagination.value.currentPage = 1;
    getList();
  }

  /**
   * 翻页
   */
  function handlePageChange(page: number): void {
    pagination.value.currentPage = page;
    getList();
  }

  // 生命周期
  onMounted(async () => {
    await loadSelectData();
    await getList();
  });

  return {
    dataList,
    loading,
    pagination,
    searchForm,
    selectData,
    getList,
    onSearch,
    onReset,
    handlePageChange,
    loadSelectData
  };
}
