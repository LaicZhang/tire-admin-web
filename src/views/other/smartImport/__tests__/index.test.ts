import { flushPromises, mount } from "@vue/test-utils";
import { nextTick, reactive, ref, type PropType } from "vue";
import { defineComponent, h } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => {
  const spies = {
    handleFileChange: vi.fn(),
    handleFileRemove: vi.fn(),
    parseFileSheets: vi.fn(async () => undefined),
    handleSheetSelect: vi.fn(async () => false),
    performSmartMapping: vi.fn(),
    handleMappingChange: vi.fn(),
    removeMapping: vi.fn(),
    getAvailableTargetFields: vi.fn(() => [
      { key: "name", label: "名称", required: true }
    ]),
    resetMapping: vi.fn(),
    loadPreview: vi.fn(async () => undefined),
    resetPreview: vi.fn(),
    startImport: vi.fn(async () => undefined),
    resetExecute: vi.fn(),
    message: vi.fn()
  };
  return {
    spies,
    file: null as any,
    mapping: null as any,
    preview: null as any,
    execute: null as any
  };
});

vi.mock("@/utils/message", () => ({ message: fixture.spies.message }));
vi.mock("../composables/useSmartImportFile", async () => {
  const { ref } = await import("vue");
  fixture.file = {
    uploadedFile: ref<any>(null),
    sheets: ref<any[]>([]),
    selectedSheet: ref(0),
    sourceColumns: ref<any[]>([]),
    loading: ref(false),
    handleFileChange: fixture.spies.handleFileChange,
    handleFileRemove: fixture.spies.handleFileRemove,
    parseFileSheets: fixture.spies.parseFileSheets,
    handleSheetSelect: fixture.spies.handleSheetSelect
  };
  return { useSmartImportFile: () => fixture.file };
});
vi.mock("../composables/useSmartImportMapping", async () => {
  const { ref } = await import("vue");
  fixture.mapping = {
    fieldMappings: ref<any[]>([]),
    requiredFieldsMapped: ref(false),
    mappedFieldsCount: ref(0),
    canProceedToPreview: ref(false),
    performSmartMapping: fixture.spies.performSmartMapping,
    handleMappingChange: fixture.spies.handleMappingChange,
    removeMapping: fixture.spies.removeMapping,
    getAvailableTargetFields: fixture.spies.getAvailableTargetFields,
    reset: fixture.spies.resetMapping
  };
  return { useSmartImportMapping: () => fixture.mapping };
});
vi.mock("../composables/useSmartImportPreview", async () => {
  const { ref } = await import("vue");
  fixture.preview = {
    previewData: ref<any[]>([]),
    loading: ref(false),
    validRowsCount: ref(0),
    errorRowsCount: ref(0),
    generatePreviewColumns: vi.fn(() => []),
    getRowStatusType: vi.fn(() => "success"),
    loadPreview: fixture.spies.loadPreview,
    reset: fixture.spies.resetPreview
  };
  return { useSmartImportPreview: () => fixture.preview };
});
vi.mock("../composables/useSmartImportExecute", async () => {
  const { ref } = await import("vue");
  fixture.execute = {
    progress: ref(reactive({ current: 0, total: 0, status: "idle" })),
    importResult: ref<any>(null),
    loading: ref(false),
    startImport: fixture.spies.startImport,
    reset: fixture.spies.resetExecute
  };
  return { useSmartImportExecute: () => fixture.execute };
});

import SmartImportPage from "../index.vue";
import { ImportStep } from "../types";

