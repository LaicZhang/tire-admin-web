<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { message, handleApiError } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import {
  getNoticeListApi,
  createNoticeApi,
  updateNoticeApi,
  deleteNoticeApi,
  type NoticeItem
} from "@/api/system/notice";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import View from "~icons/ep/view";
import DeleteButton from "@/components/DeleteButton/index.vue";

defineOptions({
  name: "NoticeManagement"
});

const loading = ref(true);
const dataList = ref<NoticeItem[]>([]);
const searchFormRef = ref();
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = reactive({
  title: "",
  type: undefined as number | undefined
});

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getNoticeListApi({
      page: pagination.currentPage,
      limit: pagination.pageSize,
      ...form
    });
    dataList.value = data.list || [];
    pagination.total = data.total || 0;
  } catch (e) {
    handleApiError(e, "获取公告列表失败");
  } finally {
    loading.value = false;
  }
}

const resetForm = (formEl: { resetFields: () => void } | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

async function handleDelete(row: NoticeItem) {
  try {
    await deleteNoticeApi(row.id);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e) {
    message(e.message || "删除失败", { type: "error" });
  }
}

function viewDetail(row: NoticeItem) {
  addDialog({
    title: "公告详情",
    width: "50%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: true,
    contentRenderer: () =>
      h("div", { class: "notice-detail" }, [
        h(
          "el-descriptions",
          { column: 2, border: true },
          {
            default: () => [
              h("el-descriptions-item", { label: "标题", span: 2 }, row.title),
              h(
                "el-descriptions-item",
                { label: "类型" },
                row.type === 1 ? "通知" : "公告"
              ),
              h("el-descriptions-item", { label: "状态" }, [
                h(
                  "el-tag",
                  { type: row.status ? "success" : "info" },
                  row.status ? "正常" : "关闭"
                )
              ]),
              h(
                "el-descriptions-item",
                { label: "创建时间", span: 2 },
                row.createTime
              ),
              h("el-descriptions-item", { label: "内容", span: 2 }, [
                h(
                  "div",
                  {
                    style:
                      "white-space: pre-wrap; word-break: break-all; min-height: 100px; padding: 10px; background: var(--el-fill-color-light); border-radius: 4px;"
                  },
                  row.content || "暂无内容"
                )
              ])
            ]
          }
        )
      ])
  });
}

function openDialog(title = "新增", row?: NoticeItem) {
  addDialog({
    title: `${title}公告`,
    props: {
      formInline: {
        title: row?.title ?? "",
        type: row?.type ?? 1,
        content: row?.content ?? "",
        status: row?.status ?? true
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const { formInline } = options.props! as {
        formInline: {
          title: string;
          type: number;
          content: string;
          status: boolean;
        };
      };
      return h("div", [
        h("el-form", { model: formInline, labelWidth: "80px" }, [
          h("el-form-item", { label: "公告标题", required: true }, [
            h("el-input", {
              modelValue: formInline.title,
              "onUpdate:modelValue": (val: string) => (formInline.title = val),
              placeholder: "请输入标题"
            })
          ]),
          h("el-form-item", { label: "公告类型", required: true }, [
            h(
              "el-select",
              {
                modelValue: formInline.type,
                "onUpdate:modelValue": (val: number) => (formInline.type = val),
                class: "w-full"
              },
              {
                default: () => [
                  h("el-option", { label: "通知", value: 1 }),
                  h("el-option", { label: "公告", value: 2 })
                ]
              }
            )
          ]),
          h("el-form-item", { label: "状态" }, [
            h(
              "el-radio-group",
              {
                modelValue: formInline.status,
                "onUpdate:modelValue": (val: boolean) =>
                  (formInline.status = val)
              },
              {
                default: () => [
                  h("el-radio", { value: true, label: "正常" }),
                  h("el-radio", { value: false, label: "关闭" })
                ]
              }
            )
          ]),
          h("el-form-item", { label: "内容" }, [
            h("el-input", {
              modelValue: formInline.content,
              "onUpdate:modelValue": (val: string) =>
                (formInline.content = val),
              type: "textarea",
              rows: 6
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const data = (
        options.props! as {
          formInline: {
            title: string;
            type: number;
            content: string;
            status: boolean;
          };
        }
      ).formInline;
      if (!data.title) {
        message("请输入标题", { type: "warning" });
        return;
      }
      const promise =
        title === "新增"
          ? createNoticeApi(data)
          : updateNoticeApi(row!.id, data);
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
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="resetForm(searchFormRef)"
    >
      <el-form-item label="公告标题" prop="title">
        <el-input
          v-model="form.title"
          placeholder="请输入公告标题"
          clearable
          class="w-[200px]!"
        />
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择类型"
          clearable
          class="w-[120px]!"
        >
          <el-option label="通知" :value="1" />
          <el-option label="公告" :value="2" />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="公告管理" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增公告
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
              查看
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
