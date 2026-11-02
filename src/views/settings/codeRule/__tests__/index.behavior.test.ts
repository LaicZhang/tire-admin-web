import { flushPromises } from "@vue/test-utils";
import { defineComponent, h, type PropType } from "vue";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  message: vi.fn(),
  addDialog: vi.fn(),
  confirm: vi.fn(),
  fullscreen: vi.fn(),
  get: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  remove: vi.fn(),
  batchRemove: vi.fn(),
  dialog: null as Record<string, any> | null
}));

vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message
}));
vi.mock("@/composables/useDialogService", () => ({
  addDialog: mocks.addDialog
}));
vi.mock("@/composables/useConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mocks.confirm })
}));
vi.mock("@/utils/viewport", () => ({
  resolveDialogFullscreen: mocks.fullscreen
}));
vi.mock("@/api/setting", () => ({
  getCodeRulesApi: mocks.get,
  saveCodeRuleApi: mocks.save,
  updateCodeRuleApi: mocks.update,
  enableCodeRuleApi: mocks.enable,
  disableCodeRuleApi: mocks.disable,
  deleteCodeRuleApi: mocks.remove,
  batchDeleteCodeRulesApi: mocks.batchRemove
}));

import CodeRulePage from "../index.vue";

const TableStub = defineComponent({
  props: {
    data: { type: Array as PropType<Record<string, any>[]>, default: () => [] }
  },
  emits: ["selection-change"],
  setup(props, { emit, slots }) {
    return () =>
      h("div", { class: "rule-table" }, [
        h("button", {
          class: "select-first",
          type: "button",
          onClick: () => emit("selection-change", props.data.slice(0, 1))
        }),
        ...props.data.flatMap(
          (row, index) => slots.operation?.({ row, $index: index }) ?? []
        )
      ]);
  }
});

async function mountPage() {
  return mountSmokeComponent(
    async () => ({ default: CodeRulePage }),
    "settings/codeRule/index.vue",
    {
      keepMounted: true,
      globalStubs: { "pure-table": TableStub, PureTable: TableStub }
    }
  );
}
const state = (wrapper: Awaited<ReturnType<typeof mountPage>>) =>
  wrapper.vm.$.setupState as Record<string, any>;

function rule(overrides: Record<string, unknown> = {}) {
  return {
    uid: "rule-1",
    name: "销售单规则",
    targetType: "document",
    targetCode: "sales_order",
    prefix: "SO",
    dateFormat: "YYYYMMDD",
    serialDigits: 4,
    serialStart: 1,
    resetType: "daily",
    autoFillGap: false,
    allowManualEdit: false,
    resetOnDateChange: false,
    isActive: false,
    isDefault: false,
    ...overrides
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.dialog = null;
  mocks.fullscreen.mockReturnValue(false);
  mocks.get.mockResolvedValue({ code: 200, data: [] });
  mocks.save.mockResolvedValue({ code: 200 });
  mocks.update.mockResolvedValue({ code: 200 });
  mocks.enable.mockResolvedValue({ code: 200 });
  mocks.disable.mockResolvedValue({ code: 200 });
  mocks.remove.mockResolvedValue({ code: 200 });
  mocks.batchRemove.mockResolvedValue({ code: 200 });
  mocks.confirm.mockResolvedValue(true);
  mocks.addDialog.mockImplementation(config => {
    mocks.dialog = config;
  });
});

