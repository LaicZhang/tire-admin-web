<script setup lang="ts">
import { ref, computed } from "vue";
import type { FormRules } from "element-plus";
import type { FormProps, UnitOption } from "./types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Plus from "~icons/ep/plus";
import Delete from "~icons/ep/delete";
import { elementRules } from "@/utils/validation/elementRules";

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

const rules: FormRules = {
  name: [
    elementRules.requiredStringTrim("请输入单位组名称"),
    elementRules.maxLen(50, "单位组名称最多 50 个字符")
  ],
  baseUnitUid: [
    elementRules.requiredSelect("请选择基本单位"),
    elementRules.uuidV4("基本单位不合法", "change")
  ],
  conversions: [
    {
      trigger: "change",
      validator: (_rule, value, callback) => {
        const baseUnitUid = String(
          newFormInline.value.baseUnitUid || ""
        ).trim();
        if (baseUnitUid && !/^[0-9a-f-]{36}$/i.test(baseUnitUid))
          return callback(new Error("基本单位不合法"));

        const list = Array.isArray(value) ? (value as any[]) : [];
        const used = new Set<string>();
        for (const conv of list) {
          const unitUid = String(conv?.unitUid || "").trim();
          if (!unitUid) return callback(new Error("请选择换算单位"));
          if (baseUnitUid && unitUid === baseUnitUid)
            return callback(new Error("换算单位不能与基本单位相同"));
          if (used.has(unitUid)) return callback(new Error("换算单位不能重复"));
          used.add(unitUid);

          if (
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              unitUid
            )
          )
            return callback(new Error("换算单位不合法"));

          const ratio =
            typeof conv?.ratio === "number" ? conv.ratio : Number(conv?.ratio);
          if (!Number.isFinite(ratio) || ratio < 0.0001)
            return callback(new Error("换算比例需不小于 0.0001"));
        }
        callback();
      }
    }
  ],
  sort: [
    {
      trigger: "blur",
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined || value === "")
          return callback();
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(n) || n < 0 || n > 9999)
          return callback(new Error("排序需在 0~9999"));
        callback();
      }
    }
  ],
  remark: [elementRules.maxLen(200, "备注最多 200 个字符")]
};

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
  newFormInline.value.conversions.push({
    unitUid: "",
    ratio: 1,
    _uid: crypto.randomUUID()
  });
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
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="rules"
    label-width="90px"
  >
    <el-form-item label="单位组名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入单位组名称，如：重量单位"
        maxlength="50"
      />
    </el-form-item>
    <el-form-item label="基本单位" prop="baseUnitUid">
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

    <el-form-item label="换算关系" prop="conversions">
      <div class="w-full">
        <div
          v-for="(conv, index) in newFormInline.conversions"
          :key="conv._uid || conv.unitUid || index"
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
