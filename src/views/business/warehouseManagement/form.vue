<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { FormRules } from "element-plus";
import { localForage } from "@/utils";

interface FormItemProps {
  uid: string;
  tireId: string;
  count: number;
  toBeStocked: number;
  toBeShipped: number;
  maxPriceInHistory: number;
  minPriceInHistory: number;
  averagePrice: number;
  lastPrice: number;
  alarmId: string;
  repoId: string;
  desc: string;
  lastInAt: Date;
  lastOutAt: Date;
}

interface FormProps {
  formInline: FormItemProps;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    uid: "",
    tireId: "",
    count: 0,
    toBeStocked: 0,
    toBeShipped: 0,
    maxPriceInHistory: 0,
    minPriceInHistory: 0,
    averagePrice: 0,
    lastPrice: 0,
    alarmId: "",
    repoId: "",
    desc: "",
    lastInAt: null,
    lastOutAt: null
  })
});
/** 自定义表单规则校验 */
const formRules = reactive({
  tireId: [{ required: true, message: "轮胎类型为必填项", trigger: "blur" }],
  desc: [{ required: false, message: "角色标识为必填项", trigger: "blur" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);
const allTiresList = ref([]);

const getAllTiresList = async () => {
  allTiresList.value = await localForage().getItem("tire");
};

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
onMounted(async () => {
  await getAllTiresList();
});
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-form-item label="轮胎" prop="tireId">
      <el-select
        v-model="newFormInline.tireId"
        clearable
        placeholder="请选择轮胎"
      >
        <el-option
          v-for="item in allTiresList"
          :key="item.id"
          :label="item.group + '-' + item.name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="库存数量" prop="count">
      <el-input-number v-model="newFormInline.count" clearable />
    </el-form-item>

    <el-form-item label="均价" prop="averagePrice">
      <el-input
        v-model="newFormInline.averagePrice"
        clearable
        placeholder="请输入均价"
      />
    </el-form-item>

    <el-form-item label="最新价格" prop="lastPrice">
      <el-input
        v-model="newFormInline.lastPrice"
        clearable
        placeholder="请输入最新价格"
      />
    </el-form-item>

    <el-form-item label="备注">
      <el-input
        v-model="newFormInline.desc"
        placeholder="请输入备注信息"
        type="textarea"
      />
    </el-form-item>

    <el-form-item label="最新入库" prop="lastInAt">
      <el-date-picker
        v-model="newFormInline.lastInAt"
        clearable
        type="datetime"
        placeholder="请输入最新入库时间"
      />
    </el-form-item>

    <el-form-item label="最新出库" prop="lastOutAt">
      <el-date-picker
        v-model="newFormInline.lastOutAt"
        clearable
        type="datetime"
        placeholder="请输入最新出库时间"
      />
    </el-form-item>
  </el-form>
</template>
