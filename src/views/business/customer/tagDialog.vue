<script setup lang="ts">
import { h, ref, watch } from "vue";
import { message } from "@/utils";
import { PureTable } from "@pureadmin/table";
import { addDialog, closeAllDialog } from "@/components/ReDialog";
import {
  getCustomerTagListApi,
  createCustomerTagApi,
  updateCustomerTagApi,
  deleteCustomerTagApi
} from "@/api";
import TagEditForm from "./TagEditForm.vue";

interface Tag {
  id: number;
  name: string;
  color?: string;
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const loading = ref(false);
const tagList = ref<Tag[]>([]);

const columns: TableColumnList = [
  {
    label: "标签名称",
    prop: "name",
    slot: "name"
  },
  {
    label: "颜色",
    prop: "color",
    width: 120,
    slot: "color"
  },
  {
    label: "操作",
    width: 180,
    slot: "operation"
  }
];

async function loadTags() {
  loading.value = true;
  try {
    const { data, code } = await getCustomerTagListApi();
    if (code === 200) {
      tagList.value = (data || []) as Tag[];
    }
  } finally {
    loading.value = false;
  }
}

function openCreateForm() {
  addDialog({
    title: "新增标签",
    width: "400px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(TagEditForm, {
        formData: { name: "", color: "#409EFF" },
        onSubmit: async (data: { name: string; color: string }) => {
          await createCustomerTagApi(data);
          message("标签创建成功", { type: "success" });
          closeAllDialog();
          await loadTags();
        },
        onClose: () => closeAllDialog()
      })
  });
}

function openEditForm(tag: Tag) {
  addDialog({
    title: "编辑标签",
    width: "400px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(TagEditForm, {
        formData: { name: tag.name, color: tag.color || "#409EFF" },
        onSubmit: async (data: { name: string; color: string }) => {
          await updateCustomerTagApi(tag.id, data);
          message("标签更新成功", { type: "success" });
          closeAllDialog();
          await loadTags();
        },
        onClose: () => closeAllDialog()
      })
  });
}

async function handleDelete(tag: Tag) {
  loading.value = true;
  try {
    await deleteCustomerTagApi(tag.id);
    message("标签删除成功", { type: "success" });
    await loadTags();
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
      loadTags();
    }
  },
  { immediate: true }
);
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="标签管理"
    width="600px"
    @close="handleClose"
  >
    <div class="tag-manager">
      <div class="header mb-4">
        <el-button type="primary" @click="openCreateForm">新增标签</el-button>
      </div>

      <PureTable border :loading="loading" :data="tagList" :columns="columns">
        <template #name="{ row }">
          <el-tag :color="row.color" effect="dark">{{ row.name }}</el-tag>
        </template>
        <template #color="{ row }">
          <div
            class="w-6 h-6 rounded"
            :style="{ backgroundColor: row.color || '#409EFF' }"
          />
        </template>
        <template #operation="{ row }">
          <el-button link type="primary" @click="openEditForm(row)">
            编辑
          </el-button>
          <el-popconfirm
            :title="`确定删除标签「${row.name}」吗？`"
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
