<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import type { FormRules } from "element-plus";
import type { InitialStockForm, InitialStockItem } from "./types";
import AddIcon from "~icons/ep/plus";
import DeleteIcon from "~icons/ep/delete";

interface FormProps {
  formInline?: InitialStockForm;
  isEdit?: boolean;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    tireId: "",
    repoId: "",
    quantity: 0,
    costPrice: 0,
    batchNo: "",
    remark: ""
  }),
  isEdit: false
});

const formRules = reactive<FormRules>({
  tireId: [{ required: true, message: "请选择商品", trigger: "change" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

// 多仓库期初库存明细
const stockItems = ref<InitialStockItem[]>([
  { repoId: "", repoName: "", quantity: 0, costPrice: 0, batchNo: "" }
]);

// 模拟数据
const tireList = ref([
  { uid: "t1", name: "轮胎A" },
  { uid: "t2", name: "轮胎B" },
  { uid: "t3", name: "轮胎C" }
]);

const repoList = ref([
  { uid: "r1", name: "主仓库" },
  { uid: "r2", name: "分仓库A" },
  { uid: "r3", name: "分仓库B" }
]);

// 添加仓库行
const handleAddItem = () => {
  stockItems.value.push({
    repoId: "",
    repoName: "",
    quantity: 0,
    costPrice: 0,
    batchNo: ""
  });
};

// 删除仓库行
const handleRemoveItem = (index: number) => {
  if (stockItems.value.length > 1) {
    stockItems.value.splice(index, 1);
  }
};

// 计算总数量和总金额
const totalQuantity = computed(() => {
  return stockItems.value.reduce((sum, item) => sum + (item.quantity || 0), 0);
});

const totalAmount = computed(() => {
  return stockItems.value.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.costPrice || 0);
  }, 0);
});

function getRef() {
  return ruleFormRef.value;
}

function getStockItems() {
  return stockItems.value;
}

defineExpose({ getRef, getStockItems });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="100px"
  >
    <el-form-item label="商品" prop="tireId">
      <el-select
        v-model="newFormInline.tireId"
        placeholder="请选择商品"
        filterable
        class="w-full"
        :disabled="isEdit"
      >
        <el-option
          v-for="item in tireList"
          :key="item.uid"
          :label="item.name"
          :value="item.uid"
        />
      </el-select>
    </el-form-item>

    <el-divider content-position="left">仓库期初库存</el-divider>

    <div class="border rounded p-4 mb-4">
      <div
        v-for="(item, index) in stockItems"
        :key="index"
        class="flex items-center gap-2 mb-4 last:mb-0"
      >
        <el-form-item label="仓库" class="mb-0 flex-1">
          <el-select
            v-model="item.repoId"
            placeholder="选择仓库"
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

        <el-form-item label="数量" class="mb-0 w-32">
          <el-input-number
            v-model="item.quantity"
            :min="0"
            :precision="0"
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="成本单价" class="mb-0 w-36">
          <el-input-number
            v-model="item.costPrice"
            :min="0"
            :precision="2"
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="批次号" class="mb-0 w-32">
          <el-input
            v-model="item.batchNo"
            placeholder="批次号"
            class="w-full"
          />
        </el-form-item>

        <el-button
          type="danger"
          :icon="DeleteIcon"
          circle
          size="small"
          :disabled="stockItems.length <= 1"
          @click="handleRemoveItem(index)"
        />
      </div>

      <el-button type="primary" text :icon="AddIcon" @click="handleAddItem">
        添加仓库
      </el-button>
    </div>

    <el-form-item label="统计">
      <div class="flex gap-8">
        <span>
          总数量：<span class="font-bold text-primary">{{
            totalQuantity
          }}</span>
        </span>
        <span>
          总金额：<span class="font-bold text-primary">{{
            totalAmount.toFixed(2)
          }}</span>
        </span>
      </div>
    </el-form-item>

    <el-form-item label="备注" prop="remark">
      <el-input
        v-model="newFormInline.remark"
        type="textarea"
        placeholder="请输入备注"
        :rows="2"
      />
    </el-form-item>
  </el-form>
</template>
