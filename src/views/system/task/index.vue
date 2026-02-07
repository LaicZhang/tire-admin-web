<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "../../../utils/constants";
import { ref, reactive, onMounted, h } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import { message } from "@/utils/message";
import { handleApiError } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import {
  getTaskListApi,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
  runTaskApi,
  type TaskItem
} from "@/api/system/task";
import EditPen from "~icons/ep/edit-pen";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import Play from "~icons/ep/video-play";
import View from "~icons/ep/view";
import DeleteButton from "@/components/DeleteButton/index.vue";
import type { FormInstance } from "element-plus";

defineOptions({
  name: "TaskManagement"
});

const loading = ref(true);
const dataList = ref<TaskItem[]>([]);
const searchFormRef = ref<FormInstance>();
const pagination = reactive({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

const form = reactive({
  name: "",
  status: undefined as boolean | undefined
});

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getTaskListApi({
      page: pagination.currentPage,
      limit: pagination.pageSize,
      ...form
    });
    dataList.value = data.list || [];
    pagination.total = data.total || 0;
  } catch (e) {
    handleApiError(e, "查询失败");
  } finally {
    loading.value = false;
  }
}

const resetForm = (formEl?: FormInstance) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

async function handleDelete(row: TaskItem) {
  try {
    await deleteTaskApi(row.id);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e) {
    message(e.message || "删除失败", { type: "error" });
  }
}

async function handleRun(row: TaskItem) {
  try {
    await runTaskApi(row.id);
    message("执行指令已发送", { type: "success" });
  } catch (e) {
    message(e.message || "执行失败", { type: "error" });
  }
}

function viewDetail(row: TaskItem) {
  addDialog({
    title: "任务详情",
    width: "50%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: true,
    contentRenderer: () =>
      h("div", { class: "task-detail" }, [
        h(
          "el-descriptions",
          { column: 2, border: true },
          {
            default: () => [
              h("el-descriptions-item", { label: "任务名称" }, row.name),
              h("el-descriptions-item", { label: "Service" }, row.service),
              h("el-descriptions-item", { label: "Cron表达式" }, row.cron),
              h("el-descriptions-item", { label: "状态" }, [
                h(
                  "el-tag",
                  { type: row.status ? "success" : "info" },
                  row.status ? "启用" : "禁用"
                )
              ]),
              h(
                "el-descriptions-item",
                { label: "下次执行时间", span: 2 },
                row.nextRunTime || "-"
              ),
              h(
                "el-descriptions-item",
                { label: "创建时间", span: 2 },
                row.createTime
              ),
              h("el-descriptions-item", { label: "参数", span: 2 }, [
                h(
                  "pre",
                  {
                    style:
                      "margin: 0; white-space: pre-wrap; word-break: break-all; background: var(--el-fill-color-light); padding: 8px; border-radius: 4px;"
                  },
                  row.parameters || "-"
                )
              ]),
              h("el-descriptions-item", { label: "描述", span: 2 }, [
                h(
                  "div",
                  {
                    style:
                      "white-space: pre-wrap; word-break: break-all; min-height: 50px;"
                  },
                  row.description || "暂无描述"
                )
              ])
            ]
          }
        )
      ])
  });
}

function openDialog(title = "新增", row?: TaskItem) {
  addDialog({
    title: `${title}任务`,
    props: {
      formInline: {
        name: row?.name ?? "",
        service: row?.service ?? "",
        cron: row?.cron ?? "",
        parameters: row?.parameters ?? "",
        description: row?.description ?? "",
        status: row?.status ?? true
      }
    },
    width: "45%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const { formInline } = options.props! as {
        formInline: {
          name: string;
          service: string;
          cron: string;
          parameters: string;
          description: string;
          status: boolean;
        };
      };
      return h("div", [
        h("el-form", { model: formInline, labelWidth: "100px" }, [
          h("el-form-item", { label: "任务名称", required: true }, [
            h("el-input", {
              modelValue: formInline.name,
              "onUpdate:modelValue": (val: string) => (formInline.name = val),
              placeholder: "请输入任务名称"
            })
          ]),
          h("el-form-item", { label: "Service", required: true }, [
            h("el-input", {
              modelValue: formInline.service,
              "onUpdate:modelValue": (val: string) =>
                (formInline.service = val),
              placeholder: "例如: demoTask"
            })
          ]),
          h("el-form-item", { label: "Cron表达式", required: true }, [
            h("el-input", {
              modelValue: formInline.cron,
              "onUpdate:modelValue": (val: string) => (formInline.cron = val),
              placeholder: "例如: 0 0 12 * * ?"
            })
          ]),
          h("el-form-item", { label: "参数" }, [
            h("el-input", {
              modelValue: formInline.parameters,
              "onUpdate:modelValue": (val: string) =>
                (formInline.parameters = val),
              placeholder: "JSON 格式参数"
            })
          ]),
          h("el-form-item", { label: "状态" }, [
            h("el-switch", {
              modelValue: formInline.status,
              "onUpdate:modelValue": (val: boolean) =>
                (formInline.status = val),
              activeText: "启用",
              inactiveText: "禁用"
            })
          ]),
          h("el-form-item", { label: "描述" }, [
            h("el-input", {
              modelValue: formInline.description,
              "onUpdate:modelValue": (val: string) =>
                (formInline.description = val),
              type: "textarea",
              rows: 3
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const data = (
        options.props! as {
          formInline: {
            name: string;
            service: string;
            cron: string;
            parameters: string;
            description: string;
            status: boolean;
          };
        }
      ).formInline;
      if (!data.name || !data.cron || !data.service) {
        message("请补全必填信息", { type: "warning" });
        return;
      }
      const promise =
        title === "新增" ? createTaskApi(data) : updateTaskApi(row!.id, data);
      promise.then(() => {
        message("操作成功", { type: "success" });
        done();
        onSearch();
      });
    }
  });
}

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="任务名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入任务名称"
          clearable
          class="w-[200px]!"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="form.status"
          placeholder="请选择状态"
          clearable
          class="w-[120px]!"
        >
          <el-option label="启用" :value="true" />
          <el-option label="禁用" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button
          :icon="useRenderIcon(Refresh)"
          @click="resetForm(searchFormRef)"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="定时任务" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增任务
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
              :icon="useRenderIcon(View)"
              @click="viewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              class="reset-margin"
              link
              type="success"
              :icon="useRenderIcon(Play)"
              @click="handleRun(row)"
            >
              执行
            </el-button>
            <el-button
              class="reset-margin"
              link
              type="primary"
              :icon="useRenderIcon(EditPen)"
              @click="openDialog('修改', row)"
            >
              修改
            </el-button>
            <DeleteButton :show-icon="false" @confirm="handleDelete(row)" />
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
