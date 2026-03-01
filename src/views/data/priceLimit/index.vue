<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import SettingIcon from "~icons/ep/setting";
import { message } from "@/utils";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import type { PriceLimit, PriceLimitForm, PriceLimitConfig } from "./types";
import { getTireListApi } from "@/api/business/tire";
import {
  getPriceLimitMapApi,
  upsertPriceLimitApi,
  type PriceLimitRecord
} from "@/api/data/price-limit";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import type { Tire } from "@/api/business/tire";

defineOptions({
  name: "PriceLimit"
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const selectedRows = ref<PriceLimit[]>([]);
const form = ref({
  keyword: undefined,
  enablePurchaseLimit: undefined,
  enableSaleLimit: undefined
});

// 系统参数
const config = ref<PriceLimitConfig>({
  purchaseOverPriceAction: "warn",
  saleBelowPriceAction: "warn"
});

type TireLike = Tire & {
  barcode?: string;
  barCode?: string;
  number?: string;
};

type PriceLimitListRes = {
  tireRes: CommonResult<PaginatedResponseDto<Tire>>;
  limitMap: Record<string, PriceLimitRecord>;
};

const {
  loading,
  dataList,
  pagination,
  fetchData: getList,
  onCurrentChange
} = useCrud<PriceLimit, PriceLimitListRes, { page: number; pageSize: number }>({
  api: async ({ page }) => {
    const [tireRes, limitMap] = await Promise.all([
      getTireListApi(page, { keyword: form.value.keyword || undefined }),
      getPriceLimitMapApi()
    ]);
    return { tireRes, limitMap };
  },
  pagination: {
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    background: true
  },
  transform: (res: PriceLimitListRes) => {
    if (res.tireRes.code !== 200) {
      message(res.tireRes.msg || "获取列表失败", { type: "error" });
      return { list: [], total: 0 };
    }

    const list = (res.tireRes.data?.list ?? []).map(tire => {
      const t = tire as TireLike;
      const limit = res.limitMap[t.uid];
      return {
        id: t.id,
        uid: t.uid,
        tireId: t.uid,
        tireName: t.name,
        tireCode: t.barcode ?? t.barCode ?? t.number,
        group: t.group,
        maxPurchasePrice: limit?.maxPurchasePrice,
        minSalePrice: limit?.minSalePrice,
        enablePurchaseLimit: limit?.enablePurchaseLimit ?? false,
        enableSaleLimit: limit?.enableSaleLimit ?? false,
        updatedAt: limit?.updatedAt
      } as PriceLimit;
    });

    // 前端过滤开关（保持原逻辑：total 不随过滤变化）
    let filtered = list;
    if (form.value.enablePurchaseLimit !== undefined) {
      const expect = Boolean(form.value.enablePurchaseLimit);
      filtered = filtered.filter(
        r => Boolean(r.enablePurchaseLimit) === expect
      );
    }
    if (form.value.enableSaleLimit !== undefined) {
      const expect = Boolean(form.value.enableSaleLimit);
      filtered = filtered.filter(r => Boolean(r.enableSaleLimit) === expect);
    }

    return { list: filtered, total: res.tireRes.data?.count ?? 0 };
  },
  immediate: true
});

const columns = [
  { type: "selection", width: 50 },
  { label: "ID", prop: "id", width: 80 },
  { label: "商品名称", prop: "tireName" },
  { label: "分组", prop: "group", width: 100 },
  {
    label: "最高采购价",
    prop: "maxPurchasePrice",
    slot: "maxPurchasePrice",
    width: 120
  },
  {
    label: "采购限价",
    prop: "enablePurchaseLimit",
    slot: "enablePurchaseLimit",
    width: 100
  },
  {
    label: "最低销售价",
    prop: "minSalePrice",
    slot: "minSalePrice",
    width: 120
  },
  {
    label: "销售限价",
    prop: "enableSaleLimit",
    slot: "enableSaleLimit",
    width: 100
  },
  { label: "更新时间", prop: "updatedAt", width: 160 },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    fixed: "right",
    minWidth: 100
  }
];

const onSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  getList();
};

