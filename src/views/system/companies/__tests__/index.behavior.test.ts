import type { Component, PropType } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, inject, nextTick, provide } from "vue";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  add: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  restore: vi.fn(),
  precheck: vi.fn(),
  transfer: vi.fn(),
  message: vi.fn(),
  error: vi.fn(),
  dialog: vi.fn(),
  prompt: vi.fn(),
  fullscreen: vi.fn()
}));

vi.mock("@/api/company", () => ({
  getCompanyListApi: mocks.list,
  addCompanyApi: mocks.add,
  updateCompanyApi: mocks.update,
  deleteCompanyApi: mocks.remove,
  restoreCompanyApi: mocks.restore,
  getCompanyClosePrecheckApi: mocks.precheck,
  transferCompanyBossApi: mocks.transfer
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message,
  handleApiError: mocks.error
}));
vi.mock("@/composables/useDialogService", () => ({ addDialog: mocks.dialog }));
vi.mock("@/utils/viewport", () => ({
  resolveDialogFullscreen: mocks.fullscreen
}));
vi.mock("element-plus", async importOriginal => {
  const actual = await importOriginal<typeof import("element-plus")>();
  return {
    ...actual,
    ElMessageBox: { ...actual.ElMessageBox, prompt: mocks.prompt }
  };
});

const PassThrough = defineComponent({
  setup(_, { slots }) {
    return () => h("div", slots.default?.());
  }
});
const TableBar = defineComponent({
  setup(_, { slots }) {
    return () =>
      h("div", slots.default?.({ size: "default", dynamicColumns: [] }));
  }
});
const Button = defineComponent({
  emits: ["click"],
  setup(_, { slots }) {
    return () => h("button", slots.default?.());
  }
});
const TableRows = Symbol("companyRows");
const Table = defineComponent({
  props: {
    data: { type: Array as PropType<Record<string, any>[]>, default: () => [] }
  },
  setup(props, { slots }) {
    provide(TableRows, () => props.data);
    return () =>
      h(
        "div",
        { class: "table" },
        props.data.map(row =>
          h("div", [
            row.name,
            row.deleteAt ? "已删除" : row.status === false ? "禁用" : "启用",
            slots.operation?.({ row })
          ])
        )
      );
  }
});
const TableColumn = defineComponent({
  props: { label: String, formatter: Function },
  setup(props, { slots }) {
    const rows = inject<() => Record<string, any>[]>(TableRows, () => []);
    return () =>
      h(
        "div",
        { class: "column" },
        rows().flatMap((row, index) => [
          props.formatter ? String(props.formatter({ ...row })) : "",
          ...(slots.default?.({ row, $index: index }) ?? [])
        ])
      );
  }
});
const DeleteButton = defineComponent({
  emits: ["confirm"],
  setup(_, { emit }) {
    return () =>
      h("button", { class: "delete", onClick: () => emit("confirm") }, "关停");
  }
});
const Search = defineComponent({
  emits: ["search", "reset"],
  setup(_, { expose, slots }) {
    expose({ resetFields: () => undefined });
    return () => h("div", slots.default?.());
  }
});
const PlanDialog = defineComponent({
  props: ["modelValue", "companyId", "companyName"],
  setup() {
    return () => h("div", { class: "plan-dialog" });
  }
});

type Row = Record<string, any>;
async function mountPage(rows: Row[] = []) {
  mocks.list.mockResolvedValue({ data: { list: rows, count: rows.length } });
  const module = await import("../index.vue");
  return mount(module.default as Component, {
    global: {
      stubs: {
        ReSearchForm: Search,
        PureTableBar: TableBar,
        "pure-table": Table,
        ElTableColumn: TableColumn,
        ElButton: Button,
        ElSelect: PassThrough,
        ElOption: PassThrough,
        ElInput: PassThrough,
        ElFormItem: PassThrough,
        DeleteButton,
        CompanyPlanGrantsDialog: PlanDialog
      }
    }
  });
}
const state = (wrapper: Awaited<ReturnType<typeof mountPage>>) =>
  wrapper.vm.$.setupState as Record<string, any>;
const settle = async () => {
  await flushPromises();
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockResolvedValue({ data: { list: [], count: 0 } });
  mocks.add.mockResolvedValue({});
  mocks.update.mockResolvedValue({});
  mocks.remove.mockResolvedValue({});
  mocks.restore.mockResolvedValue({});
  mocks.precheck.mockResolvedValue({
    data: { canCloseWithoutForce: true, blockers: [] }
  });
  mocks.transfer.mockResolvedValue({});
  mocks.prompt.mockResolvedValue({ value: " reason " });
  mocks.fullscreen.mockReturnValue(true);
});

