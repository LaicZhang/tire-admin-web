<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import ClearIcon from "~icons/ep/delete";
import ImportIcon from "~icons/ri/upload-cloud-2-line";
import { message, handleApiError } from "@/utils";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { ImportDialog } from "@/components/ImportExport";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/composables/useDialogService";
import { deviceDetection } from "@pureadmin/utils";
import editForm from "./form.vue";
import type { PriceInfo, PriceInfoForm } from "./types";
import type { FormInstance } from "element-plus";
import { getTireListApi, updateTireApi } from "@/api/business/tire";
import {
  deletePriceLimitApi,
  getPriceLimitListApi,
  upsertPriceLimitApi,
  type PriceLimitRecord
} from "@/api/data/price-limit";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import type { Tire } from "@/api/business/tire";
import { useSysDictOptions } from "@/composables/useSysDict";
import { columns } from "./columns";

defineOptions({
  name: "PriceInfo"
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const showImportDialog = ref(false);
const selectedRows = ref<PriceInfo[]>([]);
const form = ref({
  keyword: undefined,
  group: undefined
});
const { options: groupOptions } = useSysDictOptions("tireGroup");

type TireLike = Tire & {
  barcode?: string;
  salePrice?: number;
  purchasePrice?: number;
  updateAt?: string;
  updatedAt?: string;
};

interface PriceInfoPageResponse {
  tires: CommonResult<PaginatedResponseDto<Tire>>;
  limits: CommonResult<PaginatedResponseDto<PriceLimitRecord>>;
}

const toYuan = (value?: number | string | bigint | null) =>
  value === undefined || value === null ? undefined : Number(value) / 100;

const toFen = (value?: number) =>
  value === undefined ? undefined : Math.round(value * 100);

const buildPriceLimitMap = (records?: PriceLimitRecord[]) => {
  return Object.fromEntries((records ?? []).map(item => [item.tireId, item]));
};

const buildPriceLimitPayload = (row: PriceInfo, formInline: PriceInfoForm) => ({
  uid: row.priceLimitUid,
  tireId: row.tireId,
  enablePurchaseLimit:
    formInline.maxPurchasePrice !== undefined
      ? true
      : Boolean(row.enablePurchaseLimit),
  enableSaleLimit:
    formInline.minSalePrice !== undefined ? true : Boolean(row.enableSaleLimit),
  maxPurchasePrice: toFen(formInline.maxPurchasePrice),
  minSalePrice: toFen(formInline.minSalePrice),
  wholesalePrice: toFen(formInline.wholesalePrice),
  vipPrice: toFen(formInline.vipPrice),
  memberPrice: toFen(formInline.memberPrice)
});

const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
  PriceInfo,
  PriceInfoPageResponse,
  { page: number; pageSize: number }
>({
  api: async ({ page, pageSize }) => {
    const tires = await getTireListApi(page, {
      keyword: form.value.keyword || undefined,
      group: form.value.group || undefined
    });
    const tireIds = (tires.data?.list ?? []).map(item => item.uid);
    const limits =
      tireIds.length > 0
        ? await getPriceLimitListApi(1, {
            tireIds,
            pageSize: Math.max(pageSize, tireIds.length)
          })
        : ({
            code: 200,
            msg: "",
            data: { list: [], total: 0 }
          } as unknown as CommonResult<PaginatedResponseDto<PriceLimitRecord>>);
    return { tires, limits };
  },
  pagination: {
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    background: true
  },
  transform: ({ tires, limits }) => {
    if (tires.code !== 200) {
      message(tires.msg || "获取列表失败", { type: "error" });
      return { list: [], total: 0 };
    }
    if (limits.code !== 200) {
      message(limits.msg || "获取价格配置失败", { type: "error" });
      return { list: [], total: 0 };
    }
    const limitMap = buildPriceLimitMap(limits.data?.list);
    const list = (tires.data?.list ?? []).map(tire => {
      const t = tire as TireLike;
      const limit = limitMap[t.uid];
      return {
        id: t.id,
        uid: t.uid,
        priceLimitUid: limit?.uid,
        tireId: t.uid,
        tireName: t.name,
        tireCode: t.barcode ?? t.number,
        group: t.group,
        retailPrice: t.salePrice ?? t.price,
        maxPurchasePrice: t.purchasePrice ?? t.cost,
        wholesalePrice: toYuan(limit?.wholesalePrice),
        vipPrice: toYuan(limit?.vipPrice),
        memberPrice: toYuan(limit?.memberPrice),
        minSalePrice: toYuan(limit?.minSalePrice),
        enablePurchaseLimit: limit?.enablePurchaseLimit,
        enableSaleLimit: limit?.enableSaleLimit,
        lastPurchasePrice: undefined,
        lastSalePrice: undefined,
        updatedAt: t.updateAt ?? t.updatedAt
      } as PriceInfo;
    });
    return { list, total: tires.data?.total ?? 0 };
  },
  immediate: true
});

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

const dialogFormRef = ref<{ formRef?: FormInstance } | null>(null);

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
      const FormRef = dialogFormRef.value?.formRef;
      if (!FormRef) return;
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          const cur = (options.props as { formInline: PriceInfoForm })
            .formInline;
          try {
            await Promise.all([
              upsertPriceLimitApi(buildPriceLimitPayload(row, cur)),
              updateTireApi(row.tireId, {
                salePrice: cur.retailPrice,
                purchasePrice: cur.maxPurchasePrice
              })
            ]);
            message("保存成功", { type: "success" });
            done();
            fetchData();
          } catch (error) {
            handleApiError(error);
          }
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
    props: {
      formInline: {
        wholesalePrice: undefined as number | undefined,
        vipPrice: undefined as number | undefined,
        memberPrice: undefined as number | undefined,
        minSalePrice: undefined as number | undefined
      }
    },
    width: "500px",
    draggable: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const { formInline } = options.props as {
        formInline: {
          wholesalePrice?: number;
          vipPrice?: number;
          memberPrice?: number;
          minSalePrice?: number;
        };
      };
      return h("div", { class: "p-4" }, [
        h("el-alert", {
          title: "批量编辑说明",
          type: "info",
          description: "留空的字段将保持不变，仅修改有值的字段",
          showIcon: true,
          closable: false,
          class: "mb-4"
        }),
        h("el-form", { model: formInline, labelWidth: "100px" }, [
          h("el-form-item", { label: "批发价" }, [
            h("el-input-number", {
              modelValue: formInline.wholesalePrice,
              "onUpdate:modelValue": (v: number) =>
                (formInline.wholesalePrice = v),
              min: 0,
              precision: 2,
              placeholder: "留空不修改"
            })
          ]),
          h("el-form-item", { label: "VIP价" }, [
            h("el-input-number", {
              modelValue: formInline.vipPrice,
              "onUpdate:modelValue": (v: number) => (formInline.vipPrice = v),
              min: 0,
              precision: 2,
              placeholder: "留空不修改"
            })
          ]),
          h("el-form-item", { label: "会员价" }, [
            h("el-input-number", {
              modelValue: formInline.memberPrice,
              "onUpdate:modelValue": (v: number) =>
                (formInline.memberPrice = v),
              min: 0,
              precision: 2,
              placeholder: "留空不修改"
            })
          ]),
          h("el-form-item", { label: "最低销售价" }, [
            h("el-input-number", {
              modelValue: formInline.minSalePrice,
              "onUpdate:modelValue": (v: number) =>
                (formInline.minSalePrice = v),
              min: 0,
              precision: 2,
              placeholder: "留空不修改"
            })
          ])
        ])
      ]);
    },
    beforeSure: async (done, { options }) => {
      const batch = (
        options.props as {
          formInline: {
            wholesalePrice?: number;
            vipPrice?: number;
            memberPrice?: number;
            minSalePrice?: number;
          };
        }
      ).formInline;
      for (const [label, v] of [
        ["批发价", batch.wholesalePrice],
        ["VIP价", batch.vipPrice],
        ["会员价", batch.memberPrice],
        ["最低销售价", batch.minSalePrice]
      ] as const) {
        if (v === undefined) continue;
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0) {
          message(`${label}不合法`, { type: "warning" });
          return;
        }
      }
      try {
        await Promise.all(
          selectedRows.value.map(row =>
            upsertPriceLimitApi({
              uid: row.priceLimitUid,
              tireId: row.tireId,
              enablePurchaseLimit: Boolean(row.enablePurchaseLimit),
              enableSaleLimit:
                batch.minSalePrice !== undefined
                  ? true
                  : Boolean(row.enableSaleLimit),
              maxPurchasePrice: toFen(row.maxPurchasePrice),
              minSalePrice:
                batch.minSalePrice !== undefined
                  ? toFen(batch.minSalePrice)
                  : toFen(row.minSalePrice),
              wholesalePrice:
                batch.wholesalePrice !== undefined
                  ? toFen(batch.wholesalePrice)
                  : toFen(row.wholesalePrice),
              vipPrice:
                batch.vipPrice !== undefined
                  ? toFen(batch.vipPrice)
                  : toFen(row.vipPrice),
              memberPrice:
                batch.memberPrice !== undefined
                  ? toFen(batch.memberPrice)
                  : toFen(row.memberPrice)
            })
          )
        );
        message("批量编辑成功", { type: "success" });
        done();
        fetchData();
      } catch (error) {
        handleApiError(error);
      }
    }
  });
};

