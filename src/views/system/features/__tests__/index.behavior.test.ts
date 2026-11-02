import { flushPromises } from "@vue/test-utils";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  disable: vi.fn(),
  confirm: vi.fn(),
  message: vi.fn(),
  handleError: vi.fn()
}));

vi.mock("@/api/system/subscription", () => ({
  listFeaturesApi: mocks.list,
  createFeatureApi: mocks.create,
  updateFeatureApi: mocks.update,
  disableFeatureApi: mocks.disable
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message,
  handleApiError: mocks.handleError
}));
vi.mock("element-plus", async importOriginal => {
  const original = await importOriginal<typeof import("element-plus")>();
  return {
    ...original,
    ElMessageBox: { ...original.ElMessageBox, confirm: mocks.confirm }
  };
});

import FeaturesPage from "../index.vue";

function feature(overrides: Record<string, unknown> = {}) {
  return {
    key: "org.salary",
    name: "薪资",
    group: "org",
    description: "工资管理",
    menuUids: ["m1", "m2"],
    permissionPaths: ["salary.read"],
    limits: { maxStores: 3 },
    status: true,
    ...overrides
  };
}

async function mountPage() {
  return mountSmokeComponent(
    async () => ({ default: FeaturesPage }),
    "system/features/index.vue",
    { keepMounted: true }
  );
}

