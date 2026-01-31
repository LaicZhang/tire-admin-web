<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import { PureTableBar } from "@/components/RePureTableBar";
import DeleteButton from "@/components/DeleteButton/index.vue";
import {
  getPurchasePlanListApi,
  createPurchasePlanApi,
  deletePurchasePlanApi,
  updatePurchasePlanApi
} from "@/api/business/purchase";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import type { PurchasePlan } from "@/api/business/purchase";

defineOptions({
  name: "PurchasePlan"
});

const dataList = ref<PurchasePlan[]>([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = ref({
  status: undefined
});

const getData = async () => {
  loading.value = true;
  const { data, code, msg } = await getPurchasePlanListApi(
    pagination.value.currentPage,
    form.value
  );
  if (code === 200) {
    dataList.value = data.list;
    pagination.value.total = data.count;
  } else {
    message(msg, { type: "error" });
  }
  loading.value = false;
};

const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
  getData();
};

const handleDelete = async (row: PurchasePlan) => {
  await deletePurchasePlanApi(String(row.id));
  message("删除成功", { type: "success" });
  getData();
};

// Dialog options interface
interface DialogProps {
  desc: string;
}

function openDialog(title = "新增", row?: PurchasePlan) {
  // Simplified dialog for adding purchase plan: just entering details in desc for now
  // In real app, this should be a complex form with product selection table
  addDialog({
    title: `${title}采购计划`,
    props: {
      desc: row?.desc ?? ""
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const props = options.props as DialogProps;
      return h("div", [
        h("el-form", {}, [
          h("el-form-item", { label: "备注" }, [
            h("el-input", {
              modelValue: props.desc,
              "onUpdate:modelValue": (val: string) => (props.desc = val),
              placeholder: "暂支持备注录入，详细商品选择开发中...",
              type: "textarea"
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const props = options.props as DialogProps;
      const data = {
        desc: props.desc,
        status: "DRAFT",
        items: [] // Mock items
      };
      const promise =
        title === "新增"
          ? createPurchasePlanApi(data)
          : updatePurchasePlanApi(String(row!.id), data);

      promise.then(() => {
        message("操作成功", { type: "success" });
        done();
        getData();
      });
    }
  });
}

onMounted(() => {
  getData();
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
            class="w-[150px]"
          >
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已提交" value="SUBMITTED" />
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
            @click="openDialog()"
          >
            新增计划
          </el-button>
        </template>
        <template v-slot="{ size }">
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
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>
              <DeleteButton @confirm="handleDelete(row)" />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
