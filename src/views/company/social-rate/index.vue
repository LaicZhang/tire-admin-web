<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { message } from "@/utils";
import {
  getSocialRateApi,
  upsertSocialRateApi,
  type SocialRateConfig
} from "@/api/company/social-rate";

defineOptions({ name: "SocialRateConfig" });

const loading = ref(false);
const form = reactive<SocialRateConfig>({
  contributionBase: 0,
  employeePensionBp: 800,
  employeeMedicalBp: 200,
  employeeUnemploymentBp: 50,
  employeeInjuryBp: 0,
  employeeBirthBp: 0,
  employeeHousingBp: 1200,
  companyPensionBp: 1600,
  companyMedicalBp: 800,
  companyUnemploymentBp: 50,
  companyInjuryBp: 20,
  companyBirthBp: 80,
  companyHousingBp: 1200,
  effectiveFrom: null
});

type BpKey = Exclude<
  keyof SocialRateConfig,
  "uid" | "contributionBase" | "effectiveFrom"
>;

const bpFields: Array<{ key: BpKey; label: string }> = [
  { key: "employeePensionBp", label: "个人养老 bp" },
  { key: "employeeMedicalBp", label: "个人医疗 bp" },
  { key: "employeeUnemploymentBp", label: "个人失业 bp" },
  { key: "employeeInjuryBp", label: "个人工伤 bp" },
  { key: "employeeBirthBp", label: "个人生育 bp" },
  { key: "employeeHousingBp", label: "个人公积金 bp" },
  { key: "companyPensionBp", label: "公司养老 bp" },
  { key: "companyMedicalBp", label: "公司医疗 bp" },
  { key: "companyUnemploymentBp", label: "公司失业 bp" },
  { key: "companyInjuryBp", label: "公司工伤 bp" },
  { key: "companyBirthBp", label: "公司生育 bp" },
  { key: "companyHousingBp", label: "公司公积金 bp" }
];

async function load() {
  loading.value = true;
  try {
    const res = await getSocialRateApi();
    if (res.data) Object.assign(form, res.data);
  } finally {
    loading.value = false;
  }
}

async function save() {
  loading.value = true;
  try {
    await upsertSocialRateApi({ ...form });
    message("五险一金配置已保存（生成工资表时快照）", { type: "success" });
    await load();
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div v-loading="loading" class="p-4">
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span>公司五险一金比例（bp：1% = 100）</span>
          <el-button type="primary" @click="save">保存</el-button>
        </div>
      </template>
      <el-form label-width="140px" class="max-w-3xl">
        <el-form-item label="缴费基数(分)">
          <el-input v-model="form.contributionBase" class="w-[240px]" />
        </el-form-item>
        <el-form-item label="生效月 YYYYMM">
          <el-input
            v-model="form.effectiveFrom"
            class="w-[240px]"
            placeholder="可空=始终"
          />
        </el-form-item>
        <el-divider>个人 / 公司比例</el-divider>
        <div class="grid grid-cols-2 gap-x-6">
          <el-form-item v-for="f in bpFields" :key="f.key" :label="f.label">
            <el-input-number
              v-model="form[f.key]"
              :min="0"
              :max="10000"
              controls-position="right"
            />
          </el-form-item>
        </div>
        <el-alert
          type="info"
          :closable="false"
          title="说明：配置在生成工资表时快照到个人/公司社保明细，历史工资表不受后续改动影响。"
        />
      </el-form>
    </el-card>
  </div>
</template>
