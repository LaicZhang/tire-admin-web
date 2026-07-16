<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils";
import { formatMoneyFromFen } from "@/utils/formatMoney";
import {
  createSupplierPromotionPolicyApi,
  deactivateSupplierPromotionPolicyApi,
  getSupplierPromotionPoliciesApi,
  updateSupplierPromotionPolicyApi,
  type SupplierPromotionPolicy,
  type SupplierPromotionPolicyInput,
  type SupplierPromotionType
} from "@/api/purchase/supplier-promotion";

defineOptions({ name: "SupplierPromotionManagement" });

const loading = ref(false);
const rows = ref<SupplierPromotionPolicy[]>([]);
const page = reactive({ current: 1, total: 0, pageSize: 20 });
const editingUid = ref<string>();
const form = reactive({
  providerId: "",
  name: "",
  policyType: "DISCOUNT" as SupplierPromotionType,
  minPurchaseAmount: 0,
  discountBasisPoints: 1000,
  rebateAmount: 0,
  giftTireId: "",
  giftQuantity: 0,
  priority: 0,
  isStackable: false,
  effectiveFrom: "",
  effectiveTo: ""
});

const typeText: Record<SupplierPromotionType, string> = {
  DISCOUNT: "采购折扣",
  REBATE: "采购返利",
  GIFT: "采购赠品"
};

function money(value: string) {
  return formatMoneyFromFen(BigInt(value));
}

function getPolicy(row: unknown): SupplierPromotionPolicy {
  if (
    !row ||
    typeof row !== "object" ||
    !("uid" in row) ||
    typeof row.uid !== "string" ||
    !("policyType" in row) ||
    typeof row.policyType !== "string"
  ) {
    throw new Error("供应商促销政策数据无效");
  }
  return row as SupplierPromotionPolicy;
}

function promotionTypeText(row: unknown) {
  const policy = getPolicy(row);
  return typeText[policy.policyType];
}

function resetForm() {
  editingUid.value = undefined;
  form.providerId = "";
  form.name = "";
  form.policyType = "DISCOUNT";
  form.minPurchaseAmount = 0;
  form.discountBasisPoints = 1000;
  form.rebateAmount = 0;
  form.giftTireId = "";
  form.giftQuantity = 0;
  form.priority = 0;
  form.isStackable = false;
  form.effectiveFrom = "";
  form.effectiveTo = "";
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getSupplierPromotionPoliciesApi(page.current);
    rows.value = res.data?.list ?? [];
    page.total = res.data?.count ?? 0;
    page.pageSize = res.data?.pageSize ?? 20;
  } finally {
    loading.value = false;
  }
}

function formPayload(): SupplierPromotionPolicyInput {
  return {
    providerId: form.providerId.trim(),
    name: form.name.trim(),
    policyType: form.policyType,
    minPurchaseAmount: form.minPurchaseAmount,
    discountBasisPoints:
      form.policyType === "DISCOUNT" ? form.discountBasisPoints : 0,
    rebateAmount: form.policyType === "REBATE" ? form.rebateAmount : 0,
    giftTireId: form.policyType === "GIFT" ? form.giftTireId.trim() : undefined,
    giftQuantity: form.policyType === "GIFT" ? form.giftQuantity : 0,
    priority: form.priority,
    isStackable: form.isStackable,
    effectiveFrom: form.effectiveFrom,
    effectiveTo: form.effectiveTo || undefined
  };
}

async function savePolicy() {
  if (!form.providerId.trim() || !form.name.trim() || !form.effectiveFrom) {
    message("供应商、名称和生效时间不能为空", { type: "warning" });
    return;
  }
  const payload = formPayload();
  if (editingUid.value) {
    await updateSupplierPromotionPolicyApi(editingUid.value, payload);
    message("供应商促销政策已更新", { type: "success" });
  } else {
    await createSupplierPromotionPolicyApi(payload);
    message("供应商促销政策已创建", { type: "success" });
  }
  resetForm();
  await loadData();
}

function editPolicy(row: unknown) {
  const policy = getPolicy(row);
  editingUid.value = policy.uid;
  form.providerId = policy.providerId;
  form.name = policy.name;
  form.policyType = policy.policyType;
  form.minPurchaseAmount = Number(policy.minPurchaseAmount);
  form.discountBasisPoints = policy.discountBasisPoints;
  form.rebateAmount = Number(policy.rebateAmount);
  form.giftTireId = policy.giftTireId ?? "";
  form.giftQuantity = policy.giftQuantity;
  form.priority = policy.priority;
  form.isStackable = policy.isStackable;
  form.effectiveFrom = policy.effectiveFrom;
  form.effectiveTo = policy.effectiveTo ?? "";
}

