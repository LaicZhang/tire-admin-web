<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@/utils";
import { PureTable } from "@pureadmin/table";
import {
  getCustomerLevelListApi,
  createCustomerLevelApi,
  updateCustomerLevelApi,
  deleteCustomerLevelApi
} from "@/api";

interface Level {
  id: number;
  name: string;
  discount?: number;
  minAmount?: number;
}

const loading = ref(false);
const levelList = ref<Level[]>([]);
const showForm = ref(false);
const editingLevel = ref<Level | null>(null);
const formData = ref({
  name: "",
  discount: 100,
  minAmount: 0
});

const columns: TableColumnList = [
  {
    label: "等级名称",
    prop: "name"
  },
  {
    label: "折扣比例",
    prop: "discount",
    width: 120,
    slot: "discount"
  },
  {
    label: "最低消费金额",
    prop: "minAmount",
    width: 140,
    slot: "minAmount"
  },
  {
    label: "操作",
    width: 180,
    slot: "operation"
  }
];

const formRules = {
  name: [{ required: true, message: "请输入等级名称", trigger: "blur" }],
  discount: [{ required: true, message: "请输入折扣比例", trigger: "blur" }]
};

const formRef = ref();

async function loadLevels() {
  loading.value = true;
  try {
    const { data, code } = await getCustomerLevelListApi();
    if (code === 200) {
      levelList.value = (data || []) as Level[];
    }
  } finally {
    loading.value = false;
  }
}

function openCreateForm() {
  editingLevel.value = null;
  formData.value = { name: "", discount: 100, minAmount: 0 };
  showForm.value = true;
}

function openEditForm(level: Level) {
  editingLevel.value = level;
  formData.value = {
    name: level.name,
    discount: level.discount ?? 100,
    minAmount: level.minAmount ?? 0
  };
  showForm.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    if (editingLevel.value) {
      await updateCustomerLevelApi(editingLevel.value.id, formData.value);
      message("等级更新成功", { type: "success" });
    } else {
      await createCustomerLevelApi(formData.value);
      message("等级创建成功", { type: "success" });
    }
    showForm.value = false;
    await loadLevels();
  } finally {
    loading.value = false;
  }
}

async function handleDelete(level: Level) {
  loading.value = true;
  try {
    await deleteCustomerLevelApi(level.id);
    message("等级删除成功", { type: "success" });
    await loadLevels();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadLevels();
});
</script>

<template>
  <div class="level-manager">
    <div class="header mb-4">
      <el-button type="primary" @click="openCreateForm">新增等级</el-button>
    </div>

    <PureTable border :loading="loading" :data="levelList" :columns="columns">
      <template #discount="{ row }"> {{ row.discount ?? 100 }}% </template>
      <template #minAmount="{ row }">
        ¥{{ (row.minAmount ?? 0).toLocaleString() }}
      </template>
      <template #operation="{ row }">
        <el-button link type="primary" @click="openEditForm(row)">
          编辑
        </el-button>
        <el-popconfirm
          :title="`确定删除等级「${row.name}」吗？`"
          @confirm="handleDelete(row)"
        >
          <template #reference>
            <el-button link type="danger">删除</el-button>
          </template>
        </el-popconfirm>
      </template>
    </PureTable>

    <!-- 新增/编辑表单弹窗 -->
    <el-dialog
      v-model="showForm"
      :title="editingLevel ? '编辑等级' : '新增等级'"
      width="450px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="等级名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入等级名称" />
        </el-form-item>
        <el-form-item label="折扣比例" prop="discount">
          <el-input-number
            v-model="formData.discount"
            :min="1"
            :max="100"
            :precision="0"
          />
          <span class="ml-2">%</span>
        </el-form-item>
        <el-form-item label="最低消费金额" prop="minAmount">
          <el-input-number
            v-model="formData.minAmount"
            :min="0"
            :precision="2"
          />
          <span class="ml-2">元</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
