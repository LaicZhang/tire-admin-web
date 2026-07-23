<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { getPaymentApi, getPaymentListApi, type PaymentListData } from "@/api";
import type { PaymentAccount } from "@/api/type";
import {
  listRecentEntities,
  touchRecentEntity
} from "@/composables/recentFormMemory";
import { handleApiError, message } from "@/utils";

type OptionItem = {
  value: string;
  label: string;
  raw?: PaymentAccount;
};

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    companyUid?: string;
  }>(),
  {
    placeholder: "请选择账户",
    clearable: true,
    disabled: false,
    companyUid: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string | undefined];
}>();

const innerValue = computed<string | undefined>({
  get: () => (props.modelValue ? String(props.modelValue) : undefined),
  set: val => emit("update:modelValue", val || undefined)
});

const loading = ref(false);
const keyword = ref("");
const allAccounts = ref<PaymentAccount[]>([]);
const recent = ref<OptionItem[]>([]);

function accountLabel(a: PaymentAccount): string {
  return `${a.name ?? "未命名"} (余额:${a.balance ?? 0})`;
}

const options = computed<OptionItem[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  const list = allAccounts.value;
  const filtered =
    kw.length === 0
      ? list
      : list.filter(a => {
          const name = String(a.name ?? "").toLowerCase();
          const bank = String(a.bankName ?? "").toLowerCase();
          const account = String(a.bankAccount ?? "").toLowerCase();
          return name.includes(kw) || bank.includes(kw) || account.includes(kw);
        });

  return filtered.map(a => ({
    value: a.uid,
    label: accountLabel(a),
    raw: a
  }));
});

function normalizePaymentList(
  data: PaymentListData | undefined
): PaymentAccount[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as PaymentAccount[];
  const payments = (data as { payments?: PaymentAccount[] }).payments;
  if (Array.isArray(payments)) return payments;
  const list = (data as { list?: PaymentAccount[] }).list;
  return Array.isArray(list) ? list : [];
}

async function loadRecent() {
  try {
    const items = await listRecentEntities("payment");
    recent.value = items.map(i => ({ value: i.uid, label: i.name }));
  } catch {
    recent.value = [];
  }
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await getPaymentListApi(props.companyUid);
    if (res.code !== 200) {
      message(res.msg || "加载账户列表失败", { type: "error" });
      allAccounts.value = [];
      return;
    }
    allAccounts.value = normalizePaymentList(res.data);
  } catch (error) {
    handleApiError(error, "加载账户列表失败");
    allAccounts.value = [];
  } finally {
    loading.value = false;
  }
}

async function ensureSelected(uid: string) {
  if (!uid) return;
  if (allAccounts.value.some(a => a.uid === uid)) return;
  try {
    const res = await getPaymentApi(uid);
    if (res.code !== 200) return;
    allAccounts.value = [res.data, ...allAccounts.value];
  } catch {}
}

watch(
  () => props.modelValue,
  val => {
    if (val) ensureSelected(String(val));
  },
  { immediate: true }
);

function onFocus() {
  void loadRecent();
  if (allAccounts.value.length === 0) fetchList();
}

function onChange(val: string | undefined) {
  if (!val) return;
  const fromList = allAccounts.value.find(a => a.uid === val);
  const fromRecent = recent.value.find(o => o.value === val);
  void touchRecentEntity("payment", {
    uid: val,
    name: fromList?.name || fromRecent?.label || val
  });
}

const showRecentGroup = computed(
  () => recent.value.length > 0 && keyword.value.trim().length === 0
);

const remoteOptions = computed(() => {
  if (!showRecentGroup.value) return options.value;
  const recentIds = new Set(recent.value.map(r => r.value));
  return options.value.filter(o => !recentIds.has(o.value));
});

const remoteMethod = useDebounceFn((val: string) => {
  keyword.value = val || "";
}, 150);
</script>

<template>
  <el-select
    v-model="innerValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    filterable
    remote
    :remote-method="remoteMethod"
    :loading="loading"
    class="w-full"
    @focus="onFocus"
    @change="onChange"
  >
    <template v-if="showRecentGroup">
      <el-option-group label="最近">
        <el-option
          v-for="item in recent"
          :key="`r-${item.value}`"
          :label="item.label"
          :value="item.value"
        />
      </el-option-group>
      <el-option-group v-if="remoteOptions.length" label="全部">
        <el-option
          v-for="item in remoteOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-option-group>
    </template>
    <template v-else>
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </template>
  </el-select>
</template>
