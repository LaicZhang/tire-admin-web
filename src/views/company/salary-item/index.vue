<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils";
import {
  createSalaryItemApi,
  deleteSalaryItemApi,
  getSalaryItemsApi,
  updateSalaryItemApi,
  type SalaryItemDefinition
} from "@/api/company/salary-item";

defineOptions({ name: "SalaryItemDefinitions" });

const loading = ref(false);
const rows = ref<SalaryItemDefinition[]>([]);
const form = reactive({
  code: "",
  name: "",
  category: "EARNING" as "EARNING" | "DEDUCTION" | "EMPLOYER_COST",
  calcKind: "INPUT" as "INPUT" | "FORMULA",
  formula: "",
  sort: 100
});

async function load() {
  loading.value = true;
  try {
    const res = await getSalaryItemsApi();
    rows.value = res.data ?? [];
  } finally {
    loading.value = false;
  }
}

async function createItem() {
  if (!form.code.trim() || !form.name.trim()) {
    message("请填写编码与名称", { type: "warning" });
    return;
  }
  await createSalaryItemApi({
    code: form.code.trim(),
    name: form.name.trim(),
    category: form.category,
    calcKind: form.calcKind,
    formula: form.calcKind === "FORMULA" ? form.formula : undefined,
    sort: form.sort
  });
  message("已创建", { type: "success" });
  form.code = "";
  form.name = "";
  form.formula = "";
  await load();
}

async function toggleActive(row: SalaryItemDefinition) {
  await updateSalaryItemApi(row.uid, { active: !row.active });
  message(row.active ? "已停用" : "已启用", { type: "success" });
  await load();
}

async function remove(row: SalaryItemDefinition) {
  if (row.isSystem) {
    message("系统项不可删除，可停用", { type: "warning" });
    return;
  }
  await ElMessageBox.confirm(`确认删除工资项 ${row.code}?`, "提示");
  await deleteSalaryItemApi(row.uid);
  message("已删除", { type: "success" });
  await load();
}

onMounted(load);
</script>

<template>
  <div class="p-4">
    <el-card class="mb-3">
      <template #header>新增自定义工资项目</template>
      <el-form inline>
        <el-form-item label="编码">
          <el-input
            v-model="form.code"
            class="w-[140px]"
            placeholder="如 BONUS"
          />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" class="w-[160px]" />
        </el-form-item>
        <el-form-item label="类别">
          <el-select v-model="form.category" class="w-[140px]">
            <el-option label="应发" value="EARNING" />
            <el-option label="扣项" value="DEDUCTION" />
            <el-option label="公司成本" value="EMPLOYER_COST" />
          </el-select>
        </el-form-item>
        <el-form-item label="计算">
          <el-select v-model="form.calcKind" class="w-[120px]">
            <el-option label="录入" value="INPUT" />
            <el-option label="公式" value="FORMULA" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.calcKind === 'FORMULA'" label="公式">
          <el-input
            v-model="form.formula"
            class="w-[320px]"
            placeholder="BASE+PERF 或 IF(BASE>=10000,BASE*2,BASE)"
          />
          <div class="text-xs text-gray-500 mt-1 w-full">
            支持 + - * 与有界 IF(条件,真,假)；条件为比较（&gt; &gt;= &lt; &lt;=
            == !=）；嵌套深度≤3；不支持除法/AND/OR/字符串。
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="createItem">创建</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading">
      <template #header>
        <div class="flex justify-between items-center">
          <span>工资项目定义</span>
          <el-button @click="load">刷新</el-button>
        </div>
      </template>
      <el-table :data="rows" border>
        <el-table-column prop="code" label="编码" width="120" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="category" label="类别" width="120" />
        <el-table-column prop="calcKind" label="计算" width="100" />
        <el-table-column prop="formula" label="公式" min-width="160" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="系统" width="80">
          <template #default="{ row }">{{
            row.isSystem ? "是" : "否"
          }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.active ? 'success' : 'info'">
              {{ row.active ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="toggleActive(row as SalaryItemDefinition)"
            >
              {{ row.active ? "停用" : "启用" }}
            </el-button>
            <el-button
              v-if="!row.isSystem"
              link
              type="danger"
              @click="remove(row as SalaryItemDefinition)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
