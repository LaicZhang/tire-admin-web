<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { reactive, ref, h } from "vue";
import { ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import { PureTableBar } from "@/components/RePureTableBar";
import DeleteButton from "@/components/DeleteButton/index.vue";
import {
  getPriceListListApi,
  createPriceListApi,
  updatePriceListApi,
  deletePriceListApi,
  getPriceListApi,
  addPriceListDetailApi,
  updatePriceListDetailApi,
  deletePriceListDetailApi,
  assignPriceListToCustomerApi,
  unassignPriceListCustomerApi
} from "@/api/business/price-list";
import { message } from "@/utils";
import { addDialog } from "@/composables/useDialogService";
import { deviceDetection } from "@pureadmin/utils";
import Form from "./form.vue";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import type { PriceList } from "@/api/business/price-list";
import { columns } from "./columns";

defineOptions({
  name: "PriceList"
});

const form = ref({
  name: undefined as string | undefined
});
const detailDrawerVisible = ref(false);
const selectedPriceList = ref<PriceList | null>(null);
const detailForm = reactive({ tireId: "", price: 0, minQuantity: 1 });
const assignmentForm = reactive({ customerId: "", priority: 0 });

const {
  loading,
  dataList,
  pagination,
  fetchData: getData,
  onCurrentChange
} = useCrud<
  PriceList,
  CommonResult<PaginatedResponseDto<PriceList>>,
  { page: number; pageSize: number }
>({
  api: ({ page }) => getPriceListListApi(page, form.value),
  pagination: {
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
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
      total: res.data?.total ?? 0
    };
  },
  immediate: true
});

const handleSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  getData();
};

const handleDelete = async (row: PriceList) => {
  await deletePriceListApi(row.id);
  message("删除成功", { type: "success" });
  getData();
};

function getPriceListRow(row: unknown): PriceList {
  if (
    !row ||
    typeof row !== "object" ||
    !("id" in row) ||
    typeof row.id !== "number"
  ) {
    throw new Error("价目表 ID 缺失");
  }
  return row as PriceList;
}

async function refreshPriceListDetail() {
  if (!selectedPriceList.value) return;
  const res = await getPriceListApi(selectedPriceList.value.id);
  selectedPriceList.value = res.data;
}

async function openDetailManager(row: unknown) {
  selectedPriceList.value = getPriceListRow(row);
  detailDrawerVisible.value = true;
  await refreshPriceListDetail();
}

async function addDetail() {
  if (!selectedPriceList.value || !detailForm.tireId.trim()) return;
  await addPriceListDetailApi(selectedPriceList.value.id, {
    tireId: detailForm.tireId.trim(),
    price: detailForm.price,
    minQuantity: detailForm.minQuantity
  });
  detailForm.tireId = "";
  detailForm.price = 0;
  detailForm.minQuantity = 1;
  await refreshPriceListDetail();
}

async function editDetail(row: unknown) {
  if (
    !row ||
    typeof row !== "object" ||
    !("id" in row) ||
    typeof row.id !== "number" ||
    !("price" in row)
  ) {
    return;
  }
  const result = await ElMessageBox.prompt(
    "请输入新价格（分）",
    "修改价目明细",
    {
      inputValue: String(row.price),
      inputPattern: /^\d+$/,
      inputErrorMessage: "价格必须为非负整数"
    }
  );
  await updatePriceListDetailApi(row.id, { price: Number(result.value) });
  await refreshPriceListDetail();
}

async function removeDetail(row: unknown) {
  if (
    !row ||
    typeof row !== "object" ||
    !("id" in row) ||
    typeof row.id !== "number"
  )
    return;
  await deletePriceListDetailApi(row.id);
  await refreshPriceListDetail();
}

async function assignCustomer() {
  if (!selectedPriceList.value || !assignmentForm.customerId.trim()) return;
  await assignPriceListToCustomerApi(selectedPriceList.value.id, {
    customerId: assignmentForm.customerId.trim(),
    priority: assignmentForm.priority
  });
  assignmentForm.customerId = "";
  assignmentForm.priority = 0;
  await refreshPriceListDetail();
}

