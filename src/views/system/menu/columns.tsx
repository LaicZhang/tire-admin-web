import { PAGE_SIZE_SMALL } from "../../../utils/constants";
import type {
  LoadingConfig,
  AdaptiveConfig,
  PaginationProps
} from "@pureadmin/table";
import { ref, reactive } from "vue";
import { delay } from "@pureadmin/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { formatDate } from "@/utils";
import type { MenuItem as ApiMenuItem } from "@/api/system/menu";

export type MenuItem = ApiMenuItem;

export function useColumns() {
  const dataList = ref<MenuItem[]>([]);
  const loading = ref(true);

  const columns: TableColumnList = [
    {
      label: "菜单名称",
      prop: "title",
      align: "left",
      cellRenderer: ({ row }) => (
        <>
          <span class="inline-block mr-1">
            {row.icon ? useRenderIcon(row.icon) : null}
          </span>
          <span>{row.title || row.name}</span>
        </>
      )
    },
    {
      label: "路由路径",
      prop: "path"
    },
    {
      label: "组件路径",
      prop: "component"
      // formatter: ({ component }) => component || "-"
    },
    {
      label: "排序",
      prop: "rank",
      width: 100
    },
    {
      label: "显示",
      prop: "showLink",
      width: 100,
      cellRenderer: ({ row, props }) => (
        <el-tag
          size={props.size}
          type={(row.showLink ?? true) ? "success" : "info"}
          effect="plain"
        >
          {(row.showLink ?? true) ? "显示" : "隐藏"}
        </el-tag>
      )
    },
    {
      label: "删除时间",
      prop: "deleteAt",
      width: 180,
      formatter: (_row, _col, cellValue) => formatDate(cellValue)
    },
    {
      label: "操作",
      fixed: "right",
      width: 210,
      slot: "operation"
    }
  ];

  /** 分页配置 */
  const pagination = reactive<PaginationProps>({
    pageSize: PAGE_SIZE_SMALL, // Tree table usually doesn't need pagination for root, but if API supports it.
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
    // Refresh logic if needed
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