// 清空价格
const handleClear = async (row: PriceInfo) => {
  try {
    await Promise.all([
      row.priceLimitUid
        ? deletePriceLimitApi(row.priceLimitUid)
        : Promise.resolve(),
      updateTireApi(row.tireId, {
        salePrice: undefined,
        purchasePrice: undefined
      })
    ]);
    message(`已清空${row.tireName}的价格设置`, { type: "success" });
  } catch (e) {
    handleApiError(e);
  }
  fetchData();
};

// 批量清空
const handleBatchClear = async () => {
  if (selectedRows.value.length === 0) {
    message("请选择要清空的商品", { type: "warning" });
    return;
  }
  const errors: string[] = [];
  for (const row of selectedRows.value) {
    try {
      await Promise.all([
        row.priceLimitUid
          ? deletePriceLimitApi(row.priceLimitUid)
          : Promise.resolve(),
        updateTireApi(row.tireId, {
          salePrice: undefined,
          purchasePrice: undefined
        })
      ]);
    } catch {
      errors.push(row.tireName ?? row.tireId);
    }
  }
  if (errors.length > 0) {
    message(`${errors.length}个商品清空失败: ${errors.join(", ")}`, {
      type: "warning"
    });
  } else {
    message(`已清空${selectedRows.value.length}个商品的价格设置`, {
      type: "success"
    });
  }
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
        <el-select
          v-model="form.group"
          placeholder="请选择或输入分组"
          filterable
          clearable
          allow-create
          default-first-option
          class="w-[180px]"
        >
          <el-option
            v-for="item in groupOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
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
          <el-button
            :icon="useRenderIcon(ImportIcon)"
            @click="showImportDialog = true"
          >
            导入价格
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

    <ImportDialog
      v-model:visible="showImportDialog"
      type="price-info"
      title="批量导入商品价格资料"
      @success="fetchData"
    />
  </div>
</template>
