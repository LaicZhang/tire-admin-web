<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { CreateRecalcTaskDto } from "./types";
import { RecalcScope, recalcScopeMap } from "./types";
import { getTireListApi } from "@/api/business/tire";

interface Props {
  formInline: Partial<CreateRecalcTaskDto>;
}

const props = withDefaults(defineProps<Props>(), {});

const formRef = ref<FormInstance>();
const tireList = ref<{ uid: string; name: string }[]>([]);
const loading = ref(false);

const scopeOptions = Object.entries(recalcScopeMap).map(([value, config]) => ({
  value,
  label: config.label,
  desc: config.desc
}));

const formData = reactive<CreateRecalcTaskDto>({
  scope: props.formInline.scope || RecalcScope.SINGLE,
  tireId: props.formInline.tireId || "",
  categoryId: props.formInline.categoryId || "",
  startDate: props.formInline.startDate || "",
  endDate: props.formInline.endDate || "",
  remark: props.formInline.remark || ""
});

const dateRange = ref<[string, string] | null>(null);

const rules = reactive<FormRules>({
  scope: [{ required: true, message: "请选择重算范围", trigger: "change" }],
  tireId: [
    {
      required: true,
      message: "请选择商品",
      trigger: "change",
      validator: (_rule, _value, callback) => {
        if (formData.scope === RecalcScope.SINGLE && !formData.tireId) {
          callback(new Error("请选择商品"));
        } else {
          callback();
        }
      }
    }
  ]
});

watch(dateRange, val => {
  formData.startDate = val?.[0] || "";
  formData.endDate = val?.[1] || "";
});

const loadTires = async () => {
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
  loadTires();
});
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="100px"
    class="recalc-form"
  >
    <el-alert title="注意事项" type="warning" :closable="false" class="mb-4">
      <template #default>
        <ul class="text-sm">
          <li>成本重算按成本规则重新计算指定期间的成本</li>
          <li>可能会导致商品出库成本变动</li>
          <li>已结账与已生成财务凭证的单据不参与成本重算</li>
          <li>建议先备份账套后再进行操作</li>
        </ul>
      </template>
    </el-alert>

    <el-form-item label="重算范围" prop="scope">
      <el-radio-group v-model="formData.scope">
        <el-radio
          v-for="item in scopeOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
          <span class="text-gray-400 text-xs ml-1">({{ item.desc }})</span>
        </el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item
      v-if="formData.scope === 'single'"
      label="选择商品"
      prop="tireId"
    >
      <el-select
        v-model="formData.tireId"
        placeholder="请选择商品"
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

    <el-form-item label="重算期间">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        class="w-full"
      />
      <span class="text-gray-400 text-xs mt-1">
        留空表示从建账日期开始重算
      </span>
    </el-form-item>

    <el-form-item label="备注">
      <el-input
        v-model="formData.remark"
        type="textarea"
        :rows="2"
        placeholder="请输入备注"
        maxlength="500"
      />
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.recalc-form {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.w-full {
  width: 100%;
}

.text-sm {
  font-size: 13px;
}

.text-xs {
  font-size: 12px;
}

.text-gray-400 {
  color: #9ca3af;
}

.ml-1 {
  margin-left: 4px;
}

.mt-1 {
  display: block;
  margin-top: 4px;
}

ul {
  padding-left: 16px;
  margin: 0;
}

li {
  line-height: 1.8;
}
</style>
