<script setup lang="ts">
import { ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import DeleteButton from "@/components/DeleteButton/index.vue";
import {
  getIncomeExpenseItemListApi,
  createIncomeExpenseItemApi,
  deleteIncomeExpenseItemApi
} from "@/api/finance";
import type { IncomeExpenseItem } from "@/api/finance";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";

defineOptions({
  name: "FinanceItem"
});

const form = ref<{ type?: IncomeExpenseItem["type"] }>({});

const {
  loading,
  dataList,
  pagination,
  fetchData: getData,
  onCurrentChange
} = useCrud<
  IncomeExpenseItem,
  CommonResult<{ list: IncomeExpenseItem[]; count: number }>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getIncomeExpenseItemListApi(page, form.value) as Promise<
      CommonResult<{ list: IncomeExpenseItem[]; count: number }>
    >,
  pagination: {
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  },
  transform: res => {
    if (res.code !== 200) {
      message(res.msg || "加载失败", { type: "error" });
      return { list: [], total: 0 };
    }
    return {
      list: res.data?.list ?? [],
      total: res.data?.count ?? 0
    };
  },
  immediate: true
});

const columns = [
  {
    label: "名称",
    prop: "name"
  },
  {
    label: "类型",
    prop: "type",
    cellRenderer: ({ row }: { row: IncomeExpenseItem }) => {
      const map: Record<IncomeExpenseItem["type"], string> = {
        income: "收入",
        expense: "支出"
      };
      return map[row.type];
    }
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];

const handleSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  getData();
};

const handleDelete = async (row: IncomeExpenseItem) => {
  await deleteIncomeExpenseItemApi(row.id);
  message("删除成功", { type: "success" });
  getData();
};

function openDialog() {
  addDialog({
    title: "新增收支项目",
    props: {
      formInline: {
        name: "",
        type: "expense",
        desc: ""
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const { formInline } = options.props! as {
        formInline: { name: string; type: "income" | "expense"; desc: string };
      };
      return h("div", [
        h("el-form", { model: formInline, labelWidth: "80px" }, [
          h("el-form-item", { label: "名称", required: true }, [
            h("el-input", {
              modelValue: formInline.name,
              "onUpdate:modelValue": (val: string) => (formInline.name = val),
              placeholder: "请输入项目名称"
            })
          ]),
          h("el-form-item", { label: "类型", required: true }, [
            h(
              "el-radio-group",
              {
                modelValue: formInline.type,
                "onUpdate:modelValue": (val: IncomeExpenseItem["type"]) =>
                  (formInline.type = val)
              },
              [
                h("el-radio", { label: "income" }, () => "收入"),
                h("el-radio", { label: "expense" }, () => "支出")
              ]
            )
          ]),
          h("el-form-item", { label: "备注" }, [
            h("el-input", {
              modelValue: formInline.desc,
              "onUpdate:modelValue": (val: string) => (formInline.desc = val),
              type: "textarea"
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const curData = (
        options.props! as {
          formInline: {
            name: string;
            type: "income" | "expense";
            desc: string;
          };
        }
      ).formInline;
      if (!curData.name) {
        message("请输入名称", { type: "warning" });
        return;
      }
      createIncomeExpenseItemApi(curData).then(() => {
        message("创建成功", { type: "success" });
        done();
        getData();
      });
    }
  });
}
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-form
        :inline="true"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-3 overflow-auto"
      >
        <el-form-item label="类型">
          <el-select
            v-model="form.type"
            placeholder="全部类型"
            clearable
            class="w-[150px]"
          >
            <el-option label="收入" value="income" />
            <el-option label="支出" value="expense" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:search-line')"
            :loading="loading"
            @click="handleSearch"
          >
            搜索
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="m-1">
      <PureTableBar title="收支项目管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增项目
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :size="size"
            :columns="columns"
            border
            :data="dataList"
            :loading="loading"
            :pagination="{ ...pagination, size }"
            @page-current-change="onCurrentChange"
          >
            <template #operation="{ row }">
              <DeleteButton @confirm="handleDelete(row)" />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
