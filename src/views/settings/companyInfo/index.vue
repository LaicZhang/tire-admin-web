<script setup lang="ts">
import { ref } from "vue";
import { message } from "@/utils";
import { useSettingsForm } from "@/composables";
import {
  getCompanyInfoApi,
  updateCompanyInfoApi,
  uploadCompanyLogoApi,
  type CompanyInfoDto,
  type UpdateCompanyInfoDto
} from "@/api/setting";
import type { CompanyInfo } from "./types";

defineOptions({
  name: "CompanyInfo"
});

const createDefaultCompanyInfo = (): CompanyInfo => ({
  companyName: "",
  taxNumber: "",
  legalPerson: "",
  contactPerson: "",
  phone: "",
  fax: "",
  email: "",
  address: "",
  website: "",
  bankName: "",
  bankAccount: "",
  logo: "",
  remark: ""
});

const formRef = ref();

const rules = {
  companyName: [{ required: true, message: "请输入公司名称", trigger: "blur" }]
};

const {
  loading,
  formData,
  handleSave: saveCompanyInfo
} = useSettingsForm<CompanyInfo, CompanyInfoDto>({
  group: "company-info",
  loadGroup: async () => {
    const res = await getCompanyInfoApi();
    return {
      ...res,
      data: res.data ? [res.data] : []
    };
  },
  saveGroup: async (_group, settings) =>
    updateCompanyInfoApi(settings as UpdateCompanyInfoDto),
  defaults: createDefaultCompanyInfo,
  transformLoad: (settings, form) => {
    const dto = settings[0];
    if (!dto) return;
    form.companyName = dto.name ?? "";
    form.phone = dto.phone ?? "";
    form.email = dto.email ?? "";
    form.address = dto.address ?? "";
    form.logo = dto.logoUrl ?? "";
    form.logoUid = dto.logoUid;
    form.remark = dto.desc ?? "";
    form.contactPerson = dto.principalName ?? "";
  },
  transformSave: form => ({
    name: form.companyName,
    address: form.address,
    phone: form.phone,
    email: form.email,
    desc: form.remark,
    principalName: form.contactPerson,
    logoUid: form.logoUid
  })
});

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  await saveCompanyInfo();
};

const handleLogoUpload = async (file: File) => {
  try {
    const { code, data } = await uploadCompanyLogoApi(file);
    if (code === 200 && data) {
      formData.value.logo = data.url;
      formData.value.logoUid = data.uid;
      message("Logo上传成功", { type: "success" });
    } else {
      message("Logo上传失败", { type: "error" });
    }
  } catch {
    message("Logo上传失败", { type: "error" });
  }
  return false;
};
</script>

<template>
  <div class="page-container">
    <div class="bg-white p-6 rounded-md">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-medium">公司信息</h3>
        <el-button type="primary" :loading="loading" @click="handleSave">
          保存
        </el-button>
      </div>

      <div class="flex gap-8">
        <!-- 左侧 Logo 上传 -->
        <div class="shrink-0">
          <div class="text-sm text-gray-500 mb-2">公司 Logo</div>
          <el-upload
            class="logo-uploader"
            :show-file-list="false"
            :before-upload="handleLogoUpload"
            accept="image/*"
          >
            <img
              v-if="formData.logo"
              :src="formData.logo"
              class="w-32 h-32 object-contain border rounded"
            />
            <div
              v-else
              class="w-32 h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 cursor-pointer"
            >
              <span class="text-3xl">+</span>
            </div>
          </el-upload>
          <div class="text-xs text-gray-400 mt-2">点击上传公司Logo</div>
        </div>

        <!-- 右侧表单 -->
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="100px"
          label-position="left"
          class="flex-1"
        >
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="公司名称" prop="companyName">
                <el-input
                  v-model="formData.companyName"
                  placeholder="请输入公司名称"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="纳税人识别号" prop="taxNumber">
                <el-input
                  v-model="formData.taxNumber"
                  placeholder="请输入纳税人识别号"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="法人代表" prop="legalPerson">
                <el-input
                  v-model="formData.legalPerson"
                  placeholder="请输入法人代表"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系人" prop="contactPerson">
                <el-input
                  v-model="formData.contactPerson"
                  placeholder="请输入联系人"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="电话" prop="phone">
                <el-input v-model="formData.phone" placeholder="请输入电话" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="传真" prop="fax">
                <el-input v-model="formData.fax" placeholder="请输入传真" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="formData.email" placeholder="请输入邮箱" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="网址" prop="website">
                <el-input v-model="formData.website" placeholder="请输入网址" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="地址" prop="address">
            <el-input v-model="formData.address" placeholder="请输入公司地址" />
          </el-form-item>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="开户银行" prop="bankName">
                <el-input
                  v-model="formData.bankName"
                  placeholder="请输入开户银行"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="银行账号" prop="bankAccount">
                <el-input
                  v-model="formData.bankAccount"
                  placeholder="请输入银行账号"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}

.logo-uploader {
  :deep(.el-upload) {
    display: block;
  }
}
</style>
