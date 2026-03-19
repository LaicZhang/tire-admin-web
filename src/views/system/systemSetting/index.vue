<script setup lang="ts">
import { onMounted, reactive, ref, h } from "vue";
import { columns } from "./columns";
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Plus from "~icons/ep/plus";
import Save from "~icons/ep/check";
import Delete from "~icons/ep/delete";
import { addDialog, closeAllDialog } from "@/composables/useDialogService";
import { message, confirmBox, handleApiError } from "@/utils";
import {
  createSystemSettingApi,
  deleteSystemSettingApi,
  getSystemSettingPageApi,
  updateSystemSettingApi,
  type SystemSetting
} from "@/api/system/system-setting";
import SystemSettingForm, { type SystemSettingFormData } from "./form.vue";

defineOptions({
  name: "SystemSettingAdmin"
});

const RECOMMENDED_ENV_KEYS: string[] = [
  "BACKUP_CRON_EXPRESSION",
  "BACKUP_COMMAND_TIMEOUT_MS",
  "BACKUP_PG_IMAGE",
  "CRON_JOB_TIMEOUT_MS"
];

const loading = ref(false);
type EditableSystemSetting = Omit<SystemSetting, "value"> & { value: string };
const list = ref<EditableSystemSetting[]>([]);
const filters = reactive({
  group: "",
  key: "",
  isPublic: "" as "" | "true" | "false"
});
const pagination = reactive({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

const buildQuery = () => {
  const query: Record<string, unknown> = {};
  if (filters.group.trim()) query.group = filters.group.trim();
  if (filters.key.trim()) query.key = filters.key.trim();
  if (filters.isPublic === "true") query.isPublic = true;
  if (filters.isPublic === "false") query.isPublic = false;
  return query;
};

const loadData = async () => {
  loading.value = true;
  try {
    const { code, data, msg } = await getSystemSettingPageApi(
      pagination.currentPage,
      buildQuery()
    );
    if (code !== 200) {
      message(msg || "加载系统设置失败", { type: "error" });
      list.value = [];
      pagination.total = 0;
      return;
    }
    list.value = (data?.list ?? []).map(item => ({
      ...item,
      value: item.value ?? ""
    }));
    pagination.total = data?.count ?? 0;
  } catch (error) {
    list.value = [];
    pagination.total = 0;
    handleApiError(error, "加载系统设置失败");
  } finally {
    loading.value = false;
  }
};

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
  loadData();
};

const handleSearch = () => {
  pagination.currentPage = 1;
  loadData();
};

const handleSaveRow = async (row: EditableSystemSetting) => {
  if (!row.uid) {
    message("缺少 uid，无法保存", { type: "error" });
    return;
  }
  loading.value = true;
  try {
    const { code, msg } = await updateSystemSettingApi(row.uid, {
      value: row.value,
      isPublic: row.isPublic
    });
    if (code === 200) {
      message("保存成功", { type: "success" });
      loadData();
    } else {
      message(msg || "保存失败", { type: "error" });
    }
  } catch (error) {
    handleApiError(error, "保存失败");
  } finally {
    loading.value = false;
  }
};

const handleDeleteRow = async (row: EditableSystemSetting) => {
  if (!row.uid) {
    message("缺少 uid，无法删除", { type: "error" });
    return;
  }
  try {
    await confirmBox(`确定删除 key="${row.key}" 的配置吗？`);
    loading.value = true;
    const { code, msg } = await deleteSystemSettingApi(row.uid);
    if (code === 200) {
      message("删除成功", { type: "success" });
      loadData();
    } else {
      message(msg || "删除失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") handleApiError(error, "删除失败");
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  const formRef = ref<{
    formRef?: { validate?: (callback: (valid: boolean) => void) => void };
    getData?: () => SystemSettingFormData;
  }>();
  addDialog({
    title: "新增系统设置",
    width: "600px",
    draggable: true,
    closeOnClickModal: false,
    destroyOnClose: true,
    contentRenderer: () =>
      h(SystemSettingForm, {
        ref: formRef,
        initial: { group: "env", isPublic: false },
        recommendedEnvKeys: RECOMMENDED_ENV_KEYS
      }),
    beforeSure: async done => {
      const FormRef = formRef.value?.formRef ?? null;
      if (!FormRef?.validate) return;
      FormRef.validate(async (valid: boolean) => {
        if (!valid) return;
        const data = formRef.value?.getData?.();
        if (!data) return;
        loading.value = true;
        try {
          const { code, msg } = await createSystemSettingApi({
            group: data.group.trim() || null,
            key: data.key.trim(),
            value: data.value,
            isPublic: data.isPublic
          });
          if (code === 200) {
            message("创建成功", { type: "success" });
            closeAllDialog();
            loadData();
            done();
          } else {
            message(msg || "创建失败", { type: "error" });
          }
        } catch (error) {
          handleApiError(error, "创建失败");
        } finally {
          loading.value = false;
        }
      });
    }
  });
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main p-4">
    <div class="bg-white p-4 mb-4 rounded-md">
      <div class="flex gap-3 items-center flex-wrap">
        <el-input
          v-model="filters.group"
          style="width: 180px"
          placeholder="分组(group)"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="filters.key"
          style="width: 260px"
          placeholder="Key(contains)"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select v-model="filters.isPublic" style="width: 140px" clearable>
          <el-option label="全部" value="" />
          <el-option label="公开" value="true" />
          <el-option label="非公开" value="false" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button :icon="useRenderIcon(Plus)" @click="openCreateDialog">
          新增
        </el-button>
      </div>
    </div>

    <div class="bg-white p-4 rounded-md">
      <PureTableBar
        title="系统设置(SystemSetting)"
        :columns="columns"
        @refresh="loadData"
      >
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            border
            align-whole="center"
            showOverflowTooltip
            :loading="loading"
            :size="size"
            :data="list"
            :columns="dynamicColumns"
            :pagination="pagination"
            @page-current-change="handleCurrentChange"
          >
            <template #value="{ row }">
              <el-input v-model="row.value" placeholder="请输入值" />
            </template>
            <template #isPublic="{ row }">
              <el-switch v-model="row.isPublic" />
            </template>
            <template #operation="{ row }">
              <el-button
                link
                type="primary"
                :icon="useRenderIcon(Save)"
                :disabled="loading"
                @click="handleSaveRow(row)"
              >
                保存
              </el-button>
              <el-button
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                :disabled="loading"
                @click="handleDeleteRow(row)"
              >
                删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>
  </div>
</template>
