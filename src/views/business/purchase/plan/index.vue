<script setup lang="ts">
import { h, onMounted, ref } from "vue";
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { columns } from "./columns";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { addDialog } from "@/components/ReDialog";
import { ALL_LIST, handleApiError, localForage, message } from "@/utils";
import {
  createPurchasePlanApi,
  deletePurchasePlanApi,
  getPurchasePlanListApi,
  type PurchasePlanRecord
} from "@/api";
import { openPurchasePlanConvertDialog } from "./usePurchasePlanConvertDialog";

defineOptions({
  name: "PurchasePlan"
});

interface SelectOption {
  id?: number | string;
  uid: string;
  name: string;
}

interface CreatePlanDialogProps {
  tireId: string;
  repoId: string;
  count: number;
  period: number;
  basedOn: string;
}

const dataList = ref<PurchasePlanRecord[]>([]);
const loading = ref(false);
const tireList = ref<SelectOption[]>([]);
const repoList = ref<SelectOption[]>([]);
const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});
const form = ref<{
  status?: PurchasePlanRecord["status"];
}>({
  status: undefined
});

async function loadBaseOptions() {
  const [tires, repos] = await Promise.all([
    localForage().getItem<SelectOption[]>(ALL_LIST.tire),
    localForage().getItem<SelectOption[]>(ALL_LIST.repo)
  ]);
  tireList.value = tires ?? [];
  repoList.value = repos ?? [];
}

async function getData() {
  try {
    loading.value = true;
    const { data, code, msg } = await getPurchasePlanListApi({
      page: pagination.value.currentPage,
      limit: pagination.value.pageSize,
      status: form.value.status
    });
    if (code !== 200) {
      message(msg, { type: "error" });
      return;
    }
    dataList.value = data.list;
    pagination.value.total = data.count;
  } catch (error) {
    handleApiError(error, "获取采购计划失败");
  } finally {
    loading.value = false;
  }
}

async function handleCurrentChange(page: number) {
  pagination.value.currentPage = page;
  await getData();
}

async function handleDelete(row: PurchasePlanRecord) {
  try {
    await deletePurchasePlanApi(row.id);
    message("删除成功", { type: "success" });
    await getData();
  } catch (error) {
    handleApiError(error, "删除采购计划失败");
  }
}

async function handleConvert(row: PurchasePlanRecord) {
  await openPurchasePlanConvertDialog(
    {
      id: row.id,
      repo: row.repo,
      tire: row.tire,
      count: row.count
    },
    getData
  );
}

function openCreateDialog() {
  addDialog({
    title: "新增采购计划",
    width: "560px",
    draggable: true,
    closeOnClickModal: false,
    props: {
      tireId: "",
      repoId: "",
      count: 1,
      period: 30,
      basedOn: ""
    } satisfies CreatePlanDialogProps,
    contentRenderer: ({ options }) => {
      const props = options.props as CreatePlanDialogProps;
      return h("el-form", { labelWidth: "88px" }, [
        h("el-form-item", { label: "商品" }, [
          h(
            "el-select",
            {
              modelValue: props.tireId,
              "onUpdate:modelValue": (value: string) => {
                props.tireId = value;
              },
              filterable: true,
              placeholder: "请选择商品",
              class: "w-full"
            },
            () =>
              tireList.value.map(item =>
                h("el-option", {
                  key: item.uid,
                  label: item.name,
                  value: item.uid
                })
              )
          )
        ]),
        h("el-form-item", { label: "仓库" }, [
          h(
            "el-select",
            {
              modelValue: props.repoId,
              "onUpdate:modelValue": (value: string) => {
                props.repoId = value;
              },
              filterable: true,
              placeholder: "请选择仓库",
              class: "w-full"
            },
            () =>
              repoList.value.map(item =>
                h("el-option", {
                  key: item.uid,
                  label: item.name,
                  value: item.uid
                })
              )
          )
        ]),
        h("el-form-item", { label: "数量" }, [
          h("el-input-number", {
            modelValue: props.count,
            "onUpdate:modelValue": (value: number) => {
              props.count = value;
            },
            min: 1,
            step: 1,
            stepStrictly: true,
            class: "w-full"
          })
        ]),
        h("el-form-item", { label: "周期(天)" }, [
          h("el-input-number", {
            modelValue: props.period,
            "onUpdate:modelValue": (value: number) => {
              props.period = value;
            },
            min: 1,
            step: 1,
            stepStrictly: true,
            class: "w-full"
          })
        ]),
        h("el-form-item", { label: "依据" }, [
          h("el-input", {
            modelValue: props.basedOn,
            "onUpdate:modelValue": (value: string) => {
              props.basedOn = value;
            },
            type: "textarea",
            placeholder: "例如：门店补货、近 30 天销量预测"
          })
        ])
      ]);
    },
    beforeSure: async (done, { options }) => {
      const props = options.props as CreatePlanDialogProps;
      if (!props.tireId) {
        message("请选择商品", { type: "warning" });
        return;
      }
      if (!props.repoId) {
        message("请选择仓库", { type: "warning" });
        return;
      }
      if (!Number.isInteger(props.count) || props.count < 1) {
        message("数量必须是大于 0 的整数", { type: "warning" });
        return;
      }
      if (!Number.isInteger(props.period) || props.period < 1) {
        message("周期必须是大于 0 的整数", { type: "warning" });
        return;
      }

      try {
        await createPurchasePlanApi({
          tireId: props.tireId,
          repoId: props.repoId,
          count: props.count,
          period: props.period,
          basedOn: props.basedOn.trim() || undefined
        });
        message("采购计划创建成功", { type: "success" });
        done();
        await getData();
      } catch (error) {
        handleApiError(error, "创建采购计划失败");
      }
    }
  });
}

onMounted(async () => {
  await loadBaseOptions();
  await getData();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-form
        :inline="true"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-3 overflow-auto"
      >
        <el-form-item label="状态">
          <el-select
            v-model="form.status"
            placeholder="全部"
            clearable
            class="w-[160px]"
          >
            <el-option label="待处理" value="pending" />
            <el-option label="已下单" value="ordered" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:search-line')"
            :loading="loading"
            @click="getData"
          >
            搜索
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="m-1">
      <PureTableBar title="采购计划管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openCreateDialog"
          >
            新增计划
          </el-button>
        </template>
        <template #default="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :size="size"
            :columns="columns"
            border
            :data="dataList"
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                v-if="row.status !== 'ordered'"
                class="reset-margin"
                link
                type="primary"
                @click="handleConvert(row)"
              >
                生成订单
              </el-button>
              <DeleteButton @confirm="handleDelete(row)" />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
