<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "@/utils";
import { PureTable } from "@pureadmin/table";
import {
  getCustomerTagListApi,
  createCustomerTagApi,
  updateCustomerTagApi,
  deleteCustomerTagApi
} from "@/api";

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
const showForm = ref(false);
const editingTag = ref<Tag | null>(null);
const formData = ref({
  name: "",
  color: "#409EFF"
});

const colors = [
  "#409EFF",
  "#67C23A",
  "#E6A23C",
  "#F56C6C",
  "#909399",
  "#00d4ff",
  "#ff85c0",
  "#b37feb"
];

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
  editingTag.value = null;
  formData.value = { name: "", color: "#409EFF" };
  showForm.value = true;
}

function openEditForm(tag: Tag) {
  editingTag.value = tag;
  formData.value = { name: tag.name, color: tag.color || "#409EFF" };
  showForm.value = true;
}

async function handleSubmit() {
  if (!formData.value.name.trim()) {
    message("请输入标签名称", { type: "warning" });
    return;
  }

  loading.value = true;
  try {
    if (editingTag.value) {
      await updateCustomerTagApi(editingTag.value.id, formData.value);
      message("标签更新成功", { type: "success" });
    } else {
      await createCustomerTagApi(formData.value);
      message("标签创建成功", { type: "success" });
    }
    showForm.value = false;
    await loadTags();
  } finally {
    loading.value = false;
  }
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

      <!-- 新增/编辑表单弹窗 -->
      <el-dialog
        v-model="showForm"
        :title="editingTag ? '编辑标签' : '新增标签'"
        width="400px"
      >
        <el-form :model="formData" label-width="80px">
          <el-form-item label="标签名称" required>
            <el-input v-model="formData.name" placeholder="请输入标签名称" />
          </el-form-item>
          <el-form-item label="标签颜色">
            <div class="flex flex-wrap gap-2">
              <div
                v-for="color in colors"
                :key="color"
                class="w-8 h-8 rounded cursor-pointer border-2"
                :style="{
                  backgroundColor: color,
                  borderColor: formData.color === color ? '#000' : 'transparent'
                }"
                @click="formData.color = color"
              />
            </div>
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
  </el-dialog>
</template>
