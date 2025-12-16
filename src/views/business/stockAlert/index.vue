<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import Refresh from "~icons/ep/refresh";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getStockAlertListApi,
  createStockAlertApi,
  scanStockAlertApi
} from "@/api/business/stock-alert";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";

defineOptions({
  name: "StockAlert"
});

const dataList = ref([]);
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
    label: "轮胎规格",
    prop: "tireSpec"
  },
  {
    label: "安全库存",
    prop: "safeStock"
  },
  {
    label: "最高库存",
    prop: "maxStock"
  },
  {
    label: "最低库存",
    prop: "minStock"
  },
  {
    label: "备注",
    prop: "desc"
  }
];

const getData = async () => {
  loading.value = true;
  const { data, code, msg } = await getStockAlertListApi({
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

const handleCurrentChange = val => {
  pagination.value.currentPage = val;
  getData();
};

const handleScan = async () => {
  const { code, msg } = await scanStockAlertApi();
  if (code === 200) {
    message("触发扫描成功", { type: "success" });
  } else {
    message(msg, { type: "error" });
  }
};

function openDialog(title = "新增") {
  addDialog({
    title: `${title}库存预警配置`,
    props: {
      formInline: {
        name: "",
        tireSpec: "",
        safeStock: 0,
        maxStock: 0,
        minStock: 0,
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
        h("el-form", { model: formInline, labelWidth: "80px" }, [
          h("el-form-item", { label: "规则名称", required: true }, [
            h("el-input", {
              modelValue: formInline.name,
              "onUpdate:modelValue": val => (formInline.name = val),
              placeholder: "请输入规则名称"
            })
          ]),
          h("el-form-item", { label: "轮胎规格" }, [
            h("el-input", {
              modelValue: formInline.tireSpec,
              "onUpdate:modelValue": val => (formInline.tireSpec = val),
              placeholder: "暂支持手动输入，后续关联商品选择"
            })
          ]),
          h("el-form-item", { label: "安全库存" }, [
            h("el-input-number", {
              modelValue: formInline.safeStock,
              "onUpdate:modelValue": val => (formInline.safeStock = val),
              min: 0
            })
          ]),
          h("el-form-item", { label: "最低库存" }, [
            h("el-input-number", {
              modelValue: formInline.minStock,
              "onUpdate:modelValue": val => (formInline.minStock = val),
              min: 0
            })
          ]),
          h("el-form-item", { label: "最高库存" }, [
            h("el-input-number", {
              modelValue: formInline.maxStock,
              "onUpdate:modelValue": val => (formInline.maxStock = val),
              min: 0
            })
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
      const data = options.props.formInline;
      if (!data.name) {
        message("请输入名称", { type: "warning" });
        return;
      }
      createStockAlertApi(data).then(() => {
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
      <PureTableBar title="库存预警管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增配置
          </el-button>
          <el-button
            type="success"
            :icon="useRenderIcon(Refresh)"
            @click="handleScan"
          >
            触发扫描
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
