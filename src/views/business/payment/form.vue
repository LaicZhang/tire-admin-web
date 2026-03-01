<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";
import { elementRules } from "@/utils/validation/elementRules";

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

const rules: FormRules = {
  name: [
    elementRules.requiredStringTrim("请输入账户名称"),
    elementRules.maxLen(50, "账户名称最多 50 个字符")
  ],
  type: [
    elementRules.requiredSelect("请选择账户类型", "change"),
    {
      trigger: "change",
      validator: (_rule, value, callback) => {
        const allowed = new Set(["Alipay", "Wechat", "Bank", "Cash"]);
        if (!allowed.has(String(value)))
          return callback(new Error("账户类型不合法"));
        callback();
      }
    }
  ],
  account: [
    elementRules.requiredStringTrim("请输入账号"),
    elementRules.maxLen(50, "账号最多 50 个字符")
  ],
  realName: [elementRules.maxLen(50, "真实姓名最多 50 个字符")],
  amount: [
    elementRules.requiredSelect("请输入充值金额", "blur"),
    elementRules.moneyYuan({
      min: 0,
      minExclusive: true,
      message: "充值金额需大于 0"
    })
  ],
  remark: [elementRules.maxLen(200, "备注最多 200 个字符")]
};

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="rules"
    label-width="82px"
  >
    <template v-if="newFormInline.title === '新增'">
      <el-form-item label="账户名称" prop="name">
        <el-input
          v-model="newFormInline.name"
          placeholder="请输入账户名称"
          clearable
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="账户类型" prop="type">
        <el-select
          v-model="newFormInline.type"
          placeholder="请选择账户类型"
          class="w-full"
          clearable
        >
          <el-option label="支付宝" value="Alipay" />
          <el-option label="微信" value="Wechat" />
          <el-option label="银行卡" value="Bank" />
          <el-option label="现金" value="Cash" />
        </el-select>
      </el-form-item>
      <el-form-item label="账号" prop="account">
        <el-input
          v-model="newFormInline.account"
          placeholder="请输入账号"
          clearable
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="真实姓名" prop="realName">
        <el-input
          v-model="newFormInline.realName"
          placeholder="请输入真实姓名"
          clearable
          maxlength="50"
          show-word-limit
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
      <el-form-item label="充值金额" prop="amount">
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
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </template>
  </el-form>
</template>