const onReset = () => {
  searchFormRef.value?.resetFields();
  onSearch();
};

const handleSelectionChange = (rows: PriceLimit[]) => {
  selectedRows.value = rows;
};

// 编辑限价
const openDialog = (row: PriceLimit) => {
  const formData = ref<PriceLimitForm>({
    tireId: row.tireId,
    maxPurchasePrice: row.maxPurchasePrice,
    minSalePrice: row.minSalePrice,
    enablePurchaseLimit: row.enablePurchaseLimit,
    enableSaleLimit: row.enableSaleLimit
  });

  addDialog({
    title: `编辑限价 - ${row.tireName}`,
    width: "500px",
    draggable: true,
    fullscreen: deviceDetection(),
    closeOnClickModal: false,
    contentRenderer: () =>
      h("div", { class: "p-4" }, [
        h("el-form", { labelWidth: "120px" }, [
          h("el-form-item", { label: "商品" }, [
            h("span", { class: "font-bold" }, row.tireName)
          ]),
          h("el-divider", { contentPosition: "left" }, "采购限价"),
          h("el-form-item", { label: "启用采购限价" }, [
            h("el-switch", {
              modelValue: formData.value.enablePurchaseLimit,
              "onUpdate:modelValue": (val: boolean) => {
                formData.value.enablePurchaseLimit = val;
              }
            })
          ]),
          h("el-form-item", { label: "最高采购价" }, [
            h("el-input-number", {
              modelValue: formData.value.maxPurchasePrice,
              "onUpdate:modelValue": (val: number) => {
                formData.value.maxPurchasePrice = val;
              },
              min: 0,
              precision: 2,
              disabled: !formData.value.enablePurchaseLimit
            })
          ]),
          h("el-divider", { contentPosition: "left" }, "销售限价"),
          h("el-form-item", { label: "启用销售限价" }, [
            h("el-switch", {
              modelValue: formData.value.enableSaleLimit,
              "onUpdate:modelValue": (val: boolean) => {
                formData.value.enableSaleLimit = val;
              }
            })
          ]),
          h("el-form-item", { label: "最低销售价" }, [
            h("el-input-number", {
              modelValue: formData.value.minSalePrice,
              "onUpdate:modelValue": (val: number) => {
                formData.value.minSalePrice = val;
              },
              min: 0,
              precision: 2,
              disabled: !formData.value.enableSaleLimit
            })
          ])
        ])
      ]),
    beforeSure: done => {
      if (formData.value.enablePurchaseLimit) {
        if (
          formData.value.maxPurchasePrice === null ||
          formData.value.maxPurchasePrice === undefined
        ) {
          message("请输入最高采购价", { type: "warning" });
          return;
        }
        const n = Number(formData.value.maxPurchasePrice);
        if (!Number.isFinite(n) || n < 0) {
          message("最高采购价不合法", { type: "warning" });
          return;
        }
      }
      if (formData.value.enableSaleLimit) {
        if (
          formData.value.minSalePrice === null ||
          formData.value.minSalePrice === undefined
        ) {
          message("请输入最低销售价", { type: "warning" });
          return;
        }
        const n = Number(formData.value.minSalePrice);
        if (!Number.isFinite(n) || n < 0) {
          message("最低销售价不合法", { type: "warning" });
          return;
        }
      }
      upsertPriceLimitApi({
        tireId: row.tireId,
        enablePurchaseLimit: formData.value.enablePurchaseLimit,
        enableSaleLimit: formData.value.enableSaleLimit,
        maxPurchasePrice: formData.value.maxPurchasePrice,
        minSalePrice: formData.value.minSalePrice
      }).then(() => {
        message("保存成功", { type: "success" });
        done();
        getList();
      });
    }
  });
};

