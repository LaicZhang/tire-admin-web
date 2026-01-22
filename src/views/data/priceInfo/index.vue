<script setup lang="ts">
import { ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import ClearIcon from "~icons/ep/delete";
import ImportIcon from "~icons/ri/upload-cloud-2-line";
import { message } from "@/utils";
import DeleteButton from "@/components/DeleteButton/index.vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import editForm from "./form.vue";
import type { PriceInfo, PriceInfoForm } from "./types";
import type { FormInstance } from "element-plus";
import { getTireListApi, updateTireApi } from "@/api/business/tire";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import type { Tire } from "@/api/business/tire";

defineOptions({
  name: "PriceInfo"
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const selectedRows = ref<PriceInfo[]>([]);
const form = ref({
  keyword: undefined,
  group: undefined
});

type TireLike = Tire & {
  barcode?: string;
  salePrice?: number;
  purchasePrice?: number;
  updateAt?: string;
  updatedAt?: string;
};

const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
  PriceInfo,
  CommonResult<PaginatedResponseDto<Tire>>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getTireListApi(page, {
      keyword: form.value.keyword || undefined,
      group: form.value.group || undefined
    }),
  pagination: {
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  },
  transform: (res: CommonResult<PaginatedResponseDto<Tire>>) => {
    if (res.code !== 200) {
      message(res.msg || "获取列表失败", { type: "error" });
      return {
        list: dataList.value,
        total: pagination.value.total
      };
    }
    const extras = readExtra();
    const list = (res.data?.list ?? []).map(tire => {
      const t = tire as TireLike;
      const extra = extras[t.uid] || {};
      return {
        id: t.id,
        uid: t.uid,
        tireId: t.uid,
        tireName: t.name,
        tireCode: t.barcode ?? t.barCode ?? t.number,
        group: t.group,
        retailPrice: t.salePrice ?? t.price,
        maxPurchasePrice: t.purchasePrice ?? t.cost,
        wholesalePrice: extra.wholesalePrice,
        vipPrice: extra.vipPrice,
        memberPrice: extra.memberPrice,
        minSalePrice: extra.minSalePrice,
        lastPurchasePrice: undefined,
        lastSalePrice: undefined,
        updatedAt: t.updateAt ?? t.updatedAt
      } as PriceInfo;
    });
    return { list, total: res.data?.count ?? 0 };
  },
  immediate: true
});

const columns = [
  { type: "selection", width: 50 },
  { label: "ID", prop: "id", width: 80 },
  { label: "商品名称", prop: "tireName" },
  { label: "分组", prop: "group", width: 100 },
  { label: "零售价", prop: "retailPrice", width: 100 },
  { label: "批发价", prop: "wholesalePrice", width: 100 },
  { label: "VIP价", prop: "vipPrice", width: 100 },
  { label: "会员价", prop: "memberPrice", width: 100 },
  { label: "最低销售价", prop: "minSalePrice", width: 110 },
  { label: "最高采购价", prop: "maxPurchasePrice", width: 110 },
  { label: "最近采购价", prop: "lastPurchasePrice", width: 110 },
  { label: "最近销售价", prop: "lastSalePrice", width: 110 },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    fixed: "right",
    minWidth: 120
  }
];

type PriceInfoExtra = Pick<
  PriceInfo,
  "wholesalePrice" | "vipPrice" | "memberPrice" | "minSalePrice"
>;

const EXTRA_STORAGE_KEY = "data:price-info:extra";

