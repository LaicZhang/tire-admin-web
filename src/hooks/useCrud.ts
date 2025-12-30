import { ref, shallowRef, onUnmounted, toValue, type Ref, watch } from "vue";

export interface Pagination {
  currentPage: number;
  pageSize: number;
  total: number;
  pageSizes?: number[];
  background?: boolean;
  layout?: string;
  [key: string]: any;
}

export interface UseCrudOptions<T, Res, Params> {
  api: (params: Params) => Promise<Res>;
  deleteApi?: (id: string | number) => Promise<any>;
  params?: Ref<Params> | Params | (() => Params);
  pagination?: Partial<Pagination>;
  immediate?: boolean;
  transform?: (res: Res) => { list: T[]; total?: number };
}

export function useCrud<T = any, Res = any, Params = any>(
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
        const r = res as any;
        if (Array.isArray(r)) {
          list = r;
          total = r.length;
        } else if (Array.isArray(r?.list)) {
          list = r.list;
          total = r.total || r.list.length;
        } else if (Array.isArray(r?.data?.list)) {
          list = r.data.list;
          total = r.data.total || r.data.list.length;
        } else if (Array.isArray(r?.data)) {
          list = r.data;
          total = r.total || r.data.length;
        }
      }

      dataList.value = list;
      pagination.value = {
        ...pagination.value,
        total
      };
    } catch (error: any) {
      if (error.name !== "AbortError") {
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
