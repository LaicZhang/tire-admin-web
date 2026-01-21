<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Delete } from "@element-plus/icons-vue";
import type {
  OtherInboundOrder,
  OtherInboundDetail,
  CreateOtherInboundDto
} from "./types";
import { OtherInboundType, otherInboundTypeMap } from "./types";
import { getRepoListApi } from "@/api/company/repo";
import { getTireListApi } from "@/api/business/tire";
import { getProviderListApi } from "@/api/business/provider";

interface Props {
  formInline: Partial<OtherInboundOrder>;
  isView?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isView: false
});

const formRef = ref<FormInstance>();
const repoList = ref<{ uid: string; name: string }[]>([]);
const tireList = ref<{ uid: string; name: string; barcode?: string }[]>([]);
const providerList = ref<{ uid: string; name: string }[]>([]);
const loading = ref(false);

const typeOptions = Object.entries(otherInboundTypeMap).map(
  ([value, config]) => ({
    value,
    label: config.label
  })
);

const formData = reactive<CreateOtherInboundDto>({
  type:
    (props.formInline.type as OtherInboundType) ||
    OtherInboundType.OTHER_INBOUND,
  providerId: props.formInline.providerId || "",
  orderDate: props.formInline.orderDate || new Date().toISOString(),
  operatorId: props.formInline.operatorId || "",
  remark: props.formInline.remark || "",
  details: props.formInline.details?.map(d => ({
    _uid: crypto.randomUUID(),
    tireId: d.tireId,
    repoId: d.repoId,
    quantity: d.quantity,
    unitCost: d.unitCost,
    remark: d.remark
  })) || [
    {
      _uid: crypto.randomUUID(),
      tireId: "",
      repoId: "",
      quantity: 1,
      unitCost: 0,
      remark: ""
    }
  ]
});

const rules = reactive<FormRules>({
  type: [{ required: true, message: "请选择业务类型", trigger: "change" }]
});

const addDetail = () => {
  formData.details.push({
    _uid: crypto.randomUUID(),
    tireId: "",
    repoId: "",
    quantity: 1,
    unitCost: 0,
    remark: ""
  });
};

const removeDetail = (index: number) => {
  if (formData.details.length > 1) {
    formData.details.splice(index, 1);
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [repoRes, tireRes, providerRes] = await Promise.all([
      getRepoListApi(1, {}),
      getTireListApi(1, {}),
      getProviderListApi(1, {})
    ]);
    if (repoRes.code === 200) {
      repoList.value = repoRes.data.list;
    }
    if (tireRes.code === 200) {
      tireList.value = tireRes.data.list;
    }
    if (providerRes.code === 200) {
      providerList.value = providerRes.data.list;
    }
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
    class="inbound-form"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="业务类型" prop="type">
          <el-select v-model="formData.type" class="w-full">
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="供应商">
          <el-select
            v-model="formData.providerId"
            placeholder="请选择供应商(可选)"
            filterable
            clearable
            class="w-full"
          >
            <el-option
              v-for="provider in providerList"
              :key="provider.uid"
              :label="provider.name"
              :value="provider.uid"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="单据日期">
          <el-date-picker
            v-model="formData.orderDate"
            type="date"
            placeholder="选择日期"
            class="w-full"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            placeholder="请输入备注"
            maxlength="200"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-divider content-position="left">入库明细</el-divider>

    <div class="detail-list">
      <div
        v-for="(detail, index) in formData.details"
        :key="detail._uid || index"
        class="detail-item"
      >
        <el-row :gutter="12" align="middle">
          <el-col :span="6">
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
          <el-col :span="5">
            <el-form-item
              :prop="`details.${index}.repoId`"
              :rules="[
                { required: true, message: '请选择仓库', trigger: 'change' }
              ]"
              label-width="0"
            >
              <el-select
                v-model="detail.repoId"
                placeholder="入库仓库"
                filterable
                class="w-full"
              >
                <el-option
                  v-for="repo in repoList"
                  :key="repo.uid"
                  :label="repo.name"
                  :value="repo.uid"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item
              :prop="`details.${index}.quantity`"
              :rules="[
                { required: true, message: '请输入数量', trigger: 'blur' }
              ]"
              label-width="0"
            >
              <el-input-number
                v-model="detail.quantity"
                :min="1"
                placeholder="数量"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item
              :prop="`details.${index}.unitCost`"
              :rules="[
                { required: true, message: '请输入成本', trigger: 'blur' }
              ]"
              label-width="0"
            >
              <el-input-number
                v-model="detail.unitCost"
                :min="0"
                :precision="2"
                placeholder="单位成本"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label-width="0">
              <el-input v-model="detail.remark" placeholder="备注" />
            </el-form-item>
          </el-col>
          <el-col :span="2">
            <el-button
              v-if="!isView && formData.details.length > 1"
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
      v-if="!isView"
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
.inbound-form {
  padding: 16px;
}

.detail-list {
  max-height: 300px;
  overflow-y: auto;
}

.detail-item {
  padding: 8px;
  margin-bottom: 8px;
  background: #fafafa;
  border-radius: 4px;
}

.w-full {
  width: 100%;
}

.mt-4 {
  margin-top: 16px;
}
</style>
