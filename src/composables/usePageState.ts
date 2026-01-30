import { ref, computed, onMounted, type Ref } from "vue";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import { message } from "@/utils";
import { createLogger } from "@/utils/logger";

const logger = createLogger("usePageState");

/**
 * 分页配置
 */
export interface PaginationConfig {
  total: number;
  pageSize: number;
  currentPage: number;
  background?: boolean;
  pageSizes?: number[];
}

/**
 * 查询参数
 */
export type QueryParams = Record<string, unknown>;

/**
 * 列表数据项
 */
export type ListItem = Record<string, unknown>;

function getUid(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const uid = (value as { uid?: unknown }).uid;
  return typeof uid === "string" ? uid : null;
}

/**
 * API 函数类型
 */
export type ApiFunction<T, Q = QueryParams> = (
  page: number,
  params?: Q
) => Promise<CommonResult<PaginatedResponseDto<T>>>;

/**
 * 删除函数类型
 */
export type DeleteFunction = (uid: string) => Promise<CommonResult<void>>;

/**
 * 恢复函数类型
 */
export type RestoreFunction = (uid: string) => Promise<CommonResult<unknown>>;

/**
 * usePageState 配置选项
 */
export interface UsePageStateOptions<
  T extends ListItem,
  Q extends QueryParams = QueryParams
> {
  /** API 函数 */
  api: ApiFunction<T, Q>;
  /** 删除函数 */
  deleteApi?: DeleteFunction;
  /** 恢复函数 */
  restoreApi?: RestoreFunction;
  /** 初始查询参数 */
  initialParams?: Q;
  /** 初始页码 */
  initialPage?: number;
  /** 初始每页条数 */
  initialPageSize?: number;
  /** 是否立即加载数据 */
  immediate?: boolean;
  /** 数据转换函数 */
  transform?: (data: T[]) => T[];
  /** 是否启用恢复 */
  enableRestore?: boolean;
}

/**
 * usePageState 返回值
 */
export interface UsePageStateReturn<T extends ListItem, Q extends QueryParams> {
  /** 数据列表 */
  dataList: Ref<T[]>;
  /** 加载状态 */
  loading: Ref<boolean>;
  /** 分页配置 */
  pagination: Ref<PaginationConfig>;
  /** 查询参数 */
  queryParams: Ref<Q>;
  /** 获取数据 */
  fetchData: (page?: number) => Promise<void>;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 搜索 */
  search: (params?: Q) => Promise<void>;
  /** 重置搜索 */
  resetSearch: () => Promise<void>;
  /** 删除数据 */
  handleDelete: (item: T) => Promise<void>;
  /** 恢复数据 */
  handleRestore?: (item: T) => Promise<void>;
  /** 当前页改变 */
  handleCurrentChange: (page: number) => Promise<void>;
  /** 每页条数改变 */
  handleSizeChange: (size: number) => Promise<void>;
  /** 设置查询参数 */
  setQueryParams: (params: Q) => void;
  /** 设置分页 */
  setPagination: (pagination: Partial<PaginationConfig>) => void;
  /** 总数 */
  total: Ref<number>;
  /** 是否有数据 */
  hasData: Ref<boolean>;
}

/**
 * 通用页面状态管理 Composable
 *
 * @example
 * ```typescript
 * // 基本使用
 * const {
 *   dataList,
 *   loading,
 *   pagination,
 *   fetchData,
 *   handleDelete
 * } = usePageState({
 *   api: getCustomerListApi,
 *   deleteApi: deleteCustomerApi
 * });
 *
 * // 带参数和转换
 * const {
 *   dataList,
 *   loading,
 *   search
 * } = usePageState({
 *   api: getTireListApi,
 *   initialParams: { keyword: "test" },
 *   transform: (data) => data.map(item => ({ ...item, displayName: item.name }))
 * });
 * ```
 */
export function usePageState<
  T extends ListItem = ListItem,
  Q extends QueryParams = QueryParams
