<script setup lang="ts">
import { ref, reactive, h } from "vue";
import type { AuxiliaryAttrItem } from "./types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import Plus from "~icons/ep/plus";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getAuxiliaryAttrListApi,
  createAuxiliaryAttrApi,
  updateAuxiliaryAttrApi,
  deleteAuxiliaryAttrApi,
  addAuxiliaryAttrValueApi,
  deleteAuxiliaryAttrValueApi
} from "@/api/data/category";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import Form from "./form.vue";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";

defineOptions({
  name: "AuxiliaryAttrManagement"
});

const searchFormRef = ref();

const form = reactive({
  name: ""
});

const {
  loading,
  dataList,
  pagination,
  fetchData: getData,
  onCurrentChange,
  onSizeChange
} = useCrud<
  AuxiliaryAttrItem,
  CommonResult<PaginatedResponseDto<AuxiliaryAttrItem>>,
  { page: number; pageSize: number }
>({
  api: ({ page }) => getAuxiliaryAttrListApi(page, { ...form }),
  pagination: {
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  },
  transform: (res: CommonResult<PaginatedResponseDto<AuxiliaryAttrItem>>) => {
    if (res.code !== 200) {
      message(res.msg, { type: "error" });
      return { list: dataList.value, total: pagination.value.total };
    }
    return {
      list: res.data?.list ?? [],
      total: res.data?.count ?? res.data?.total ?? 0
    };
  },
  immediate: true
});

const columns: TableColumnList = [
  {
    label: "属性名称",
    prop: "name",
    minWidth: 120
  },
  {
    label: "属性值",
    prop: "values",
    minWidth: 300,
    cellRenderer: ({ row }) => {
      if (!row.values?.length) return h("span", "-");
      return h(
        "div",
        { class: "flex flex-wrap gap-1" },
        row.values.map((v: { uid: string; name: string }) =>
          h("el-tag", { key: v.uid, size: "small" }, v.name)
        )
      );
    }
  },
  {
    label: "排序",
    prop: "sort",
    minWidth: 80
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 150
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 200
  }
];

const resetForm = () => {
  searchFormRef.value?.resetFields();
  pagination.value = { ...pagination.value, currentPage: 1 };
  getData();
};

const handleDelete = async (row: AuxiliaryAttrItem) => {
  try {
    const { code, msg } = await deleteAuxiliaryAttrApi(row.uid);
    if (code === 200) {
      message("删除成功", { type: "success" });
      getData();
    } else {
      message(msg || "删除失败", { type: "error" });
    }
  } catch (e: unknown) {
    const err = e as Error;
    message(err.message || "删除失败", { type: "error" });
  }
};

function openDialog(title = "新增", row?: AuxiliaryAttrItem) {
  addDialog({
    title: `${title}辅助属性`,
    props: {
      formInline: {
        name: row?.name ?? "",
        values: row?.values?.map(v => v.name) ?? [],
        sort: row?.sort ?? 0,
        remark: row?.remark ?? ""
      },
      isEdit: title === "修改"
    },
    width: "550px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(Form, { ref: "formRef" }),
    beforeSure: async (done, { options }) => {
      const formRef = (options as unknown).contentRef?.getRef?.();
      if (!formRef) return;
      await formRef.validate(async (valid: boolean) => {
        if (!valid) return;
        const formData = (options.props as unknown).formInline;
        try {
          const promise =
            title === "新增"
              ? createAuxiliaryAttrApi({
                  name: formData.name,
                  values: formData.values,
                  sort: formData.sort,
                  remark: formData.remark
                })
              : updateAuxiliaryAttrApi(row!.uid, {
                  name: formData.name,
                  values: formData.values,
                  sort: formData.sort,
                  remark: formData.remark
                });
          const { code, msg } = await promise;
          if (code === 200) {
            message("操作成功", { type: "success" });
            done();
            getData();
          } else {
            message(msg || "操作失败", { type: "error" });
          }
        } catch (e: unknown) {
          const err = e as Error;
          message(err.message || "操作失败", { type: "error" });
        }
      });
    }
  });
}

function openAddValueDialog(row: AuxiliaryAttrItem) {
  addDialog({
    title: `添加属性值 - ${row.name}`,
    props: {
      formInline: {
        name: ""
      }
    },
    width: "400px",
    draggable: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const formData = (options.props as unknown).formInline;
      return h("el-form", { labelWidth: "80px" }, [
        h("el-form-item", { label: "属性值" }, [
          h("el-input", {
            modelValue: formData.name,
            "onUpdate:modelValue": (val: string) => (formData.name = val),
            placeholder: "请输入属性值"
          })
        ])
      ]);
    },
    beforeSure: async (done, { options }) => {
      const formData = (options.props as unknown).formInline;
      if (!formData.name?.trim()) {
        message("请输入属性值", { type: "warning" });
        return;
      }
      try {
        const { code, msg } = await addAuxiliaryAttrValueApi(
          row.uid,
          formData.name.trim()
        );
        if (code === 200) {
          message("添加成功", { type: "success" });
          done();
          getData();
        } else {
          message(msg || "添加失败", { type: "error" });
        }
      } catch (e: unknown) {
        const err = e as Error;
        message(err.message || "添加失败", { type: "error" });
      }
    }
  });
}
</script>

<template>
  <div class="main">
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="属性名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入属性名称"
          clearable
          class="w-[200px]!"
          @keyup.enter="getData"
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
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="辅助属性" @refresh="getData">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          row-key="uid"
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
          @page-size-change="onSizeChange"
          @page-current-change="onCurrentChange"
        >
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :icon="useRenderIcon(Plus)"
              @click="openAddValueDialog(row)"
            >
              添加值
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
