import { flushPromises } from "@vue/test-utils";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  categories: vi.fn(),
  message: vi.fn()
}));

vi.mock("@/api/business/order", () => ({
  getReturnInspectionListApi: mocks.list,
  createReturnInspectionApi: mocks.create,
  getClaimDefectCategoryListApi: mocks.categories
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message
}));

import ReturnInspectionDialog from "../ReturnInspectionDialog.vue";

function details() {
  return [
    {
      uid: "d1",
      tireId: "t1",
      tireName: "轮胎一",
      count: 2,
      unitPrice: 10,
      total: 20,
      serialNumbers: [{ serialNo: "S1" }, { serialNo: "S2" }]
    },
    {
      uid: "d2",
      tireId: "t2",
      count: 1,
      unitPrice: 10,
      total: 10,
      serialNumbers: [{ serialNo: "S3" }]
    },
    { tireId: "no-uid", count: 1, unitPrice: 0, total: 0, serialNumbers: [] },
    { uid: "no-serials", tireId: "t3", count: 1, unitPrice: 0, total: 0 },
    {
      uid: "blank-serials",
      tireId: "t4",
      count: 1,
      unitPrice: 0,
      total: 0,
      serialNumbers: []
    }
  ];
}

async function mountPage(items = details() as any[]) {
  const wrapper = await mountSmokeComponent(
    async () => ({ default: ReturnInspectionDialog }),
    "sales/return/ReturnInspectionDialog.vue",
    {
      keepMounted: true,
      deep: true,
      props: { orderUid: "o1", details: items }
    }
  );
  await flushPromises();
  return wrapper;
}

