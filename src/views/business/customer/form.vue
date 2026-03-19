<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import {
  getCustomerInitialBalanceApi,
  getCustomerTagListApi,
  getCustomerLevelListApi
} from "@/api";
import { useSysDictOptions } from "@/composables/useSysDict";

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
const initialBalanceLoading = ref(false);
const initialBalanceSummary = ref({
  receivableBalance: 0,
  advanceBalance: 0,
  totalBalance: 0
});
const { options: customerSourceOptions } = useSysDictOptions("customerSource");

const formRules = reactive({
  name: [{ required: true, message: "客户名称为必填项", trigger: "blur" }]
});

async function loadOptions() {
  const [tagRes, levelRes] = await Promise.all([
    getCustomerTagListApi(),
    getCustomerLevelListApi()
  ]);

  if (tagRes.code === 200) {
    tagList.value = (tagRes.data || []) as TagItem[];
  }
  if (levelRes.code === 200) {
    levelList.value = (levelRes.data || []) as LevelItem[];
  }
}

async function loadInitialBalance(uid?: string) {
  if (!uid) {
    initialBalanceSummary.value = {
      receivableBalance: 0,
      advanceBalance: 0,
      totalBalance: 0
    };
    return;
  }
  initialBalanceLoading.value = true;
  try {
    const { code, data } = await getCustomerInitialBalanceApi(uid);
    if (code === 200 && data?.summary) {
      initialBalanceSummary.value = {
        receivableBalance: Number(data.summary.receivableBalance || 0),
        advanceBalance: Number(data.summary.advanceBalance || 0),
        totalBalance: Number(data.summary.totalBalance || 0)
      };
    }
  } finally {
    initialBalanceLoading.value = false;
  }
}

onMounted(() => {
  loadOptions();
  loadInitialBalance(newFormInline.value.uid);
});

watch(
  () => newFormInline.value.uid,
  uid => {
    loadInitialBalance(uid);
  }
);

defineExpose({ formRef: ruleFormRef });
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
        placeholder="客户创建后请通过财务期初余额维护"
        disabled
      />
      <div class="text-xs text-gray-400 mt-1">
        <template v-if="newFormInline.uid">
          <span v-if="initialBalanceLoading">正在加载期初余额摘要...</span>
          <span v-else>
            当前期初净额：{{
              initialBalanceSummary.totalBalance / 100
            }}
            （应收：{{
              initialBalanceSummary.receivableBalance / 100
            }}，预收：{{ initialBalanceSummary.advanceBalance / 100 }}）
          </span>
        </template>
        <template v-else>客户创建后请通过财务期初余额维护。</template>
      </div>
    </el-form-item>

    <el-form-item label="来源" prop="from">
      <el-select
        v-model="newFormInline.from"
        filterable
        clearable
        allow-create
        default-first-option
        placeholder="请选择或输入客户来源"
        style="width: 100%"
      >
        <el-option
          v-for="item in customerSourceOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
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
