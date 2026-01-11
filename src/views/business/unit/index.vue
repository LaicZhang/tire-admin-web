<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import DeleteButton from "@/components/DeleteButton/index.vue";
import {
  getUnitListApi,
  createUnitApi,
  deleteUnitApi,
  type Unit
} from "@/api/business/unit";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";

defineOptions({
  name: "Unit"
});

const dataList = ref<Unit[]>([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const columns = [
  {
    label: "单位名称",
    prop: "name"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];

const getData = async () => {
  loading.value = true;
  const { data, code, msg } = await getUnitListApi(
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

const handleDelete = async (row: Unit) => {
  await deleteUnitApi(row.id);
  message("删除成功", { type: "success" });
  getData();
};

function openDialog() {
  addDialog({
    title: "新增计量单位",
    props: {
      name: ""
    },
    width: "30%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const props = options.props as { name: string };
      return h("div", [
        h("el-form", {}, [
          h("el-form-item", { label: "名称", required: true }, [
            h("el-input", {
              modelValue: props.name,
              "onUpdate:modelValue": (val: string) => (props.name = val),
              placeholder: "请输入单位名称 (如: 个、箱)"
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const props = options.props as { name: string };
      const name = props.name;
      if (!name) {
        message("请输入名称", { type: "warning" });
        return;
      }
      createUnitApi({ name }).then(() => {
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
      <PureTableBar title="计量单位管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增单位
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
              <DeleteButton @confirm="handleDelete(row)" />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
