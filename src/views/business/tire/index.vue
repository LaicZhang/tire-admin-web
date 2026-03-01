<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { openDialog } from "./table";
import { getTireListApi, deleteTireApi, getDepartmentWithEmpApi } from "@/api";
import { message, localForage, ALL_LIST } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { BaseImagePath } from "@/utils";
import { ImportDialog, ExportDialog } from "@/components/ImportExport";
import ImportIcon from "~icons/ri/upload-cloud-2-line";
import ExportIcon from "~icons/ri/download-cloud-2-line";
import StockIcon from "~icons/ri/stack-line";
import type { Tire } from "@/api/business/tire";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import { useSysDictOptions } from "@/composables/useSysDict";

defineOptions({
  name: "Tire"
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = ref({
  group: undefined as string | undefined,
  name: undefined as string | undefined,
  desc: undefined as string | undefined
});
const { options: groupOptions } = useSysDictOptions("tireGroup");

const showImportDialog = ref(false);
const showExportDialog = ref(false);

const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
  Tire,
  CommonResult<PaginatedResponseDto<Tire>>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getTireListApi(page, form.value) as Promise<
      CommonResult<PaginatedResponseDto<Tire>>
    >,
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
  immediate: false // Will be triggered manually after caching logic
});

// Cache tire data in localForage (existing logic preserved)
const getEmployeesWithTire = async () => {
  const { data, code, msg } = await getDepartmentWithEmpApi();
  if (code === 200) {
    await localForage().setItem("dep-w-emp", data);
    data.forEach(item => {
      localForage().setItem("dep-w-emp:" + item.id, item);
    });
  } else message(msg, { type: "error" });
};

const getAllTires = async () => {
  const { data, code, msg } = await getTireListApi(0);
  const tasks = [];
  if (code === 200) {
    tasks.push(localForage().setItem(ALL_LIST.tire, data.list));
    data.list.forEach((element: Tire) => {
      tasks.push(localForage().setItem("tire:" + element.name, element));
    });
  } else message(msg, { type: "error" });
  await Promise.all(tasks);
};

const onSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

const resetForm = () => {
  searchFormRef.value?.resetFields();
  onSearch();
};

async function handleDelete(row: Tire) {
  await deleteTireApi(row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  fetchData();
}

onMounted(async () => {
  await Promise.all([getEmployeesWithTire(), fetchData(), getAllTires()]);
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="resetForm"
    >
      <el-form-item label="分组名称：" prop="group">
        <el-select
          v-model="form.group"
          placeholder="请选择或输入分组"
          filterable
          clearable
          allow-create
          default-first-option
          class="w-[180px]!"
        >
          <el-option
            v-for="item in groupOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="名称：" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入名称"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="备注：" prop="desc">
        <el-input
          v-model="form.desc"
          placeholder="请输入备注"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增轮胎
          </el-button>

          <el-button
            :icon="useRenderIcon(StockIcon)"
            @click="showImportDialog = true"
          >
            期初库存
          </el-button>

          <el-button
            :icon="useRenderIcon(ImportIcon)"
            @click="showImportDialog = true"
          >
            导入
          </el-button>

          <el-button
            :icon="useRenderIcon(ExportIcon)"
            @click="showExportDialog = true"
          >
            导出
          </el-button>
        </template>
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
            @page-current-change="onCurrentChange"
          >
            <template #covers="{ row }">
              <el-image
                v-for="item in row.covers"
                :key="item.id"
                :src="BaseImagePath + item.hash + '.' + item.ext"
                loading="lazy"
                hide-on-click-modal
                preview-teleported
                style="height: 30px"
                :preview-src-list="
                  row.covers.map((item: { hash: string; ext: string }) => {
                    return BaseImagePath + item.hash + '.' + item.ext;
                  })
                "
              />
            </template>
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('查看', row)"
              >
                查看
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>

              <DeleteButton
                :show-icon="false"
                :title="`是否确认删除${row.name}这条数据`"
                @confirm="handleDelete(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>

    <ImportDialog
      v-model:visible="showImportDialog"
      type="tire"
      title="批量导入商品"
      @success="fetchData"
    />
    <ExportDialog
      v-model:visible="showExportDialog"
      type="tire"
      title="导出商品数据"
    />
  </div>
</template>
