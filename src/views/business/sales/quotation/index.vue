<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import { PureTableBar } from "@/components/RePureTableBar";
import DeleteButton from "@/components/DeleteButton/index.vue";
import {
  getSalesQuotationListApi,
  createSalesQuotationApi,
  deleteSalesQuotationApi,
  updateSalesQuotationApi
} from "@/api/business/sales";
import { message } from "@/utils";
import { fenToYuan } from "@/utils/formatMoney";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import type { SalesQuotation } from "@/api/business/sales";

defineOptions({
  name: "SalesQuotation"
});

const dataList = ref<SalesQuotation[]>([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const getData = async () => {
  loading.value = true;
  const { data, code, msg } = await getSalesQuotationListApi(
    pagination.value.currentPage
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

const handleDelete = async (row: unknown) => {
  await deleteSalesQuotationApi(row.id);
  message("删除成功", { type: "success" });
  getData();
};

function openDialog(title = "新增", row?: unknown) {
  addDialog({
    title: `${title}报价单`,
    props: {
      customerName: row?.customerName ?? "",
      desc: row?.desc ?? ""
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      return h("div", [
        h("el-form", {}, [
          h("el-form-item", { label: "客户" }, [
            h("el-input", {
              modelValue: options.props.customerName,
              "onUpdate:modelValue": (val: string) =>
                (options.props.customerName = val),
              placeholder: "请输入客户名称"
            })
          ]),
          h("el-form-item", { label: "备注" }, [
            h("el-input", {
              modelValue: options.props.desc,
              "onUpdate:modelValue": (val: string) =>
                (options.props.desc = val),
              placeholder: "暂支持备注录入",
              type: "textarea"
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const data = {
        customerName: options.props.customerName,
        desc: options.props.desc,
        status: "DRAFT"
      };
      const promise =
        title === "新增"
          ? createSalesQuotationApi(data)
          : updateSalesQuotationApi(row.id, data);

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
      <PureTableBar title="销售报价单管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增报价
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
