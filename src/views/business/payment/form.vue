<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  formInline: {
    type: Object,
    default: () => ({
      title: "新增",
      name: "",
      balance: 0,
      type: "Alipay", // Alipay, Wechat, Bank
      account: "",
      realName: "",
      amount: 0, // For recharge
      remark: ""
    })
  }
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form ref="ruleFormRef" :model="newFormInline" label-width="82px">
    <template v-if="newFormInline.title === '新增'">
      <el-form-item
        label="账户名称"
        prop="name"
        :rules="[
          { required: true, message: '请输入账户名称', trigger: 'blur' }
        ]"
      >
        <el-input
          v-model="newFormInline.name"
          placeholder="请输入账户名称"
          clearable
        />
      </el-form-item>
      <el-form-item
        label="账户类型"
        prop="type"
        :rules="[
          { required: true, message: '请选择账户类型', trigger: 'change' }
        ]"
      >
        <el-select
          v-model="newFormInline.type"
          placeholder="请选择账户类型"
          class="w-full"
        >
          <el-option label="支付宝" value="Alipay" />
          <el-option label="微信" value="Wechat" />
          <el-option label="银行卡" value="Bank" />
          <el-option label="现金" value="Cash" />
        </el-select>
      </el-form-item>
      <el-form-item
        label="账号"
        prop="account"
        :rules="[{ required: true, message: '请输入账号', trigger: 'blur' }]"
      >
        <el-input
          v-model="newFormInline.account"
          placeholder="请输入账号"
          clearable
        />
      </el-form-item>
      <el-form-item label="真实姓名" prop="realName">
        <el-input
          v-model="newFormInline.realName"
          placeholder="请输入真实姓名"
          clearable
        />
      </el-form-item>
    </template>

    <template v-if="newFormInline.title === '充值'">
      <el-form-item label="当前余额">
        <el-input-number
          v-model="newFormInline.balance"
          disabled
          :controls="false"
        />
      </el-form-item>
      <el-form-item
        label="充值金额"
        prop="amount"
        :rules="[
          { required: true, message: '请输入充值金额', trigger: 'blur' }
        ]"
      >
        <el-input-number
          v-model="newFormInline.amount"
          :min="0.01"
          :precision="2"
          placeholder="请输入充值金额"
          class="w-full"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="newFormInline.remark"
          placeholder="请输入备注"
          type="textarea"
          clearable
        />
      </el-form-item>
    </template>
  </el-form>
</template>
