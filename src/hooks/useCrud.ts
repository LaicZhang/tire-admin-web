import { ref, shallowRef, onUnmounted, toValue, type Ref, watch } from "vue";

export interface Pagination {
  currentPage: number;
  pageSize: number;
  total: number;
  pageSizes?: number[];
  background?: boolean;
  layout?: string;
  [key: string]: unknown;
}

export interface UseCrudOptions<T, Res, Params> {
  api: (params: Params) => Promise<Res>;
  deleteApi?: (id: string | number) => Promise<unknown>;
  params?: Ref<Params> | Params | (() => Params);
  pagination?: Partial<Pagination>;
  immediate?: boolean;
  transform?: (res: Res) => { list: T[]; total?: number };
}

/**
 * 类型守卫：检查值是否为包含 list 数组的对象
 */
function hasListProperty(
  value: unknown
): value is { list: unknown[]; total?: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "list" in value &&
    Array.isArray((value as { list?: unknown }).list)
  );
}

/**
 * 类型守卫：检查值是否为包含 data.list 数组的对象
 */
function hasDataListProperty(
  value: unknown
): value is { data: { list: unknown[]; total?: number } } {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof (value as { data?: unknown }).data === "object" &&
    (value as { data?: unknown }).data !== null &&
    "list" in ((value as { data?: unknown }).data as object) &&
    Array.isArray(
      ((value as { data?: { list?: unknown } }).data as { list?: unknown }).list
    )
  );
}

/**
 * 类型守卫：检查值是否为包含 data 数组的对象
 */
function hasDataArrayProperty(
  value: unknown
): value is { data: unknown[]; total?: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    Array.isArray((value as { data?: unknown }).data)
  );
}

export function useCrud<T = unknown, Res = unknown, Params = unknown>(
  options: UseCrudOptions<T, Res, Params>
) {
  const {
    api,
    deleteApi,
    params: initialParams,
    pagination: initialPagination,
    immediate = true,
    transform
  } = options;

  const loading = ref(false);
  const dataList = ref<T[]>([]) as Ref<T[]>;

  const pagination = shallowRef<Pagination>({
    currentPage: 1,
    pageSize: 10,
    total: 0,
    pageSizes: [10, 20, 50, 100],
    background: true,
    layout: "total, sizes, prev, pager, next, jumper",
    ...initialPagination
  });

  let abortController: AbortController | null = null;

  const fetchData = async () => {
    if (abortController) {
      abortController.abort();
    }
    const myController = new AbortController();
    abortController = myController;

    loading.value = true;
    try {
      const currentParams = toValue(initialParams) || {};
      const { currentPage, pageSize } = pagination.value;

      const requestParams = {
        ...currentParams,
        page: currentPage,
        pageSize: pageSize
      } as Params;

      const res = await api(requestParams);
      if (myController.signal.aborted) return;

      let list: T[] = [];
      let total = 0;

      if (transform) {
        const result = transform(res);
        list = result.list;
        total = result.total || 0;
      } else {
        const r: unknown = res;
        if (Array.isArray(r)) {
          list = r as T[];
          total = r.length;
        } else if (hasListProperty(r)) {
          list = r.list as T[];
          total = r.total ?? r.list.length;
        } else if (hasDataListProperty(r)) {
          list = r.data.list as T[];
          total = r.data.total ?? r.data.list.length;
        } else if (hasDataArrayProperty(r)) {
          list = r.data as T[];
          total = r.total ?? r.data.length;
        }
      }

      dataList.value = list;
      pagination.value = {
        ...pagination.value,
        total
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("fetchData error:", error);
        dataList.value = [];
      } else if (!(error instanceof Error)) {
        console.error("fetchData error:", error);
        dataList.value = [];
      }
    } finally {
      loading.value = false;
      abortController = null;
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!deleteApi) return;
    try {
      await deleteApi(id);
      await fetchData();
    } catch (error) {
      console.error("handleDelete error:", error);
    }
  };

  const onCurrentChange = (val: number) => {
    pagination.value = { ...pagination.value, currentPage: val };
  };

  const onSizeChange = (val: number) => {
    pagination.value = { ...pagination.value, pageSize: val, currentPage: 1 };
  };

  watch(pagination, (newVal, oldVal) => {
    if (
      newVal.currentPage !== oldVal?.currentPage ||
      newVal.pageSize !== oldVal?.pageSize
    ) {
      fetchData();
    }
  });

  if (immediate) {
    fetchData();
  }

  onUnmounted(() => {
    if (abortController) {
      abortController.abort();
    }
  });

  return {
    loading,
    dataList,
    pagination,
    fetchData,
    handleDelete,
    onCurrentChange,
    onSizeChange
  };
}
