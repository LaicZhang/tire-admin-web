<script setup lang="ts">
import { ref, h, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import editForm from "./form.vue";
import type { CustomerProductCode, CustomerProductCodeForm } from "./types";
import type { FormInstance } from "element-plus";
import {
  deleteCustomerProductCodeApi,
  getCustomerProductCodeListApi,
  upsertCustomerProductCodeApi
} from "@/api/data/customer-product-code";
import { getCustomerApi } from "@/api/business/customer";
import { getTireApi } from "@/api/business/tire";

defineOptions({
  name: "CustomerProductCode"
});

const dataList = ref<CustomerProductCode[]>([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  customerId: undefined,
  tireId: undefined,
  keyword: undefined
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const columns = [
  { label: "ID", prop: "id", width: 80 },
  { label: "客户名称", prop: "customerName" },
  { label: "商品名称", prop: "tireName" },
  { label: "客户商品编码", prop: "customerCode" },
  { label: "客户商品名称", prop: "customerProductName" },
  { label: "备注", prop: "remark" },
  { label: "创建时间", prop: "createdAt", width: 160 },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    fixed: "right",
    minWidth: 140
  }
];

const getList = async () => {
  loading.value = true;
  try {
    const { code, data, msg } = await getCustomerProductCodeListApi(
      pagination.value.currentPage,
      {
        customerId: form.value.customerId || undefined,
        tireId: form.value.tireId || undefined,
        keyword: form.value.keyword || undefined,
        pageSize: pagination.value.pageSize
      }
    );
    if (code !== 200) {
      message(msg || "获取列表失败", { type: "error" });
      return;
    }

    const list = (data.list || []) as CustomerProductCode[];
    const customerIds = Array.from(new Set(list.map(i => i.customerId)));
    const tireIds = Array.from(new Set(list.map(i => i.tireId)));

    const [customers, tires] = await Promise.all([
      Promise.all(
        customerIds.map(async uid => {
          try {
            const res = await getCustomerApi(uid);
            return res.code === 200 ? (res.data as unknown) : null;
          } catch {
            return null;
          }
        })
      ),
      Promise.all(
        tireIds.map(async uid => {
          try {
            const res = await getTireApi(uid);
            return res.code === 200 ? (res.data as unknown) : null;
          } catch {
            return null;
          }
        })
      )
    ]);

    const customerMap = new Map<string, string>();
    for (const c of customers) {
      if (c?.uid && c?.name) customerMap.set(c.uid, c.name);
    }
    const tireMap = new Map<string, string>();
    for (const t of tires) {
      if (t?.uid && t?.name) tireMap.set(t.uid, t.name);
    }

    dataList.value = list.map(row => ({
      ...row,
      customerName: customerMap.get(row.customerId) ?? row.customerName,
      tireName: tireMap.get(row.tireId) ?? row.tireName
    }));
    pagination.value.total = data.count || 0;
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  pagination.value.currentPage = 1;
  getList();
};

const resetForm = (formEl: unknown) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
  getList();
};

const dialogFormRef = ref<{ getRef: () => FormInstance } | null>(null);

const openDialog = (title = "新增", row?: CustomerProductCode) => {
  addDialog({
    title: `${title}客户商品编码`,
    props: {
      formInline: {
        id: row?.id,
        uid: row?.uid,
        customerId: row?.customerId ?? "",
        tireId: row?.tireId ?? "",
        customerCode: row?.customerCode ?? "",
        customerProductName: row?.customerProductName ?? "",
        remark: row?.remark ?? ""
      }
    },
    width: "500px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, {
        ref: dialogFormRef,
        formInline: (options.props as { formInline: CustomerProductCodeForm })
          .formInline
      }),
    beforeSure: (done, { options }) => {
      const FormRef = dialogFormRef.value?.getRef();
      if (!FormRef) return;
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          const cur = (options.props as { formInline: CustomerProductCodeForm })
            .formInline;
          const { code, msg } = await upsertCustomerProductCodeApi({
            uid: cur.uid,
            customerId: cur.customerId,
            tireId: cur.tireId,
            customerCode: cur.customerCode,
            customerProductName: cur.customerProductName,
            remark: cur.remark
          });
          if (code === 200) {
            message(`${title}成功`, { type: "success" });
            done();
            getList();
          } else {
            message(msg || `${title}失败`, { type: "error" });
          }
        }
      });
    }
  });
};

const handleDelete = async (row: CustomerProductCode) => {
  const { code, msg } = await deleteCustomerProductCodeApi(row.uid);
  if (code === 200) {
    message(`删除${row.customerCode}成功`, { type: "success" });
    getList();
  } else {
    message(msg || "删除失败", { type: "error" });
  }
};

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-form
        ref="formRef"
        :inline="true"
        :model="form"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-3 overflow-auto"
      >
        <el-form-item label="客户：" prop="customerId">
          <el-input
            v-model="form.customerId"
            placeholder="请输入客户名称"
            clearable
            class="w-[180px]!"
          />
        </el-form-item>
        <el-form-item label="商品：" prop="tireId">
          <el-input
            v-model="form.tireId"
            placeholder="请输入商品名称"
            clearable
            class="w-[180px]!"
          />
        </el-form-item>
        <el-form-item label="编码：" prop="keyword">
          <el-input
            v-model="form.keyword"
            placeholder="请输入客户编码"
            clearable
            class="w-[180px]!"
          />
        </el-form-item>
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
      <PureTableBar title="客户商品编码" @refresh="getList">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增
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
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('编辑', row)"
              >
                编辑
              </el-button>
              <el-popconfirm
                :title="`确认删除${row.customerCode}?`"
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