describe("company management behavior", () => {
  it("loads, filters, resets and paginates company rows", async () => {
    const rows = [
      {
        uid: "a",
        name: "Alpha",
        province: "P",
        city: "C",
        status: true,
        createdAt: "2026-01-01T00:00:00Z"
      },
      {
        uid: "b",
        name: "Beta",
        status: false,
        deleteAt: "2026-02-02T00:00:00Z"
      }
    ];
    const wrapper = await mountPage(rows);
    await settle();
    const vm = state(wrapper);
    expect(mocks.list).toHaveBeenCalledWith(1, {
      scope: "nonDeleted",
      name: undefined
    });
    expect(wrapper.text()).toContain("Alpha");
    expect(wrapper.text()).toContain("已删除");

    vm.form.name = " Alpha ";
    vm.form.scope = "all";
    await vm.onSearch();
    expect(mocks.list).toHaveBeenLastCalledWith(1, {
      scope: "all",
      name: " Alpha "
    });
    expect(vm.pagination.total).toBe(2);

    vm.resetForm(undefined);
    expect(mocks.list).toHaveBeenCalledTimes(2);
    const reset = { resetFields: vi.fn() };
    vm.resetForm(reset);
    await settle();
    expect(reset.resetFields).toHaveBeenCalled();
    expect(mocks.list).toHaveBeenCalledTimes(3);

    vm.handleSizeChange(50);
    await settle();
    expect(vm.pagination).toMatchObject({ pageSize: 50, currentPage: 1 });
    vm.handleCurrentChange(3);
    await settle();
    expect(vm.pagination.currentPage).toBe(3);
    expect(mocks.list).toHaveBeenLastCalledWith(3, expect.any(Object));
    wrapper.unmount();
  });

  it("handles query failures and malformed data", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    mocks.list.mockRejectedValueOnce(new Error("down"));
    await vm.onSearch();
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "查询失败");
    expect(vm.loading).toBe(false);
    wrapper.unmount();
  });

  it("opens add and edit dialogs with normalized defaults and submits valid payloads", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.openDialog();
    let options = mocks.dialog.mock.calls[0][0];
    expect(options.title).toBe("新增公司");
    expect(options.fullscreen).toBe(true);
    expect(options.props.formInline).toMatchObject({
      name: "",
      province: "",
      city: ""
    });
    expect(options.props.formInline.uid).toBeTruthy();
    options.contentRenderer({ options });
    await settle();

    const done = vi.fn();
    const validate = vi.fn(cb => cb(true));
    vm.formRef = { formRef: { validate } };
    options.beforeSure(done, { options });
    await settle();
    expect(mocks.add).toHaveBeenCalledWith(
      expect.objectContaining({
        company: expect.objectContaining({ uid: options.props.formInline.uid })
      })
    );
    expect(mocks.message).toHaveBeenCalledWith("操作成功", { type: "success" });
    expect(done).toHaveBeenCalled();

    options.props.formInline.uid = "";
    const missingDone = vi.fn();
    options.beforeSure(missingDone, {
      options: {
        props: { formInline: { ...options.props.formInline, uid: "" } }
      }
    });
    expect(mocks.message).toHaveBeenCalledWith("缺少公司ID", { type: "error" });
    expect(missingDone).not.toHaveBeenCalled();

    const row = {
      uid: "company-1",
      name: "Edit",
      province: "P",
      city: "C",
      desc: "D",
      principalName: "N",
      principalPhone: "1"
    };
    vm.openDialog("修改", row);
    options = mocks.dialog.mock.calls[1][0];
    expect(options.title).toBe("修改公司");
    expect(options.props.formInline).toMatchObject({
      uid: "company-1",
      name: "Edit"
    });
    validate.mockImplementation(cb => cb(false));
    options.beforeSure(done, { options });
    expect(mocks.update).not.toHaveBeenCalled();
    validate.mockImplementation(cb => cb(true));
    options.beforeSure(done, { options });
    await settle();
    expect(mocks.update).toHaveBeenCalledWith(
      "company-1",
      expect.objectContaining({ name: "Edit", desc: "D" })
    );
    wrapper.unmount();
  });

  it("handles successful and failed dialog submissions", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.openDialog();
    const options = mocks.dialog.mock.calls[0][0];
    vm.formRef = { formRef: { validate: cb => cb(true) } };
    mocks.add.mockRejectedValueOnce(new Error("conflict"));
    const done = vi.fn();
    options.beforeSure(done, { options });
    await settle();
    expect(done).not.toHaveBeenCalled();
    expect(mocks.message).not.toHaveBeenCalledWith(
      "操作成功",
      expect.anything()
    );
    wrapper.unmount();
  });

  it("deletes clean companies and ignores missing ids", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    await vm.handleDelete({ name: "none" });
    expect(mocks.precheck).not.toHaveBeenCalled();
    await vm.handleDelete({ uid: "clean", name: "Clean" });
    expect(mocks.remove).toHaveBeenCalledWith("clean", { massLayoff: false });
    expect(mocks.message).toHaveBeenCalledWith(
      expect.stringContaining("删除成功"),
      { type: "success" }
    );
    wrapper.unmount();
  });

  it("forces deletion with blockers and handles blank or cancelled prompts", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    mocks.precheck.mockResolvedValue({
      data: { canCloseWithoutForce: false, blockers: ["open orders", "stock"] }
    });
    await vm.handleDelete({ uid: "blocked", name: "Blocked" });
    expect(mocks.prompt).toHaveBeenCalledWith(
      "关停前置检查未通过：open orders；stock。如需强制关停，请填写原因：",
      "强制关停公司",
      expect.any(Object)
    );
    expect(mocks.remove).toHaveBeenCalledWith("blocked", {
      force: true,
      reason: "reason",
      massLayoff: true
    });

    mocks.prompt.mockResolvedValueOnce({ value: "  " });
    await vm.handleDelete({ uid: "blank", name: "Blank" });
    expect(mocks.message).toHaveBeenCalledWith("已取消关停", { type: "info" });

    mocks.precheck.mockResolvedValueOnce({
      data: { canCloseWithoutForce: false }
    });
    mocks.prompt.mockRejectedValueOnce("cancel");
    await vm.handleDelete({ uid: "cancel", name: "Cancel" });
    expect(mocks.error).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("distinguishes prompt cancellation from API failures", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    mocks.precheck.mockRejectedValueOnce(new Error("precheck"));
    await vm.handleDelete({ uid: "a", name: "A" });
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "关停公司失败");

    mocks.precheck.mockResolvedValueOnce({
      data: { canCloseWithoutForce: false }
    });
    mocks.prompt.mockRejectedValueOnce("close");
    await vm.handleDelete({ uid: "b", name: "B" });
    mocks.precheck.mockResolvedValueOnce({
      data: { canCloseWithoutForce: false }
    });
    mocks.prompt.mockRejectedValueOnce({ message: "user cancel" });
    await vm.handleDelete({ uid: "c", name: "C" });
    expect(mocks.error).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("restores companies and reports restore failures", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    await vm.handleRestore({ name: "none" });
    expect(mocks.restore).not.toHaveBeenCalled();
    await vm.handleRestore({ uid: "deleted", name: "Deleted" });
    expect(mocks.restore).toHaveBeenCalledWith("deleted");
    expect(mocks.message).toHaveBeenCalledWith(
      expect.stringContaining("恢复成功"),
      { type: "success" }
    );
    mocks.restore.mockRejectedValueOnce(new Error("down"));
    await vm.handleRestore({ uid: "bad", name: "Bad" });
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "恢复公司失败");
    wrapper.unmount();
  });

  it("transfers bosses with trim, cancellation and failure branches", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    await vm.handleTransferBoss({ name: "none" });
    await vm.handleTransferBoss({ uid: "a", name: "Alpha" });
    expect(mocks.transfer).toHaveBeenCalledWith("a", "reason");
    mocks.transfer.mockRejectedValueOnce(new Error("down"));
    await vm.handleTransferBoss({ uid: "b", name: "Beta" });
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "老板移交失败");
    mocks.prompt.mockResolvedValueOnce({ value: " " });
    await vm.handleTransferBoss({ uid: "c", name: "Gamma" });
    mocks.prompt.mockRejectedValueOnce("cancel");
    await vm.handleTransferBoss({ uid: "d", name: "Delta" });
    mocks.prompt.mockRejectedValueOnce("close");
    await vm.handleTransferBoss({ uid: "e", name: "Epsilon" });
    expect(mocks.error).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("opens plan grants only for persisted companies", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.openPlanDialog({ name: "No id" });
    expect(vm.planDialogVisible).toBe(false);
    vm.openPlanDialog({ uid: "company-1", name: "Alpha" });
    await nextTick();
    expect(vm.planDialogVisible).toBe(true);
    expect(vm.planCompany).toEqual({ uid: "company-1", name: "Alpha" });
    expect(wrapper.find(".plan-dialog").exists()).toBe(true);
    wrapper.unmount();
  });

  it("formats nullable column values and status renderers", async () => {
    const { useColumns } = await import("../columns");
    const { columns } = useColumns();
    expect(columns[1].formatter!({ province: "P", city: "C" } as any)).toBe(
      "P C"
    );
    expect(columns[1].formatter!({} as any)).toBe("-");
    expect(
      columns[5].formatter!({ createdAt: "2026-01-01T12:00:00Z" } as any)
    ).toBe("2026-01-01 12:00:00");
    expect(columns[5].formatter!({} as any)).toBe("-");
    expect(
      columns[6].formatter!({ deleteAt: "2026-02-01T12:00:00Z" } as any)
    ).toBe("2026-02-01 12:00:00");
    expect(columns[6].formatter!({} as any)).toBe("-");
    for (const row of [
      { deleteAt: "x" },
      { status: false },
      { status: true }
    ]) {
      const vnode = columns[4].cellRenderer!({
        row,
        props: { size: "small" }
      } as any) as any;
      expect(vnode.type).toBeTruthy();
    }
  });
});
