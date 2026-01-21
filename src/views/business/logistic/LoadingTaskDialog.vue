<script setup lang="ts">
import { ref, watch } from "vue";
import { getOrderListApi } from "@/api";
import { BATCH_FETCH_PAGE_SIZE } from "@/utils/constants";

defineOptions({
  name: "LoadingTaskDialog"
});

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "submit", data: unknown): void;
}>();

const dialogVisible = ref(props.visible);
const formRef = ref();
const loading = ref(false);
const orderOptions = ref<{ uid: string; label: string }[]>([]);

const formData = ref({
  vehicleNo: "",
  driverName: "",
  driverPhone: "",
  orders: [] as string[]
});

const formRules = {
  vehicleNo: [{ required: true, message: "请输入车牌号", trigger: "blur" }],
  orders: [{ required: true, message: "请选择关联订单", trigger: "change" }]
};

watch(
  () => props.visible,
  val => {
    dialogVisible.value = val;
    if (val) {
      resetForm();
      loadOrders();
    }
  }
);

watch(dialogVisible, val => {
  emit("update:visible", val);
});

function resetForm() {
  formData.value = {
    vehicleNo: "",
    driverName: "",
    driverPhone: "",
    orders: []
  };
  formRef.value?.clearValidate();
}

async function loadOrders() {
  try {
    const { data, code } = await getOrderListApi("sale-order", 1, {
      pageSize: BATCH_FETCH_PAGE_SIZE
    });
    if (code === 200) {
      orderOptions.value = (data?.list || []).map((order: unknown) => ({
        uid: order.uid,
        label: `${order.uid.slice(-8)} - ${order.type || "订单"}`
      }));
    }
  } catch {
    orderOptions.value = [];
  }
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;

    loading.value = true;
    try {
      emit("submit", {
        vehicleNo: formData.value.vehicleNo,
        driverName: formData.value.driverName || undefined,
        driverPhone: formData.value.driverPhone || undefined,
        orders: formData.value.orders
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
    title="新建装车任务"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="车牌号" prop="vehicleNo">
        <el-input
          v-model="formData.vehicleNo"
          placeholder="请输入车牌号"
          clearable
        />
      </el-form-item>

      <el-form-item label="司机姓名" prop="driverName">
        <el-input
          v-model="formData.driverName"
          placeholder="请输入司机姓名"
          clearable
        />
      </el-form-item>

      <el-form-item label="司机电话" prop="driverPhone">
        <el-input
          v-model="formData.driverPhone"
          placeholder="请输入司机电话"
          clearable
        />
      </el-form-item>

      <el-form-item label="关联订单" prop="orders">
        <el-select
          v-model="formData.orders"
          multiple
          filterable
          placeholder="请选择关联订单"
          style="width: 100%"
        >
          <el-option
            v-for="item in orderOptions"
            :key="item.uid"
            :label="item.label"
            :value="item.uid"
          />
        </el-select>
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