type Wrapper = Awaited<ReturnType<typeof mountPage>>;
const state = (wrapper: Wrapper) =>
  wrapper.vm.$.setupState as Record<string, any>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.categories.mockResolvedValue({
    code: 200,
    data: [
      { id: 1, name: "外观" },
      { id: 2, name: "结构" }
    ]
  });
  mocks.list.mockResolvedValue({
    code: 200,
    data: [
      {
        uid: "i1",
        serialNo: "S2",
        result: "DEFECTIVE",
        inspectedBy: "A",
        remark: "划伤",
        defectCategory: { name: "外观" }
      }
    ]
  });
  mocks.create.mockResolvedValue({ code: 200 });
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("return inspection dialog behavior", () => {
  it("filters eligible details and initializes drafts from genuinely pending serials", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    expect(vm.eligibleDetails.map((item: any) => item.uid)).toEqual([
      "d1",
      "d2"
    ]);
    expect(mocks.list).toHaveBeenCalledWith("o1", "d1");
    expect(mocks.list).toHaveBeenCalledWith("o1", "d2");
    expect(vm.draftMap.d1).toEqual([
      { serialNo: "S1", result: "GOOD_RETURN", inspectedBy: "", remark: "" }
    ]);
    expect(vm.draftMap.d2).toEqual([
      { serialNo: "S3", result: "GOOD_RETURN", inspectedBy: "", remark: "" }
    ]);
    expect(vm.loading).toBe(false);
    wrapper.unmount();
  });

  it("handles missing detail and inspection identities", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    expect(vm.getInspections()).toEqual([]);
    expect(vm.getInspections("missing")).toEqual([]);
    expect(vm.initDraft({ tireId: "no-uid" })).toBeUndefined();
    expect(
      vm.getPendingSerials({ tireId: "x", serialNumbers: [{ serialNo: "A" }] })
    ).toEqual(["A"]);
    wrapper.unmount();
  });

  it.each([
    ["GOOD_RETURN", "良品退回"],
    ["DEFECTIVE", "不良"],
    ["SCRAPPED", "报废"],
    ["OTHER", "-"],
    [undefined, "-"]
  ])("maps inspection result %s to %s", async (value, expected) => {
    const wrapper = await mountPage();
    expect(state(wrapper).getResultLabel(value)).toBe(expected);
    wrapper.unmount();
  });

  it("handles category failure envelopes and all thrown error types", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    mocks.categories.mockResolvedValueOnce({
      code: 500,
      msg: "category failed"
    });
    await vm.loadBaseData();
    expect(mocks.message).toHaveBeenLastCalledWith("category failed", {
      type: "error"
    });
    expect(vm.loading).toBe(false);

    mocks.categories.mockResolvedValueOnce({ code: 500 });
    await vm.loadBaseData();
    expect(mocks.message).toHaveBeenLastCalledWith("加载缺陷类别失败", {
      type: "error"
    });

    mocks.categories.mockRejectedValueOnce(new Error("network"));
    await vm.loadBaseData();
    expect(mocks.message).toHaveBeenLastCalledWith("network", {
      type: "error"
    });

    mocks.categories.mockRejectedValueOnce("plain");
    await vm.loadBaseData();
    expect(mocks.message).toHaveBeenLastCalledWith("加载退货质检失败", {
      type: "error"
    });
    wrapper.unmount();
  });

  it("uses empty arrays for non-array category and inspection payloads", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    mocks.categories.mockResolvedValueOnce({ code: 200, data: { list: [] } });
    await vm.loadBaseData();
    expect(vm.defectCategoryOptions).toEqual([]);

    mocks.list.mockResolvedValueOnce({ code: 200, data: { list: [] } });
    await vm.loadDetailInspections("d2");
    expect(vm.inspectionMap.d2).toEqual([]);
    wrapper.unmount();
  });

  it("reports inspection load envelopes", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    mocks.list.mockResolvedValueOnce({ code: 422, msg: "load failed" });
    await vm.loadDetailInspections("d1");
    expect(mocks.message).toHaveBeenLastCalledWith("load failed", {
      type: "error"
    });

    mocks.list.mockResolvedValueOnce({ code: 422 });
    await vm.loadDetailInspections("d1");
    expect(mocks.message).toHaveBeenLastCalledWith("加载退货质检记录失败", {
      type: "error"
    });
    wrapper.unmount();
  });

  it("guards empty drafts and missing detail ids when saving", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    await vm.saveDetail({ tireId: "missing" });
    await vm.saveDetail({ uid: "empty", tireId: "empty" });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.message).toHaveBeenLastCalledWith("当前明细没有待质检胎号", {
      type: "warning"
    });
    wrapper.unmount();
  });

  it("trims optional payload fields and clears successful drafts", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.draftMap.d2 = [
      {
        serialNo: " S3 ",
        result: "SCRAPPED",
        inspectedBy: "  张三  ",
        remark: "  报废  ",
        defectCategoryId: 2
      },
      { serialNo: "S4", result: "GOOD_RETURN", inspectedBy: " ", remark: "" }
    ];
    mocks.list.mockResolvedValueOnce({
      code: 200,
      data: [
        { serialNo: "S3", result: "SCRAPPED" },
        { serialNo: "S4", result: "GOOD_RETURN" }
      ]
    });
    await vm.saveDetail({ uid: "d2", tireId: "t2" });
    expect(mocks.create).toHaveBeenCalledWith("o1", "d2", {
      items: [
        {
          serialNo: " S3 ",
          result: "SCRAPPED",
          inspectedBy: "张三",
          remark: "报废",
          defectCategoryId: 2
        },
        {
          serialNo: "S4",
          result: "GOOD_RETURN",
          inspectedBy: undefined,
          remark: undefined,
          defectCategoryId: undefined
        }
      ]
    });
    expect(mocks.message).toHaveBeenCalledWith("退货质检已保存", {
      type: "success"
    });
    expect(vm.draftMap.d2).toEqual([]);
    expect(vm.saving).toBe(false);
    wrapper.unmount();
  });

  it("reports save envelopes and preserves the failed draft", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    const original = vm.draftMap.d2;
    mocks.create.mockResolvedValueOnce({ code: 500, msg: "save failed" });
    await vm.saveDetail({ uid: "d2" });
    expect(mocks.message).toHaveBeenLastCalledWith("save failed", {
      type: "error"
    });
    expect(vm.draftMap.d2).toBe(original);

    mocks.create.mockResolvedValueOnce({ code: 500 });
    await vm.saveDetail({ uid: "d2" });
    expect(mocks.message).toHaveBeenLastCalledWith("保存退货质检失败", {
      type: "error"
    });
    wrapper.unmount();
  });

  it.each([
    [new Error("save network"), "save network"],
    ["plain save", "保存退货质检失败"]
  ])("handles save exceptions", async (error, expected) => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    mocks.create.mockRejectedValueOnce(error);
    await vm.saveDetail({ uid: "d2" });
    expect(mocks.message).toHaveBeenLastCalledWith(expected, { type: "error" });
    expect(vm.saving).toBe(false);
    wrapper.unmount();
  });

  it("tolerates an empty details prop", async () => {
    const wrapper = await mountPage([]);
    const vm = state(wrapper);
    expect(vm.eligibleDetails).toEqual([]);
    wrapper.unmount();
  });
});
