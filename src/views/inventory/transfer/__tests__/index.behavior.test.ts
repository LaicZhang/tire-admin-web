import { flushPromises, mount } from "@vue/test-utils";
import type { Component, PropType } from "vue";
import { defineComponent, h, nextTick } from "vue";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  add: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  audit: vi.fn(),
  ship: vi.fn(),
  arrive: vi.fn(),
  getCompanyId: vi.fn(),
  getCompanyConnect: vi.fn(),
  localGet: vi.fn(),
  message: vi.fn(),
  error: vi.fn(),
  confirm: vi.fn(),
  addDialog: vi.fn(),
  record: vi.fn(),
  uid: vi.fn(),
  validation: vi.fn(),
  payload: vi.fn(),
  actionConfig: null as any,
  searchStub: {
    emits: ["search", "reset"],
    setup(_: unknown, { expose, slots }: any) {
      expose({ resetFields: vi.fn() });
      return () => h("div", slots.default?.());
    }
  },
  tableBarStub: {
    setup(_: unknown, { slots }: any) {
      return () =>
        h("div", [slots.buttons?.(), slots.default?.({ size: "default" })]);
    }
  },
  tableStub: {
    props: { data: { type: Array, default: () => [] } },
    setup(props: { data: Record<string, any>[] }, { slots }: any) {
      return () =>
        h(
          "div",
          { class: "table" },
          props.data.map(row =>
            h("div", [row.docNo, row.desc, slots.operation?.({ row })])
          )
        );
    }
  }
}));

vi.mock("@/api", () => ({
  addOrderApi: mocks.add,
  auditOrderApi: mocks.audit,
  confirmTransferOrderArrivalApi: mocks.arrive,
  confirmTransferOrderShipmentApi: mocks.ship,
  deleteOrderApi: mocks.remove,
  getCompanyConnect: mocks.getCompanyConnect,
  getCompanyId: mocks.getCompanyId,
  getOrderListApi: mocks.list,
  updateOrderApi: mocks.update
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  handleApiError: mocks.error,
  localForage: () => ({ getItem: mocks.localGet }),
  message: mocks.message,
  ALL_LIST: { repo: "repo", manager: "manager" }
}));
vi.mock("@/composables", () => ({ recordSuccessfulCreate: mocks.record }));
vi.mock("@/composables/useActionFormDialog", () => ({
  useActionFormDialog: (config: any) => {
    mocks.actionConfig = config;
    return { openDialog: vi.fn() };
  }
}));
vi.mock("@/composables/useConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mocks.confirm })
}));
vi.mock("@/composables/useDialogService", () => ({
  addDialog: mocks.addDialog
}));
const userStore = vi.hoisted(() => ({ uid: "operator-1" }));
vi.mock("@/store/modules/user", () => ({ useUserStoreHook: () => userStore }));
vi.mock("uuid", () => ({ v7: mocks.uid }));
vi.mock("@/components/ReIcon/src/hooks", () => ({
  useRenderIcon: () => () => h("span")
}));
vi.mock("@/components/RePureTableBar", () => ({
  PureTableBar: mocks.tableBarStub
}));
vi.mock("@/components/ReSearchForm/index.vue", () => ({
  default: mocks.searchStub
}));
vi.mock(
  "@/views/business/order/components/ConfirmOrderDetailAction.vue",
  () => ({
    default: {
      props: ["orderType", "action", "orderUid"],
      setup(
        _: unknown,
        { expose }: { expose: (api: Record<string, unknown>) => void }
      ) {
        expose({ validate: mocks.validation, getPayload: mocks.payload });
        return () => h("div", { class: "confirm-action" });
      }
    }
  })
);
const ConfirmStub = defineComponent({
  props: ["orderType", "action", "orderUid"],
  setup(_, { expose }) {
    expose({ validate: mocks.validation, getPayload: mocks.payload });
    return () => h("div", { class: "confirm-action" });
  }
});
const PassThrough = defineComponent({
  setup(_, { slots }) {
    return () => h("div", slots.default?.());
  }
});
const Button = defineComponent({
  emits: ["click"],
  setup(_, { emit, slots }) {
    return () =>
      h("button", { onClick: () => emit("click") }, slots.default?.());
  }
});
const Search = defineComponent({
  emits: ["search", "reset"],
  setup(_, { expose, slots }) {
    expose({ resetFields: vi.fn() });
    return () => h("div", slots.default?.());
  }
});
const TableBar = defineComponent({
  setup(_, { slots }) {
    return () =>
      h("div", [slots.buttons?.(), slots.default?.({ size: "default" })]);
  }
});
const Table = defineComponent({
  props: {
    data: { type: Array as PropType<Record<string, any>[]>, default: () => [] }
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        { class: "table" },
        props.data.map(row =>
          h("div", [row.docNo, row.desc, slots.operation?.({ row })])
        )
      );
  }
});

