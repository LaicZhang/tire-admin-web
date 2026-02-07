import { PAGE_SIZE_SMALL } from "../../../utils/constants";
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
      label: "公司名称",
      prop: "name",
      minWidth: 150
    },
    {
      label: "省/市",
      prop: "province",
      minWidth: 140,
      formatter: ({ province, city }) => {
        const p = province ?? "";
        const c = city ?? "";
        const joined = [p, c].filter(Boolean).join(" ");
        return joined || "-";
      }
    },
    {
      label: "负责人",
      prop: "principalName",
      minWidth: 100
    },
    {
      label: "负责人电话",
      prop: "principalPhone",
      minWidth: 120
    },
    {
      label: "状态",
      prop: "status",
      width: 100,
      cellRenderer: ({ row, props }) => (
        <el-tag
          size={props.size}
          type={
            row.deleteAt ? "info" : row.status === false ? "danger" : "success"
          }
          effect="plain"
        >
          {row.deleteAt ? "已删除" : row.status === false ? "禁用" : "启用"}
        </el-tag>
      )
    },
    {
      label: "创建时间",
      prop: "createAt",
      minWidth: 160,
      formatter: ({ createAt }) => {
        return createAt ? createAt.replace("T", " ").substring(0, 19) : "-";
      }
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
      width: 150,
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
