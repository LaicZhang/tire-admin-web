<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Delete } from "@element-plus/icons-vue";
import type { DisassemblyOrder, CreateDisassemblyOrderDto } from "./types";
import { getRepoListApi } from "@/api/company/repo";
import { getTireListApi } from "@/api/business/tire";

interface Props {
  formInline: Partial<DisassemblyOrder>;
  isView?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isView: false
});

const formRef = ref<FormInstance>();
const repoList = ref<{ uid: string; name: string }[]>([]);
const tireList = ref<{ uid: string; name: string; barcode?: string }[]>([]);
const loading = ref(false);

const formData = reactive<CreateDisassemblyOrderDto>({
  sourceTireId: props.formInline.sourceTireId || "",
  sourceRepoId: props.formInline.sourceRepoId || "",
  quantity: props.formInline.quantity || 1,
  disassemblyFee: props.formInline.disassemblyFee || 0,
  autoAllocateCost: props.formInline.autoAllocateCost ?? true,
  orderDate: props.formInline.orderDate || new Date().toISOString(),
  remark: props.formInline.remark || "",
  components: props.formInline.components?.map(c => ({
    tireId: c.tireId,
    repoId: c.repoId || "",
    quantity: c.quantity,
    unitCost: c.unitCost,
    remark: c.remark
  })) || [{ tireId: "", repoId: "", quantity: 1, unitCost: 0, remark: "" }]
});

const rules = reactive<FormRules>({
  sourceTireId: [
    { required: true, message: "请选择组合件", trigger: "change" }
  ],
  sourceRepoId: [
    { required: true, message: "请选择出库仓库", trigger: "change" }
  ],
  quantity: [{ required: true, message: "请输入拆卸数量", trigger: "blur" }]
});

const availableComponents = computed(() =>
  tireList.value.filter(t => t.uid !== formData.sourceTireId)
);

const addComponent = () => {
  formData.components.push({
    tireId: "",
    repoId: "",
    quantity: 1,
    unitCost: 0,
    remark: ""
  });
};

const removeComponent = (index: number) => {
  if (formData.components.length > 1) {
    formData.components.splice(index, 1);
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [repoRes, tireRes] = await Promise.all([
      getRepoListApi(1, {}),
      getTireListApi(1, {})
    ]);
    if (repoRes.code === 200) {
      repoList.value = repoRes.data.list;
    }
    if (tireRes.code === 200) {
      tireList.value = tireRes.data.list;
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
    class="disassembly-form"
  >
    <el-divider content-position="left">组合件(拆卸出库)</el-divider>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="组合件" prop="sourceTireId">
          <el-select
            v-model="formData.sourceTireId"
            placeholder="请选择组合件"
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
      <el-col :span="8">
        <el-form-item label="出库仓库" prop="sourceRepoId">
          <el-select
            v-model="formData.sourceRepoId"
            placeholder="请选择仓库"
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
      <el-col :span="8">
        <el-form-item label="拆卸数量" prop="quantity">
          <el-input-number
            v-model="formData.quantity"
            :min="1"
            class="w-full"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="拆卸费用">
          <el-input-number
            v-model="formData.disassemblyFee"
            :min="0"
            :precision="2"
            placeholder="人工费/材料费等"
            class="w-full"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="自动分摊">
          <el-switch v-model="formData.autoAllocateCost" />
          <span class="ml-2 text-gray-500 text-sm">
            勾选后按比例分摊成本到部件
          </span>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="单据日期">
          <el-date-picker
            v-model="formData.orderDate"
            type="date"
            placeholder="选择日期"
            class="w-full"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="备注">
      <el-input v-model="formData.remark" placeholder="备注" />
    </el-form-item>

    <el-divider content-position="left">部件(产出入库)</el-divider>

    <div class="component-list">
      <div
        v-for="(component, index) in formData.components"
        :key="index"
        class="component-item"
      >
        <el-row :gutter="12" align="middle">
          <el-col :span="6">
            <el-form-item
              :prop="`components.${index}.tireId`"
              :rules="[
                { required: true, message: '请选择部件', trigger: 'change' }
              ]"
              label-width="0"
            >
              <el-select
                v-model="component.tireId"
                placeholder="选择部件"
                filterable
                class="w-full"
              >
                <el-option
                  v-for="tire in availableComponents"
                  :key="tire.uid"
                  :label="tire.name"
                  :value="tire.uid"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item
              :prop="`components.${index}.repoId`"
              :rules="[
                { required: true, message: '请选择仓库', trigger: 'change' }
              ]"
              label-width="0"
            >
              <el-select
                v-model="component.repoId"
                placeholder="入库仓库"
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
            <el-form-item
              :prop="`components.${index}.quantity`"
              :rules="[
                { required: true, message: '请输入数量', trigger: 'blur' }
              ]"
              label-width="0"
            >
              <el-input-number
                v-model="component.quantity"
                :min="1"
                placeholder="数量"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label-width="0">
              <el-input-number
                v-model="component.unitCost"
                :min="0"
                :precision="2"
                placeholder="入库成本"
                :disabled="formData.autoAllocateCost"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label-width="0">
              <el-input v-model="component.remark" placeholder="备注" />
            </el-form-item>
          </el-col>
          <el-col :span="2">
            <el-button
              v-if="!isView && formData.components.length > 1"
              type="danger"
              :icon="Delete"
              circle
              @click="removeComponent(index)"
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
      @click="addComponent"
    >
      添加部件
    </el-button>
  </el-form>
</template>

<style scoped lang="scss">
.disassembly-form {
  padding: 16px;
}

.component-list {
  max-height: 280px;
  overflow-y: auto;
}

.component-item {
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
