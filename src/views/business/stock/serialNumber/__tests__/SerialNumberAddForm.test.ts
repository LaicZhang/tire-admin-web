import { flushPromises, mount } from "@vue/test-utils";
import { ElMessageBox } from "element-plus";
import Form from "../SerialNumberAddForm.vue";

const mocks = vi.hoisted(() => ({
  message: vi.fn(),
  create: vi.fn(),
  createBatch: vi.fn()
}));

vi.mock("@/utils/message", () => ({ message: mocks.message }));
vi.mock("@/api/business/serialNumber", () => ({
  createSerialNumber: mocks.create,
  createSerialNumberBatch: mocks.createBatch
}));

const tireId = "123e4567-e89b-42d3-a456-426614174000";
const repoId = "223e4567-e89b-42d3-a456-426614174000";

function mountForm(type: "single" | "batch" = "single") {
  return mount(Form, {
    props: {
      formInline: {
        type,
        tireOptions: [{ uid: tireId, name: "Tire" }],
        repoOptions: [{ uid: repoId, name: "Repo" }]
      }
    }
  });
}
const vmOf = (wrapper: ReturnType<typeof mountForm>) => wrapper.vm as any;
const valid = () => ({
  tireId,
  repoId,
  sourceType: "SURPLUS",
  sourceOrderId: "SURPLUS-1"
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockResolvedValue({});
  mocks.createBatch.mockResolvedValue({
    data: [{ success: true, serialNo: "SN-1" }]
  });
});