async function unassignCustomer(row: unknown) {
  if (
    !selectedPriceList.value ||
    !row ||
    typeof row !== "object" ||
    !("customerId" in row) ||
    typeof row.customerId !== "string"
  )
    return;
  await unassignPriceListCustomerApi(
    selectedPriceList.value.id,
    row.customerId
  );
  await refreshPriceListDetail();
}

type FormInline = {
  id?: number;
  name: string;
  type: PriceList["type"];
  isDefault: boolean;
  isActive: boolean;
};

function openDialog(title = "新增", row?: PriceList) {
  addDialog({
    title: `${title}价目表`,
    props: {
      formInline: {
        id: row?.id,
        name: row?.name ?? "",
        type: row?.type ?? "STANDARD",
        isDefault: row?.isDefault ?? false,
        isActive: row?.isActive ?? true
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(Form, {
        formInline: (options.props as { formInline: FormInline }).formInline
      }),
    beforeSure: (done, { options }) => {
      const curData = (options.props as { formInline: FormInline }).formInline;
      let promise:
        | ReturnType<typeof createPriceListApi>
        | ReturnType<typeof updatePriceListApi>;

      if (title === "新增") {
        promise = createPriceListApi(
          curData as Parameters<typeof createPriceListApi>[0]
        );
      } else {
        if (!curData.id) {
          message("缺少报价单ID", { type: "error" });
          return;
        }
        promise = updatePriceListApi(
          curData.id,
          curData as Parameters<typeof updatePriceListApi>[1]
        );
      }

      promise.then(() => {
        message("操作成功", { type: "success" });
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
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="请输入名称" clearable />
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
            :loading="loading"
            :pagination="{ ...pagination, size }"
            @page-current-change="onCurrentChange"
          >
            <template #operation="{ row }">
              <el-button link type="primary" @click="openDetailManager(row)">
                明细与客户
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>
              <DeleteButton @confirm="handleDelete(row)" />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>

    <el-drawer
      v-model="detailDrawerVisible"
      :title="`${selectedPriceList?.name || ''} - 明细与客户`"
      size="72%"
    >
      <el-card class="mb-3">
        <template #header>价目明细</template>
        <el-form inline>
          <el-form-item label="商品 UID">
            <el-input v-model="detailForm.tireId" class="w-[280px]" />
          </el-form-item>
          <el-form-item label="价格（分）">
            <el-input-number v-model="detailForm.price" :min="0" />
          </el-form-item>
          <el-form-item label="起订量">
            <el-input-number v-model="detailForm.minQuantity" :min="1" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="addDetail">添加明细</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="selectedPriceList?.details || []" border>
          <el-table-column prop="tire.name" label="商品" min-width="160" />
          <el-table-column prop="tireId" label="商品 UID" min-width="220" />
          <el-table-column prop="price" label="价格（分）" width="140" />
          <el-table-column prop="minQuantity" label="起订量" width="100" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button link type="primary" @click="editDetail(row)"
                >修改</el-button
              >
              <el-button link type="danger" @click="removeDetail(row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card>
        <template #header>客户分配</template>
        <el-form inline>
          <el-form-item label="客户 UID">
            <el-input v-model="assignmentForm.customerId" class="w-[280px]" />
          </el-form-item>
          <el-form-item label="优先级">
            <el-input-number v-model="assignmentForm.priority" :min="0" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="assignCustomer"
              >分配客户</el-button
            >
          </el-form-item>
        </el-form>
        <el-table :data="selectedPriceList?.customerLink || []" border>
          <el-table-column prop="customer.name" label="客户" min-width="160" />
          <el-table-column prop="customerId" label="客户 UID" min-width="220" />
          <el-table-column prop="priority" label="优先级" width="100" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <Auth value="delete/price-list/:id/assign-customer/:customerId">
                <el-button link type="danger" @click="unassignCustomer(row)">
                  取消分配
                </el-button>
              </Auth>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-drawer>
  </div>
</template>