// 系统参数设置
const openConfigDialog = () => {
  addDialog({
    title: "限价控制设置",
    width: "500px",
    draggable: true,
    closeOnClickModal: false,
    contentRenderer: () =>
      h("div", { class: "p-4" }, [
        h(
          "el-alert",
          {
            title: "限价控制说明",
            type: "info",
            closable: false,
            class: "mb-4"
          },
          {
            default: () => "设置当价格超出限制时的系统行为"
          }
        ),
        h("el-form", { labelWidth: "140px" }, [
          h("el-form-item", { label: "采购超价控制" }, [
            h(
              "el-radio-group",
              {
                modelValue: config.value.purchaseOverPriceAction,
                "onUpdate:modelValue": (val: "warn" | "block") => {
                  config.value.purchaseOverPriceAction = val;
                }
              },
              [
                h("el-radio", { label: "warn" }, "仅提示"),
                h("el-radio", { label: "block" }, "阻止保存")
              ]
            )
          ]),
          h("el-form-item", { label: "销售低价控制" }, [
            h(
              "el-radio-group",
              {
                modelValue: config.value.saleBelowPriceAction,
                "onUpdate:modelValue": (val: "warn" | "block") => {
                  config.value.saleBelowPriceAction = val;
                }
              },
              [
                h("el-radio", { label: "warn" }, "仅提示"),
                h("el-radio", { label: "block" }, "阻止保存")
              ]
            )
          ])
        ])
      ]),
    beforeSure: done => {
      message("设置保存成功", { type: "success" });
      done();
    }
  });
};

// 批量设置
const handleBatchEdit = () => {
  if (selectedRows.value.length === 0) {
    message("请选择要设置的商品", { type: "warning" });
    return;
  }

  addDialog({
    title: `批量设置限价 (${selectedRows.value.length}个商品)`,
    width: "500px",
    draggable: true,
    closeOnClickModal: false,
    contentRenderer: () =>
      h("div", { class: "p-4" }, [
        h("el-alert", {
          title: "批量设置说明",
          type: "warning",
          description: "将对选中的所有商品统一设置限价",
          showIcon: true,
          closable: false
        })
      ]),
    beforeSure: done => {
      message("批量设置成功", { type: "success" });
      done();
      getList();
    }
  });
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
      <el-form-item label="采购限价" prop="enablePurchaseLimit">
        <el-select
          v-model="form.enablePurchaseLimit"
          placeholder="全部"
          clearable
          class="w-[120px]"
        >
          <el-option label="已启用" :value="true" />
          <el-option label="未启用" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="销售限价" prop="enableSaleLimit">
        <el-select
          v-model="form.enableSaleLimit"
          placeholder="全部"
          clearable
          class="w-[120px]"
        >
          <el-option label="已启用" :value="true" />
          <el-option label="未启用" :value="false" />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar title="采购销售限价" @refresh="getList">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(EditPen)"
            :disabled="selectedRows.length === 0"
            @click="handleBatchEdit"
          >
            批量设置
          </el-button>
          <el-button
            :icon="useRenderIcon(SettingIcon)"
            @click="openConfigDialog"
          >
            限价控制设置
          </el-button>
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
            <template #maxPurchasePrice="{ row }">
              <span
                v-if="row.maxPurchasePrice"
                class="text-orange-500 font-bold"
              >
                {{ row.maxPurchasePrice }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
            <template #enablePurchaseLimit="{ row }">
              <el-tag
                :type="row.enablePurchaseLimit ? 'success' : 'info'"
                size="small"
              >
                {{ row.enablePurchaseLimit ? "已启用" : "未启用" }}
              </el-tag>
            </template>
            <template #minSalePrice="{ row }">
              <span v-if="row.minSalePrice" class="text-green-500 font-bold">
                {{ row.minSalePrice }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
            <template #enableSaleLimit="{ row }">
              <el-tag
                :type="row.enableSaleLimit ? 'success' : 'info'"
                size="small"
              >
                {{ row.enableSaleLimit ? "已启用" : "未启用" }}
              </el-tag>
            </template>
            <template #operation="{ row }">
              <el-button link type="primary" @click="openDialog(row)">
                编辑
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
