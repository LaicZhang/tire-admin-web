<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Delete } from "@element-plus/icons-vue";
import type { Bom, CreateBomDto } from "./types";
import { getTireListApi } from "@/api/business/tire";

interface Props {
  formInline: Partial<Bom>;
  isView?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isView: false
});

const formRef = ref<FormInstance>();
const tireList = ref<{ uid: string; name: string; barcode?: string }[]>([]);
const loading = ref(false);

const formData = reactive<CreateBomDto>({
  name: props.formInline.name || "",
  code: props.formInline.code || "",
  targetTireId: props.formInline.targetTireId || "",
  targetQuantity: props.formInline.targetQuantity || 1,
  version: props.formInline.version || "1.0",
  remark: props.formInline.remark || "",
  components: props.formInline.components?.map(c => ({
    tireId: c.tireId,
    quantity: c.quantity,
    remark: c.remark
  })) || [{ tireId: "", quantity: 1, remark: "" }]
});

const rules = reactive<FormRules>({
  name: [{ required: true, message: "请输入BOM名称", trigger: "blur" }],
  targetTireId: [{ required: true, message: "请选择成品", trigger: "change" }],
  targetQuantity: [
    { required: true, message: "请输入成品数量", trigger: "blur" }
  ]
});

const availableComponents = computed(() =>
  tireList.value.filter(t => t.uid !== formData.targetTireId)
);

const addComponent = () => {
  formData.components.push({ tireId: "", quantity: 1, remark: "" });
};

const removeComponent = (index: number) => {
  if (formData.components.length > 1) {
    formData.components.splice(index, 1);
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const { data, code } = await getTireListApi(1, {});
    if (code === 200) {
      tireList.value = data.list;
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
    class="bom-form"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="BOM名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入BOM名称"
            maxlength="50"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="BOM编码" prop="code">
          <el-input
            v-model="formData.code"
            placeholder="请输入BOM编码(可选)"
            maxlength="30"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="成品" prop="targetTireId">
          <el-select
            v-model="formData.targetTireId"
            placeholder="请选择成品"
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
      <el-col :span="6">
        <el-form-item label="成品数量" prop="targetQuantity">
          <el-input-number
            v-model="formData.targetQuantity"
            :min="1"
            class="w-full"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="版本" prop="version">
          <el-input v-model="formData.version" placeholder="版本号" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="备注">
      <el-input
        v-model="formData.remark"
        type="textarea"
        :rows="2"
        placeholder="请输入备注"
        maxlength="500"
      />
    </el-form-item>

    <el-divider content-position="left">子件清单</el-divider>

    <div class="component-list">
      <div
        v-for="(component, index) in formData.components"
        :key="index"
        class="component-item"
      >
        <el-row :gutter="12" align="middle">
          <el-col :span="10">
            <el-form-item
              :prop="`components.${index}.tireId`"
              :rules="[
                { required: true, message: '请选择子件', trigger: 'change' }
              ]"
              label-width="0"
            >
              <el-select
                v-model="component.tireId"
                placeholder="选择子件"
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
              :prop="`components.${index}.quantity`"
              :rules="[
                { required: true, message: '请输入用量', trigger: 'blur' }
              ]"
              label-width="0"
            >
              <el-input-number
                v-model="component.quantity"
                :min="1"
                placeholder="用量"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="7">
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
      添加子件
    </el-button>
  </el-form>
</template>

<style scoped lang="scss">
.bom-form {
  padding: 16px;
}

.component-list {
  max-height: 300px;
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
</style>
