<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { getCustomerTagListApi, getCustomerLevelListApi } from "@/api";

interface FormItemProps {
  uid: string;
  name: string;
  // id: number; // Removed as it seems unused/legacy
  desc?: string;
  // operatorId: string; // Usually auto-filled by backend
  // level: number; // Replaced by levelId
  levelId?: number;
  tagIds?: number[];
  creditLimit?: number;
  initialBalance?: number; // Initial receivable
  // totalTransactionAmount: number;
  // isPublic: boolean;
  // province: string;
  // isIndividual: boolean;
  from?: string;
  // limit: number; // Replaced by creditLimit
  // discount: number; // Replaced by level-based discount or specific discount
}

interface FormProps {
  formInline: FormItemProps;
}

interface TagItem {
  id: number;
  name: string;
  color?: string;
}

interface LevelItem {
  id: number;
  name: string;
  discount?: number;
}

const props = defineProps<FormProps>();

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);
const tagList = ref<TagItem[]>([]);
const levelList = ref<LevelItem[]>([]);

const formRules = reactive({
  name: [{ required: true, message: "客户名称为必填项", trigger: "blur" }]
});

async function loadOptions() {
  const [tagRes, levelRes] = await Promise.all([
    getCustomerTagListApi(),
    getCustomerLevelListApi()
  ]);

  if (tagRes.code === 200) {
    tagList.value = tagRes.data || [];
  }
  if (levelRes.code === 200) {
    levelList.value = levelRes.data || [];
  }
}

function getRef() {
  return ruleFormRef.value;
}

onMounted(() => {
  loadOptions();
});

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="100px"
  >
    <el-form-item label="客户名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入客户名称"
      />
    </el-form-item>

    <el-form-item label="客户等级" prop="levelId">
      <el-select
        v-model="newFormInline.levelId"
        placeholder="请选择客户等级"
        clearable
        style="width: 100%"
      >
        <el-option
          v-for="item in levelList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="客户标签" prop="tagIds">
      <el-select
        v-model="newFormInline.tagIds"
        multiple
        placeholder="请选择标签"
        clearable
        style="width: 100%"
      >
        <el-option
          v-for="item in tagList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        >
          <div class="flex items-center">
            <div
              class="w-3 h-3 rounded-full mr-2"
              :style="{ backgroundColor: item.color || '#409EFF' }"
            />
            {{ item.name }}
          </div>
        </el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="信用额度" prop="creditLimit">
      <el-input-number
        v-model="newFormInline.creditLimit"
        :min="0"
        :step="1000"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="期初欠款" prop="initialBalance">
      <el-input-number
        v-model="newFormInline.initialBalance"
        :min="0"
        :step="100"
        style="width: 100%"
        placeholder="请输入期初欠款金额"
        :disabled="!!newFormInline.uid"
      />
      <div class="text-xs text-gray-400 mt-1">
        仅新建客户时可设置，后期请通过财务调整
      </div>
    </el-form-item>

    <el-form-item label="来源" prop="from">
      <el-input
        v-model="newFormInline.from"
        clearable
        placeholder="请输入客户来源"
      />
    </el-form-item>

    <el-form-item label="备注">
      <el-input
        v-model="newFormInline.desc"
        placeholder="请输入备注信息"
        type="textarea"
        :rows="3"
      />
    </el-form-item>
  </el-form>
</template>
