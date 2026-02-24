import { PAGE_SIZE_SMALL } from "@/utils/constants";
import type {
  LoadingConfig,
  AdaptiveConfig,
  PaginationProps,
  TableColumnRenderer
} from "@pureadmin/table";
import { ref, reactive } from "vue";
import { delay } from "@pureadmin/utils";
import { formatDate } from "@/utils";

import type { CompanyRoleItem } from "@/api/system/role";

export function useColumns() {
  const dataList = ref<CompanyRoleItem[]>([]);
  const loading = ref(true);
  const columns: TableColumnList = [
    {
      label: "角色名称",
      prop: "cn",
      minWidth: 120
    },
    {
      label: "角色标识",
      prop: "name",
      minWidth: 120
    },
    {
      label: "描述",
      prop: "desc",
      minWidth: 180
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 100,
      cellRenderer: (data: TableColumnRenderer) => {
        const row = data.row as CompanyRoleItem | undefined;
        const isActive = Boolean(row?.status);
        return (
          <el-tag
            size={data.props?.size}
            type={isActive ? "success" : "danger"}
            effect="plain"
          >
            {isActive ? "启用" : "禁用"}
          </el-tag>
        );
      }
    },
    {
      label: "删除时间",
      prop: "deleteAt",
      minWidth: 160,
      formatter: (_row, _column, cellValue) => formatDate(cellValue)
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

  function onCurrentChange(val: number, callback?: () => void) {
    pagination.currentPage = val;
    if (callback) {
      loading.value = true;
      delay(300).then(() => {
        callback();
        loading.value = false;
      });
    }
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
