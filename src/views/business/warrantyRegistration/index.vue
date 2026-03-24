<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import Refresh from "~icons/ep/refresh";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { ALL_LIST, handleApiError, localForage, message } from "@/utils";
import {
  getWarrantyRegistrationListApi,
  type WarrantyRegistrationItem
} from "@/api/business/warrantyRegistration";
import { getStoreListApi, type Store } from "@/api/company/store";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";

defineOptions({
  name: "WarrantyRegistration"
});

const loading = ref(false);
const list = ref<WarrantyRegistrationItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const storeOptions = ref<Store[]>([]);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const companyStore = useCurrentCompanyStoreHook();

const searchForm = reactive({
  serialNo: "",
  vehiclePlateNo: "",
  storeId: ""
});

const columns: TableColumnList = [
  { label: "胎号", prop: "serialNo", minWidth: 160 },
  { label: "轮胎", prop: "tire.name", minWidth: 180 },
  { label: "门店", prop: "store.name", minWidth: 140 },
  { label: "车牌号", prop: "vehiclePlateNo", minWidth: 120 },
  { label: "安装位置", prop: "installPosition", minWidth: 100 },
  { label: "技师", prop: "technicianName", minWidth: 100 },
  { label: "质保开始", prop: "warrantyStartAt", minWidth: 160 },
  { label: "质保截止", prop: "warrantyEndAt", minWidth: 160 },
  { label: "备注", prop: "remark", minWidth: 180 }
];

const pagination = computed(() => ({
  total: total.value,
  pageSize,
  currentPage: page.value,
  background: true
}));

async function loadStores() {
  const cached = await localForage().getItem<Store[]>(ALL_LIST.store);
  if (cached?.length) {
    storeOptions.value = cached;
    return;
  }
  const { code, data, msg } = await getStoreListApi(0);
  if (code !== 200) {
    message(msg || "加载门店列表失败", { type: "error" });
    return;
  }
  storeOptions.value = data.list || [];
  await localForage().setItem(ALL_LIST.store, storeOptions.value, 30);
}

async function loadList() {
  loading.value = true;
  try {
    const { code, data, msg } = await getWarrantyRegistrationListApi(
      page.value,
      {
        serialNo: searchForm.serialNo || undefined,
        vehiclePlateNo: searchForm.vehiclePlateNo || undefined,
        storeId: searchForm.storeId || undefined
      }
    );
    if (code !== 200) {
      message(msg || "加载质保登记失败", { type: "error" });
      return;
    }
    list.value = data?.list || [];
    total.value = data?.total || 0;
  } catch (error) {
    handleApiError(error, "加载质保登记失败");
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  searchFormRef.value?.resetFields();
  page.value = 1;
  void loadList();
}

function handleSearch() {
  page.value = 1;
  void loadList();
}

function handlePageChange(current: number) {
  page.value = current;
  void loadList();
}

onMounted(async () => {
  searchForm.storeId = companyStore.storeId;
  await loadStores();
  await loadList();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="searchForm"
      :loading="loading"
      label-width="90px"
      @search="handleSearch"
      @reset="handleReset"
    >
      <template #default>
        <el-form-item label="胎号">
          <el-input
            v-model="searchForm.serialNo"
            clearable
            placeholder="请输入胎号"
          />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input
            v-model="searchForm.vehiclePlateNo"
            clearable
            placeholder="请输入车牌号"
          />
        </el-form-item>
        <el-form-item label="门店">
          <el-select
            v-model="searchForm.storeId"
            clearable
            filterable
            placeholder="请选择门店"
            style="width: 220px"
          >
            <el-option
              v-for="item in storeOptions"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
      </template>
    </ReSearchForm>

    <el-card shadow="never" class="mt-4">
      <PureTableBar title="质保登记" @refresh="loadList">
        <template #buttons>
          <el-button :icon="useRenderIcon(Refresh)" @click="loadList">
            刷新
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            border
            :size
            :columns="columns"
            :data="list"
            :loading="loading"
            :pagination="{ ...pagination, size }"
            @page-current-change="handlePageChange"
          />
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
