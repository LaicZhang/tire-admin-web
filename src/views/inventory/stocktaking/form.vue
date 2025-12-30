<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { StocktakingTask, CreateStocktakingDto } from "./types";
import { getRepoListApi } from "@/api/company/repo";

interface Props {
  formInline: Partial<StocktakingTask>;
  isView?: boolean;
  isEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isView: false,
  isEdit: false
});

const formRef = ref<FormInstance>();
const repoList = ref<{ uid: string; name: string }[]>([]);
const loading = ref(false);

const formData = reactive<CreateStocktakingDto>({
  repoId: props.formInline.repoId || "",
  name: props.formInline.name || "",
  includeZeroStock: false,
  remark: props.formInline.remark || ""
});

const rules = reactive<FormRules>({
  repoId: [{ required: true, message: "请选择盘点仓库", trigger: "change" }],
  name: [{ required: true, message: "请输入盘点单名称", trigger: "blur" }]
});

const loadRepos = async () => {
  loading.value = true;
  try {
    const { data, code } = await getRepoListApi(1, {});
    if (code === 200) {
      repoList.value = data.list;
    }
  } finally {
    loading.value = false;
  }
};

const getRef = () => formRef.value;
const getFormData = () => formData;

defineExpose({ getRef, getFormData });

onMounted(() => {
  loadRepos();
});
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    :disabled="isView"
    label-width="100px"
    class="stocktaking-form"
  >
    <el-form-item label="盘点名称" prop="name">
      <el-input
        v-model="formData.name"
        placeholder="请输入盘点单名称"
        maxlength="50"
      />
    </el-form-item>

    <el-form-item label="盘点仓库" prop="repoId">
      <el-select
        v-model="formData.repoId"
        placeholder="请选择盘点仓库"
        filterable
        :disabled="isEdit"
        class="w-full"
      >
        <el-option
          v-for="repo in repoList"
          :key="repo.uid"
          :label="repo.name"
          :value="repo.uid"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="包含零库存">
      <el-switch v-model="formData.includeZeroStock" :disabled="isEdit" />
      <span class="ml-2 text-gray-500 text-sm">
        勾选后将包含库存为0的商品
      </span>
    </el-form-item>

    <el-form-item label="备注">
      <el-input
        v-model="formData.remark"
        type="textarea"
        :rows="3"
        placeholder="请输入备注"
        maxlength="500"
      />
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.stocktaking-form {
  padding: 16px;
}

.w-full {
  width: 100%;
}

.ml-2 {
  margin-left: 8px;
}

.text-gray-500 {
  color: #6b7280;
}

.text-sm {
  font-size: 12px;
}
</style>
