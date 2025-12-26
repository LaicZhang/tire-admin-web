<script setup lang="ts">
import { ref, watch } from "vue";
import { getOrderListApi, getRepoListApi } from "@/api";

defineOptions({
  name: "ShippingWaveDialog"
});

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "submit", data: any): void;
}>();

const dialogVisible = ref(props.visible);
const formRef = ref();
const loading = ref(false);
const orderOptions = ref<{ uid: string; label: string }[]>([]);
const warehouseOptions = ref<{ uid: string; name: string }[]>([]);

const formData = ref({
  name: "",
  shippingDate: "",
  warehouseUid: "",
  orderUids: [] as string[]
});

const formRules = {
  name: [{ required: true, message: "请输入波次名称", trigger: "blur" }],
  shippingDate: [
    { required: true, message: "请选择发货日期", trigger: "change" }
  ],
  warehouseUid: [{ required: true, message: "请选择仓库", trigger: "change" }],
  orderUids: [{ required: true, message: "请选择订单", trigger: "change" }]
};

watch(
  () => props.visible,
  val => {
    dialogVisible.value = val;
    if (val) {
      resetForm();
      loadData();
    }
  }
);

watch(dialogVisible, val => {
  emit("update:visible", val);
});

function resetForm() {
  formData.value = {
    name: "",
    shippingDate: "",
    warehouseUid: "",
    orderUids: []
  };
  formRef.value?.clearValidate();
}

async function loadData() {
  await Promise.all([loadOrders(), loadWarehouses()]);
}

async function loadOrders() {
  try {
    const { data, code } = await getOrderListApi("sale-order", 1, {
      pageSize: 100
    });
    if (code === 200) {
      orderOptions.value = (data?.list || []).map((order: any) => ({
        uid: order.uid,
        label: `${order.uid.slice(-8)} - ${order.type || "订单"}`
      }));
    }
  } catch {
    orderOptions.value = [];
  }
}

async function loadWarehouses() {
  try {
    const { data, code } = await getRepoListApi(1);
    if (code === 200) {
      warehouseOptions.value = data?.list || [];
    }
  } catch {
    warehouseOptions.value = [];
  }
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;

    loading.value = true;
    try {
      emit("submit", {
        name: formData.value.name,
        shippingDate: formData.value.shippingDate,
        warehouseUid: formData.value.warehouseUid,
        orderUids: formData.value.orderUids
      });
    } finally {
      loading.value = false;
    }
  });
}

function handleClose() {
  dialogVisible.value = false;
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建发货波次"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="波次名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入波次名称"
          clearable
        />
      </el-form-item>

      <el-form-item label="发货日期" prop="shippingDate">
        <el-date-picker
          v-model="formData.shippingDate"
          type="date"
          placeholder="请选择发货日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="仓库" prop="warehouseUid">
        <el-select
          v-model="formData.warehouseUid"
          filterable
          placeholder="请选择仓库"
          style="width: 100%"
        >
          <el-option
            v-for="item in warehouseOptions"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="选择订单" prop="orderUids">
        <el-transfer
          v-model="formData.orderUids"
          :data="orderOptions.map(o => ({ key: o.uid, label: o.label }))"
          :titles="['可选订单', '已选订单']"
          filterable
          filter-placeholder="搜索订单"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
:deep(.el-transfer) {
  display: flex;
  justify-content: center;
}
</style>
