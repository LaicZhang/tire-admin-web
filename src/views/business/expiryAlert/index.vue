<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getExpiryAlertListApi,
  createExpiryAlertApi
} from "@/api/business/stock-alert";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";

defineOptions({
  name: "ExpiryAlert"
});

const dataList = ref<any[]>([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const columns = [
  {
    label: "仓库",
    prop: "repoId"
  },
  {
    label: "提前预警天数",
    prop: "daysBefore"
  }
];

const getData = async () => {
  loading.value = true;
  const { data, code, msg } = await getExpiryAlertListApi({
    index: pagination.value.currentPage
  });
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

function openDialog(title = "新增") {
  addDialog({
    title: `${title}效期预警配置`,
    props: {
      formInline: {
        repoId: "",
        daysBefore: 30
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const { formInline } = options.props as {
        formInline: { repoId: string; daysBefore: number };
      };
      return h("div", [
        h("el-form", { model: formInline, labelWidth: "100px" }, [
          h("el-form-item", { label: "仓库ID（可选）" }, [
            h("el-input", {
              modelValue: formInline.repoId,
              "onUpdate:modelValue": (val: string) => (formInline.repoId = val),
              placeholder: "为空表示所有仓库"
            })
          ]),
          h("el-form-item", { label: "提前预警天数" }, [
            h("el-input-number", {
              modelValue: formInline.daysBefore,
              "onUpdate:modelValue": (val: number) =>
                (formInline.daysBefore = val),
              min: 1
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const data = (
        options.props as { formInline: { repoId: string; daysBefore: number } }
      ).formInline;
      createExpiryAlertApi({
        repoId: data.repoId || undefined,
        daysBefore: data.daysBefore
      }).then(() => {
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
      <PureTableBar title="效期预警管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增配置
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
          />
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