describe("SerialNumberAddForm", () => {
  it("renders the field appropriate to the creation mode", () => {
    const single = mountForm("single");
    expect(single.text()).toContain("序列号");
    expect(single.text()).toContain("批次号");
    expect(single.text()).toContain("生产日期");
    expect(single.text()).toContain("有效期");
    single.unmount();

    const batch = mountForm("batch");
    expect(batch.text()).toContain("序列号列表");
    expect(batch.text()).not.toContain("批次号");
    expect(batch.text()).not.toContain("生产日期");
    batch.unmount();
  });

  it("validates required and UUID product fields", () => {
    const wrapper = mountForm();
    const vm = vmOf(wrapper);
    expect(vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith("请选择商品", {
      type: "warning"
    });

    const data = wrapper.vm.$.setupState as any;
    Object.assign(data.formData, { tireId: "bad" });
    expect(vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith("商品不合法", {
      type: "warning"
    });

    Object.assign(data.formData, { tireId, repoId: "" });
    expect(vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith("请选择仓库", {
      type: "warning"
    });

    Object.assign(data.formData, { repoId: "bad" });
    expect(vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith("仓库不合法", {
      type: "warning"
    });
    wrapper.unmount();
  });

  it("validates single serial length and optional header lengths", () => {
    const wrapper = mountForm("single");
    const vm = vmOf(wrapper);
    const data = wrapper.vm.$.setupState as any;
    Object.assign(data.formData, valid());
    expect(vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith("请输入序列号", {
      type: "warning"
    });

    data.formData.serialNo = "x".repeat(101);
    expect(vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith("序列号最多 100 个字符", {
      type: "warning"
    });

    data.formData.serialNo = "SN-1";
    data.formData.batchNo = "b".repeat(51);
    expect(vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith("批次号最多 50 个字符", {
      type: "warning"
    });

    data.formData.batchNo = "";
    data.formData.remark = "r".repeat(256);
    expect(vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith("备注最多 255 个字符", {
      type: "warning"
    });
    wrapper.unmount();
  });

  it("validates batch serial lists, length, duplicates and source provenance", () => {
    const wrapper = mountForm("batch");
    const vm = vmOf(wrapper);
    const data = wrapper.vm.$.setupState as any;
    Object.assign(data.formData, { tireId, repoId });
    expect(vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith("请输入序列号（每行一个）", {
      type: "warning"
    });

    data.formData.serialNos = `${"x".repeat(101)}\nSN-2`;
    expect(vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith("序列号最多 100 个字符", {
      type: "warning"
    });

    data.formData.serialNos = "SN-1\n SN-1 ";
    expect(vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith("序列号列表存在重复项", {
      type: "warning"
    });

    data.formData.serialNos = "SN-1\nSN-2";
    expect(vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith(
      "自由建条须选择来源并填写来源单号（盘盈/调整路径，禁止幽灵在库）",
      { type: "warning" }
    );

    data.formData.sourceType = "SURPLUS";
    data.formData.sourceOrderId = "SOURCE-1";
    expect(vm.validate()).toBe(true);
    data.formData.sourceType = "OTHER";
    expect(vm.validate()).toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith(
      "自由建条仅允许 ADJUST/SURPLUS 盘盈路径",
      {
        type: "warning"
      }
    );
    wrapper.unmount();
  });

  it("submits a trimmed single serial and optional fields", async () => {
    const wrapper = mountForm("single");
    const vm = vmOf(wrapper);
    const data = wrapper.vm.$.setupState as any;
    Object.assign(data.formData, {
      ...valid(),
      tireId: ` ${tireId} `,
      repoId: ` ${repoId} `,
      serialNo: " SN-100 ",
      remark: " note ",
      batchNo: " B-1 ",
      productionDate: "2026-01-01",
      expiryDate: "2027-01-01"
    });

    await expect(vm.handleSubmit()).resolves.toBe(true);
    expect(mocks.create).toHaveBeenCalledWith({
      serialNo: "SN-100",
      remark: "note",
      tireId,
      repoId,
      batchNo: "B-1",
      productionDate: "2026-01-01",
      expiryDate: "2027-01-01",
      sourceType: "SURPLUS",
      sourceOrderId: "SURPLUS-1"
    });
    expect(mocks.message).toHaveBeenCalledWith("创建成功", { type: "success" });
    expect(vm.formLoading).toBe(false);
    wrapper.unmount();
  });

  it("omits blank optional fields for single creation", async () => {
    const wrapper = mountForm("single");
    const vm = vmOf(wrapper);
    Object.assign((wrapper.vm.$.setupState as any).formData, {
      ...valid(),
      serialNo: "SN-2",
      remark: "",
      batchNo: "",
      productionDate: "",
      expiryDate: ""
    });
    await vm.handleSubmit();
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        serialNo: "SN-2",
        remark: undefined,
        batchNo: undefined,
        productionDate: undefined,
        expiryDate: undefined
      })
    );
    wrapper.unmount();
  });

  it("creates a deduplicated-by-line batch and reports full success", async () => {
    const wrapper = mountForm("batch");
    const vm = vmOf(wrapper);
    Object.assign((wrapper.vm.$.setupState as any).formData, {
      ...valid(),
      serialNos: " SN-1 \n\nSN-2\n",
      remark: " batch "
    });
    await expect(vm.handleSubmit()).resolves.toBe(true);
    expect(mocks.createBatch).toHaveBeenCalledWith({
      serialNos: ["SN-1", "SN-2"],
      remark: "batch",
      tireId,
      repoId,
      sourceType: "SURPLUS",
      sourceOrderId: "SURPLUS-1"
    });
    expect(mocks.message).toHaveBeenCalledWith("批量创建成功 1 条", {
      type: "success"
    });
    wrapper.unmount();
  });

  it("shows an alert with per-row batch failures", async () => {
    const alert = vi
      .spyOn(ElMessageBox, "alert")
      .mockResolvedValue("confirm" as never);
    mocks.createBatch.mockResolvedValueOnce({
      data: [
        { success: true, serialNo: "SN-1" },
        { success: false, serialNo: "SN-2", error: "duplicate" }
      ]
    });
    const wrapper = mountForm("batch");
    const vm = vmOf(wrapper);
    Object.assign((wrapper.vm.$.setupState as any).formData, {
      ...valid(),
      serialNos: "SN-1\nSN-2"
    });
    await expect(vm.handleSubmit()).resolves.toBe(true);
    expect(alert).toHaveBeenCalledWith(
      "成功 1 条，失败 1 条。\n失败详情：SN-2: duplicate",
      "批量创建结果",
      { type: "warning" }
    );
    alert.mockRestore();
    wrapper.unmount();
  });

  it("reports API errors and keeps loading false", async () => {
    const wrapper = mountForm("single");
    const vm = vmOf(wrapper);
    Object.assign((wrapper.vm.$.setupState as any).formData, {
      ...valid(),
      serialNo: "SN-1"
    });
    mocks.create.mockRejectedValueOnce(new Error("server down"));
    await expect(vm.handleSubmit()).resolves.toBe(false);
    expect(mocks.message).toHaveBeenCalledWith("server down", {
      type: "error"
    });
    expect(vm.formLoading).toBe(false);

    mocks.create.mockRejectedValueOnce("bad");
    await expect(vm.handleSubmit()).resolves.toBe(false);
    expect(mocks.message).toHaveBeenLastCalledWith("创建失败", {
      type: "error"
    });
    wrapper.unmount();
  });

  it("resets all persisted form values to their defaults", () => {
    const wrapper = mountForm("single");
    const vm = vmOf(wrapper);
    const data = wrapper.vm.$.setupState as any;
    Object.assign(data.formData, {
      ...valid(),
      serialNo: "SN",
      serialNos: "SN2",
      remark: "r",
      batchNo: "b",
      productionDate: "2026-01-01",
      expiryDate: "2027-01-01"
    });
    data.resetForm();
    expect(data.formData).toEqual({
      serialNo: "",
      serialNos: "",
      remark: "",
      tireId: "",
      repoId: "",
      batchNo: "",
      productionDate: "",
      expiryDate: "",
      sourceType: "SURPLUS",
      sourceOrderId: ""
    });
    wrapper.unmount();
  });
});
