<script setup lang="ts">
import { ref, reactive } from "vue";
import { accountTransferApi } from "@/api/finance";
import { message } from "@/utils/message";

defineOptions({
  name: "FinanceTransfer"
});

const loading = ref(false);
const formRef = ref();

const form = reactive({
  fromPaymentUid: "",
  toPaymentUid: "",
  amount: 0,
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

// Mock account list (In real app, fetch from API)
const accountList = ref([
  { label: "现金账户", value: "cash_uid" },
  { label: "银行账户", value: "bank_uid" }
]);

async function onSubmit(formEl) {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      loading.value = true;
      try {
        await accountTransferApi(form);
        message("转账成功", { type: "success" });
        formEl.resetFields();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }
  });
}
</script>

<template>
  <el-card shadow="never" class="!border-none">
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
          >
            <el-option
              v-for="item in accountList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="转入账户" prop="toPaymentUid">
          <el-select
            v-model="form.toPaymentUid"
            placeholder="请选择转入账户"
            class="w-full"
          >
            <el-option
              v-for="item in accountList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0"
            :precision="2"
            class="w-full"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="备注" prop="desc">
          <el-input v-model="form.desc" type="textarea" />
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
