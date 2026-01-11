<script setup lang="ts">
import { ref, computed } from "vue";
import type { FormProps, UnitOption } from "./types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Plus from "~icons/ep/plus";
import Delete from "~icons/ep/delete";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    name: "",
    baseUnitUid: "",
    conversions: [],
    sort: 0,
    remark: ""
  }),
  unitOptions: () => [],
  isEdit: false
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const availableUnits = computed(() => {
  const usedUids = new Set([
    newFormInline.value.baseUnitUid,
    ...newFormInline.value.conversions.map(c => c.unitUid)
  ]);
  return props.unitOptions.filter(u => !usedUids.has(u.uid) || !u.uid);
});

const baseUnitName = computed(() => {
  const unit = props.unitOptions.find(
    u => u.uid === newFormInline.value.baseUnitUid
  );
  return unit?.name || "";
});

function addConversion() {
  newFormInline.value.conversions.push({ unitUid: "", ratio: 1 });
}

function removeConversion(index: number) {
  newFormInline.value.conversions.splice(index, 1);
}

function getUnitName(uid: string): string {
  const unit = props.unitOptions.find(u => u.uid === uid);
  return unit?.name || "";
}

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form ref="ruleFormRef" :model="newFormInline" label-width="90px">
    <el-form-item
      label="单位组名称"
      prop="name"
      :rules="[
        { required: true, message: '请输入单位组名称', trigger: 'blur' }
      ]"
    >
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入单位组名称，如：重量单位"
        maxlength="50"
      />
    </el-form-item>
    <el-form-item
      label="基本单位"
      prop="baseUnitUid"
      :rules="[
        { required: true, message: '请选择基本单位', trigger: 'change' }
      ]"
    >
      <el-select
        v-model="newFormInline.baseUnitUid"
        placeholder="请选择基本单位"
        class="w-full"
        clearable
      >
        <el-option
          v-for="unit in unitOptions"
          :key="unit.uid"
          :label="`${unit.name} (${unit.symbol})`"
          :value="unit.uid"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="换算关系">
      <div class="w-full">
        <div
          v-for="(conv, index) in newFormInline.conversions"
          :key="index"
          class="flex items-center gap-2 mb-2"
        >
          <span class="whitespace-nowrap">1</span>
          <el-select
            v-model="conv.unitUid"
            placeholder="选择单位"
            class="w-[120px]!"
          >
            <el-option
              v-for="unit in [
                ...availableUnits,
                ...unitOptions.filter(u => u.uid === conv.unitUid)
              ]"
              :key="unit.uid"
              :label="unit.name"
              :value="unit.uid"
            />
          </el-select>
          <span class="whitespace-nowrap">=</span>
          <el-input-number
            v-model="conv.ratio"
            :min="0.0001"
            :precision="4"
            class="w-[120px]!"
          />
          <span class="whitespace-nowrap">{{
            baseUnitName || "基本单位"
          }}</span>
          <el-button
            link
            type="danger"
            :icon="useRenderIcon(Delete)"
            @click="removeConversion(index)"
          />
        </div>
        <el-button
          type="primary"
          link
          :icon="useRenderIcon(Plus)"
          @click="addConversion"
        >
          添加换算关系
        </el-button>
      </div>
    </el-form-item>

    <el-form-item label="排序" prop="sort">
      <el-input-number
        v-model="newFormInline.sort"
        :min="0"
        :max="9999"
        class="!w-full"
      />
    </el-form-item>
    <el-form-item label="备注" prop="remark">
      <el-input
        v-model="newFormInline.remark"
        type="textarea"
        :rows="3"
        placeholder="请输入备注"
        maxlength="200"
      />
    </el-form-item>
  </el-form>
</template>
