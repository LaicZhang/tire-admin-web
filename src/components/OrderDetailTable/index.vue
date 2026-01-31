<script setup lang="ts">
import { computed } from "vue";
import type { TableColumnList } from "@/utils/columnFactories";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Delete from "~icons/ep/delete";
import AddFill from "~icons/ri/add-circle-line";

export interface OrderDetailBase {
  tireId?: string;
  count?: number;
  unitPrice?: number;
  total?: number;
  repoId?: string;
  [key: string]: unknown;
}

/** 折扣相关字段 */
interface OrderDetailDiscount {
  discountRate?: number;
  discountAmount?: number;
}

/** 物流相关字段 */
interface OrderDetailShipping {
  isArrival?: boolean;
  isShipped?: boolean;
  isDelivered?: boolean;
}

export type OrderDetailRow = OrderDetailBase &
  Partial<OrderDetailDiscount> &
  Partial<OrderDetailShipping>;

export interface OrderDetailTableProps {
  details: OrderDetailRow[];
  columns: TableColumnList;
  tireList: Array<{ uid: string; name: string }>;
  repoList: Array<{ uid: string; name: string }>;
  isReadOnly?: boolean;
  showDiscount?: boolean;
  showIsArrival?: boolean;
  showIsShipped?: boolean;
  onAdd?: (detail: OrderDetailRow) => void;
  onDelete?: (index: number, detail: OrderDetailRow) => void;
  onCalcTotal?: (row: OrderDetailRow) => void;
  onRecalcTotal?: (details: OrderDetailRow[]) => void;
}

const props = withDefaults(defineProps<OrderDetailTableProps>(), {
  isReadOnly: false,
  showDiscount: false,
  showIsArrival: false,
  showIsShipped: false
});

const emit = defineEmits<{
  (e: "add"): void;
  (e: "delete", index: number): void;
  (e: "update:details", details: OrderDetailRow[]): void;
}>();

const isEditable = computed(() => !props.isReadOnly);

const detailsModel = computed({
  get: () => props.details,
  set: val => emit("update:details", val)
});

function onAddDetail() {
  const baseDetail: OrderDetailBase = {
    tireId: "",
    count: 1,
    unitPrice: 0,
    total: 0,
    repoId: ""
  };

  const discountFields: OrderDetailDiscount = props.showDiscount
    ? { discountRate: 0, discountAmount: 0 }
    : {};

  const shippingFields: OrderDetailShipping = props.showIsArrival
    ? { isArrival: false }
    : props.showIsShipped
      ? { isShipped: false, isDelivered: false }
      : {};

  const newDetail = {
    ...baseDetail,
    ...discountFields,
    ...shippingFields
  } as OrderDetailRow;

  detailsModel.value.push(newDetail);
  emit("add");
  props.onAdd?.(newDetail);
}

function onDeleteDetail(index: number) {
  const detail = detailsModel.value[index];
  detailsModel.value.splice(index, 1);
  emit("delete", index);
  props.onDelete?.(index, detail);
  recalcTotal();
}

function recalcTotal() {
  let totalCount = 0;
  let totalAmount = 0;
  detailsModel.value.forEach(d => {
    totalCount += d.count || 0;
    totalAmount += d.total || 0;
  });
  props.onRecalcTotal?.(detailsModel.value);
}

defineExpose({
  recalcTotal
});
</script>

<template>
  <pure-table
    row-key="uid"
    :columns="columns"
    :data="detailsModel"
    border
    adaptive
    show-overflow-tooltip
  >
    <template #tireIdSelect="{ row }">
      <el-select
        v-model="row.tireId"
        placeholder="选择商品"
        clearable
        filterable
        :disabled="isReadOnly"
        aria-label="选择商品"
      >
        <el-option
          v-for="item in tireList"
          :key="item.uid"
          :label="item.name"
          :value="item.uid"
        />
      </el-select>
    </template>

    <template #countInput="{ row }">
      <el-input-number
        v-model="row.count"
        :min="1"
        :max="9999"
        :disabled="isReadOnly"
        controls-position="right"
        aria-label="数量"
        @change="() => props.onCalcTotal?.(row)"
      />
    </template>

    <template #unitPriceInput="{ row }">
      <el-input-number
        v-model="row.unitPrice"
        :min="0"
        :precision="2"
        :disabled="isReadOnly"
        controls-position="right"
        aria-label="单价"
        @change="() => props.onCalcTotal?.(row)"
      />
    </template>

    <template #totalInput="{ row }">
      <el-input-number
        v-model="row.total"
        :min="0"
        :precision="2"
        disabled
        controls-position="right"
        aria-label="金额"
      />
    </template>

    <template #repoIdSelect="{ row }">
      <el-select
        v-model="row.repoId"
        placeholder="选择仓库"
        clearable
        :disabled="isReadOnly"
        aria-label="选择仓库"
      >
        <el-option
          v-for="item in repoList"
          :key="item.uid"
          :label="item.name"
          :value="item.uid"
        />
      </el-select>
    </template>

    <template v-if="showIsArrival" #isArrivalSwitch="{ row }">
      <el-switch
        v-model="row.isArrival"
        :disabled="isReadOnly"
        aria-label="是否到货"
      />
    </template>

    <template v-if="showDiscount" #discountInput="{ row }">
      <el-input-number
        v-model="row.discountRate"
        :min="0"
        :max="100"
        :disabled="isReadOnly"
        controls-position="right"
        aria-label="折扣率"
        @change="() => props.onCalcTotal?.(row)"
      />
    </template>

    <template v-if="showDiscount" #discountAmountInput="{ row }">
      <el-input-number
        v-model="row.discountAmount"
        :min="0"
        :precision="2"
        disabled
        controls-position="right"
        aria-label="折扣金额"
      />
    </template>

    <template v-if="showIsShipped" #isShippedSwitch="{ row }">
      <el-switch
        v-model="row.isShipped"
        :disabled="isReadOnly"
        aria-label="是否发货"
      />
    </template>

    <template v-if="showIsShipped" #isDeliveredSwitch="{ row }">
      <el-switch
        v-model="row.isDelivered"
        :disabled="isReadOnly"
        aria-label="是否送达"
      />
    </template>

    <template #descInput="{ row }">
      <el-input
        v-model="row.desc"
        placeholder="备注"
        :disabled="isReadOnly"
        aria-label="备注"
      />
    </template>

    <template #operation="{ $index }">
      <el-popconfirm title="确认删除此行?" @confirm="onDeleteDetail($index)">
        <template #reference>
          <el-button
            v-if="isEditable"
            link
            type="danger"
            :icon="useRenderIcon(Delete)"
            :aria-label="`删除第 ${$index + 1} 行`"
          >
            删除
          </el-button>
        </template>
      </el-popconfirm>
    </template>

    <template v-if="isEditable" #append>
      <el-button
        plain
        class="w-full my-2"
        :icon="useRenderIcon(AddFill)"
        aria-label="添加商品明细"
        @click="onAddDetail"
      >
        添加商品明细
      </el-button>
    </template>
  </pure-table>
</template>