type Row = Record<string, any>;
async function mountPage(rows: Row[] = []) {
  mocks.list.mockResolvedValue({
    code: 200,
    data: { list: rows, total: rows.length }
  });
  const module = await import("../index.vue");
  return mount(module.default as Component, {
    global: {
      directives: { auth: {}, tippy: {} },
      components: { "pure-table": mocks.tableStub, PureTable: mocks.tableStub },
      stubs: {
        IconifyIconOffline: PassThrough,
        ReSearchForm: Search,
        PureTableBar: TableBar,
        "pure-table": mocks.tableStub,
        PureTable: mocks.tableStub,
        ElFormItem: PassThrough,
        ElSelect: PassThrough,
        ElOption: PassThrough,
        ElInput: PassThrough,
        ElCard: PassThrough,
        ElButton: Button,
        ConfirmOrderDetailAction: ConfirmStub
      }
    }
  });
}
const state = (wrapper: Awaited<ReturnType<typeof mountPage>>) =>
  wrapper.vm.$.setupState as Record<string, any>;
async function mountActionDialog(options: Record<string, any>) {
  const Host = defineComponent({
    setup: () => () => options.contentRenderer()
  });
  const dialog = mount(Host, { global: { directives: { tippy: {} } } });
  await flushPromises();
  return dialog;
}
const settle = async () => {
  await flushPromises();
  await nextTick();
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  userStore.uid = "operator-1";
  mocks.actionConfig = null;
  mocks.list.mockResolvedValue({ code: 200, data: { list: [], total: 0 } });
  mocks.add.mockResolvedValue({});
  mocks.update.mockResolvedValue({});
  mocks.remove.mockResolvedValue({});
  mocks.audit.mockResolvedValue({});
  mocks.ship.mockResolvedValue({});
  mocks.arrive.mockResolvedValue({});
  mocks.getCompanyId.mockResolvedValue("company-1");
  mocks.getCompanyConnect.mockImplementation(id => ({ connect: { uid: id } }));
  mocks.localGet.mockImplementation(async key =>
    key === "repo"
      ? [{ uid: "r1", name: "Main" }]
      : [{ uid: "m1", name: "Manager" }]
  );
  mocks.confirm.mockResolvedValue(true);
  mocks.uid.mockReturnValue("generated-uid");
  mocks.validation.mockResolvedValue(true);
  mocks.payload.mockReturnValue({ detailUid: "d1", serialNos: ["S1"] });
});

