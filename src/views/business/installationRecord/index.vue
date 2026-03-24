<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import AddFill from "~icons/ri/add-circle-line";
import Refresh from "~icons/ep/refresh";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import {
  createInstallationRecordApi,
  getInstallationRecordListApi,
  type InstallationRecordItem
} from "@/api/business/installationRecord";
import { getStoreListApi, type Store } from "@/api/company/store";
import { ALL_LIST, localForage, message, handleApiError } from "@/utils";
import { fieldRules } from "@/utils/validation/fieldRules";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";

defineOptions({
  name: "InstallationRecord"
});

const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const list = ref<InstallationRecordItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const storeOptions = ref<Store[]>([]);
const formRef = ref<FormInstance>();
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const companyStore = useCurrentCompanyStoreHook();

const searchForm = reactive({
  serialNo: "",
  vehiclePlateNo: "",
  storeId: ""
});

const form = reactive({
  serialNo: "",
  storeId: "",
  vehiclePlateNo: "",
  vehicleModel: "",
  mileageKm: undefined as number | undefined,
  installPosition: "",
  technicianName: "",
  installedAt: "",
  warrantyEndAt: "",
  remark: ""
});

const rules: FormRules = {
  serialNo: [fieldRules.name({ label: "胎号", required: true, max: 100 })],
  storeId: [fieldRules.uidSelect({ label: "门店" })],
  vehiclePlateNo: [
    fieldRules.name({ label: "车牌号", required: true, max: 64 })
  ],
  installPosition: [
    fieldRules.name({ label: "安装位置", required: true, max: 64 })
  ],
  technicianName: [fieldRules.name({ label: "技师", required: true, max: 64 })]
};

const columns: TableColumnList = [
  {
    label: "胎号",
    prop: "serialNo",
    minWidth: 160
  },
  {
    label: "轮胎",
    prop: "tire.name",
    minWidth: 180
  },
  {
    label: "安装门店",
    prop: "store.name",
    minWidth: 140
  },
  {
    label: "车牌号",
    prop: "vehiclePlateNo",
    minWidth: 120
  },
  {
    label: "安装位置",
    prop: "installPosition",
    minWidth: 120
  },
  {
    label: "技师",
    prop: "technicianName",
    minWidth: 100
  },
  {
    label: "安装时间",
    prop: "installedAt",
    minWidth: 160
  },
  {
    label: "质保截止",
    prop: "warrantyEndAt",
    minWidth: 160
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 160
  }
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
    const { code, data, msg } = await getInstallationRecordListApi(page.value, {
      serialNo: searchForm.serialNo || undefined,
      vehiclePlateNo: searchForm.vehiclePlateNo || undefined,
      storeId: searchForm.storeId || undefined
    });
    if (code !== 200) {
      message(msg || "加载安装登记失败", { type: "error" });
      return;
    }
    list.value = data?.list || [];
    total.value = data?.total || 0;
  } catch (error) {
    handleApiError(error, "加载安装登记失败");
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.serialNo = "";
  form.storeId = companyStore.storeId;
  form.vehiclePlateNo = "";
  form.vehicleModel = "";
  form.mileageKm = undefined;
  form.installPosition = "";
  form.technicianName = "";
  form.installedAt = "";
  form.warrantyEndAt = "";
  form.remark = "";
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    await createInstallationRecordApi({
      serialNo: form.serialNo.trim(),
      storeId: form.storeId,
      vehiclePlateNo: form.vehiclePlateNo.trim(),
      vehicleModel: form.vehicleModel.trim() || null,
      mileageKm: form.mileageKm ?? null,
      installPosition: form.installPosition.trim(),
      technicianName: form.technicianName.trim(),
      installedAt: form.installedAt || null,
      warrantyEndAt: form.warrantyEndAt || null,
      remark: form.remark.trim() || null
    });
    message("安装登记已创建", { type: "success" });
    dialogVisible.value = false;
    await loadList();
  } catch (error) {
    handleApiError(error, "创建安装登记失败");
  } finally {
    saving.value = false;
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
      class="m-1"
      :form="searchForm"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    >
      <el-form-item label="胎号">
        <el-input
          v-model="searchForm.serialNo"
          placeholder="请输入胎号"
          clearable
          class="w-[180px]"
        />
      </el-form-item>
      <el-form-item label="车牌号">
        <el-input
          v-model="searchForm.vehiclePlateNo"
          placeholder="请输入车牌号"
          clearable
          class="w-[180px]"
        />
      </el-form-item>
      <el-form-item label="安装门店">
        <el-select
          v-model="searchForm.storeId"
          placeholder="请选择门店"
          clearable
          class="w-[180px]"
        >
          <el-option
            v-for="item in storeOptions"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar title="安装登记" @refresh="loadList">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openCreateDialog"
          >
            新增安装登记
          </el-button>
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

    <el-dialog
      v-model="dialogVisible"
      title="新增安装登记"
      width="640px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="胎号" prop="serialNo">
          <el-input v-model="form.serialNo" placeholder="请输入胎号" />
        </el-form-item>
        <el-form-item label="安装门店" prop="storeId">
          <el-select
            v-model="form.storeId"
            placeholder="请选择门店"
            class="w-full"
          >
            <el-option
              v-for="item in storeOptions"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="车牌号" prop="vehiclePlateNo">
          <el-input v-model="form.vehiclePlateNo" placeholder="请输入车牌号" />
        </el-form-item>
        <el-form-item label="车型">
          <el-input v-model="form.vehicleModel" placeholder="可选" />
        </el-form-item>
        <el-form-item label="里程(km)">
          <el-input-number v-model="form.mileageKm" :min="0" class="w-full" />
        </el-form-item>
        <el-form-item label="安装位置" prop="installPosition">
          <el-input v-model="form.installPosition" placeholder="如：左前" />
        </el-form-item>
        <el-form-item label="技师" prop="technicianName">
          <el-input
            v-model="form.technicianName"
            placeholder="请输入技师姓名"
          />
        </el-form-item>
        <el-form-item label="安装时间">
          <el-date-picker
            v-model="form.installedAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="质保截止">
          <el-date-picker
            v-model="form.warrantyEndAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="可选"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
