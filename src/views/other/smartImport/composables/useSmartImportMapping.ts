import { ref, computed } from "vue";
import type { TargetField, FieldMapping, SourceColumn } from "../types";
import { mappingRules } from "../constants";

export function useSmartImportMapping(targetFields: TargetField[]) {
  const fieldMappings = ref<FieldMapping[]>([]);

  const requiredFieldsMapped = computed(() => {
    const required = targetFields.filter(f => f.required);
    return required.every(rf =>
      fieldMappings.value.some(fm => fm.targetField?.key === rf.key)
    );
  });

  const mappedFieldsCount = computed(() => {
    return fieldMappings.value.filter(fm => fm.targetField !== null).length;
  });

  const canProceedToPreview = computed(() => {
    return requiredFieldsMapped.value && mappedFieldsCount.value > 0;
  });

  const performSmartMapping = (sourceColumns: SourceColumn[]) => {
    fieldMappings.value = sourceColumns.map(col => {
      let matchedField: TargetField | null = null;
      let confidence = 0;

      for (const field of targetFields) {
        const rules = mappingRules[field.key] || [];
        for (const rule of rules) {
          if (col.name.includes(rule)) {
            matchedField = field;
            confidence = 85 + Math.random() * 15;
            break;
          }
        }
        if (matchedField) break;

        // 精确匹配
        if (
          col.name === field.label ||
          col.name.toLowerCase() === field.key.toLowerCase()
        ) {
          matchedField = field;
          confidence = 100;
          break;
        }
      }

      return {
        sourceColumn: col,
        targetField: matchedField,
        confidence: Math.round(confidence),
        isManual: false
      };
    });
  };

  const handleMappingChange = (index: number, targetKey: string | null) => {
    if (targetKey === null) {
      fieldMappings.value[index].targetField = null;
      fieldMappings.value[index].confidence = 0;
    } else {
      const field = targetFields.find(f => f.key === targetKey);
      if (field) {
        fieldMappings.value[index].targetField = field;
        fieldMappings.value[index].confidence = 100;
        fieldMappings.value[index].isManual = true;
      }
    }
  };

  const removeMapping = (index: number) => {
    fieldMappings.value[index].targetField = null;
    fieldMappings.value[index].confidence = 0;
    fieldMappings.value[index].isManual = false;
  };

  const getAvailableTargetFields = (currentIndex: number) => {
    const usedKeys = fieldMappings.value
      .filter((_, i) => i !== currentIndex)
      .map(fm => fm.targetField?.key)
      .filter(Boolean);
    return targetFields.filter(f => !usedKeys.includes(f.key));
  };

  const reset = () => {
    fieldMappings.value = [];
  };

  return {
    fieldMappings,
    requiredFieldsMapped,
    mappedFieldsCount,
    canProceedToPreview,
    performSmartMapping,
    handleMappingChange,
    removeMapping,
    getAvailableTargetFields,
    reset
  };
}