const Button = defineComponent({
  emits: ["click"],
  setup(_, { slots, emit }) {
    return () =>
      h(
        "button",
        { onClick: (event: Event) => emit("click", event) },
        slots.default?.()
      );
  }
});
const PassThrough = defineComponent({
  setup(_, { slots }) {
    return () => h("div", slots.default?.());
  }
});
const Card = defineComponent({
  setup(_, { slots, attrs }) {
    return () => h("section", attrs, [slots.header?.(), slots.default?.()]);
  }
});
const PureTable = defineComponent({
  props: {
    data: {
      type: Array as PropType<Record<string, unknown>[]>,
      default: () => []
    },
    columns: { type: Array as PropType<unknown[]>, default: () => [] }
  },
  setup(props, { slots }) {
    return () =>
      h("div", { class: "pure-table" }, [
        ...props.data.flatMap((row, index) =>
          Object.entries(slots)
            .filter(([name]) => name !== "default")
            .flatMap(([, slot]) => slot?.({ row, index }) ?? [])
        ),
        ...props.data.map(row => JSON.stringify(row))
      ]);
  }
});
const Upload = defineComponent({
  props: { onChange: Function, disabled: Boolean },
  setup(props) {
    return () =>
      h("button", {
        class: "upload",
        disabled: props.disabled,
        onClick: () => props.onChange?.({ name: "x" })
      });
  }
});
const Select = defineComponent({
  props: { modelValue: String },
  emits: ["update:modelValue"],
  setup(props, { slots }) {
    return () => h("select", { value: props.modelValue }, slots.default?.());
  }
});
const Option = defineComponent({
  props: { label: String, value: String },
  setup(props) {
    return () => h("option", { value: props.value }, props.label);
  }
});

function mountPage() {
  return mount(SmartImportPage, {
    global: {
      stubs: {
        ElCard: Card,
        ElButton: Button,
        ElForm: PassThrough,
        ElFormItem: PassThrough,
        ElSelect: Select,
        ElOption: Option,
        ElUpload: Upload,
        ElIcon: PassThrough,
        ElAlert: defineComponent({
          props: { description: String },
          setup(props, { slots }) {
            return () => h("div", [props.description ?? "", slots.default?.()]);
          }
        }),
        ElRadioGroup: PassThrough,
        ElRadio: PassThrough,
        ElCollapse: PassThrough,
        ElCollapseItem: defineComponent({
          props: { title: String },
          setup(props, { slots }) {
            return () => h("div", [props.title ?? "", slots.default?.()]);
          }
        }),
        ElTag: PassThrough,
        ElProgress: PassThrough,
        PureTable,
        UploadIcon: true,
        DocumentIcon: true,
        LoadingIcon: true,
        CheckIcon: true,
        CloseIcon: true
      }
    }
  });
}

type Wrapper = Awaited<ReturnType<typeof mountPage>>;
const stateOf = (wrapper: Wrapper) =>
  wrapper.vm.$.setupState as Record<string, any>;

beforeEach(() => {
  fixture.file.uploadedFile.value = null;
  fixture.file.sheets.value = [];
  fixture.file.selectedSheet.value = 0;
  fixture.file.sourceColumns.value = [];
  fixture.file.loading.value = false;
  fixture.mapping.fieldMappings.value = [];
  fixture.mapping.requiredFieldsMapped.value = false;
  fixture.mapping.mappedFieldsCount.value = 0;
  fixture.mapping.canProceedToPreview.value = false;
  fixture.preview.previewData.value = [];
  fixture.preview.loading.value = false;
  fixture.preview.validRowsCount.value = 0;
  fixture.preview.errorRowsCount.value = 0;
  fixture.execute.progress.value = reactive({
    current: 0,
    total: 0,
    status: "idle"
  });
  fixture.execute.importResult.value = null;
  fixture.execute.loading.value = false;
  Object.values(fixture.spies).forEach(spy => spy.mockClear());
  fixture.spies.parseFileSheets.mockImplementation(async () => undefined);
  fixture.spies.handleSheetSelect.mockResolvedValue(false);
  fixture.spies.startImport.mockImplementation(
    async (_type, _file, onProgress) => {
      onProgress?.(25);
    }
  );
});

