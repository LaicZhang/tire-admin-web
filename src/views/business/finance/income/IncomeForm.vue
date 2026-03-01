<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { handleApiError } from "@/utils/error";
import { message } from "@/utils";
import { http } from "@/utils/http";
import { createLogger } from "@/utils/logger";
import type { CommonResult } from "@/api/type";
import { useSysDictOptions } from "@/composables/useSysDict";

const logger = createLogger("IncomeForm");

const props = defineProps<{
  onSuccess: () => void;
  onClose: () => void;
}>();

const loading = ref(false);
const form = reactive({
  type: "",
  category: "",
  amount: 0,
  paymentId: "",
  remark: ""
});

// 收入类型选项
const incomeTypes = [
  { label: "利息收入", value: "利息收入" },
  { label: "租金收入", value: "租金收入" },
  { label: "废品变卖", value: "废品变卖" },
  { label: "政府补贴", value: "政府补贴" },
  { label: "其他收入", value: "其他收入" }
];

// 结算账户
const paymentList = ref<{ uid: string; name: string }[]>([]);
const { options: fundCategoryOptions } = useSysDictOptions("fundCategory");

// 获取结算账户列表
const fetchPaymentList = async () => {
  try {
    const { data } = await http.get<
      never,
      CommonResult<{ list: { uid: string; name: string }[] }>
    >("/payment/1");
    paymentList.value = data.list;
  } catch (error) {
    logger.error("获取结算账户失败", error);
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!form.type) {
    message("请选择收入类型", { type: "warning" });
    return;
  }
  if (!form.amount || form.amount <= 0) {
    message("请输入有效金额", { type: "warning" });
    return;
  }
  if (!form.paymentId) {
    message("请选择收款账户", { type: "warning" });
    return;
  }

  loading.value = true;
  try {
    await http.post("/finance-extension/other-transaction", {
      data: {
        type: form.type,
        category: form.category || form.type,
        amount: Math.round(form.amount * 100),
        direction: "IN",
        remark: form.remark,
        payment: { connect: { uid: form.paymentId } }
      }
    });
    message("创建成功", { type: "success" });
    props.onSuccess();
  } catch (error) {
    handleApiError(error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchPaymentList();
});
</script>

<template>
  <div>
    <el-form :model="form" label-width="100px">
      <el-form-item label="收入类型" required>
        <el-select
          v-model="form.type"
          placeholder="请选择收入类型"
          style="width: 100%"
        >
          <el-option
            v-for="item in incomeTypes"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="收款账户" required>
        <el-select
          v-model="form.paymentId"
          placeholder="请选择收款账户"
          style="width: 100%"
        >
          <el-option
            v-for="item in paymentList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="金额" required>
        <el-input-number
          v-model="form.amount"
          :min="0"
          :precision="2"
          :step="100"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="分类">
        <el-select
          v-model="form.category"
          placeholder="请选择或输入分类"
          filterable
          clearable
          allow-create
          default-first-option
          class="w-full"
        >
          <el-option
            v-for="item in fundCategoryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="备注信息"
        />
      </el-form-item>
    </el-form>
    <div class="flex justify-end gap-2 mt-4">
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确认
      </el-button>
    </div>
  </div>
</template>
