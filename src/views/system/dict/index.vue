<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getDictListApi,
  createDictApi,
  updateDictApi,
  deleteDictApi
} from "@/api/system/dict";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";

defineOptions({
  name: "DictManagement"
});

const dataList = ref([]);
const loading = ref(false);
const searchFormRef = ref();
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = reactive({
  name: "",
  code: ""
});

const columns: TableColumnList = [
  {
    label: "字典名称",
    prop: "name",
    minWidth: 120
  },
  {
    label: "字典编码",
    prop: "code",
    minWidth: 120
  },
  {
    label: "备注",
    prop: "desc",
    minWidth: 200
  },
  {
    label: "创建时间",
    prop: "createdAt",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 150
  }
];

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
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const resetForm = formEl => {
  if (!formEl) return;
  formEl.resetFields();
  getData();
};

const handleDelete = async row => {
  try {
    await deleteDictApi(row.id);
    message("删除成功", { type: "success" });
    getData();
  } catch (e) {
    message(e.message || "删除失败", { type: "error" });
  }
};

function openDialog(title = "新增", row?: any) {
  addDialog({
    title: `${title}字典`,
    props: {
      formInline: {
        name: row?.name ?? "",
        code: row?.code ?? "",
        desc: row?.desc ?? ""
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const { formInline } = options.props;
      return h("div", [
        h("el-form", { model: formInline, labelWidth: "80px" }, [
          h("el-form-item", { label: "字典名称", required: true }, [
            h("el-input", {
              modelValue: formInline.name,
              "onUpdate:modelValue": val => (formInline.name = val),
              placeholder: "例如：性别"
            })
          ]),
          h("el-form-item", { label: "字典编码", required: true }, [
            h("el-input", {
              modelValue: formInline.code,
              "onUpdate:modelValue": val => (formInline.code = val),
              placeholder: "例如：gender",
              disabled: title === "修改"
            })
          ]),
          h("el-form-item", { label: "备注" }, [
            h("el-input", {
              modelValue: formInline.desc,
              "onUpdate:modelValue": val => (formInline.desc = val),
              type: "textarea",
              rows: 3
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const data = options.props.formInline;
      if (!data.name || !data.code) {
        message("请输入名称和编码", { type: "warning" });
        return;
      }
      const promise =
        title === "新增" ? createDictApi(data) : updateDictApi(row.id, data);

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
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="字典名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入字典名称"
          clearable
          class="!w-[180px]"
        />
      </el-form-item>
      <el-form-item label="字典编码" prop="code">
        <el-input
          v-model="form.code"
          placeholder="请输入字典编码"
          clearable
          class="!w-[180px]"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="getData"
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
              class="reset-margin"
              link
              type="primary"
              :icon="useRenderIcon(EditPen)"
              @click="openDialog('修改', row)"
            >
              修改
            </el-button>
            <el-popconfirm title="确认删除?" @confirm="handleDelete(row)">
              <template #reference>
                <el-button
                  class="reset-margin"
                  link
                  type="danger"
                  :icon="useRenderIcon(Delete)"
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 20px;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
