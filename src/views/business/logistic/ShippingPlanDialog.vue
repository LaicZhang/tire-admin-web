<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { getOrderListApi } from "@/api";

defineOptions({
  name: "ShippingPlanDialog"
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

const formData = ref({
  name: "",
  plannedDate: "",
  orders: [] as string[],
  remark: ""
});

const formRules = {
  name: [{ required: true, message: "请输入计划名称", trigger: "blur" }],
  plannedDate: [
    { required: true, message: "请选择计划日期", trigger: "change" }
  ],
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
    name: "",
    plannedDate: "",
    orders: [],
    remark: ""
  };
  formRef.value?.clearValidate();
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

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;

    loading.value = true;
    try {
      emit("submit", {
        name: formData.value.name,
        plannedDate: formData.value.plannedDate,
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

onMounted(() => {
  if (props.visible) {
    loadOrders();
  }
});
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建发运计划"
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
      <el-form-item label="计划名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入计划名称"
          clearable
        />
      </el-form-item>

      <el-form-item label="计划日期" prop="plannedDate">
        <el-date-picker
          v-model="formData.plannedDate"
          type="date"
          placeholder="请选择计划日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
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

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入备注"
          :rows="3"
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
