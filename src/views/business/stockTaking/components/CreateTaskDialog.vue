<script setup lang="ts">
defineProps<{
  visible: boolean;
  loading: boolean;
  form: {
    name: string;
    remark: string;
  };
}>();

defineEmits<{
  "update:visible": [value: boolean];
  "update:form": [value: { name: string; remark: string }];
  submit: [];
}>();
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="创建盘点任务"
    width="500px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="任务名称">
        <el-input
          :model-value="form.name"
          placeholder="留空则自动生成"
          @update:model-value="$emit('update:form', { ...form, name: $event })"
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          :model-value="form.remark"
          type="textarea"
          placeholder="可选"
          @update:model-value="
            $emit('update:form', { ...form, remark: $event })
          "
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="loading" @click="$emit('submit')">
        创建
      </el-button>
    </template>
  </el-dialog>
</template>
