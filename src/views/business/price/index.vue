<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getPriceListListApi,
  createPriceListApi,
  updatePriceListApi,
  deletePriceListApi
} from "@/api/business/price";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import Form from "./form.vue"; // We will create this next

defineOptions({
  name: "PriceList"
});

const dataList = ref<any[]>([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = ref({
  name: undefined
});

const columns = [
  {
    label: "名称",
    prop: "name"
  },
  {
    label: "类型",
    prop: "type",
    cellRenderer: ({ row }: { row: any }) => {
      const map: Record<string, string> = { SYSTEM: "系统", CUSTOM: "自定义" };
      return map[String(row.type)] || row.type;
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
  const { data, code, msg } = await getPriceListListApi(
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

const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
  getData();
};

const handleDelete = async (row: any) => {
  await deletePriceListApi(row.id);
  message("删除成功", { type: "success" });
  getData();
};

function openDialog(title = "新增", row?: any) {
  addDialog({
    title: `${title}价目表`,
    props: {
      formInline: {
        id: row?.id,
        name: row?.name ?? "",
        desc: row?.desc ?? "",
        type: row?.type ?? "CUSTOM"
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(Form, { formInline: options.props.formInline }),
    beforeSure: (done, { options }) => {
      const curData = options.props.formInline;
      // Verification logic here if needed
      const promise =
        title === "新增"
          ? createPriceListApi(curData)
          : updatePriceListApi(curData.id, curData);

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
    <el-card class="m-1">
      <el-form
        :inline="true"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-3 overflow-auto"
      >
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="请输入名称" clearable />
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
      <PureTableBar title="价目表管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增价目表
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
    </el-card>
  </div>
</template>
