import { DEFAULT_PAGE_SIZE } from "../../utils/constants";
import type {
  LoadingConfig,
  AdaptiveConfig,
  PaginationProps
} from "@pureadmin/table";
import { ref, reactive } from "vue";
import { delay } from "@pureadmin/utils";
import { formatDate } from "@/utils";

export function useColumns() {
  type HistoryRow = {
    id?: string | number;
    module?: string;
    method?: string;
    success?: boolean;
    operator?: string;
    ip?: string;
    record?: {
      os?: string;
      browser?: string;
    };
    createAt?: string;
  };

  const dataList = ref<HistoryRow[]>([]);
  const loading = ref(true);
  const columns: TableColumnList = [
    {
      label: "序号",
      type: "index",
      width: 60
    },
    {
      label: "模块",
      prop: "module",
      hide: ({ method }: { method?: string }) => !method // Simple heuristic: only show if it looks like an operation log
    },
    {
      label: "操作",
      prop: "method" // For login logs this is "method", for op logs it might be "summary" or we map "method"
    },
    {
      label: "状态",
      prop: "success",
      cellRenderer: ({ row }) => (
        <el-tag type={row.success ? "success" : "danger"}>
          {row.success ? "成功" : "失败"}
        </el-tag>
      ),
      hide: ({ method }: { method?: string }) => !method // Only for op logs
    },
    {
      label: "操作人",
      prop: "operator"
    },
    {
      label: "IP地址",
      prop: "ip"
    },
    {
      label: "操作系统",
      prop: "record.os",
      hide: ({ method }: { method?: string }) => !!method // Hide for op logs if they don't have record.os
    },
    {
      label: "浏览器",
      prop: "record.browser",
      hide: ({ method }: { method?: string }) => !!method
    },
    {
      label: "时间",
      prop: "createAt",
      formatter: row => formatDate(row.createAt),
      minWidth: 160
    }
  ];

  /** 分页配置 */
  const pagination = reactive<PaginationProps>({
    pageSize: DEFAULT_PAGE_SIZE,
    currentPage: 1,
    pageSizes: [20, 40, 60],
    total: 0,
    align: "right",
    background: true
  });

  /** 加载动画配置 */
  const loadingConfig = reactive<LoadingConfig>({
    text: "正在加载第一页...",
    viewBox: "-10, -10, 50, 50",
    spinner: `
        <path class="path" d="
          M 30 15
          L 28 17
          M 25.61 25.61
          A 15 15, 0, 0, 1, 15 30
          A 15 15, 0, 1, 1, 27.99 7.5
          L 15 15
        " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
      `
    // svg: "",
    // background: rgba()
  });

  /** 撑满内容区自适应高度相关配置 */
  const adaptiveConfig: AdaptiveConfig = {
    /** 表格距离页面底部的偏移量，默认值为 `96` */
    offsetBottom: 110
    /** 是否固定表头，默认值为 `true`（如果不想固定表头，fixHeader设置为false并且表格要设置table-layout="auto"） */
    // fixHeader: true
    /** 页面 `resize` 时的防抖时间，默认值为 `60` ms */
    // timeout: 60
    /** 表头的 `z-index`，默认值为 `100` */
    // zIndex: 100
  };

  function onSizeChange(val: number) {
    pagination.pageSize = val;
    onCurrentChange(1);
  }

  function onCurrentChange(val: number) {
    loadingConfig.text = `正在加载第${val}页...`;
    loading.value = true;
    delay(600).then(() => {
      loading.value = false;
    });
  }
  return {
    loading,
    columns,
    dataList,
    pagination,
    loadingConfig,
    adaptiveConfig,
    onSizeChange,
    onCurrentChange
  };
}
