<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { accountTransferApi } from "@/api/finance";
import { getPaymentListApi } from "@/api/payment";
import { message } from "@/utils/message";

defineOptions({
  name: "FinanceTransfer"
});

const loading = ref(false);
const formRef = ref();
const accountList = ref<Array<{ uid: string; name: string; balance?: number }>>(
  []
);

const form = reactive({
  fromPaymentUid: "",
  toPaymentUid: "",
  amount: 0,
  fee: 0,
  feePaymentUid: "",
  desc: ""
});

const rules = {
  fromPaymentUid: [
    { required: true, message: "请选择转出账户", trigger: "change" }
  ],
  toPaymentUid: [
    { required: true, message: "请选择转入账户", trigger: "change" }
  ],
  amount: [{ required: true, message: "请输入金额", trigger: "blur" }]
};

// 转出账户选择项（排除转入账户）
const fromAccountOptions = computed(() => {
  return accountList.value.filter(acc => acc.uid !== form.toPaymentUid);
});

// 转入账户选择项（排除转出账户）
const toAccountOptions = computed(() => {
  return accountList.value.filter(acc => acc.uid !== form.fromPaymentUid);
});

// 选中的转出账户信息
const selectedFromAccount = computed(() => {
  return accountList.value.find(acc => acc.uid === form.fromPaymentUid);
});

async function loadAccounts() {
  try {
    const res = await getPaymentListApi();
    accountList.value =
      (res.data as Array<{ uid: string; name: string; balance?: number }>) ||
      [];
  } catch (e: unknown) {
    const error = e as Error;
    message(error.message, { type: "error" });
  }
}

async function onSubmit(formEl: {
  validate: (callback: (valid: boolean) => void) => Promise<void>;
  resetFields: () => void;
}) {
  if (!formEl) return;
  await formEl.validate(async valid => {
    if (valid) {
      // 验证转出账户余额
      if (
        selectedFromAccount.value?.balance &&
        form.amount + form.fee > selectedFromAccount.value.balance / 100
      ) {
        message("转出账户余额不足", { type: "warning" });
        return;
      }

      loading.value = true;
      try {
        await accountTransferApi({
          fromPaymentUid: form.fromPaymentUid,
          toPaymentUid: form.toPaymentUid,
          amount: Math.round(form.amount * 100),
          fee: form.fee > 0 ? Math.round(form.fee * 100) : undefined,
          feePaymentUid: form.feePaymentUid || undefined,
          desc: form.desc || undefined
        });
        message("转账成功", { type: "success" });
        formEl.resetFields();
        loadAccounts(); // 刷新账户余额
      } catch (e: unknown) {
        const error = e as Error;
        message(error.message, { type: "error" });
      } finally {
        loading.value = false;
      }
    }
  });
}

onMounted(() => {
  loadAccounts();
});
</script>

<template>
  <el-card shadow="never" class="border-none!">
    <template #header>
      <div class="card-header">
        <span>账户转账</span>
      </div>
    </template>
    <div class="w-full max-w-2xl mx-auto py-8">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="demo-ruleForm"
      >
        <el-form-item label="转出账户" prop="fromPaymentUid">
          <el-select
            v-model="form.fromPaymentUid"
            placeholder="请选择转出账户"
            class="w-full"
            filterable
          >
            <el-option
              v-for="item in fromAccountOptions"
              :key="item.uid"
              :label="`${item.name}${item.balance !== undefined ? ` (余额: ¥${(item.balance / 100).toFixed(2)})` : ''}`"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="转入账户" prop="toPaymentUid">
          <el-select
            v-model="form.toPaymentUid"
            placeholder="请选择转入账户"
            class="w-full"
            filterable
          >
            <el-option
              v-for="item in toAccountOptions"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="转账金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0"
            :precision="2"
            class="w-full"
            controls-position="right"
          />
        </el-form-item>

        <el-divider content-position="left">手续费设置（可选）</el-divider>

        <el-form-item label="手续费">
          <el-input-number
            v-model="form.fee"
            :min="0"
            :precision="2"
            class="w-full"
            controls-position="right"
            placeholder="如有手续费请填写"
          />
        </el-form-item>
        <el-form-item v-if="form.fee > 0" label="手续费承担方">
          <el-select
            v-model="form.feePaymentUid"
            placeholder="选择手续费承担账户(默认转出账户承担)"
            class="w-full"
            clearable
          >
            <el-option
              v-for="item in accountList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>

        <el-divider />

        <el-form-item label="备注" prop="desc">
          <el-input v-model="form.desc" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="onSubmit(formRef)"
          >
            确认转账
          </el-button>
          <el-button @click="formRef.resetFields()">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-card>
</template>
