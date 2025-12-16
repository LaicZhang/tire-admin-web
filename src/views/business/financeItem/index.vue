<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getIncomeExpenseItemListApi,
  createIncomeExpenseItemApi,
  deleteIncomeExpenseItemApi
} from "@/api/finance";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";

defineOptions({
  name: "FinanceItem"
});

const dataList = ref([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = ref({
  type: undefined
});

const columns = [
  {
    label: "名称",
    prop: "name"
  },
  {
    label: "类型",
    prop: "type",
    cellRenderer: ({ row }) => {
      const map = { income: "收入", expense: "支出" };
      return map[row.type] || row.type;
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

const getData = async () => {
  loading.value = true;
  const { data, code, msg } = await getIncomeExpenseItemListApi(
    pagination.value.currentPage,
    form.value
  );
  if (code === 200) {
    dataList.value = data.list;
    pagination.value.total = data.count;
  } else {
    message(msg, { type: "error" });
  }
  loading.value = false;
};

const handleCurrentChange = val => {
  pagination.value.currentPage = val;
  getData();
};

const handleDelete = async row => {
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
      const { formInline } = options.props; // Simple inline render or create separate file
      return h("div", [
        h("el-form", { model: formInline, labelWidth: "80px" }, [
          h("el-form-item", { label: "名称", required: true }, [
            h("el-input", {
              modelValue: formInline.name,
              "onUpdate:modelValue": val => (formInline.name = val),
              placeholder: "请输入项目名称"
            })
          ]),
          h("el-form-item", { label: "类型", required: true }, [
            h(
              "el-radio-group",
              {
                modelValue: formInline.type,
                "onUpdate:modelValue": val => (formInline.type = val)
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
              "onUpdate:modelValue": val => (formInline.desc = val),
              type: "textarea"
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const curData = options.props.formInline;
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

onMounted(() => {
  getData();
});
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
            @click="getData"
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
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
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
    </el-card>
  </div>
</template>
