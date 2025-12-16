<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@/utils";
import { updatePaymentApi } from "@/api";

type OperationType = "top-up" | "pay" | "freeze" | "unfreeze";

interface Props {
  visible: boolean;
  type: OperationType;
  paymentUid: string;
  paymentName: string;
  currentBalance?: number;
}

const props = withDefaults(defineProps<Props>(), {
  currentBalance: 0
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const loading = ref(false);
const formData = ref({
  amount: 0,
  desc: ""
});

const operationLabels: Record<OperationType, string> = {
  "top-up": "账户充值",
  pay: "账户扣款",
  freeze: "冻结金额",
  unfreeze: "解冻金额"
};

const operationTitle = computed(
  () => operationLabels[props.type] || "账户操作"
);

const amountLabel = computed(() => {
  switch (props.type) {
    case "top-up":
      return "充值金额";
    case "pay":
      return "扣款金额";
    case "freeze":
      return "冻结金额";
    case "unfreeze":
      return "解冻金额";
    default:
      return "金额";
  }
});

const formRef = ref();

const formRules = {
  amount: [
    { required: true, message: "请输入金额", trigger: "blur" },
    {
      validator: (
        _rule: unknown,
        value: number,
        callback: (error?: Error) => void
      ) => {
        if (value <= 0) {
          callback(new Error("金额必须大于0"));
        } else if (
          (props.type === "pay" || props.type === "freeze") &&
          value > props.currentBalance
        ) {
          callback(new Error("金额不能超过当前余额"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const { code, msg } = await updatePaymentApi(props.paymentUid, {
      type: props.type,
      record: {
        amount: formData.value.amount,
        desc: formData.value.desc || undefined
      }
    });

    if (code === 200) {
      message(`${operationTitle.value}成功`, { type: "success" });
      emit("success");
      dialogVisible.value = false;
    } else {
      message(msg || `${operationTitle.value}失败`, { type: "error" });
    }
  } catch {
    message(`${operationTitle.value}失败`, { type: "error" });
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  formData.value = { amount: 0, desc: "" };
  dialogVisible.value = false;
}

watch(dialogVisible, visible => {
  if (visible) {
    formData.value = { amount: 0, desc: "" };
  }
});
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="operationTitle"
    width="450px"
    :close-on-click-modal="false"
  >
    <div class="operation-dialog">
      <!-- 账户信息 -->
      <div class="mb-4">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="账户名称">
            {{ paymentName }}
          </el-descriptions-item>
          <el-descriptions-item label="当前余额">
            <span class="text-primary font-medium">
              ¥{{ currentBalance?.toLocaleString() || "0.00" }}
            </span>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item :label="amountLabel" prop="amount">
          <el-input-number
            v-model="formData.amount"
            :min="0.01"
            :precision="2"
            :step="100"
            style="width: 200px"
          />
          <span class="ml-2">元</span>
        </el-form-item>
        <el-form-item label="备注" prop="desc">
          <el-input
            v-model="formData.desc"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
      </el-form>

      <!-- 操作提示 -->
      <el-alert
        v-if="type === 'pay' || type === 'freeze'"
        type="warning"
        :closable="false"
      >
        <template #title>
          {{
            type === "pay"
              ? "扣款后余额将减少，请确认操作"
              : "冻结后该部分金额将不可用，请确认操作"
          }}
        </template>
      </el-alert>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确认{{ operationTitle }}
      </el-button>
    </template>
  </el-dialog>
</template>
