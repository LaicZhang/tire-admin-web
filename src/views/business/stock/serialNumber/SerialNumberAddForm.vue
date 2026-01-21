<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { message } from "@/utils/message";
import {
  createSerialNumber,
  createSerialNumberBatch
} from "@/api/business/serialNumber";
import { ElMessageBox } from "element-plus";

interface Props {
  formInline: {
    type: "single" | "batch";
    tireOptions: Array<{ uid: string; name: string }>;
    repoOptions: Array<{ uid: string; name: string }>;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "refresh"): void;
}>();

const formLoading = ref(false);

const formData = reactive({
  serialNo: "",
  serialNos: "",
  tireId: "",
  repoId: "",
  batchNo: "",
  productionDate: "",
  expiryDate: ""
});

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    serialNo: "",
    serialNos: "",
    tireId: "",
    repoId: "",
    batchNo: "",
    productionDate: "",
    expiryDate: ""
  });
};

// 表单验证
const validate = (): boolean => {
  if (!formData.tireId) {
    message("请选择商品", { type: "warning" });
    return false;
  }
  if (!formData.repoId) {
    message("请选择仓库", { type: "warning" });
    return false;
  }
  if (props.formInline.type === "single" && !formData.serialNo) {
    message("请输入序列号", { type: "warning" });
    return false;
  }
  if (props.formInline.type === "batch" && !formData.serialNos) {
    message("请输入序列号（每行一个）", { type: "warning" });
    return false;
  }
  return true;
};

// 提交表单
const handleSubmit = async () => {
  if (!validate()) return;

  formLoading.value = true;
  try {
    if (props.formInline.type === "single") {
      await createSerialNumber({
        serialNo: formData.serialNo,
        tireId: formData.tireId,
        repoId: formData.repoId,
        batchNo: formData.batchNo || undefined,
        productionDate: formData.productionDate || undefined,
        expiryDate: formData.expiryDate || undefined
      });
      message("创建成功", { type: "success" });
      return true;
    } else {
      const serialNos = formData.serialNos
        .split("\n")
        .map(s => s.trim())
        .filter(s => s);
      if (serialNos.length === 0) {
        message("请输入有效的序列号", { type: "warning" });
        return false;
      }
      const { data } = await createSerialNumberBatch({
        serialNos,
        tireId: formData.tireId,
        repoId: formData.repoId
      });
      const successCount = data.filter(r => r.success).length;
      const failCount = data.filter(r => !r.success).length;
      if (failCount > 0) {
        ElMessageBox.alert(
          `成功 ${successCount} 条，失败 ${failCount} 条。\n失败详情：${data
            .filter(r => !r.success)
            .map(r => `${r.serialNo}: ${r.error}`)
            .join("\n")}`,
          "批量创建结果",
          { type: "warning" }
        );
      } else {
        message(`批量创建成功 ${successCount} 条`, { type: "success" });
      }
      return true;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "创建失败";
    message(msg, { type: "error" });
    return false;
  } finally {
    formLoading.value = false;
  }
};

defineExpose({
  validate,
  handleSubmit,
  formLoading
});
</script>

<template>
  <el-form :model="formData" label-width="100px">
    <el-form-item v-if="formInline.type === 'single'" label="序列号" required>
      <el-input
        v-model="formData.serialNo"
        placeholder="请输入序列号（如：SN20241226001）"
      />
    </el-form-item>
    <el-form-item
      v-if="formInline.type === 'batch'"
      label="序列号列表"
      required
    >
      <el-input
        v-model="formData.serialNos"
        type="textarea"
        :rows="6"
        placeholder="每行输入一个序列号"
      />
    </el-form-item>
    <el-form-item label="商品" required>
      <el-select
        v-model="formData.tireId"
        placeholder="请选择商品"
        class="w-full!"
        filterable
      >
        <el-option
          v-for="item in formInline.tireOptions"
          :key="item.uid"
          :label="item.name"
          :value="item.uid"
        />
      </el-select>
      <div class="text-xs text-gray-400 mt-1">
        提示：商品数据需从商品管理模块获取
      </div>
    </el-form-item>
    <el-form-item label="仓库" required>
      <el-select
        v-model="formData.repoId"
        placeholder="请选择仓库"
        class="w-full!"
        filterable
      >
        <el-option
          v-for="item in formInline.repoOptions"
          :key="item.uid"
          :label="item.name"
          :value="item.uid"
        />
      </el-select>
      <div class="text-xs text-gray-400 mt-1">
        提示：仓库数据需从仓库管理模块获取
      </div>
    </el-form-item>
    <el-form-item v-if="formInline.type === 'single'" label="批次号">
      <el-input v-model="formData.batchNo" placeholder="可选" />
    </el-form-item>
    <el-form-item v-if="formInline.type === 'single'" label="生产日期">
      <el-date-picker
        v-model="formData.productionDate"
        type="date"
        placeholder="选择日期"
        class="w-full!"
      />
    </el-form-item>
    <el-form-item v-if="formInline.type === 'single'" label="有效期">
      <el-date-picker
        v-model="formData.expiryDate"
        type="date"
        placeholder="选择日期"
        class="w-full!"
      />
    </el-form-item>
  </el-form>
</template>
