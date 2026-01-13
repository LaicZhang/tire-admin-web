<script setup lang="ts">
import { h, ref, watch } from "vue";
import { message } from "@/utils";
import { PureTable } from "@pureadmin/table";
import { addDialog, closeAllDialog } from "@/components/ReDialog";
import {
  getCustomerLevelListApi,
  createCustomerLevelApi,
  updateCustomerLevelApi,
  deleteCustomerLevelApi
} from "@/api";
import LevelEditForm from "./LevelEditForm.vue";

interface Level {
  id: number;
  name: string;
  discount?: number;
  minAmount?: number;
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const loading = ref(false);
const levelList = ref<Level[]>([]);

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
  addDialog({
    title: "新增等级",
    width: "450px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(LevelEditForm, {
        formData: { name: "", discount: 100, minAmount: 0 },
        onSubmit: async (data: {
          name: string;
          discount: number;
          minAmount: number;
        }) => {
          await createCustomerLevelApi(data);
          message("等级创建成功", { type: "success" });
          closeAllDialog();
          await loadLevels();
        },
        onClose: () => closeAllDialog()
      })
  });
}

function openEditForm(level: Level) {
  addDialog({
    title: "编辑等级",
    width: "450px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(LevelEditForm, {
        formData: {
          name: level.name,
          discount: level.discount ?? 100,
          minAmount: level.minAmount ?? 0
        },
        onSubmit: async (data: {
          name: string;
          discount: number;
          minAmount: number;
        }) => {
          await updateCustomerLevelApi(level.id, data);
          message("等级更新成功", { type: "success" });
          closeAllDialog();
          await loadLevels();
        },
        onClose: () => closeAllDialog()
      })
  });
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

function handleClose() {
  emit("update:modelValue", false);
}

// 当弹窗打开时加载数据
watch(
  () => props.modelValue,
  val => {
    if (val) {
      loadLevels();
    }
  },
  { immediate: true }
);
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="等级管理"
    width="650px"
    @close="handleClose"
  >
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
    </div>
  </el-dialog>
</template>
