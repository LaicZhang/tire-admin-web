<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import type { UploadFile } from "element-plus";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { message, handleApiError } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import {
  getFileListApi,
  deleteFileApi,
  restoreFileApi,
  uploadFileApi,
  type FileItem
} from "@/api/system/file";
import UploadFilled from "~icons/ep/upload-filled";
import Download from "~icons/ep/download";
import DeleteButton from "@/components/DeleteButton/index.vue";

defineOptions({
  name: "FileManagement"
});

const loading = ref(true);
const dataList = ref<FileItem[]>([]);
const searchFormRef = ref();
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = reactive({
  fileName: "",
  fileType: "",
  scope: "nonDeleted" as "nonDeleted" | "deleted" | "all"
});

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getFileListApi({
      page: pagination.currentPage,
      limit: pagination.pageSize,
      ...form
    });
    dataList.value = data.list || [];
    pagination.total = data.total || 0;
  } catch (e) {
    handleApiError(e, "获取文件列表失败");
  } finally {
    loading.value = false;
  }
}

const resetForm = (formEl: { resetFields: () => void } | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

async function handleDelete(row: FileItem) {
  try {
    await deleteFileApi(row.id);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e) {
    message(e instanceof Error ? e.message : "删除失败", { type: "error" });
  }
}

async function handleRestore(row: FileItem) {
  try {
    await restoreFileApi(row.id);
    message("恢复成功", { type: "success" });
    onSearch();
  } catch (e) {
    message(e instanceof Error ? e.message : "恢复失败", { type: "error" });
  }
}

async function handleDownload(row: FileItem) {
  const { downloadFromUrl } = await import("@/utils/download");
  await downloadFromUrl(row.fileUrl, row.fileName);
}

function openUploadDialog() {
  const uploadFile = ref<File | null>(null);
  const uploading = ref(false);

  addDialog({
    title: "上传文件",
    width: "30%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () =>
      h("div", { style: "padding: 20px 0" }, [
        h(
          "el-upload",
          {
            drag: true,
            limit: 1,
            autoUpload: false,
            onChange: (file: UploadFile) => {
              uploadFile.value = file.raw ?? null;
            },
            onExceed: () => {
              message("只能上传一个文件", { type: "warning" });
            }
          },
          {
            default: () => [
              h(
                "el-icon",
                {
                  class: "el-icon--upload",
                  style:
                    "font-size: 67px; color: var(--el-text-color-placeholder)"
                },
                [h(UploadFilled)]
              ),
              h("div", { class: "el-upload__text" }, [
                "拖拽文件到此处或 ",
                h("em", "点击上传")
              ])
            ],
            tip: () =>
              h("div", { class: "el-upload__tip" }, "支持上传任意类型文件")
          }
        )
      ]),
    beforeSure: async done => {
      if (!uploadFile.value) {
        message("请选择文件", { type: "warning" });
        return;
      }
      uploading.value = true;
      try {
        const formData = new FormData();
        formData.append("file", uploadFile.value);
        await uploadFileApi(formData);
        message("上传成功", { type: "success" });
        done();
        onSearch();
      } catch (e) {
        message(e instanceof Error ? e.message : "上传失败", { type: "error" });
      } finally {
        uploading.value = false;
      }
    }
  });
}

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="resetForm(searchFormRef)"
    >
      <el-form-item label="文件名称" prop="fileName">
        <el-input
          v-model="form.fileName"
          placeholder="请输入文件名称"
          clearable
          class="w-[200px]!"
        />
      </el-form-item>
      <el-form-item label="文件类型" prop="fileType">
        <el-select
          v-model="form.fileType"
          placeholder="请选择类型"
          clearable
          class="!w-[150px]"
        >
          <el-option label="图片" value="image/" />
          <el-option label="文档" value="application/" />
          <el-option label="视频" value="video/" />
          <el-option label="音频" value="audio/" />
        </el-select>
      </el-form-item>
      <el-form-item label="范围" prop="scope">
        <el-select v-model="form.scope" clearable class="!w-[150px]">
          <el-option label="未删除" value="nonDeleted" />
          <el-option label="已删除" value="deleted" />
          <el-option label="全部" value="all" />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="文件管理" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(UploadFilled)"
          @click="openUploadDialog"
        >
          上传文件
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="onSearch"
          @page-current-change="onSearch"
        >
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :icon="useRenderIcon(Download)"
              @click="handleDownload(row)"
            >
              下载
            </el-button>
            <DeleteButton
              v-if="!row.deleteTime"
              :show-icon="false"
              @confirm="handleDelete(row)"
            />
            <el-button
              v-else
              class="reset-margin"
              link
              type="primary"
              @click="handleRestore(row)"
            >
              恢复
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}

.search-form {
  @extend .search-form;
}
</style>
