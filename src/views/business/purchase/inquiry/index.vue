<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "../../../../utils/constants";
import { ref, onMounted, h } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import { PureTableBar } from "@/components/RePureTableBar";
import DeleteButton from "@/components/DeleteButton/index.vue";
import {
  getPurchaseInquiryListApi,
  createPurchaseInquiryApi,
  deletePurchaseInquiryApi,
  updatePurchaseInquiryApi
} from "@/api/business/purchase";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import type { PurchaseInquiry } from "@/api/business/purchase";

defineOptions({
  name: "PurchaseInquiry"
});

const dataList = ref<PurchaseInquiry[]>([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

const getData = async () => {
  loading.value = true;
  const { data, code, msg } = await getPurchaseInquiryListApi(
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

const handleDelete = async (row: PurchaseInquiry) => {
  await deletePurchaseInquiryApi(String(row.id));
  message("删除成功", { type: "success" });
  getData();
};

type DialogProps = { providerName: string; desc: string };

function openDialog(title = "新增", row?: PurchaseInquiry) {
  addDialog({
    title: `${title}询价单`,
    props: {
      providerName: row?.providerName ?? "",
      desc: row?.desc ?? ""
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const dialogProps = options.props as DialogProps;
      return h("div", [
        h("el-form", {}, [
          h("el-form-item", { label: "供应商" }, [
            h("el-input", {
              modelValue: dialogProps.providerName,
              "onUpdate:modelValue": (val: string) =>
                (dialogProps.providerName = val),
              placeholder: "请输入供应商名称"
            })
          ]),
          h("el-form-item", { label: "备注" }, [
            h("el-input", {
              modelValue: dialogProps.desc,
              "onUpdate:modelValue": (val: string) => (dialogProps.desc = val),
              placeholder: "暂支持备注录入",
              type: "textarea"
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const dialogProps = options.props as DialogProps;
      const data = {
        providerName: dialogProps.providerName,
        desc: dialogProps.desc,
        status: "PENDING"
      };
      const promise =
        title === "新增"
          ? createPurchaseInquiryApi(data)
          : updatePurchaseInquiryApi(String(row?.id ?? ""), data);

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
      <PureTableBar title="采购询价管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增询价
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