>(options: UsePageStateOptions<T, Q>): UsePageStateReturn<T, Q> {
  const {
    api,
    deleteApi,
    restoreApi,
    initialParams = {} as Q,
    initialPage = 1,
    initialPageSize = 10,
    immediate = true,
    transform,
    enableRestore = false
  } = options;

  // State
  const dataList = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const queryParams = ref<Q>({ ...initialParams }) as Ref<Q>;
  const pagination = ref<PaginationConfig>({
    total: 0,
    pageSize: initialPageSize,
    currentPage: initialPage,
    background: true,
    pageSizes: [10, 20, 50, 100]
  });

  // Computed
  const total = computed(() => pagination.value.total);
  const hasData = computed(() => dataList.value.length > 0);

  // Methods
  const fetchData = async (page: number = pagination.value.currentPage) => {
    loading.value = true;
    try {
      const { data, code, msg } = await api(page, queryParams.value);
      if (code === 200) {
        let list = data.list || [];
        if (transform) {
          list = transform(list);
        }
        dataList.value = list;
        pagination.value.total = data.count || data.total || 0;
        pagination.value.currentPage = page;
      } else {
        message(msg || "获取数据失败", { type: "error" });
      }
    } catch (error) {
      message("获取数据失败", { type: "error" });
      logger.error("获取数据失败", error);
    } finally {
      loading.value = false;
    }
  };

  const refresh = async () => {
    await fetchData();
  };

  const search = async (params?: Q) => {
    if (params) {
      queryParams.value = { ...params };
    }
    pagination.value.currentPage = 1;
    await fetchData(1);
  };

  const resetSearch = async () => {
    queryParams.value = { ...initialParams };
    pagination.value.currentPage = 1;
    await fetchData(1);
  };

  const handleDelete = async (item: T) => {
    if (!deleteApi) {
      logger.warn("deleteApi is not provided");
      return;
    }

    const uid = getUid(item);
    if (!uid) {
      logger.warn("item.uid is missing, cannot delete", item);
      return;
    }

    try {
      await deleteApi(uid);
      message("删除成功", { type: "success" });
      await fetchData();
    } catch (error) {
      message("删除失败", { type: "error" });
      logger.error("删除失败", error);
    }
  };

  const handleRestore = async (item: T) => {
    if (!restoreApi) {
      logger.warn("restoreApi is not provided");
      return;
    }

    const uid = getUid(item);
    if (!uid) {
      logger.warn("item.uid is missing, cannot restore", item);
      return;
    }

    try {
      await restoreApi(uid);
      message("恢复成功", { type: "success" });
      await fetchData();
    } catch (error) {
      message("恢复失败", { type: "error" });
      logger.error("恢复失败", error);
    }
  };

  const handleCurrentChange = async (page: number) => {
    pagination.value.currentPage = page;
    await fetchData(page);
  };

  const handleSizeChange = async (size: number) => {
    pagination.value.pageSize = size;
    pagination.value.currentPage = 1;
    await fetchData(1);
  };

  const setQueryParams = (params: Q) => {
    queryParams.value = { ...params };
  };

  const setPagination = (paginationConfig: Partial<PaginationConfig>) => {
    pagination.value = { ...pagination.value, ...paginationConfig };
  };

  // Lifecycle
  if (immediate) {
    onMounted(() => {
      fetchData();
    });
  }

  return {
    dataList,
    loading,
    pagination,
    queryParams,
    fetchData,
    refresh,
    search,
    resetSearch,
    handleDelete,
    handleRestore: enableRestore ? handleRestore : undefined,
    handleCurrentChange,
    handleSizeChange,
    setQueryParams,
    setPagination,
    total,
    hasData
  };
}

/**
 * 创建表单状态的 Composable
 */
export interface UseFormStateOptions<T> {
  /** 初始值 */
  initialValues?: Partial<T>;
  /** 验证规则 */
  rules?: Record<string, unknown[]>;
  /** 提交前钩子 */
  beforeSubmit?: (data: T) => T | Promise<T>;
  /** 提交后钩子 */
  afterSubmit?: (result: unknown) => void | Promise<void>;
  /** 提交错误钩子 */
  onSubmitError?: (error: unknown) => void;
}

export interface UseFormStateReturn<T> {
  /** 表单数据 */
  formData: Ref<Partial<T>>;
  /** 加载状态 */
  loading: Ref<boolean>;
  /** 提交表单 */
  submit: <R>(submitFn: (data: T) => Promise<R>) => Promise<R>;
  /** 重置表单 */
  reset: () => void;
  /** 设置表单值 */
  setFieldValue: <K extends keyof T>(key: K, value: T[K]) => void;
  /** 获取表单值 */
  getFormData: () => Partial<T>;
  /** 验证表单 */
  validate: () => Promise<boolean>;
}

export function useFormState<T extends Record<string, unknown>>(
  options: UseFormStateOptions<T> = {}
): UseFormStateReturn<T> {
  const {
    initialValues = {},
    rules: _rules,
    beforeSubmit,
    afterSubmit,
    onSubmitError
  } = options;

  const formData = ref({ ...initialValues }) as Ref<Partial<T>>;
  const loading = ref(false);

  const submit = async <R>(submitFn: (data: T) => Promise<R>): Promise<R> => {
    loading.value = true;
    try {
      let data = { ...formData.value } as T;
      if (beforeSubmit) {
        data = await beforeSubmit(data);
      }
      const result = await submitFn(data);
      if (afterSubmit) {
        await afterSubmit(result);
      }
      return result;
    } catch (error) {
      if (onSubmitError) {
        onSubmitError(error);
      }
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    formData.value = { ...initialValues };
  };

  const setFieldValue = <K extends keyof T>(key: K, value: T[K]) => {
    formData.value[key] = value;
  };

  const getFormData = () => {
    return { ...formData.value };
  };

  const validate = async (): Promise<boolean> => {
    // 这里需要与具体的表单组件集成
    // 目前返回 true，实际使用时需要根据表单组件的 validate 方法
    return true;
  };

  return {
    formData,
    loading,
    submit,
    reset,
    setFieldValue,
    getFormData,
    validate
  };
}
