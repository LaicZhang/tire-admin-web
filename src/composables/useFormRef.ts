import { type Ref, unref } from "vue";
import type { FormInstance, FormRules } from "element-plus";

/**
 * Element Plus 表单引用封装
 *
 * @description 简化 formRef.value.getRef().validate() 调用模式
 *
 * @example
 * ```vue
 * <script setup>
 * import { ref } from 'vue';
 * import { useFormRef } from '@/composables/useFormRef';
 *
 * const formRef = ref();
 * const { validate, validateField, reset, scrollToField } = useFormRef(formRef);
 *
 * async function handleSubmit() {
 *   if (await validate()) {
 *     // 表单验证通过
 *   }
 * }
 * </script>
 * ```
 */
export function useFormRef<T extends FormInstance = FormInstance>(
  formRef: Ref<T | undefined>
) {
  const getInstance = (): T | undefined => {
    const ref = unref(formRef);
    // 兼容 getRef 模式
    return (ref as unknown as { getRef?: () => T })?.getRef?.() ?? ref;
  };

  /**
   * 验证整个表单
   */
  async function validate(): Promise<boolean> {
    const instance = getInstance();
    if (!instance) return false;
    return instance.validate().then(valid => valid as boolean);
  }

  /**
   * 验证单个字段
   */
  async function validateField(
    prop: string | string[],
    rules?: FormRules | FormRules[]
  ): Promise<boolean> {
    const instance = getInstance();
    if (!instance) return false;
    return instance.validateField(prop, rules).then((valid: boolean) => valid);
  }

  /**
   * 重置表单
   */
  function resetFields(props?: string | string[]) {
    const instance = getInstance();
    instance?.resetFields(props);
  }

  /**
   * 清除验证
   */
  function clearValidate(props?: string | string[]) {
    const instance = getInstance();
    instance?.clearValidate(props);
  }

  /**
   * 滚动到指定字段
   */
  function scrollToField(prop: string) {
    const instance = getInstance();
    instance?.scrollToField(prop);
  }

  /**
   * 获取表单数据
   */
  function getFormData<T = Record<string, unknown>>(): T {
    const instance = getInstance();
    return (instance?.model as T) || {};
  }

  /**
   * 设置表单数据
   */
  function setFormData(data: Record<string, unknown>) {
    const instance = getInstance();
    if (instance?.model) {
      Object.assign(instance.model, data);
    }
  }

  return {
    /** 原始表单引用 */
    formRef,
    /** 验证表单 */
    validate,
    /** 验证单个字段 */
    validateField,
    /** 重置表单 */
    resetFields,
    /** 清除验证 */
    clearValidate,
    /** 滚动到字段 */
    scrollToField,
    /** 获取表单数据 */
    getFormData,
    /** 设置表单数据 */
    setFormData,
    /** 获取内部实例（直接访问 Element Plus API） */
    getInstance
  };
}
