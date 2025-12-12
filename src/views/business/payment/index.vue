<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import {
  getPaymentListApi,
  getPaymentApi,
  createPaymentApi,
  updatePaymentApi,
  checkPaymentBalanceApi,
  deletePaymentApi
} from "@/api";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { getCompanyId } from "@/api/company";

defineOptions({
  name: "Payment"
});

const dataList = ref([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  companyUid: undefined
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const columns = ref([
  {
    label: "账户UID",
    prop: "uid"
  },
  {
    label: "公司UID",
    prop: "companyUid"
  },
  {
    label: "余额",
    prop: "balance",
    formatter: (row, column, cellValue) => {
      return typeof cellValue === "string" || typeof cellValue === "number"
        ? Number(cellValue).toFixed(2)
        : "0.00";
    }
  },
  {
    label: "创建时间",
    prop: "createAt",
    formatter: (row, column, cellValue) => {
      return cellValue ? new Date(cellValue).toLocaleString() : "-";
    }
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 200
  }
]);

const getPaymentListInfo = async () => {
  loading.value = true;
  try {
    const companyUid = await getCompanyId();
    const { data, code, msg } = await getPaymentListApi(companyUid);
    if (code === 200) {
      dataList.value = Array.isArray(data) ? data : data.list || [];
      pagination.value.total = data.count || dataList.value.length;
    } else {
      message(msg, { type: "error" });
    }
  } catch (error) {
    message(error.message || "获取支付账户列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const onSearch = async () => {
  await getPaymentListInfo();
};

const resetForm = formEl => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getPaymentListInfo();
}

import { addDialog } from "@/components/ReDialog";
import { h } from "vue";
import editForm from "./form.vue";
import { deviceDetection } from "@pureadmin/utils";

// ... previous imports ...

async function handleCreate() {
  addDialog({
    title: "新增",
    props: {
      formInline: {
        title: "新增",
        name: "",
        type: "Alipay",
        account: "",
        realName: ""
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(editForm, { ref: formRef }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value.getRef();
      const curData = options.props.formInline;
      FormRef.validate(async valid => {
        if (valid) {
          try {
            const companyUid = await getCompanyId();
            await createPaymentApi({
              companyUid,
              name: curData.name,
              type: curData.type,
              account: curData.account,
              realName: curData.realName
            });
            message("创建成功", { type: "success" });
            done();
            onSearch();
          } catch (error) {
            message(error.message || "创建失败", { type: "error" });
          }
        }
      });
    }
  });
}

async function handleRecharge(row) {
  addDialog({
    title: "充值",
    props: {
      formInline: {
        title: "充值",
        uid: row.uid,
        balance: row.balance,
        amount: 0,
        remark: ""
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(editForm, { ref: formRef }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value.getRef();
      const curData = options.props.formInline;
      FormRef.validate(async valid => {
        if (valid) {
          try {
            await updatePaymentApi(curData.uid, {
              type: "top-up",
              payment: {
                amount: curData.amount,
                remark: curData.remark
              }
            });
            message("充值成功", { type: "success" });
            done();
            onSearch();
          } catch (error) {
            message(error.message || "充值失败", { type: "error" });
          }
        }
      });
    }
  });
}

async function handleCheckBalance(row) {
  try {
    const { data, code, msg } = await checkPaymentBalanceApi(row.uid, 0);
    if (code === 200) {
      message(`当前余额: ${data.balance || 0}`, { type: "success" });
    } else {
      message(msg, { type: "error" });
    }
  } catch (error) {
    message(error.message || "查询余额失败", { type: "error" });
  }
}

async function handleDelete(row) {
  try {
    await deletePaymentApi(row.uid);
    message("删除成功", { type: "success" });
    await onSearch();
  } catch (error) {
    message(error.message || "删除失败", { type: "error" });
  }
}

onMounted(async () => {
  await getPaymentListInfo();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-form
        ref="formRef"
        :inline="true"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-3 overflow-auto"
      >
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:search-line')"
            :loading="loading"
            @click="onSearch"
          >
            搜索
          </el-button>
          <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="getPaymentListInfo">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="handleCreate"
          >
            创建支付账户
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
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="handleRecharge(row)"
              >
                充值
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="handleCheckBalance(row)"
              >
                查询余额
              </el-button>

              <el-popconfirm
                :title="`是否确认删除该支付账户`"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button class="reset-margin" link type="danger">
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
