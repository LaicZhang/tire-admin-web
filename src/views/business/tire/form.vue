<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { FormRules } from "element-plus";
import Add from "@iconify-icons/ep/plus";
import {
  getFileMd5,
  getImageWH,
  getMD5,
  getToken,
  localForage,
  message,
  StaticImageTypeEnum
} from "@/utils";
import { setUploadedImages } from "@/views/business/tire/store";
import { BaseImagePath, BaseStaticUploadPath } from "@/utils";

interface FormItemProps {
  id?: number;
  uid?: string;
  group: string;
  name: string;
  desc?: string;
  unit: string;
  pattern: string;
  brand: string;
  loadIndex: string;
  speedLevel: string;
  format: string;
  weight: number;
  purchasePriceWithTax: number;
  purchasePrice: number;
  salePriceWithTax: number;
  salePrice: number;
  commissionType: number;
  commission: string;
  covers: any[];
}

interface FormProps {
  formInline: FormItemProps;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    id: undefined,
    uid: "",
    group: "默认",
    name: undefined,
    desc: undefined,
    unit: "条",
    pattern: undefined,
    brand: undefined,
    loadIndex: undefined,
    speedLevel: undefined,
    format: undefined,
    weight: undefined,
    purchasePriceWithTax: undefined,
    purchasePrice: undefined,
    salePriceWithTax: undefined,
    salePrice: undefined,
    commissionType: 0,
    commission: undefined,
    covers: []
  })
});
/** 自定义表单规则校验 */
const formRules = reactive({
  name: [{ required: true, message: "名称为必填项", trigger: "blur" }],
  salePrice: [{ required: true, message: "售价为必填项", trigger: "blur" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

function getRef() {
  return ruleFormRef.value;
}

const Authorization = ref("");

function getAuthorization() {
  if (!Authorization.value)
    Authorization.value = "Bearer " + getToken().accessToken;
}

const uploadData = ref();

// const uploadedImagesList = ref([]);

async function handleSuccess(response, file, fileList, row?) {
  console.log("handleSuccess", response, file, fileList, row);
  const { code, msg, data } = response;
  if (code !== 200) message(msg, { type: "error" });
  const params = { id: data.id };
  // uploadedImagesList.value.push(params);
  // uploadedImagesList.value = Array.from(new Set(uploadedImagesList.value));
  await setUploadedImages(params);
}

const onBeforeUpload = async file => {
  const { name, size, type, lastModified } = file;
  console.log(file);
  const hash = getFileMd5(lastModified, size);
  const [filename, ext] = name.split(".");
  const { width, height } = await getImageWH(file);
  uploadData.value = {
    hash,
    ext,
    filename,
    size,
    mimetype: type,
    width,
    height,
    lastModified,
    type: StaticImageTypeEnum.COVER
  };
  console.log("uploadData", uploadData.value);
};

defineExpose({ getRef });
onMounted(() => {
  getAuthorization();
});
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-form-item label="名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入名称"
      />
    </el-form-item>

    <el-form-item label="分组" prop="group">
      <el-input
        v-model="newFormInline.group"
        clearable
        placeholder="请输入分组"
      />
    </el-form-item>

    <el-form-item label="实物图" prop="covers">
      <div v-if="newFormInline.covers.length !== 0">
        <el-image
          v-for="item in newFormInline.covers"
          :key="item.id"
          style="height: 80px"
          :src="BaseImagePath + item.hash + '.' + item.ext"
          loading="lazy"
          :preview-src-list="
            newFormInline.covers.map(item => {
              return BaseImagePath + item.hash + '.' + item.ext;
            })
          "
        />
      </div>
      <el-upload
        v-if="newFormInline.covers.length < 4"
        v-model="newFormInline.covers"
        :before-upload="onBeforeUpload"
        :on-success="
          (response, file, fileList) => {
            return handleSuccess(response, file, fileList);
          }
        "
        :data="uploadData"
        class="cover-uploader"
        drag
        :action="BaseStaticUploadPath"
        :headers="{ Authorization }"
      >
        <IconifyIconOffline :icon="Add" class="m-auto mt-4" />
      </el-upload>
    </el-form-item>

    <el-form-item label="单位" prop="unit">
      <el-input v-model="newFormInline.unit" clearable placeholder="默认为条" />
    </el-form-item>

    <el-form-item label="品牌" prop="brand">
      <el-input
        v-model="newFormInline.brand"
        clearable
        placeholder="请输入品牌"
      />
    </el-form-item>

    <el-form-item label="花纹" prop="pattern">
      <el-input
        v-model="newFormInline.pattern"
        clearable
        placeholder="请输入花纹"
      />
    </el-form-item>

    <el-form-item label="载重指数" prop="loadIndex">
      <el-input
        v-model="newFormInline.loadIndex"
        clearable
        placeholder="请输入载重指数"
      />
    </el-form-item>

    <el-form-item label="速度级别" prop="speedLevel">
      <el-input
        v-model="newFormInline.speedLevel"
        clearable
        placeholder="请输入速度级别"
      />
    </el-form-item>

    <el-form-item label="规格" prop="format">
      <el-input
        v-model="newFormInline.format"
        clearable
        placeholder="请输入规格"
      />
    </el-form-item>

    <el-form-item label="重量" prop="weight">
      <el-input-number
        v-model="newFormInline.weight"
        clearable
        placeholder="请输入重量"
      />
    </el-form-item>

    <div class="flex">
      <el-form-item label="含税进价" prop="purchasePriceWithTax">
        <el-input-number
          v-model="newFormInline.purchasePriceWithTax"
          clearable
          placeholder="请输入含税进价"
        />
      </el-form-item>

      <el-form-item label="进价" prop="purchasePrice">
        <el-input-number
          v-model="newFormInline.purchasePrice"
          clearable
          placeholder="请输入进价"
        />
      </el-form-item>
    </div>

    <div class="flex">
      <el-form-item label="含税售价" prop="salePriceWithTax">
        <el-input-number
          v-model="newFormInline.salePriceWithTax"
          clearable
          placeholder="请输入含税售价"
        />
      </el-form-item>

      <el-form-item label="售价" prop="salePrice">
        <el-input-number
          v-model="newFormInline.salePrice"
          clearable
          placeholder="请输入售价"
        />
      </el-form-item>
    </div>

    <el-form-item label="备注" prop="desc">
      <el-input
        v-model="newFormInline.desc"
        placeholder="请输入备注信息"
        type="textarea"
      />
    </el-form-item>
  </el-form>
</template>

<style scoped>
.cover-uploader .el-upload {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  transition: var(--el-transition-duration-fast);
}

.cover-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

/**
.el-icon.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
*/
</style>
