<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { message } from "@/utils";
import {
  createContractTemplateApi,
  deleteContractTemplateApi,
  getContractTemplatesApi,
  type ContractTemplate
} from "@/api/business/contract-template";

defineOptions({ name: "ContractTemplateManagement" });

const loading = ref(false);
const rows = ref<ContractTemplate[]>([]);
const page = reactive({ current: 1, total: 0, pageSize: 20 });
const form = reactive({
  name: "",
  type: "" as "" | "SALE" | "PURCHASE",
  body: ""
});

async function loadData() {
  loading.value = true;
  try {
    const res = await getContractTemplatesApi(page.current);
    rows.value = res.data?.list ?? [];
    page.total = res.data?.count ?? 0;
    page.pageSize = res.data?.pageSize ?? 20;
  } finally {
    loading.value = false;
  }
}

async function createTemplate() {
  if (!form.name.trim() || !form.body.trim()) {
    message("名称和正文不能为空", { type: "warning" });
    return;
  }
  await createContractTemplateApi({
    name: form.name.trim(),
    type: form.type || undefined,
    body: form.body
  });
  message("模板已创建", { type: "success" });
  form.name = "";
  form.body = "";
  form.type = "";
  await loadData();
}

async function remove(row: ContractTemplate) {
  await deleteContractTemplateApi(row.uid);
  message("已删除", { type: "success" });
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <div class="p-4">
    <div class="mb-4 grid max-w-3xl gap-2">
      <el-input v-model="form.name" placeholder="模板名称" />
      <el-select v-model="form.type" clearable placeholder="类型">
        <el-option label="销售" value="SALE" />
        <el-option label="采购" value="PURCHASE" />
      </el-select>
      <el-input
        v-model="form.body"
        type="textarea"
        :rows="4"
        placeholder="模板正文 HTML/JSON"
      />
      <div>
        <Auth value="post/contract-template">
          <el-button type="primary" @click="createTemplate">新建模板</el-button>
        </Auth>
        <el-button class="ml-2" @click="loadData">刷新</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="name" label="名称" min-width="160" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="isActive" label="启用" width="80">
        <template #default="{ row }">
          {{ row.isActive ? "是" : "否" }}
        </template>
      </el-table-column>
      <el-table-column prop="body" label="正文摘要" min-width="220">
        <template #default="{ row }">
          {{ String(row.body || "").slice(0, 80) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <Auth value="delete/contract-template">
            <el-button
              size="small"
              type="danger"
              @click="remove(row as ContractTemplate)"
              >删除</el-button
            >
          </Auth>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="page.current"
        :page-size="page.pageSize"
        :total="page.total"
        layout="total, prev, pager, next"
        @current-change="loadData"
      />
    </div>
  </div>
</template>
