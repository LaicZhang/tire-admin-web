<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { createWriteOff, type WriteOffOrderDto } from "@/api/business/writeOff";
import { getCustomerListApi } from "@/api/business/customer";
import { getProviderListApi } from "@/api/business/provider";
import { message } from "@/utils/message";

const props = defineProps<{
  onSuccess: () => void;
  onClose: () => void;
}>();

const loading = ref(false);
const customerList = ref<Array<{ uid: string; name: string }>>([]);
const providerList = ref<Array<{ uid: string; name: string }>>([]);

const formData = reactive<WriteOffOrderDto>({
  type: "OFFSET",
  customerId: "",
  providerId: "",
  receivableAmount: 0,
  payableAmount: 0,
  writeOffAmount: 0,
  reason: "",
  remark: ""
});

async function loadSelectData() {
  try {
    const [customerRes, providerRes] = await Promise.all([
      getCustomerListApi(1, { keyword: "" }),
      getProviderListApi(1, { keyword: "" })
    ]);
    customerList.value = customerRes.data?.list || [];
    providerList.value = providerRes.data?.list || [];
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "加载数据失败";
    message(msg, { type: "error" });
  }
}

async function handleSubmit() {
  if (!formData.customerId && !formData.providerId) {
    message("请选择客户或供应商", { type: "warning" });
    return;
  }
  if (formData.writeOffAmount <= 0) {
    message("核销金额必须大于0", { type: "warning" });
    return;
  }

  loading.value = true;
  try {
    await createWriteOff({
      ...formData,
      receivableAmount: Math.round(formData.receivableAmount * 100),
      payableAmount: Math.round(formData.payableAmount * 100),
      writeOffAmount: Math.round(formData.writeOffAmount * 100)
    });
    message("创建成功", { type: "success" });
    props.onSuccess();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "创建失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadSelectData();
});
</script>

<template>
  <div>
    <el-form :model="formData" label-width="100px">
      <el-form-item label="核销类型">
        <el-radio-group v-model="formData.type">
          <el-radio value="OFFSET">互抵核销</el-radio>
          <el-radio value="BAD_DEBT">坏账核销</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="客户">
        <el-select
          v-model="formData.customerId"
          placeholder="请选择客户"
          clearable
          filterable
          class="w-full!"
        >
          <el-option
            v-for="item in customerList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="供应商">
        <el-select
          v-model="formData.providerId"
          placeholder="请选择供应商"
          clearable
          filterable
          class="w-full!"
        >
          <el-option
            v-for="item in providerList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="应收金额">
        <el-input-number
          v-model="formData.receivableAmount"
          :min="0"
          :precision="2"
          class="w-full!"
        />
      </el-form-item>
      <el-form-item label="应付金额">
        <el-input-number
          v-model="formData.payableAmount"
          :min="0"
          :precision="2"
          class="w-full!"
        />
      </el-form-item>
      <el-form-item label="核销金额">
        <el-input-number
          v-model="formData.writeOffAmount"
          :min="0"
          :precision="2"
          class="w-full!"
        />
      </el-form-item>
      <el-form-item label="核销原因">
        <el-input v-model="formData.reason" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="formData.remark" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <div class="flex justify-end gap-2 mt-4">
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </div>
  </div>
</template>
