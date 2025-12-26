<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from "vue";
import type { FormRules } from "element-plus";
import Add from "~icons/ep/plus";
import Delete from "~icons/ep/delete";
import {
  formatToken,
  getFileMd5,
  getImageWH,
  getToken,
  message,
  StaticImageTypeEnum,
  BaseImagePath,
  BaseStaticUploadPath
} from "@/utils";
import { setUploadedImages } from "@/views/business/tire/store";
import {
  getAllUnitsApi,
  createUnitConversionApi,
  deleteUnitConversionApi,
  type Unit,
  type UnitConversion
} from "@/api/business/unit";

interface FormItemProps {
  id?: number;
  uid?: string;
  group: string;
  name?: string;
  desc?: string;
  unit: string;
  unitId?: string;
  pattern?: string;
  brand?: string;
  loadIndex?: string;
  speedLevel?: string;
  format?: string;
  weight?: number;
  purchasePriceWithTax?: number;
  purchasePrice?: number;
  salePriceWithTax?: number;
  salePrice?: number;
  commissionType: number;
  commission?: string;
  covers: any[];
  // 多单位设置
  enableMultiUnit?: boolean;
  unitConversions?: UnitConversion[];
}

interface FormProps {
  formInline?: FormItemProps;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    id: undefined,
    uid: undefined,
    group: "默认",
    name: undefined,
    desc: undefined,
    unit: "套",
    unitId: undefined,
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
    covers: [],
    enableMultiUnit: false,
    unitConversions: []
  })
});
/** 自定义表单规则校验 */
const formRules = reactive({
  name: [{ required: true, message: "名称为必填项", trigger: "blur" }],
  salePrice: [{ required: true, message: "售价为必填项", trigger: "blur" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

// 多单位相关
const unitList = ref<Unit[]>([]);
const showAddConversionDialog = ref(false);
const newConversion = ref({
  targetUnitId: "",
  ratio: 1
});

// 计算主单位
const mainUnit = computed(() => {
  if (!newFormInline.value.unitId) return null;
  return unitList.value.find(u => u.uid === newFormInline.value.unitId);
});

function getRef() {
  return ruleFormRef.value;
}

const Authorization = ref("");

function getAuthorization() {
  const token = getToken();
  if (!token?.accessToken) return;
  Authorization.value = formatToken(token.accessToken);
}

const uploadData = ref();

async function handleSuccess(
  response: any,
  _file: any,
  _fileList: any,
  _row?: any
) {
  const { code, msg, data } = response;
  if (code !== 200) message(msg, { type: "error" });
  const params = { id: data.id };
  await setUploadedImages(params);
}

const onBeforeUpload = async (file: any) => {
  const { name, size, type, lastModified } = file;
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
};

// 加载单位列表
const loadUnits = async () => {
  try {
    const { data, code } = await getAllUnitsApi();
    if (code === 200) {
      unitList.value = data || [];
    }
  } catch (error) {
    console.error("加载单位列表失败", error);
  }
};

// 添加单位换算
const handleAddConversion = async () => {
  if (!newConversion.value.targetUnitId || !newConversion.value.ratio) {
    message("请填写完整信息", { type: "warning" });
    return;
  }

  if (newConversion.value.ratio <= 0) {
    message("换算比例必须大于0", { type: "warning" });
    return;
  }

  const targetUnit = unitList.value.find(
    u => u.uid === newConversion.value.targetUnitId
  );

  // 本地添加到列表
  const conversions = newFormInline.value.unitConversions || [];
  conversions.push({
    id: Date.now(),
    uid: `temp-${Date.now()}`,
    sourceUnitId: newFormInline.value.unitId || "",
    targetUnitId: newConversion.value.targetUnitId,
    ratio: newConversion.value.ratio,
    sourceUnit: mainUnit.value || undefined,
    targetUnit: targetUnit
  });
  newFormInline.value.unitConversions = conversions;

  showAddConversionDialog.value = false;
  newConversion.value = { targetUnitId: "", ratio: 1 };
  message("已添加换算关系，保存商品时生效", { type: "success" });
};

// 删除换算关系
const handleRemoveConversion = (index: number) => {
  const conversions = newFormInline.value.unitConversions || [];
  conversions.splice(index, 1);
  newFormInline.value.unitConversions = conversions;
};

// 获取可添加的辅单位（排除已添加的）
const availableUnits = computed(() => {
  const existingIds = (newFormInline.value.unitConversions || []).map(
    c => c.targetUnitId
  );
  return unitList.value.filter(
    u => u.uid !== newFormInline.value.unitId && !existingIds.includes(u.uid)
  );
});

defineExpose({ getRef });

onMounted(() => {
  getAuthorization();
  loadUnits();
});

// 监听主单位变化，更新unit字段
watch(
  () => newFormInline.value.unitId,
  newVal => {
    if (newVal) {
      const unit = unitList.value.find(u => u.uid === newVal);
      if (unit) {
        newFormInline.value.unit = unit.name;
      }
    }
  }
);
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
          :src="BaseImagePath + item.hash + '.' + item.ext"
          loading="lazy"
          :preview-src-list="
            newFormInline.covers.map(item => {
              return BaseImagePath + item.hash + '.' + item.ext;
            })
          "
        />
      </div>
      <div v-else>
        <el-upload
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
      </div>
    </el-form-item>

    <!-- 单位设置 -->
    <el-divider content-position="left">单位设置</el-divider>

    <el-form-item label="主单位" prop="unitId">
      <el-select
        v-model="newFormInline.unitId"
        placeholder="选择单位"
        clearable
        class="w-40"
      >
        <el-option
          v-for="unit in unitList"
          :key="unit.uid"
          :label="unit.name"
          :value="unit.uid"
        />
      </el-select>
      <span class="ml-2 text-gray-400 text-sm"> 或使用文本单位： </span>
      <el-input
        v-model="newFormInline.unit"
        clearable
        placeholder="默认为套"
        class="w-24 ml-2"
      />
    </el-form-item>

    <el-form-item label="多单位">
      <el-switch v-model="newFormInline.enableMultiUnit" />
      <span class="ml-2 text-gray-400 text-sm">
        启用后可设置辅助单位和换算比例
      </span>
    </el-form-item>

    <!-- 多单位换算设置 -->
    <el-form-item v-if="newFormInline.enableMultiUnit" label="单位换算">
      <div class="w-full">
        <div
          v-for="(conv, index) in newFormInline.unitConversions"
          :key="conv.uid"
          class="flex items-center mb-2 p-2 bg-gray-50 rounded"
        >
          <span>1 {{ mainUnit?.name || newFormInline.unit }}</span>
          <span class="mx-2">=</span>
          <span class="font-bold text-primary">{{ conv.ratio }}</span>
          <span class="ml-1">{{ conv.targetUnit?.name || "未知单位" }}</span>
          <el-button
            type="danger"
            size="small"
            text
            class="ml-auto"
            @click="handleRemoveConversion(index)"
          >
            <IconifyIconOffline :icon="Delete" />
          </el-button>
        </div>

        <el-button
          v-if="availableUnits.length > 0"
          type="primary"
          size="small"
          text
          @click="showAddConversionDialog = true"
        >
          <IconifyIconOffline :icon="Add" class="mr-1" />
          添加换算关系
        </el-button>
        <span
          v-else-if="(newFormInline.unitConversions || []).length > 0"
          class="text-gray-400 text-sm"
        >
          所有可用单位已添加
        </span>
      </div>
    </el-form-item>

    <el-divider content-position="left">商品信息</el-divider>

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

  <!-- 添加换算关系弹窗 -->
  <el-dialog
    v-model="showAddConversionDialog"
    title="添加单位换算"
    width="400px"
  >
    <el-form label-width="80px">
      <el-form-item label="换算关系">
        <div class="flex items-center">
          <span>1 {{ mainUnit?.name || newFormInline.unit }}</span>
          <span class="mx-2">=</span>
          <el-input-number
            v-model="newConversion.ratio"
            :min="0.001"
            :precision="3"
            class="w-28"
          />
          <el-select
            v-model="newConversion.targetUnitId"
            placeholder="选择辅单位"
            class="ml-2 w-28"
          >
            <el-option
              v-for="unit in availableUnits"
              :key="unit.uid"
              :label="unit.name"
              :value="unit.uid"
            />
          </el-select>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showAddConversionDialog = false">取消</el-button>
      <el-button type="primary" @click="handleAddConversion">确定</el-button>
    </template>
  </el-dialog>
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
</style>
