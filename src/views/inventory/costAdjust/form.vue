<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Delete } from "@element-plus/icons-vue";
import type {
  CreateCostAdjustOrderDto,
  CreateCostAdjustDetailDto
} from "./types";
import { getRepoListApi } from "@/api/company/repo";
import { getTireListApi } from "@/api/business/tire";
import { getEmployeeListApi } from "@/api/company/employee";

interface Props {
  formInline: {
    operatorId?: string;
    auditorId?: string;
    reason?: string;
    desc?: string;
    details?: CreateCostAdjustDetailDto[];
  };
  isView?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isView: false
});

const formRef = ref<FormInstance>();
const repoList = ref<{ uid: string; name: string }[]>([]);
const tireList = ref<{ uid: string; name: string; barcode?: string }[]>([]);
const employeeList = ref<{ uid: string; name: string }[]>([]);
const loading = ref(false);

const formData = reactive<CreateCostAdjustOrderDto>({
  operatorId: props.formInline.operatorId || "",
  auditorId: props.formInline.auditorId || "",
  reason: props.formInline.reason || "",
  desc: props.formInline.desc || "",
  details: props.formInline.details || [
    {
      repoId: "",
      tireId: "",
      originalCost: 0,
      adjustedCost: 0,
      count: 1,
      remark: ""
    }
  ]
});

const rules = reactive<FormRules>({
  operatorId: [{ required: true, message: "请选择操作人", trigger: "change" }],
  reason: [{ required: true, message: "请输入调整原因", trigger: "blur" }]
});

const totalAdjustAmount = computed(() => {
  return formData.details.reduce((sum, d) => {
    return sum + (d.adjustedCost - d.originalCost) * d.count;
  }, 0);
});

const addDetail = () => {
  formData.details.push({
    repoId: "",
    tireId: "",
    originalCost: 0,
    adjustedCost: 0,
    count: 1,
    remark: ""
  });
};

const removeDetail = (index: number) => {
  if (formData.details.length > 1) {
    formData.details.splice(index, 1);
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [repoRes, tireRes, employeeRes] = await Promise.all([
      getRepoListApi(1, {}),
      getTireListApi(1, {}),
      getEmployeeListApi(1, {})
    ]);
    if (repoRes.code === 200) {
      repoList.value = repoRes.data.list;
    }
    if (tireRes.code === 200) {
      tireList.value = tireRes.data.list;
    }
    if (employeeRes.code === 200) {
      employeeList.value = employeeRes.data.list;
    }
  } finally {
    loading.value = false;
  }
};

const getRef = () => formRef.value;
const getFormData = () => formData;

defineExpose({ getRef, getFormData });

onMounted(() => {
  loadData();
});
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    :disabled="isView"
    label-width="100px"
    class="cost-adjust-form"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="操作人" prop="operatorId">
          <el-select
            v-model="formData.operatorId"
            placeholder="请选择操作人"
            filterable
            class="w-full"
          >
            <el-option
              v-for="emp in employeeList"
              :key="emp.uid"
              :label="emp.name"
              :value="emp.uid"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="审核人">
          <el-select
            v-model="formData.auditorId"
            placeholder="请选择审核人(可选)"
            filterable
            clearable
            class="w-full"
          >
            <el-option
              v-for="emp in employeeList"
              :key="emp.uid"
              :label="emp.name"
              :value="emp.uid"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="调整原因" prop="reason">
      <el-input
        v-model="formData.reason"
        placeholder="请输入调整原因"
        maxlength="200"
      />
    </el-form-item>

    <el-form-item label="备注说明">
      <el-input
        v-model="formData.desc"
        type="textarea"
        :rows="2"
        placeholder="请输入备注说明"
        maxlength="500"
      />
    </el-form-item>

    <el-divider content-position="left">
      调整明细
      <span class="ml-4 text-sm">
        总调整金额:
        <span
          :class="totalAdjustAmount >= 0 ? 'text-green-600' : 'text-red-600'"
        >
          {{ totalAdjustAmount.toFixed(2) }}
        </span>
      </span>
    </el-divider>

    <div class="detail-list">
      <div
        v-for="(detail, index) in formData.details"
        :key="index"
        class="detail-item"
      >
        <el-row :gutter="12" align="middle">
          <el-col :span="4">
            <el-form-item
              :prop="`details.${index}.tireId`"
              :rules="[
                { required: true, message: '请选择商品', trigger: 'change' }
              ]"
              label-width="0"
            >
              <el-select
                v-model="detail.tireId"
                placeholder="商品"
                filterable
                class="w-full"
              >
                <el-option
                  v-for="tire in tireList"
                  :key="tire.uid"
                  :label="tire.name"
                  :value="tire.uid"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item
              :prop="`details.${index}.repoId`"
              :rules="[
                { required: true, message: '请选择仓库', trigger: 'change' }
              ]"
              label-width="0"
            >
              <el-select
                v-model="detail.repoId"
                placeholder="仓库"
                filterable
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
          </el-col>
          <el-col :span="3">
            <el-form-item label-width="0">
              <el-input-number
                v-model="detail.count"
                :min="1"
                placeholder="数量"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label-width="0">
              <el-input-number
                v-model="detail.originalCost"
                :min="0"
                :precision="2"
                placeholder="原成本"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item
              :prop="`details.${index}.adjustedCost`"
              :rules="[
                { required: true, message: '请输入调整后成本', trigger: 'blur' }
              ]"
              label-width="0"
            >
              <el-input-number
                v-model="detail.adjustedCost"
                :min="0"
                :precision="2"
                placeholder="调整后"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label-width="0">
              <el-input v-model="detail.remark" placeholder="备注" />
            </el-form-item>
          </el-col>
          <el-col :span="2">
            <el-button
              v-if="!isView && formData.details.length > 1"
              type="danger"
              :icon="Delete"
              circle
              @click="removeDetail(index)"
            />
          </el-col>
        </el-row>
      </div>
    </div>

    <el-button
      v-if="!isView"
      type="primary"
      :icon="Plus"
      class="mt-4"
      @click="addDetail"
    >
      添加明细
    </el-button>
  </el-form>
</template>

<style scoped lang="scss">
.cost-adjust-form {
  padding: 16px;
}

.detail-list {
  max-height: 300px;
  overflow-y: auto;
}

.detail-item {
  padding: 8px;
  margin-bottom: 8px;
  background: #fafafa;
  border-radius: 4px;
}

.w-full {
  width: 100%;
}

.mt-4 {
  margin-top: 16px;
}

.ml-4 {
  margin-left: 16px;
}

.text-sm {
  font-size: 14px;
}

.text-green-600 {
  color: #16a34a;
}

.text-red-600 {
  color: #dc2626;
}
</style>
