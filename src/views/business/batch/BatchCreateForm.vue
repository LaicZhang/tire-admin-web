<script setup lang="ts">
import { ref } from "vue";
import { createBatchApi } from "@/api/batch";
import { message } from "@/utils/message";

interface RepoItem {
  uid: string;
  name: string;
}

const props = defineProps<{
  repoList: RepoItem[];
  onSuccess: () => void;
  onClose: () => void;
}>();

const formRef = ref<any>(null);
const loading = ref(false);
const batchForm = ref({
  repoId: undefined as string | undefined,
  tireId: undefined as string | undefined,
  batchNo: "",
  quantity: 1,
  productionDate: "",
  expiryDate: ""
});

const rules = {
  repoId: [{ required: true, message: "请选择仓库", trigger: "change" }],
  tireId: [{ required: true, message: "请输入轮胎ID", trigger: "blur" }],
  batchNo: [{ required: true, message: "请输入批次号", trigger: "blur" }],
  quantity: [{ required: true, message: "请输入数量", trigger: "blur" }]
};

const handleSubmit = async () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      try {
        await createBatchApi(batchForm.value as any);
        message("批次创建成功", { type: "success" });
        props.onSuccess();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "创建失败";
        message(msg, { type: "error" });
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<template>
  <div>
    <el-form
      ref="formRef"
      :model="batchForm"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="仓库" prop="repoId">
        <el-select
          v-model="batchForm.repoId"
          placeholder="请选择仓库"
          class="w-full"
        >
          <el-option
            v-for="item in repoList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="商品ID" prop="tireId">
        <el-input v-model="batchForm.tireId" placeholder="请输入商品ID" />
      </el-form-item>
      <el-form-item label="批次号" prop="batchNo">
        <el-input v-model="batchForm.batchNo" placeholder="请输入批次号" />
      </el-form-item>
      <el-form-item label="初始数量" prop="quantity">
        <el-input-number v-model="batchForm.quantity" :min="1" class="w-full" />
      </el-form-item>
      <el-form-item label="生产日期" prop="productionDate">
        <el-date-picker
          v-model="batchForm.productionDate"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          class="w-full"
        />
      </el-form-item>
      <el-form-item label="过期日期" prop="expiryDate">
        <el-date-picker
          v-model="batchForm.expiryDate"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          class="w-full"
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