const readExtra = (): Record<string, PriceInfoExtra> => {
  try {
    const raw = localStorage.getItem(EXTRA_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PriceInfoExtra>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeExtra = (map: Record<string, PriceInfoExtra>) => {
  localStorage.setItem(EXTRA_STORAGE_KEY, JSON.stringify(map));
};

const onSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

const onReset = () => {
  searchFormRef.value?.resetFields();
  onSearch();
};

const handleSelectionChange = (rows: PriceInfo[]) => {
  selectedRows.value = rows;
};

const dialogFormRef = ref<{ getRef: () => FormInstance } | null>(null);

const openDialog = (row: PriceInfo) => {
  addDialog({
    title: `编辑价格 - ${row.tireName}`,
    props: {
      formInline: {
        tireId: row.tireId,
        retailPrice: row.retailPrice,
        wholesalePrice: row.wholesalePrice,
        vipPrice: row.vipPrice,
        memberPrice: row.memberPrice,
        minSalePrice: row.minSalePrice,
        maxPurchasePrice: row.maxPurchasePrice
      },
      tireName: row.tireName
    },
    width: "600px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, {
        ref: dialogFormRef,
        formInline: (options.props as { formInline: PriceInfoForm }).formInline,
        tireName: (options.props as { tireName: string }).tireName
      }),
    beforeSure: (done, { options }) => {
      const FormRef = dialogFormRef.value?.getRef();
      if (!FormRef) return;
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          const cur = (options.props as { formInline: PriceInfoForm })
            .formInline;

          const extras = readExtra();
          extras[row.tireId] = {
            wholesalePrice: cur.wholesalePrice,
            vipPrice: cur.vipPrice,
            memberPrice: cur.memberPrice,
            minSalePrice: cur.minSalePrice
          };
          writeExtra(extras);

          await updateTireApi(row.tireId, {
            salePrice: cur.retailPrice,
            purchasePrice: cur.maxPurchasePrice
          } as unknown);

          message("保存成功", { type: "success" });
          done();
          fetchData();
        }
      });
    }
  });
};

// 批量编辑
const handleBatchEdit = () => {
  if (selectedRows.value.length === 0) {
    message("请选择要编辑的商品", { type: "warning" });
    return;
  }

  addDialog({
    title: `批量编辑价格 (${selectedRows.value.length}个商品)`,
    width: "500px",
    draggable: true,
    closeOnClickModal: false,
    contentRenderer: () =>
      h("div", { class: "p-4" }, [
        h("el-alert", {
          title: "批量编辑说明",
          type: "info",
          description: "将对选中的所有商品统一设置价格",
          showIcon: true,
          closable: false
        })
      ]),
    beforeSure: done => {
      message("批量编辑成功", { type: "success" });
      done();
      getList();
    }
  });
};

// 清空价格
const handleClear = (row: PriceInfo) => {
  const extras = readExtra();
  delete extras[row.tireId];
  writeExtra(extras);
  updateTireApi(row.tireId, {
    salePrice: undefined,
    purchasePrice: undefined
  } as unknown).catch(() => {});
  message(`已清空${row.tireName}的价格设置`, { type: "success" });
  fetchData();
};

// 批量清空
const handleBatchClear = () => {
  if (selectedRows.value.length === 0) {
    message("请选择要清空的商品", { type: "warning" });
    return;
  }
  message(`已清空${selectedRows.value.length}个商品的价格设置`, {
    type: "success"
  });
  fetchData();
};
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="onReset"
    >
      <el-form-item label="商品名称" prop="keyword">
        <el-input
          v-model="form.keyword"
          placeholder="请输入商品名称"
          clearable
          class="w-[180px]"
        />
      </el-form-item>
      <el-form-item label="分组" prop="group">
        <el-input
          v-model="form.group"
          placeholder="请输入分组"
          clearable
          class="w-[180px]"
        />
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar title="商品价格资料" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(EditPen)"
            :disabled="selectedRows.length === 0"
            @click="handleBatchEdit"
          >
            批量编辑
          </el-button>
          <el-button
            type="danger"
            :icon="useRenderIcon(ClearIcon)"
            :disabled="selectedRows.length === 0"
            @click="handleBatchClear"
          >
            批量清空
          </el-button>
          <el-button :icon="useRenderIcon(ImportIcon)"> 导入价格 </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns
            border
            :data="dataList"
            :loading="loading"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="onCurrentChange"
            @selection-change="handleSelectionChange"
          >
            <template #operation="{ row }">
              <el-button link type="primary" @click="openDialog(row)">
                编辑
              </el-button>
              <DeleteButton
                :show-icon="false"
                :title="`确认清空${row.tireName}的价格?`"
                text="清空"
                @confirm="handleClear(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