describe("transfer order page behavior", () => {
  it("loads options, rows, filters by audit and keyword, and resets", async () => {
    const rows = [
      {
        uid: "1",
        docNo: "TR-001",
        desc: "Alpha",
        isApproved: false,
        isLocked: false,
        details: [],
        auditorId: "m1"
      },
      {
        uid: "2",
        docNo: "TR-002",
        rejectReason: "damage",
        isApproved: false,
        isLocked: true,
        details: []
      },
      {
        uid: "3",
        docNo: "TR-003",
        isApproved: true,
        isLocked: true,
        details: [{ isShipped: true }]
      }
    ];
    const wrapper = await mountPage(rows);
    await settle();
    const vm = state(wrapper);
    expect(mocks.localGet).toHaveBeenCalledTimes(2);
    expect(vm.repoList).toEqual([{ uid: "r1", name: "Main" }]);
    expect(wrapper.text()).toContain("TR-001");

    vm.queryParams.auditStatus = "REJECTED";
    await vm.fetchData();
    expect(vm.dataList.map((r: Row) => r.uid)).toEqual(["2"]);
    vm.queryParams.auditStatus = "PENDING";
    vm.queryParams.keyword = "  TR-001 ";
    await vm.fetchData();
    expect(vm.dataList.map((r: Row) => r.uid)).toEqual(["1"]);
    vm.queryParams.keyword = "  ";
    await vm.fetchData();
    expect(vm.dataList).toHaveLength(1);

    vm.queryParams.fromRepositoryId = "r1";
    vm.queryParams.toRepositoryId = "r2";
    vm.queryParams.auditorId = "m1";
    await vm.fetchData();
    expect(mocks.list).toHaveBeenLastCalledWith("transfer-order", 1, {
      fromRepositoryId: "r1",
      toRepositoryId: "r2",
      auditorId: "m1"
    });
    vm.handleReset();
    expect(vm.queryParams).toMatchObject({
      fromRepositoryId: "",
      toRepositoryId: "",
      auditorId: "",
      keyword: "",
      auditStatus: undefined
    });
    wrapper.unmount();
  });

  it("handles envelope, malformed and rejected list responses", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    mocks.list.mockResolvedValueOnce({ code: 500 });
    await vm.fetchData();
    expect(mocks.message).toHaveBeenCalledWith("获取调拨单列表失败", {
      type: "error"
    });
    mocks.list.mockResolvedValueOnce({ code: 500, msg: "downstream" });
    await vm.fetchData();
    expect(mocks.message).toHaveBeenCalledWith("downstream", { type: "error" });
    mocks.list.mockResolvedValueOnce({ code: 200 });
    await vm.fetchData();
    expect(vm.dataList).toEqual([]);
    mocks.list.mockRejectedValueOnce(new Error("network"));
    await vm.fetchData();
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "获取调拨单列表失败"
    );
    expect(vm.loading).toBe(false);
    wrapper.unmount();
  });

  it("deletes and approves only after confirmation, with failure states", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    mocks.confirm.mockResolvedValueOnce(false);
    await vm.handleDelete({ uid: "1" });
    expect(mocks.remove).not.toHaveBeenCalled();
    await vm.handleDelete({ uid: "1" });
    expect(mocks.remove).toHaveBeenCalledWith("transfer-order", "1");
    mocks.remove.mockRejectedValueOnce(new Error("down"));
    await vm.handleDelete({ uid: "1" });
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "删除失败");

    mocks.confirm.mockResolvedValueOnce(false);
    await vm.handleApprove({ uid: "1" });
    expect(mocks.audit).not.toHaveBeenCalled();
    await vm.handleApprove({ uid: "1" });
    expect(mocks.audit).toHaveBeenCalledWith("1", {
      type: "transfer-order",
      isApproved: true
    });
    mocks.audit.mockRejectedValueOnce(new Error("down"));
    await vm.handleApprove({ uid: "1" });
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "审核失败");
    wrapper.unmount();
  });

  it("rejects with a reason and handles string, cancellation and failure outcomes", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const prompt = vi
      .fn()
      .mockResolvedValueOnce({ value: "bad stock" })
      .mockResolvedValueOnce("raw")
      .mockRejectedValueOnce("cancel")
      .mockRejectedValueOnce(new Error("prompt down"));
    const element = await import("element-plus");
    vi.spyOn(element.ElMessageBox, "prompt").mockImplementation(prompt as any);
    await vm.handleReject({ uid: "1" });
    expect(mocks.audit).toHaveBeenCalledWith("1", {
      type: "transfer-order",
      isApproved: false,
      desc: "bad stock"
    });
    await vm.handleReject({ uid: "1" });
    expect(mocks.audit).toHaveBeenCalledTimes(1);
    await vm.handleReject({ uid: "1" });
    await vm.handleReject({ uid: "1" });
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "操作失败");
    wrapper.unmount();
  });

  it("builds create payloads and guards missing user, data and details", async () => {
    const wrapper = await mountPage();
    await settle();
    const create = mocks.actionConfig.handlers["新增"];
    const vm = state(wrapper);
    vm.editFormRef = {
      getFormData: () => ({
        fromRepositoryId: "r1",
        toRepositoryId: "r2",
        desc: "D",
        details: [
          {
            tireId: "t1",
            count: 2,
            serialNumbers: [{ serialNo: "S1" } as any],
            serialNosText: "S1"
          }
        ]
      })
    };
    await create({ uid: "order-1" });
    expect(mocks.add).toHaveBeenCalledWith("transfer-order", {
      order: {
        uid: "order-1",
        company: { connect: { uid: "company-1" } },
        operator: { connect: { uid: "operator-1" } },
        fromRepository: { connect: { uid: "r1" } },
        toRepository: { connect: { uid: "r2" } },
        desc: "D"
      },
      details: [
        expect.objectContaining({
          companyId: "company-1",
          number: "generated-uid",
          tireId: "t1",
          count: 2,
          isShipped: false,
          isArrival: false,
          serialNumbers: [{ serialNo: "S1" }]
        })
      ]
    });
    expect(mocks.record).toHaveBeenCalledWith(
      "transfer",
      expect.objectContaining({ sourceRepoId: "r1", targetRepoId: "r2" })
    );

    vm.editFormRef = {
      getFormData: () => ({
        fromRepositoryId: "r1",
        toRepositoryId: "r2",
        desc: "",
        details: []
      })
    };
    await create({ uid: "empty" });
    expect(mocks.message).toHaveBeenCalledWith("请添加商品明细", {
      type: "warning"
    });
    vm.editFormRef = { getFormData: () => undefined };
    expect(await create({ uid: "none" })).toBe(false);
    wrapper.unmount();
  });

  it("guards missing operator, updates with nullable descriptions and failures", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const create = mocks.actionConfig.handlers["新增"];
    const updateHandler = mocks.actionConfig.handlers["修改"];
    const userModule = await import("@/store/modules/user");
    const store = userModule.useUserStoreHook();
    store.uid = "";
    expect(await create({ uid: "order" })).toBe(false);
    expect(mocks.message).toHaveBeenCalledWith(
      "用户信息缺失，请重新登录后再试",
      { type: "error" }
    );
    store.uid = "operator-1";

    expect(await updateHandler({})).toBe(false);
    vm.editFormRef = { getFormData: () => undefined };
    expect(await updateHandler({ uid: "order" })).toBe(false);
    vm.editFormRef = {
      getFormData: () => ({
        fromRepositoryId: "r1",
        toRepositoryId: "r2",
        desc: "",
        details: []
      })
    };
    await updateHandler({ uid: "order" });
    expect(mocks.update).toHaveBeenCalledWith(
      "transfer-order",
      "order",
      expect.objectContaining({
        desc: null,
        company: { connect: { uid: "company-1" } }
      })
    );
    wrapper.unmount();
  });

  it("opens shipment and arrival action dialogs with validated payloads", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    await vm.handleConfirmShipment({ uid: "ship" });
    let options = mocks.addDialog.mock.calls[0][0];
    expect(options).toMatchObject({
      title: "确认发货",
      width: "520px",
      draggable: true,
      closeOnClickModal: false
    });
    let dialog = await mountActionDialog(options);
    const done = vi.fn();
    mocks.validation.mockResolvedValueOnce(false);
    await options.beforeSure(done);
    expect(done).not.toHaveBeenCalled();
    mocks.validation.mockResolvedValueOnce(true);
    mocks.payload.mockReturnValueOnce({});
    await options.beforeSure(done);
    expect(done).not.toHaveBeenCalled();
    await options.beforeSure(done);
    expect(mocks.ship).toHaveBeenCalledWith("ship", {
      detailUid: "d1",
      serialNos: ["S1"]
    });
    expect(done).toHaveBeenCalled();
    dialog.unmount();

    await vm.handleConfirmArrival({ uid: "arrive" });
    options = mocks.addDialog.mock.calls[1][0];
    dialog = await mountActionDialog(options);
    await options.beforeSure(done);
    expect(mocks.arrive).toHaveBeenCalledWith("arrive", {
      detailUid: "d1",
      serialNos: ["S1"]
    });
    dialog.unmount();
    wrapper.unmount();
  });

  it("reports confirmation action API failures", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    await vm.handleConfirmShipment({ uid: "ship" });
    const options = mocks.addDialog.mock.calls[0][0];
    const dialog = await mountActionDialog(options);
    mocks.ship.mockRejectedValueOnce(new Error("down"));
    await options.beforeSure(vi.fn());
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "确认发货失败");
    dialog.unmount();
    wrapper.unmount();
  });
});