async function deactivate(row: unknown) {
  const policy = getPolicy(row);
  await ElMessageBox.confirm(
    "停用后新入库不再匹配该政策，是否继续？",
    "停用政策"
  );
  await deactivateSupplierPromotionPolicyApi(policy.uid);
  message("供应商促销政策已停用", { type: "success" });
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <div class="main">
    <el-card class="mb-3">
      <template #header>{{ editingUid ? "修改政策" : "新建政策" }}</template>
      <el-form inline>
        <el-form-item label="供应商 UID">
          <el-input v-model="form.providerId" class="w-[240px]" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" class="w-[220px]" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.policyType" class="w-[140px]">
            <el-option label="采购折扣" value="DISCOUNT" />
            <el-option label="采购返利" value="REBATE" />
            <el-option label="采购赠品" value="GIFT" />
          </el-select>
        </el-form-item>
        <el-form-item label="门槛（分）">
          <el-input-number v-model="form.minPurchaseAmount" :min="0" />
        </el-form-item>
        <el-form-item v-if="form.policyType === 'DISCOUNT'" label="折扣基点">
          <el-input-number
            v-model="form.discountBasisPoints"
            :min="1"
            :max="10000"
          />
        </el-form-item>
        <el-form-item v-if="form.policyType === 'REBATE'" label="返利（分）">
          <el-input-number v-model="form.rebateAmount" :min="1" />
        </el-form-item>
        <template v-if="form.policyType === 'GIFT'">
          <el-form-item label="赠品 UID">
            <el-input v-model="form.giftTireId" class="w-[240px]" />
          </el-form-item>
          <el-form-item label="赠品数量">
            <el-input-number v-model="form.giftQuantity" :min="1" />
          </el-form-item>
        </template>
        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" />
        </el-form-item>
        <el-form-item label="可叠加">
          <el-switch v-model="form.isStackable" />
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker
            v-model="form.effectiveFrom"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
          />
        </el-form-item>
        <el-form-item label="失效时间">
          <el-date-picker
            v-model="form.effectiveTo"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
          />
        </el-form-item>
        <el-form-item>
          <Auth
            :value="
              editingUid
                ? 'patch/supplier-promotion-policy'
                : 'post/supplier-promotion-policy'
            "
          >
            <el-button type="primary" @click="savePolicy">
              {{ editingUid ? "保存修改" : "创建政策" }}
            </el-button>
          </Auth>
          <el-button v-if="editingUid" @click="resetForm">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column prop="name" label="政策名称" min-width="180" />
        <el-table-column prop="providerId" label="供应商 UID" min-width="220" />
        <el-table-column label="类型" width="110">
          <template #default="{ row }">{{ promotionTypeText(row) }}</template>
        </el-table-column>
        <el-table-column label="门槛" width="120">
          <template #default="{ row }"
            >¥{{ money(row.minPurchaseAmount) }}</template
          >
        </el-table-column>
        <el-table-column
          prop="discountBasisPoints"
          label="折扣基点"
          width="100"
        />
        <el-table-column label="返利" width="120">
          <template #default="{ row }">¥{{ money(row.rebateAmount) }}</template>
        </el-table-column>
        <el-table-column prop="giftTireId" label="赠品 UID" min-width="180" />
        <el-table-column prop="giftQuantity" label="赠品数" width="90" />
        <el-table-column prop="priority" label="优先级" width="90" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">{{
            row.isActive ? "启用" : "停用"
          }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <Auth value="patch/supplier-promotion-policy">
              <el-button link type="primary" @click="editPolicy(row)"
                >修改</el-button
              >
            </Auth>
            <Auth value="delete/supplier-promotion-policy">
              <el-button
                v-if="row.isActive"
                link
                type="danger"
                @click="deactivate(row)"
              >
                停用
              </el-button>
            </Auth>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page.current"
        class="mt-3 justify-end"
        :page-size="page.pageSize"
        :total="page.total"
        @current-change="loadData"
      />
    </el-card>
  </div>
</template>
