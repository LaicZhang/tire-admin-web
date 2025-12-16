<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getSalesQuotationListApi,
  createSalesQuotationApi,
  deleteSalesQuotationApi,
  updateSalesQuotationApi
} from "@/api/business/sales";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";

defineOptions({
  name: "SalesQuotation"
});

const dataList = ref([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const columns = [
  {
    label: "报价单号",
    prop: "quotationNo"
  },
  {
    label: "客户",
    prop: "customerName"
  },
  {
    label: "总金额",
    prop: "totalAmount"
  },
  {
    label: "状态",
    prop: "status",
    cellRenderer: ({ row }) => {
      const map = { DRAFT: "草稿", SENT: "已发送", CONFIRMED: "已确认" };
      return map[row.status] || row.status;
    }
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];

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

const handleCurrentChange = val => {
  pagination.value.currentPage = val;
  getData();
};

const handleDelete = async row => {
  await deleteSalesQuotationApi(row.id);
  message("删除成功", { type: "success" });
  getData();
};

function openDialog(title = "新增", row?: any) {
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
              "onUpdate:modelValue": val => (options.props.customerName = val),
              placeholder: "请输入客户名称"
            })
          ]),
          h("el-form-item", { label: "备注" }, [
            h("el-input", {
              modelValue: options.props.desc,
              "onUpdate:modelValue": val => (options.props.desc = val),
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
              <el-popconfirm title="确认删除?" @confirm="handleDelete(row)">
                <template #reference>
                  <el-button
                    class="reset-margin"
                    link
                    type="danger"
                    :icon="useRenderIcon(Delete)"
                  >
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