describe("SmartImport page", () => {
  it("reacts to type changes only when source columns exist", async () => {
    const wrapper = mountPage();
    const state = stateOf(wrapper);

    state.config.type = "tire";
    await nextTick();
    expect(fixture.spies.performSmartMapping).not.toHaveBeenCalled();

    fixture.file.sourceColumns.value = [
      { index: 0, name: "名称", sampleValues: [] }
    ];
    state.config.type = "product";
    await nextTick();
    expect(fixture.spies.performSmartMapping).toHaveBeenCalledWith(
      fixture.file.sourceColumns.value
    );

    state.config.type = "unknown";
    await nextTick();
    expect(state.targetFields).toEqual([]);
    wrapper.unmount();
  });

  it("opens sheet selection for zero, one and several parsed sheets", async () => {
    const wrapper = mountPage();
    const state = stateOf(wrapper);

    await state.handleFileChangeWrapper({ name: "empty.xlsx" });
    await flushPromises();
    expect(state.currentStep).toBe(ImportStep.UPLOAD);

    fixture.spies.parseFileSheets.mockImplementationOnce(async () => {
      fixture.file.sheets.value = [{ index: 0, name: "Only", rowCount: 2 }];
    });
    await state.handleFileChangeWrapper({ name: "one.xlsx" });
    await flushPromises();
    expect(state.currentStep).toBe(ImportStep.SELECT_SHEET);
    expect(fixture.spies.handleSheetSelect).toHaveBeenCalledTimes(1);

    fixture.spies.parseFileSheets.mockImplementationOnce(async () => {
      fixture.file.sheets.value = [
        { index: 0, name: "One", rowCount: 1 },
        { index: 1, name: "Two", rowCount: 2 }
      ];
    });
    await state.handleFileChangeWrapper({ name: "many.xlsx" });
    await flushPromises();
    expect(state.currentStep).toBe(ImportStep.SELECT_SHEET);
    expect(wrapper.text()).toContain("One");
    expect(wrapper.text()).toContain("Two");
    wrapper.unmount();
  });

  it("advances mapping only after a successful sheet parse with columns", async () => {
    const wrapper = mountPage();
    const state = stateOf(wrapper);

    fixture.spies.handleSheetSelect.mockResolvedValueOnce(false);
    await state.handleSheetSelect();
    expect(state.currentStep).toBe(ImportStep.UPLOAD);

    fixture.spies.handleSheetSelect.mockResolvedValueOnce(true);
    await state.handleSheetSelect();
    expect(state.currentStep).toBe(ImportStep.UPLOAD);

    fixture.file.sourceColumns.value = [
      { index: 0, name: "名称", sampleValues: [] }
    ];
    fixture.spies.handleSheetSelect.mockResolvedValueOnce(true);
    await state.handleSheetSelect();
    expect(fixture.spies.performSmartMapping).toHaveBeenCalledWith(
      fixture.file.sourceColumns.value
    );
    expect(state.currentStep).toBe(ImportStep.FIELD_MAPPING);
    wrapper.unmount();
  });

  it("guards preview and only advances when rows are returned", async () => {
    const wrapper = mountPage();
    const state = stateOf(wrapper);

    await state.goToPreview();
    expect(fixture.spies.message).toHaveBeenCalledWith(
      "请确保所有必填字段都已映射",
      { type: "warning" }
    );
    expect(fixture.spies.loadPreview).not.toHaveBeenCalled();

    fixture.mapping.canProceedToPreview.value = true;
    await state.goToPreview();
    expect(state.currentStep).toBe(ImportStep.UPLOAD);

    fixture.preview.previewData.value = [{ rowIndex: 1 }];
    await state.goToPreview();
    expect(state.currentStep).toBe(ImportStep.PREVIEW);
    wrapper.unmount();
  });

  it("imports selected files and chooses result state from the execution result", async () => {
    const wrapper = mountPage();
    const state = stateOf(wrapper);

    await state.startImport();
    expect(fixture.spies.startImport).not.toHaveBeenCalled();

    fixture.file.uploadedFile.value = {
      uid: "1",
      name: "data.xlsx",
      size: 10,
      status: "ready"
    };
    fixture.execute.importResult.value = null;
    await state.startImport();
    expect(state.currentStep).toBe(ImportStep.IMPORTING);
    expect(fixture.spies.startImport).toHaveBeenCalledWith(
      "",
      fixture.file.uploadedFile.value,
      expect.any(Function)
    );
    expect(fixture.execute.progress.value.current).toBe(25);

    fixture.execute.importResult.value = {
      success: true,
      total: 1,
      successCount: 1,
      failedCount: 0
    };
    await state.startImport();
    expect(state.currentStep).toBe(ImportStep.RESULT);
    wrapper.unmount();
  });

  it("resets state, navigates back and formats file sizes", () => {
    const wrapper = mountPage();
    const state = stateOf(wrapper);

    state.currentStep = ImportStep.PREVIEW;
    state.config.type = "tire";
    state.goBack();
    expect(state.currentStep).toBe(ImportStep.PREVIEW - 1);
    state.currentStep = ImportStep.UPLOAD;
    state.goBack();
    expect(state.currentStep).toBe(ImportStep.UPLOAD);

    expect(state.formatFileSize(10)).toBe("10 B");
    expect(state.formatFileSize(1024)).toBe("1.0 KB");
    expect(state.formatFileSize(1024 * 1024)).toBe("1.0 MB");

    state.currentStep = ImportStep.PREVIEW;
    state.resetImport();
    expect(state.currentStep).toBe(ImportStep.UPLOAD);
    expect(state.config.type).toBe("");
    expect(fixture.spies.handleFileRemove).toHaveBeenCalled();
    expect(fixture.spies.resetMapping).toHaveBeenCalled();
    expect(fixture.spies.resetPreview).toHaveBeenCalled();
    expect(fixture.spies.resetExecute).toHaveBeenCalled();
    wrapper.unmount();
  });

  it("derives loading when any async operation runs", async () => {
    const wrapper = mountPage();
    const state = stateOf(wrapper);
    expect(state.loading).toBe(false);
    fixture.file.loading.value = true;
    await nextTick();
    expect(state.loading).toBe(true);
    fixture.file.loading.value = false;
    fixture.preview.loading.value = true;
    await nextTick();
    expect(state.loading).toBe(true);
    fixture.preview.loading.value = false;
    fixture.execute.loading.value = true;
    await nextTick();
    expect(state.loading).toBe(true);
    wrapper.unmount();
  });

  it("renders upload, remove and step controls", async () => {
    const wrapper = mountPage();
    const state = stateOf(wrapper);
    fixture.file.uploadedFile.value = {
      uid: "1",
      name: "data.xlsx",
      size: 2048,
      status: "ready"
    };
    await nextTick();
    expect(wrapper.text()).toContain("data.xlsx");
    expect(wrapper.text()).toContain("2.0 KB");

    const remove = wrapper
      .findAll("button")
      .find(button => button.text() === "删除");
    await remove!.trigger("click");
    expect(fixture.spies.handleFileRemove).toHaveBeenCalled();

    state.currentStep = ImportStep.FIELD_MAPPING;
    await nextTick();
    expect(
      wrapper.findAll("button").some(button => button.text() === "重新开始")
    ).toBe(true);
    state.currentStep = ImportStep.RESULT;
    await nextTick();
    expect(
      wrapper.findAll("button").some(button => button.text() === "重新开始")
    ).toBe(false);
    wrapper.unmount();
  });

  it("renders mapping completeness and mapping actions", async () => {
    const wrapper = mountPage();
    const state = stateOf(wrapper);
    state.currentStep = ImportStep.FIELD_MAPPING;
    fixture.file.sourceColumns.value = [
      { index: 0, name: "名称", sampleValues: [] }
    ];
    fixture.mapping.fieldMappings.value = [
      {
        sourceColumn: { index: 0, name: "名称" },
        targetField: null,
        confidence: 0,
        isManual: false
      },
      {
        sourceColumn: { index: 1, name: "编码" },
        targetField: { key: "code", label: "编码" },
        confidence: 100,
        isManual: true
      }
    ];
    fixture.mapping.mappedFieldsCount.value = 1;
    fixture.mapping.requiredFieldsMapped.value = false;
    fixture.spies.getAvailableTargetFields.mockReturnValue([
      { key: "name", label: "名称", required: false },
      { key: "code", label: "编码", required: true }
    ]);
    await nextTick();
    expect(wrapper.text()).toContain("存在未映射的必填字段");
    expect(wrapper.findAll("option").map(option => option.text())).toContain(
      "名称"
    );
    expect(wrapper.findAll("option").map(option => option.text())).toContain(
      "编码 *"
    );
    expect(
      wrapper.findAll("option").map(option => option.text())
    ).not.toContain("名称 *");
    expect(
      wrapper.findAll("button").filter(button => button.text() === "移除")
    ).toHaveLength(1);

    fixture.mapping.requiredFieldsMapped.value = true;
    await nextTick();
    expect(wrapper.text()).toContain("必填字段已完成映射");
    wrapper.unmount();
  });

  it("renders preview warnings and starts import from the preview", async () => {
    const wrapper = mountPage();
    const state = stateOf(wrapper);
    state.currentStep = ImportStep.PREVIEW;
    fixture.preview.previewData.value = [{ rowIndex: 1 }];
    fixture.preview.validRowsCount.value = 1;
    fixture.preview.errorRowsCount.value = 2;
    fixture.file.uploadedFile.value = {
      uid: "1",
      name: "data.xlsx",
      size: 10,
      status: "ready"
    };
    await nextTick();
    expect(wrapper.text()).toContain("错误数据: 2 条");
    expect(wrapper.text()).toContain("存在错误数据");

    const start = wrapper
      .findAll("button")
      .find(button => button.text().includes("开始导入"));
    await start!.trigger("click");
    expect(fixture.spies.startImport).toHaveBeenCalled();
    wrapper.unmount();
  });

  it("renders import progress and successful result details", async () => {
    const wrapper = mountPage();
    const state = stateOf(wrapper);
    state.currentStep = ImportStep.IMPORTING;
    fixture.execute.progress.value.current = 3;
    fixture.execute.progress.value.total = 4;
    await nextTick();
    expect(wrapper.text()).toContain("3 / 4");

    fixture.execute.importResult.value = {
      success: true,
      total: 3,
      successCount: 3,
      failedCount: 0,
      errors: []
    };
    state.currentStep = ImportStep.RESULT;
    await nextTick();
    expect(wrapper.text()).toContain("导入完成");
    expect(wrapper.text()).toContain("成功导入");
    expect(wrapper.text()).not.toContain("导入失败");
    expect(wrapper.text()).not.toContain("查看错误详情");
    wrapper.unmount();
  });

  it("renders failed result errors without an import result", async () => {
    const wrapper = mountPage();
    const state = stateOf(wrapper);
    state.currentStep = ImportStep.RESULT;
    await nextTick();
    expect(wrapper.text()).not.toContain("导入失败");

    fixture.execute.importResult.value = {
      success: false,
      total: 2,
      successCount: 1,
      failedCount: 1,
      errors: [{ row: 2, message: "bad value" }]
    };
    await nextTick();
    expect(wrapper.text()).toContain("导入失败");
    expect(wrapper.text()).toContain("导入失败");
    expect(wrapper.text()).toContain("查看错误详情");
    expect(wrapper.text()).toContain("bad value");
    wrapper.unmount();
  });
});
