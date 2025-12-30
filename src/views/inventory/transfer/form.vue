<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Delete } from "@element-plus/icons-vue";
import type { TransferOrder, TransferOrderDetail } from "./types";
import { getRepoListApi } from "@/api/company/repo";
import { getTireListApi } from "@/api/business/tire";
import { ALL_LIST, handleApiError, localForage } from "@/utils";

interface Props {
  formInline: Partial<TransferOrder>;
  isView?: boolean;
  /** 新建时允许编辑明细；编辑时为只读 */
  isCreate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isView: false,
  isCreate: true
});

const formRef = ref<FormInstance>();
const repoList = ref<{ uid: string; name: string }[]>([]);
const tireList = ref<{ uid: string; name: string; barcode?: string }[]>([]);
const auditorList = ref<Array<{ uid: string; name: string }>>([]);
const loading = ref(false);

const formData = reactive({
  fromRepositoryId: props.formInline.fromRepositoryId || "",
  toRepositoryId: props.formInline.toRepositoryId || "",
  auditorId: props.formInline.auditorId || "",
  desc: (props.formInline.desc as string) || "",
  details: props.formInline.details?.map(d => ({
    uid: d.uid,
    tireId: d.tireId,
    tireName: d.tireName,
    count: d.count ?? 1,
    isShipped: d.isShipped,
    isArrival: d.isArrival
  })) || [{ tireId: "", count: 1 }]
});

const rules = reactive<FormRules>({
  fromRepositoryId: [
    { required: true, message: "请选择调出仓库", trigger: "change" }
  ],
  toRepositoryId: [
    { required: true, message: "请选择调入仓库", trigger: "change" }
  ],
  auditorId: [{ required: true, message: "请选择审核人", trigger: "change" }]
});

const filteredToRepoList = computed(() =>
  repoList.value.filter(r => r.uid !== formData.fromRepositoryId)
);

const filteredFromRepoList = computed(() =>
  repoList.value.filter(r => r.uid !== formData.toRepositoryId)
);

const addDetail = () => {
  formData.details.push({ tireId: "", count: 1 } as TransferOrderDetail);
};

const removeDetail = (index: number) => {
  if (formData.details.length > 1) {
    formData.details.splice(index, 1);
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [repoRes, tireRes, managers] = await Promise.all([
      getRepoListApi(1, {}),
      getTireListApi(1, {}),
      localForage().getItem(ALL_LIST.manager)
    ]);
    if (repoRes.code === 200) repoList.value = repoRes.data.list;
    if (tireRes.code === 200) tireList.value = tireRes.data.list;
    auditorList.value =
      (managers as Array<{ uid: string; name: string }>) || [];
  } catch (error) {
    handleApiError(error, "加载基础数据失败");
  } finally {
    loading.value = false;
  }
};

const getRef = () => formRef.value;
const getFormData = () => formData;

defineExpose({ getRef, getFormData });

onMounted(() => {
  loadData();
});
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    :disabled="isView"
    label-width="100px"
    class="transfer-form"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="调出仓库" prop="fromRepositoryId">
          <el-select
            v-model="formData.fromRepositoryId"
            placeholder="请选择调出仓库"
            filterable
            class="w-full"
          >
            <el-option
              v-for="repo in filteredFromRepoList"
              :key="repo.uid"
              :label="repo.name"
              :value="repo.uid"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="调入仓库" prop="toRepositoryId">
          <el-select
            v-model="formData.toRepositoryId"
            placeholder="请选择调入仓库"
            filterable
            class="w-full"
          >
            <el-option
              v-for="repo in filteredToRepoList"
              :key="repo.uid"
              :label="repo.name"
              :value="repo.uid"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="审核人" prop="auditorId">
          <el-select
            v-model="formData.auditorId"
            placeholder="请选择审核人"
            filterable
            class="w-full"
          >
            <el-option
              v-for="item in auditorList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="备注">
          <el-input v-model="formData.desc" placeholder="请输入备注" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-divider content-position="left">调拨明细</el-divider>

    <div class="detail-list">
      <div
        v-for="(detail, index) in formData.details"
        :key="detail.uid || index"
        class="detail-item"
      >
        <el-row :gutter="12" align="middle">
          <el-col :span="12">
            <el-form-item
              :prop="`details.${index}.tireId`"
              :rules="[
                { required: true, message: '请选择商品', trigger: 'change' }
              ]"
              label-width="0"
            >
              <el-select
                v-model="detail.tireId"
                placeholder="选择商品"
                filterable
                class="w-full"
                :disabled="!isCreate"
              >
                <el-option
                  v-for="tire in tireList"
                  :key="tire.uid"
                  :label="tire.name"
                  :value="tire.uid"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item
              :prop="`details.${index}.count`"
              :rules="[
                { required: true, message: '请输入数量', trigger: 'blur' }
              ]"
              label-width="0"
            >
              <el-input-number
                v-model="detail.count"
                :min="1"
                placeholder="数量"
                class="w-full"
                :disabled="!isCreate"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-button
              v-if="!isView && isCreate && formData.details.length > 1"
              type="danger"
              :icon="Delete"
              circle
              @click="removeDetail(index)"
            />
          </el-col>
        </el-row>
      </div>
    </div>

    <el-button
      v-if="!isView && isCreate"
      type="primary"
      :icon="Plus"
      class="mt-4"
      @click="addDetail"
    >
      添加商品
    </el-button>
  </el-form>
</template>

<style scoped lang="scss">
.transfer-form {
  padding: 16px;
}

.detail-list {
  max-height: 300px;
  overflow-y: auto;
}

.detail-item {
  padding: 8px;
}
</style>