describe("code rule page behavior", () => {
  it("normalizes list shapes, separates tabs and handles load failures", async () => {
    mocks.get
      .mockResolvedValueOnce({
        code: 200,
        data: [
          rule({ uid: "doc", targetCode: "unknown-doc", resetType: "monthly" }),
          rule({
            uid: "basic",
            targetType: "basic",
            targetCode: "warehouse",
            resetType: "yearly"
          }),
          rule({
            uid: "partial",
            targetType: undefined,
            targetCode: undefined,
            serialDigits: 0
          })
        ]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: { list: [rule({ uid: "wrapped" })] }
      })
      .mockResolvedValueOnce({ code: 200, data: { list: "invalid" } })
      .mockResolvedValueOnce({ code: 500 })
      .mockRejectedValueOnce(new Error("network"));
    const wrapper = await mountPage();
    const vm = state(wrapper);
    try {
      mocks.get
        .mockReset()
        .mockResolvedValueOnce({
          code: 200,
          data: [
            rule({
              uid: "doc",
              targetCode: "unknown-doc",
              resetType: "monthly"
            }),
            rule({
              uid: "basic",
              targetType: "basic",
              targetCode: "warehouse",
              resetType: "yearly"
            }),
            rule({
              uid: "partial",
              targetType: undefined,
              targetCode: undefined,
              serialDigits: 0
            })
          ]
        })
        .mockResolvedValueOnce({
          code: 200,
          data: { list: [rule({ uid: "wrapped" })] }
        })
        .mockResolvedValueOnce({ code: 200, data: { list: "invalid" } })
        .mockResolvedValueOnce({ code: 500 })
        .mockRejectedValueOnce(new Error("network"));
      await vm.loadData();
      expect(vm.documentRules).toHaveLength(2);
      expect(vm.basicRules).toHaveLength(1);
      expect(vm.documentRules[0].targetName).toBe("unknown-doc");
      expect(vm.documentRules[0].resetTypeName).toBe("当月从起始值开始");
      expect(vm.basicRules[0].resetTypeName).toBe("当年从起始值开始");
      expect(vm.documentRules[1].targetTypeName).toBe("单据");
      expect(vm.documentRules[1].serialDigits).toBe(0);

      await vm.loadData();
      expect(vm.documentRules.map(r => r.uid)).toEqual(["wrapped"]);
      await vm.loadData();
      expect(vm.documentRules).toEqual([]);
      expect(vm.basicRules).toEqual([]);

      await vm.loadData();
      await vm.loadData();
      expect(mocks.message).toHaveBeenCalledWith("加载编码规则失败", {
        type: "error"
      });
      expect(vm.loading).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it("opens create and edit dialogs and submits validated payloads", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    try {
      vm.activeTab = "basic";
      vm.openDialog();
      expect(mocks.addDialog).toHaveBeenCalledTimes(1);
      expect(mocks.dialog).toMatchObject({
        title: "新增编码规则",
        width: "600px",
        draggable: true,
        fullscreen: false,
        fullscreenIcon: true,
        closeOnClickModal: false
      });
      expect(mocks.dialog?.props.formInline).toMatchObject({
        targetType: "basic",
        targetCode: "",
        serialDigits: 4,
        resetType: "daily"
      });
      const vnode = mocks.dialog?.contentRenderer({ options: mocks.dialog });
      expect(vnode).toBeTruthy();

      const done = vi.fn();
      const formInline = mocks.dialog?.props.formInline;
      Object.assign(formInline, {
        name: "客户规则",
        targetCode: "customer",
        prefix: "CU",
        resetType: "monthly",
        autoFillGap: true
      });
      vm.formRef = {
        formRef: { validate: (cb: (ok: boolean) => void) => cb(false) }
      };
      mocks.dialog.beforeSure(done, { options: mocks.dialog });
      expect(mocks.save).not.toHaveBeenCalled();

      vm.formRef = {
        formRef: { validate: (cb: (ok: boolean) => void) => cb(true) }
      };
      mocks.save.mockResolvedValueOnce({ code: 500, msg: "保存拒绝" });
      mocks.dialog.beforeSure(done, { options: mocks.dialog });
      await flushPromises();
      expect(mocks.save).toHaveBeenCalledWith({
        name: "客户规则",
        targetType: "basic",
        targetCode: "customer",
        prefix: "CU",
        dateFormat: "YYYYMMDD",
        serialDigits: 4,
        serialStart: 1,
        resetType: "monthly",
        autoFillGap: true,
        allowManualEdit: false,
        resetOnDateChange: false
      });
      expect(mocks.message).toHaveBeenCalledWith("保存拒绝", { type: "error" });

      mocks.save.mockRejectedValueOnce(new Error("save"));
      mocks.dialog.beforeSure(done, { options: mocks.dialog });
      await flushPromises();
      expect(mocks.message).toHaveBeenCalledWith("操作失败", { type: "error" });

      mocks.save.mockResolvedValueOnce({ code: 200 });
      mocks.dialog.beforeSure(done, { options: mocks.dialog });
      await flushPromises();
      expect(done).toHaveBeenCalled();
      expect(mocks.message).toHaveBeenCalledWith("操作成功", {
        type: "success"
      });

      mocks.addDialog.mockClear();
      vm.openDialog("修改", rule({ uid: "edit-1", name: "编辑规则" }));
      expect(mocks.dialog?.title).toBe("修改编码规则");
      expect(mocks.dialog?.props.formInline).toMatchObject({
        uid: "edit-1",
        name: "编辑规则"
      });
      mocks.dialog.beforeSure(done, { options: mocks.dialog });
      await flushPromises();
      expect(mocks.update).toHaveBeenCalledWith(
        "edit-1",
        expect.objectContaining({ name: "编辑规则" })
      );
    } finally {
      wrapper.unmount();
    }
  });

  it("enables and disables rules across success and failure paths", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    try {
      await vm.enableRule(rule({ uid: "" }));
      expect(mocks.message).toHaveBeenCalledWith("缺少规则ID", {
        type: "warning"
      });

      await vm.enableRule(rule());
      expect(mocks.enable).toHaveBeenCalledWith("rule-1");
      expect(mocks.message).toHaveBeenCalledWith("启用成功", {
        type: "success"
      });

      mocks.enable.mockResolvedValueOnce({ code: 500, msg: "" });
      await vm.enableRule(rule());
      expect(mocks.message).toHaveBeenCalledWith("启用失败", { type: "error" });
      mocks.enable.mockRejectedValueOnce(new Error("enable"));
      await vm.enableRule(rule());
      expect(mocks.enable).toHaveBeenCalledTimes(3);

      await vm.disableRule(rule({ isDefault: true }));
      expect(mocks.message).toHaveBeenCalledWith("默认规则不能停用", {
        type: "warning"
      });
      await vm.disableRule(rule({ uid: "" }));
      expect(mocks.message).toHaveBeenCalledWith("缺少规则ID", {
        type: "warning"
      });

      await vm.disableRule(rule());
      expect(mocks.disable).toHaveBeenCalledWith("rule-1");
      expect(mocks.message).toHaveBeenCalledWith("停用成功", {
        type: "success"
      });
      mocks.disable.mockResolvedValueOnce({ code: 500, msg: "停用拒绝" });
      await vm.disableRule(rule());
      expect(mocks.message).toHaveBeenCalledWith("停用拒绝", { type: "error" });
      mocks.disable.mockRejectedValueOnce(new Error("disable"));
      await vm.disableRule(rule());
      expect(mocks.disable).toHaveBeenCalledTimes(3);
    } finally {
      wrapper.unmount();
    }
  });

  it("guards single and batch deletion before confirmation", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    try {
      await vm.deleteRule(rule({ isDefault: true }));
      expect(mocks.message).toHaveBeenCalledWith("默认规则不能删除", {
        type: "warning"
      });
      await vm.deleteRule(rule({ isActive: true }));
      expect(mocks.message).toHaveBeenCalledWith("使用中的规则不能删除", {
        type: "warning"
      });
      await vm.deleteRule(rule({ uid: "" }));
      expect(mocks.message).toHaveBeenCalledWith("缺少规则ID", {
        type: "warning"
      });

      mocks.confirm.mockResolvedValueOnce(false);
      await vm.deleteRule(rule());
      expect(mocks.remove).not.toHaveBeenCalled();
      mocks.confirm.mockResolvedValueOnce(true);
      await vm.deleteRule(rule());
      expect(mocks.remove).toHaveBeenCalledWith("rule-1");
      expect(mocks.message).toHaveBeenCalledWith("删除成功", {
        type: "success"
      });

      mocks.remove.mockResolvedValueOnce({ code: 500, msg: "" });
      await vm.deleteRule(rule());
      expect(mocks.message).toHaveBeenCalledWith("删除失败", { type: "error" });
      mocks.remove.mockRejectedValueOnce(new Error("delete"));
      await vm.deleteRule(rule());

      vm.selectedRows = [];
      await vm.batchDelete();
      expect(mocks.message).toHaveBeenCalledWith("请先选择要删除的规则", {
        type: "warning"
      });
      vm.selectedRows = [rule({ isDefault: true }), rule({ isActive: true })];
      await vm.batchDelete();
      expect(mocks.message).toHaveBeenCalledWith("选中的规则都不能删除", {
        type: "warning"
      });

      vm.selectedRows = [
        rule({ uid: "a" }),
        rule({ uid: "b", isDefault: true })
      ];
      mocks.confirm.mockResolvedValueOnce(false);
      await vm.batchDelete();
      expect(mocks.batchRemove).not.toHaveBeenCalled();
      mocks.confirm.mockResolvedValueOnce(true);
      await vm.batchDelete();
      expect(mocks.batchRemove).toHaveBeenCalledWith(["a"]);
      expect(mocks.message).toHaveBeenCalledWith("删除成功", {
        type: "success"
      });

      vm.selectedRows = [rule({ uid: "a" })];
      mocks.confirm.mockResolvedValueOnce(true);
      mocks.batchRemove.mockResolvedValueOnce({ code: 500, msg: "批量拒绝" });
      await vm.batchDelete();
      expect(mocks.message).toHaveBeenCalledWith("批量拒绝", { type: "error" });
      vm.selectedRows = [rule({ uid: "a" })];
      mocks.confirm.mockResolvedValueOnce(true);
      mocks.batchRemove.mockRejectedValueOnce(new Error("batch"));
      await vm.batchDelete();
      expect(mocks.batchRemove).toHaveBeenCalledTimes(3);
    } finally {
      wrapper.unmount();
    }
  });

  it("renders active and inactive operations and tracks selection", async () => {
    mocks.get.mockResolvedValueOnce({
      code: 200,
      data: [
        rule({ isActive: false }),
        rule({ uid: "active", isActive: true, isDefault: true })
      ]
    });
    const wrapper = await mountPage();
    try {
      await flushPromises();
      expect(wrapper.text()).toContain("启用");
      expect(wrapper.text()).toContain("停用");
      expect(wrapper.text()).toContain("编辑");
      await wrapper.find(".select-first").trigger("click");
      expect(state(wrapper).selectedRows).toHaveLength(1);
    } finally {
      wrapper.unmount();
    }
  });
});
