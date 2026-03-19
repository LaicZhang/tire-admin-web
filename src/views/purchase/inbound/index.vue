<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { h, onMounted, ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/composables/useDialogService";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import TableOperations from "@/components/TableOperations/index.vue";
import type { CustomAction } from "@/components/TableOperations/types";
import { useRoute } from "vue-router";
import {
  getPurchaseInboundApi,
  getPurchaseInboundListApi
} from "@/api/purchase";
import { message, ALL_LIST, localForage, handleApiError } from "@/utils";
import { inboundOrderColumns } from "./columns";
import type { InboundOrder, InboundOrderQueryParams } from "./types";
import editForm from "./form.vue";

defineOptions({
  name: "PurchaseInbound"
});

const route = useRoute();

const dataList = ref<InboundOrder[]>([]);
const loading = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

const searchForm = ref<InboundOrderQueryParams>({
  operatorId: undefined,
  auditorId: undefined,
  providerId: undefined,
  desc: undefined
});

const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

interface SelectItem {
  uid: string;
  name: string;
}
const employeeList = ref<SelectItem[]>([]);
const managerList = ref<SelectItem[]>([]);
const providerList = ref<SelectItem[]>([]);

async function loadSelectData() {
  try {
    const [employees, managers, providers] = await Promise.all([
      localForage().getItem(ALL_LIST.employee),
      localForage().getItem(ALL_LIST.manager),
      localForage().getItem(ALL_LIST.provider)
    ]);
    employeeList.value = (employees as SelectItem[]) || [];
    managerList.value = (managers as SelectItem[]) || [];
    providerList.value = (providers as SelectItem[]) || [];
  } catch (error) {
    handleApiError(error, "加载下拉数据失败");
  }
}

async function getList() {
  try {
    loading.value = true;
    const res = await getPurchaseInboundListApi(
      pagination.value.currentPage,
      searchForm.value
    );
    if (res.code === 200) {
      dataList.value = res.data.list;
      pagination.value.total = res.data.total ?? res.data.count ?? 0;
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    handleApiError(error, "获取采购入库单列表失败");
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  pagination.value.currentPage = 1;
  getList();
}

function onReset() {
  searchFormRef.value?.resetFields();
  pagination.value.currentPage = 1;
  getList();
}

function handlePageChange(page: number) {
  pagination.value.currentPage = page;
  getList();
}

function openDialog(row: InboundOrder) {
  addDialog({
    title: "查看采购到货记录",
    props: {
      formInline: { ...row },
      formTitle: "查看"
    },
    width: "90%",
    hideFooter: true,
    contentRenderer: () =>
      h(editForm, {
        formInline: { ...row },
        formTitle: "查看"
      })
  });
}

async function openFromRouteQuery() {
  const uid = route.query.uid;
  const action = route.query.action;
  if (typeof uid !== "string" || typeof action !== "string") return;

  const titleMap: Record<string, string> = {
    view: "查看",
    edit: "修改",
    audit: "审核"
  };
  if (!titleMap[action]) return;

  try {
    loading.value = true;
    const res = await getPurchaseInboundApi(uid);
    if (res.code === 200) {
      openDialog(res.data);
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    handleApiError(error, "获取采购入库单失败");
  } finally {
    loading.value = false;
  }
}

async function handleGenerateReturnOrder(row: InboundOrder) {
  message(`请从采购订单或采购退货流程处理该到货记录，单号: ${row.number}`, {
    type: "info"
  });
}

onMounted(async () => {
  await loadSelectData();
  await getList();
  await openFromRouteQuery();
});
</script>

<template>
  <div class="main">
    <el-alert
      class="m-1"
      type="info"
      :closable="false"
      title="采购入库在当前后台中统一视为采购订单的到货确认视图，不单独创建入库单。"
    />
    <ReSearchForm
      ref="searchFormRef"
      :form="searchForm"
      :loading="loading"
      @search="onSearch"
      @reset="onReset"
    >
      <el-form-item label="供应商">
        <el-select
          v-model="searchForm.providerId"
          placeholder="请选择供应商"
          clearable
          filterable
          class="w-[180px]"
        >
          <el-option
            v-for="item in providerList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="操作人">
        <el-select
          v-model="searchForm.operatorId"
          placeholder="请选择操作人"
          clearable
          class="w-[180px]"
        >
          <el-option
            v-for="item in employeeList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="审核人">
        <el-select
          v-model="searchForm.auditorId"
          placeholder="请选择审核人"
          clearable
          class="w-[180px]"
        >
          <el-option
            v-for="item in managerList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="searchForm.desc"
          placeholder="请输入备注关键词"
          clearable
          class="w-[180px]"
        />
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar title="采购到货确认" @refresh="getList">
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns="inboundOrderColumns"
            border
            :data="dataList"
            :loading="loading"
            show-overflow-tooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handlePageChange"
          >
            <template #operation="{ row }">
              <TableOperations
                :row="row"
                :delete-title="`确认删除编号 ${row.number} 的到货记录?`"
                :custom-actions="
                  [
                    {
                      label: '退货处理指引',
                      type: 'warning',
                      visible: row.isApproved,
                      onClick: () => handleGenerateReturnOrder(row)
                    }
                  ] as CustomAction[]
                "
                :show-edit="false"
                :show-audit="false"
                :show-delete="false"
                @view="openDialog($event as unknown as InboundOrder)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
