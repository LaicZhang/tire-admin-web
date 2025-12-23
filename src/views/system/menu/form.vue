<script setup lang="ts">
import { ref, computed } from "vue";
import { formRules } from "./utils/rule";
import { FormProps } from "./utils/types";
import IconSelect from "@/components/ReIcon/src/Select.vue";
import ReCol from "@/components/ReCol";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    code: 0,
    parentId: "",
    title: "",
    icon: "",
    path: "",
    rank: 99,
    component: "",
    auths: "",
    frameSrc: "",
    redirect: "",
    showLink: true,
    keepAlive: false,
    hidden: false,
    fixedTag: false,
    hiddenTag: false,
    enterTransition: "",
    leaveTransition: ""
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

function getRef() {
  return ruleFormRef.value;
}

const showType = computed(() => {
  return newFormInline.value.code;
});

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :active="newFormInline"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-row :gutter="30">
      <re-col>
        <el-form-item label="菜单类型">
          <el-radio-group v-model="newFormInline.code">
            <el-radio-button :value="0">菜单</el-radio-button>
            <el-radio-button :value="1">Iframe</el-radio-button>
            <el-radio-button :value="2">外链</el-radio-button>
            <el-radio-button :value="3">按钮</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </re-col>

      <!-- Parent Menu Selection can be added here, usually a Cascader or TreeSelect -->

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="菜单名称" prop="title">
          <el-input
            v-model="newFormInline.title"
            clearable
            placeholder="请输入菜单名称"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="路由路径" prop="path">
          <el-input
            v-model="newFormInline.path"
            clearable
            placeholder="请输入路由路径"
          />
        </el-form-item>
      </re-col>

      <re-col v-if="showType !== 3" :value="12" :xs="24" :sm="24">
        <el-form-item label="组件路径" prop="component">
          <el-input
            v-model="newFormInline.component"
            clearable
            placeholder="请输入组件路径"
          />
        </el-form-item>
      </re-col>

      <re-col v-if="showType !== 3" :value="12" :xs="24" :sm="24">
        <el-form-item label="菜单图标">
          <IconSelect v-model="newFormInline.icon" class="w-full" />
        </el-form-item>
      </re-col>

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="排序">
          <el-input-number
            v-model="newFormInline.rank"
            class="!w-full"
            :min="0"
            :max="9999"
          />
        </el-form-item>
      </re-col>

      <re-col v-if="showType === 3" :value="12" :xs="24" :sm="24">
        <el-form-item label="权限标识" prop="auths">
          <el-input
            v-model="newFormInline.auths"
            clearable
            placeholder="请输入权限标识"
          />
        </el-form-item>
      </re-col>

      <re-col v-if="showType === 1" :value="12" :xs="24" :sm="24">
        <el-form-item label="链接地址">
          <el-input
            v-model="newFormInline.frameSrc"
            clearable
            placeholder="请输入 Iframe 链接地址"
          />
        </el-form-item>
      </re-col>

      <re-col v-if="showType === 2" :value="12" :xs="24" :sm="24">
        <el-form-item label="外链地址">
          <el-input
            v-model="newFormInline.frameSrc"
            clearable
            placeholder="请输入外链链接地址"
          />
        </el-form-item>
      </re-col>

      <re-col v-if="showType === 0" :value="12" :xs="24" :sm="24">
        <el-form-item label="重定向">
          <el-input
            v-model="newFormInline.redirect"
            clearable
            placeholder="请输入重定向地址"
          />
        </el-form-item>
      </re-col>

      <!-- Switches for booleans -->
      <re-col v-if="showType !== 3" :value="12" :xs="24" :sm="24">
        <el-form-item label="显示">
          <el-switch
            v-model="newFormInline.showLink"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
      </re-col>

      <re-col v-if="showType === 0" :value="12" :xs="24" :sm="24">
        <el-form-item label="缓存">
          <el-switch
            v-model="newFormInline.keepAlive"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
