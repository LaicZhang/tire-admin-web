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
    label: "预警规则",
    prop: "name"
  },
  {
    label: "提前预警天数",
    prop: "leadDays"
  },
  {
    label: "紧急预警天数",
    prop: "urgentDays"
  },
  {
    label: "备注",
    prop: "desc"
  }
];

const getData = async () => {
  loading.value = true;
  const { data, code, msg } = await getExpiryAlertListApi({
    page: pagination.value.currentPage,
    pageSize: pagination.value.pageSize
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
        name: "",
        leadDays: 30,
        urgentDays: 7,
        desc: ""
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
        h("el-form", { model: formInline, labelWidth: "100px" }, [
          h("el-form-item", { label: "规则名称", required: true }, [
            h("el-input", {
              modelValue: formInline.name,
              "onUpdate:modelValue": (val: string) => (formInline.name = val),
              placeholder: "请输入规则名称"
            })
          ]),
          h("el-form-item", { label: "提前预警天数" }, [
            h("el-input-number", {
              modelValue: formInline.leadDays,
              "onUpdate:modelValue": (val: number) =>
                (formInline.leadDays = val),
              min: 1
            })
          ]),
          h("el-form-item", { label: "紧急预警天数" }, [
            h("el-input-number", {
              modelValue: formInline.urgentDays,
              "onUpdate:modelValue": (val: number) =>
                (formInline.urgentDays = val),
              min: 1
            })
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
      const data = options.props.formInline;
      if (!data.name) {
        message("请输入名称", { type: "warning" });
        return;
      }
      createExpiryAlertApi(data).then(() => {
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