type Wrapper = Awaited<ReturnType<typeof mountPage>>;
const state = (wrapper: Wrapper) =>
  wrapper.vm.$.setupState as Record<string, any>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockResolvedValue({
    code: 200,
    data: [
      feature(),
      feature({
        key: "core.empty",
        name: "空",
        group: "",
        description: "",
        menuUids: null,
        permissionPaths: null,
        status: false
      })
    ]
  });
  mocks.create.mockResolvedValue({ code: 200 });
  mocks.update.mockResolvedValue({ code: 200 });
  mocks.disable.mockResolvedValue({ code: 200 });
  mocks.confirm.mockResolvedValue(undefined);
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("system feature catalog behavior", () => {
  it("loads the catalog and renders status, edit and disable actions", async () => {
    const wrapper = await mountPage();
    await flushPromises();
    try {
      expect(mocks.list).toHaveBeenCalledOnce();
      expect(wrapper.text()).toContain("启用");
      expect(wrapper.text()).toContain("停用");
      expect(wrapper.text()).toContain("编辑");
      const columns = state(wrapper).columns;
      expect(columns[0].prop).toBe("key");
      expect(columns[1].prop).toBe("name");
      expect(columns[2].formatter({ group: "" })).toBe("—");
      expect(columns[3].formatter({ description: "" })).toBe("—");
      expect(columns[4].formatter({ menuUids: ["a", "b"] })).toBe("2");
      expect(columns[4].formatter({ menuUids: null })).toBe("0");
      expect(columns[5].formatter({ permissionPaths: ["a"] })).toBe("1");
      expect(columns[5].formatter({ permissionPaths: null })).toBe("0");
    } finally {
      wrapper.unmount();
    }
  });

  it("handles empty, malformed and failed list responses", async () => {
    mocks.list
      .mockResolvedValueOnce({ code: 200, data: null })
      .mockResolvedValueOnce({ code: 400, msg: "目录错误" });
    const wrapper = await mountPage();
    const vm = state(wrapper);
    try {
      await flushPromises();
      expect(vm.features).toEqual([]);
      await vm.loadData();
      expect(vm.features).toEqual([]);
      expect(mocks.message).toHaveBeenCalledWith("目录错误", { type: "error" });

      mocks.list.mockResolvedValueOnce({ code: 500 });
      await vm.loadData();
      expect(mocks.message).toHaveBeenCalledWith("加载功能目录失败", {
        type: "error"
      });

      const error = new Error("network");
      mocks.list.mockRejectedValueOnce(error);
      await vm.loadData();
      expect(vm.features).toEqual([]);
      expect(mocks.handleError).toHaveBeenCalledWith(error, "加载功能目录失败");
      expect(vm.loading).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it("opens blank create and populated edit forms", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    try {
      vm.openCreate();
      expect(vm.isCreate).toBe(true);
      expect(vm.editingKey).toBeNull();
      expect(vm.form).toMatchObject({
        key: "",
        name: "",
        group: "",
        description: "",
        menuUidsText: "",
        permissionPathsText: "",
        limitsText: ""
      });
      expect(vm.editVisible).toBe(true);

      const row = feature({
        group: undefined,
        description: undefined,
        menuUids: null,
        permissionPaths: null,
        limits: null
      });
      vm.openEdit(row);
      expect(vm.isCreate).toBe(false);
      expect(vm.editingKey).toBe("org.salary");
      expect(vm.form).toMatchObject({
        key: "org.salary",
        name: "薪资",
        group: "",
        description: "",
        menuUidsText: "",
        permissionPathsText: "",
        limitsText: ""
      });
      vm.openEdit(feature());
      expect(vm.form.menuUidsText).toBe("m1\nm2");
      expect(vm.form.permissionPathsText).toBe("salary.read");
      expect(vm.form.limitsText).toContain('"maxStores": 3');
    } finally {
      wrapper.unmount();
    }
  });

  it("rejects blank names and invalid limits before calling APIs", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    try {
      vm.openCreate();
      vm.form.name = "   ";
      await vm.submitEdit();
      expect(mocks.message).toHaveBeenCalledWith("请填写功能名称", {
        type: "warning"
      });

      vm.form.name = "新功能";
      mocks.message.mockClear();
      for (const limits of ["[]", "null", "42", "{bad"]) {
        vm.form.limitsText = limits;
        await vm.submitEdit();
        expect(mocks.create).not.toHaveBeenCalled();
      }
      expect(mocks.message).toHaveBeenCalledWith("limits 须为 JSON 对象", {
        type: "warning"
      });
      expect(mocks.message).toHaveBeenCalledWith("limits JSON 解析失败", {
        type: "warning"
      });
    } finally {
      wrapper.unmount();
    }
  });

  it("validates create keys and sends normalized create payloads", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    try {
      vm.openCreate();
      Object.assign(vm.form, { name: " 新功能 ", key: "   " });
      await vm.submitEdit();
      expect(mocks.message).toHaveBeenCalledWith(
        "请填写功能 key（如 org.salary）",
        { type: "warning" }
      );

      mocks.message.mockClear();
      Object.assign(vm.form, {
        key: " core.workplace ",
        group: " core ",
        description: " 说明 ",
        menuUidsText: "m1, m2\n m3 ",
        permissionPathsText: "p.read\n, p.write",
        limitsText: '{"maxStores":3}'
      });
      await vm.submitEdit();
      expect(mocks.create).toHaveBeenCalledWith({
        key: "core.workplace",
        name: "新功能",
        group: "core",
        description: "说明",
        menuUids: ["m1", "m2", "m3"],
        permissionPaths: ["p.read", "p.write"],
        limits: { maxStores: 3 }
      });
      expect(mocks.message).toHaveBeenCalledWith("功能已创建", {
        type: "success"
      });
      expect(vm.editVisible).toBe(false);
      expect(mocks.list).toHaveBeenCalledTimes(2);

      mocks.list.mockClear();
      mocks.create.mockResolvedValueOnce({ code: 500 });
      vm.openCreate();
      Object.assign(vm.form, {
        name: "空值",
        key: "empty",
        group: " ",
        description: " ",
        menuUidsText: " ",
        permissionPathsText: "",
        limitsText: " "
      });
      await vm.submitEdit();
      expect(mocks.create).toHaveBeenLastCalledWith({
        key: "empty",
        name: "空值",
        group: undefined,
        description: undefined,
        menuUids: undefined,
        permissionPaths: undefined,
        limits: undefined
      });
      expect(mocks.message).toHaveBeenCalledWith("创建失败", { type: "error" });
      expect(mocks.list).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
    }
  });

  it("updates features and reports failed updates", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    try {
      vm.openEdit(feature());
      vm.form.name = " 新薪资 ";
      vm.form.group = " ";
      vm.form.description = "  ";
      vm.form.menuUidsText = "m1\nm2";
      vm.form.permissionPathsText = "";
      vm.form.limitsText = "";
      await vm.submitEdit();
      expect(mocks.update).toHaveBeenCalledWith("org.salary", {
        name: "新薪资",
        group: undefined,
        description: undefined,
        menuUids: ["m1", "m2"],
        permissionPaths: [],
        limits: undefined
      });
      expect(mocks.message).toHaveBeenCalledWith("功能已更新", {
        type: "success"
      });

      mocks.update.mockResolvedValueOnce({ code: 403, msg: "无权更新" });
      vm.openEdit(feature());
      await vm.submitEdit();
      expect(mocks.message).toHaveBeenCalledWith("无权更新", { type: "error" });
      mocks.update.mockResolvedValueOnce({ code: 500 });
      await vm.submitEdit();
      expect(mocks.message).toHaveBeenCalledWith("更新失败", { type: "error" });

      vm.editingKey = null;
      await vm.submitEdit();
      expect(mocks.update).toHaveBeenCalledTimes(3);
    } finally {
      wrapper.unmount();
    }
  });

  it("handles API failures while saving without leaking loading state", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    const error = new Error("save");
    try {
      vm.openCreate();
      Object.assign(vm.form, { name: "名称", key: "key" });
      mocks.create.mockRejectedValueOnce(error);
      await vm.submitEdit();
      expect(mocks.handleError).toHaveBeenCalledWith(error, "保存功能失败");
      expect(vm.loading).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it("disables enabled features only after confirmation and handles all outcomes", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    const row = feature();
    try {
      mocks.confirm.mockRejectedValueOnce(new Error("cancel"));
      await vm.handleDisable(row);
      expect(mocks.disable).not.toHaveBeenCalled();

      await vm.handleDisable(row);
      expect(mocks.confirm).toHaveBeenLastCalledWith(
        "停用功能「org.salary」后，新绑定计划将不再包含它（已授予快照不受影响）。确认？",
        "停用功能",
        { type: "warning", confirmButtonText: "停用", cancelButtonText: "取消" }
      );
      expect(mocks.disable).toHaveBeenCalledWith("org.salary");
      expect(mocks.message).toHaveBeenCalledWith("已停用", { type: "success" });

      mocks.disable.mockResolvedValueOnce({ code: 500, msg: "" });
      await vm.handleDisable(row);
      expect(mocks.message).toHaveBeenCalledWith("停用失败", { type: "error" });

      const error = new Error("disable");
      mocks.disable.mockRejectedValueOnce(error);
      await vm.handleDisable(row);
      expect(mocks.handleError).toHaveBeenCalledWith(error, "停用功能失败");
      expect(vm.loading).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });
});
