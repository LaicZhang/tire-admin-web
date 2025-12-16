<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import EditPen from "~icons/ep/edit-pen";
import { getReserveListApi, updateReserveApi } from "@/api";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { h } from "vue";
import { deviceDetection } from "@pureadmin/utils";
import editForm from "./form.vue";

defineOptions({
  name: "StockTaking"
});

const dataList = ref([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  keyword: ""
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const getList = async () => {
  loading.value = true;
  try {
    const { data, code, msg } = await getReserveListApi(
      pagination.value.currentPage,
      {
        // Simple search if backend supports it, otherwise logic needs refinement
      }
    );
    if (code === 200) {
      dataList.value = data.list;
      pagination.value.total = data.count;
    } else {
      message(msg, { type: "error" });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "获取失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

const onSearch = async () => {
  pagination.value.currentPage = 1;
  await getList();
};

const resetForm = formEl => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getList();
}

function openDialog(row) {
  addDialog({
    title: "盘点录入",
    props: {
      formInline: {
        uid: row.id, // Reserve ID
        tireName: row.tire?.name,
        repoName: row.repo?.name,
        batchNo: row.batchNo,
        systemCount: row.count,
        actualCount: row.count // Default to system count
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(editForm, { ref: formRef }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value.getRef();
      const curData = options.props.formInline;
      FormRef.validate(async valid => {
        if (valid) {
          try {
            // Directly update reserve count.
            // Ideally we should create a Waste/Surplus order, but for simplicity/checklist: "Use updateReserveApi"
            await updateReserveApi(curData.uid, {
              count: curData.actualCount
            });
            message("盘点成功", { type: "success" });
            done();
            onSearch();
          } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : "盘点失败";
            message(errorMsg, { type: "error" });
          }
        }
      });
    }
  });
}

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-form
        ref="formRef"
        :inline="true"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-3 overflow-auto"
      >
        <el-form-item label="关键字">
          <el-input
            v-model="form.keyword"
            placeholder="搜索（预留）"
            disabled
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:search-line')"
            :loading="loading"
            @click="onSearch"
          >
            搜索
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="getList">
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :size
            :columns
            border
            :data="dataList"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog(row)"
              >
                盘点
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
