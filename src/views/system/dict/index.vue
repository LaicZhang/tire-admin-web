<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "../../../utils/constants";
import { ref, reactive, onMounted, h } from "vue";
import type { DictItem } from "@/api/system/dict";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getDictListApi,
  createDictApi,
  updateDictApi,
  deleteDictApi,
  restoreDictApi
} from "@/api/system/dict";
import { message, handleApiError } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";

defineOptions({
  name: "DictManagement"
});

const dataList = ref<DictItem[]>([]);
const loading = ref(false);
const searchFormRef = ref();
const pagination = reactive({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

const form = reactive({
  scope: "nonDeleted" as "nonDeleted" | "deleted" | "all",
  name: undefined,
  key: undefined,
  cn: undefined,
  en: undefined,
  isPublic: undefined
});

const getData = async () => {
  loading.value = true;
  try {
    const { data, code, msg } = await getDictListApi(
      pagination.currentPage,
      form
    );
    if (code === 200) {
      dataList.value = data.list || [];
      pagination.total = data.count || data.total || 0;
    } else {
      message(msg, { type: "error" });
    }
  } catch (e) {
    handleApiError(e, "查询失败");
  } finally {
    loading.value = false;
  }
};

const resetForm = (formEl: { resetFields: () => void } | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
  getData();
};

const handleDelete = async (row: DictItem) => {
  try {
    await deleteDictApi(row.id);
    message("删除成功", { type: "success" });
    getData();
  } catch (e: unknown) {
    const err = e as Error;
    message(err.message || "删除失败", { type: "error" });
  }
};

const handleRestore = async (row: DictItem) => {
  try {
    await restoreDictApi(row.id);
    message("恢复成功", { type: "success" });
    getData();
  } catch (e) {
    handleApiError(e, "恢复失败");
  }
};

function openDialog(title = "新增", row?: DictItem) {
  const resolvedKey =
    typeof row?.key === "number"
      ? row.key
      : typeof row?.group === "string"
        ? Number(row.group)
        : 0;
  addDialog({
    title: `${title}字典`,
    props: {
      formInline: {
        name: row?.name ?? "",
        key: Number.isFinite(resolvedKey) ? resolvedKey : 0,
        cn: row?.cn ?? "",
        en: row?.en ?? ""
      }
    },
    width: "46%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const { formInline } = options.props as {
        formInline: { name: string; key: number; cn: string; en: string };
      };
      return h("div", [
        h("el-form", { model: formInline, labelWidth: "90px" }, [
          h("el-form-item", { label: "字典类型", required: true }, [
            h("el-input", {
              modelValue: formInline.name,
              "onUpdate:modelValue": (val: string) => (formInline.name = val),
              placeholder: "例如：gender"
            })
          ]),
          h("el-form-item", { label: "键值", required: true }, [
            h("el-input-number", {
              modelValue: formInline.key,
              "onUpdate:modelValue": (val: number) => (formInline.key = val),
              min: 0,
              style: { width: "100%" }
            })
          ]),
          h("el-form-item", { label: "中文标签" }, [
            h("el-input", {
              modelValue: formInline.cn,
              "onUpdate:modelValue": (val: string) => (formInline.cn = val),
              placeholder: "例如：男"
            })
          ]),
          h("el-form-item", { label: "英文标签" }, [
            h("el-input", {
              modelValue: formInline.en,
              "onUpdate:modelValue": (val: string) => (formInline.en = val),
              placeholder: "例如：Male"
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const data = (
        options.props as {
          formInline: {
            name: string;
            key: number;
            cn: string;
            en: string;
          };
        }
      ).formInline;
      if (!data.name) {
        message("请输入字典类型名称", { type: "warning" });
        return;
      }
      const promise =
        title === "新增" ? createDictApi(data) : updateDictApi(row!.id, data);

      promise.then(() => {
        message("操作成功", { type: "success" });
        done();
        getData();
      });
    }
  });
}

onMounted(() => {
  getData();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="getData"
      @reset="resetForm(searchFormRef)"
    >
      <el-form-item label="范围" prop="scope">
        <el-select
          v-model="form.scope"
          placeholder="请选择范围"
          class="w-[200px]!"
        >
          <el-option label="未删除" value="nonDeleted" />
          <el-option label="已删除" value="deleted" />
          <el-option label="全部" value="all" />
        </el-select>
      </el-form-item>
      <el-form-item label="字典类型" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入字典类型名称"
          clearable
          class="w-[200px]!"
        />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="字典管理" @refresh="getData">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增字典
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          row-key="id"
          :loading="loading"
          :size="size"
          :columns="dynamicColumns"
          :data="dataList"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="getData"
          @page-current-change="getData"
        >
          <template #operation="{ row }">
            <el-button
              v-if="!row.deleteAt"
              class="reset-margin"
              link
              type="primary"
              :icon="useRenderIcon(EditPen)"
              @click="openDialog('修改', row)"
            >
              修改
            </el-button>

            <el-popconfirm
              v-if="row.deleteAt"
              title="是否确认恢复该字典？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleRestore(row)"
            >
              <template #reference>
                <el-button class="reset-margin" link type="primary">
                  恢复
                </el-button>
              </template>
            </el-popconfirm>

            <DeleteButton
              v-if="!row.deleteAt"
              :show-icon="false"
              @confirm="handleDelete(row)"
            />
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
