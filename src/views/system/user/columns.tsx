import type {
  LoadingConfig,
  AdaptiveConfig,
  PaginationProps
} from "@pureadmin/table";
import { ref, reactive } from "vue";
import { delay } from "@pureadmin/utils";
import type { FormItemProps } from "./utils/types";

export function useColumns() {
  const dataList = ref<FormItemProps[]>([]);
  const loading = ref(true);
  const columns: TableColumnList = [
    {
      label: "uid",
      prop: "uid",
      minWidth: 120
    },
    {
      label: "用户名",
      prop: "username",
      minWidth: 120
    },
    {
      label: "电话",
      prop: "phone",
      minWidth: 120
    },
    {
      label: "邮箱",
      prop: "email",
      minWidth: 150
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 100,
      cellRenderer: ({ row, props }) => (
        <el-tag
          size={props.size}
          type={row.status === "1" ? "success" : "danger"}
          effect="plain"
        >
          {row.status === "1" ? "启用" : "禁用"}
        </el-tag>
      )
    },
    {
      label: "操作",
      width: 180,
      fixed: "right",
      slot: "operation"
    }
  ];

  /** 分页配置 */
  const pagination = reactive<PaginationProps>({
    pageSize: 10,
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
    // 需要在外部触发重新查询
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
