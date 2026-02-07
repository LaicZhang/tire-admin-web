import { PAGE_SIZE_SMALL } from "../../../utils/constants";
import type {
  LoadingConfig,
  AdaptiveConfig,
  PaginationProps
} from "@pureadmin/table";
import { ref, reactive } from "vue";
import { delay } from "@pureadmin/utils";
import type { PermissionDto } from "@/api/system/permission";

export function useColumns() {
  const dataList = ref<PermissionDto[]>([]);
  const loading = ref(true);

  const columns: TableColumnList = [
    {
      label: "方法",
      prop: "type",
      width: 90,
      cellRenderer: ({ row }) => (
        <el-tag size="small" effect="plain">
          {(row.type || "-").toString()}
        </el-tag>
      )
    },
    {
      label: "模块",
      prop: "module",
      minWidth: 120
    },
    {
      label: "描述",
      prop: "desc",
      minWidth: 160,
      showOverflowTooltip: true
    },
    {
      label: "Path",
      prop: "path",
      minWidth: 200,
      showOverflowTooltip: true
    },
    {
      label: "归属",
      prop: "belong",
      width: 80
    },
    {
      label: "删除时间",
      prop: "deleteAt",
      minWidth: 160,
      formatter: ({ deleteAt }) => {
        return deleteAt ? deleteAt.replace("T", " ").substring(0, 19) : "-";
      }
    },
    {
      label: "操作",
      fixed: "right",
      width: 180,
      slot: "operation"
    }
  ];

  /** 分页配置 */
  const pagination = reactive<PaginationProps>({
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    pageSizes: [10, 20, 50],
    total: 0,
    align: "right",
    background: true,
    layout: "total, sizes, prev, pager, next, jumper"
  });

  /** 加载动画配置 */
  const loadingConfig = reactive<LoadingConfig>({
    text: "正在加载...",
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
  });

  /** 撑满内容区自适应高度相关配置 */
  const adaptiveConfig: AdaptiveConfig = {
    offsetBottom: 110
  };

  function onSizeChange(val: number) {
    pagination.pageSize = val;
  }

  function onCurrentChange(_val: number) {
    loading.value = true;
    delay(300).then(() => {
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
