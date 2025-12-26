<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getRepoZoneListApi,
  createRepoZoneApi,
  deleteRepoZoneApi,
  type Zone
} from "@/api/business/stock";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";

defineOptions({
  name: "StockLocation"
});

const dataList = ref<Zone[]>([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const columns = [
  {
    label: "库区名称",
    prop: "name"
  },
  {
    label: "所属仓库",
    prop: "repoName"
  },
  {
    label: "货位数量",
    prop: "binCount"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];

const getData = async () => {
  loading.value = true;
  const { data, code, msg } = await getRepoZoneListApi(
    pagination.value.currentPage
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

const handleDelete = async (row: Zone) => {
  await deleteRepoZoneApi(String(row.id));
  message("删除成功", { type: "success" });
  getData();
};

function openDialog(title = "新增", row?: any) {
  addDialog({
    title: `${title}库区`,
    props: {
      name: "",
      repoId: ""
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      return h("div", [
        h("el-form", {}, [
          h("el-form-item", { label: "仓库ID" }, [
            h("el-input", {
              modelValue: options.props.repoId,
              "onUpdate:modelValue": (val: string) =>
                (options.props.repoId = val),
              placeholder: "请输入仓库ID (后期改为下拉)"
            })
          ]),
          h("el-form-item", { label: "库区名称" }, [
            h("el-input", {
              modelValue: options.props.name,
              "onUpdate:modelValue": (val: string) =>
                (options.props.name = val),
              placeholder: "例如：A区"
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const data = {
        name: options.props.name,
        repoId: options.props.repoId
      };
      createRepoZoneApi(data).then(() => {
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
      <PureTableBar title="库区管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增库区
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

    <!-- Note: Bin Management would logically be a sub-view or drill-down. 
         For simplicity in this batch, we assume it's managed under Zone or separate tab.
         Here we only implemented Zone list first. -->
  </div>
</template>
