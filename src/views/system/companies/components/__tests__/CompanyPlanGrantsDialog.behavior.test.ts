import { flushPromises, mount } from "@vue/test-utils";
import type { Component, PropType } from "vue";
import { defineComponent, h, nextTick } from "vue";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  grant: vi.fn(),
  revoke: vi.fn(),
  message: vi.fn(),
  error: vi.fn(),
  prompt: vi.fn()
}));

vi.mock("@/api/system/subscription", () => ({
  listCompanyPlanGrantsApi: mocks.list,
  grantCompanyPlanApi: mocks.grant,
  revokeCompanyPlanApi: mocks.revoke
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message,
  handleApiError: mocks.error
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
const Button = defineComponent({
  emits: ["click"],
  setup(_, { emit, slots }) {
    return () =>
      h("button", { onClick: () => emit("click") }, slots.default?.());
  }
});
const Card = defineComponent({
  setup(_, { slots }) {
    return () => h("section", [slots.header?.(), slots.default?.()]);
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
        props.data.flatMap((row, index) => [
          h("div", [row.plan?.code, row.status]),
          ...Object.entries(slots)
            .filter(([name]) => name !== "default")
            .flatMap(([, slot]) => slot?.({ row, $index: index }) ?? [])
        ])
      );
  }
});
const Dialog = defineComponent({
  props: { modelValue: Boolean },
  emits: ["update:modelValue"],
  setup(_, { slots }) {
    return () =>
      h("div", { class: "dialog" }, [slots.default?.(), slots.footer?.()]);
  }
});

type Row = Record<string, any>;
async function mountDialog(companyId = "company-1", rows: Row[] = []) {
  mocks.list.mockResolvedValue({ code: 200, data: rows });
  const module = await import("../CompanyPlanGrantsDialog.vue");
  return mount(module.default as Component, {
    props: { modelValue: true, companyId, companyName: "Acme" },
    global: {
      stubs: {
        ElDialog: Dialog,
        ElCard: Card,
        ElForm: PassThrough,
        ElFormItem: PassThrough,
        ElSelect: PassThrough,
        ElOption: PassThrough,
        ElDatePicker: PassThrough,
        ElInput: PassThrough,
        ElButton: Button,
        ElTag: PassThrough,
        ElEmpty: PassThrough,
        "pure-table": Table
      }
    }
  });
}
const state = (wrapper: Awaited<ReturnType<typeof mountDialog>>) =>
  wrapper.vm.$.setupState as Record<string, any>;
const settle = async () => {
  await flushPromises();
  await nextTick();
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockResolvedValue({ code: 200, data: [] });
  mocks.grant.mockResolvedValue({ code: 200 });
  mocks.revoke.mockResolvedValue({ code: 200 });
  mocks.prompt.mockResolvedValue({ value: " policy " });
});

describe("CompanyPlanGrantsDialog behavior", () => {
  it("loads array data and renders active grant details", async () => {
    const wrapper = await mountDialog("company-1", [
      {
        uid: "g1",
        status: "ACTIVE",
        source: "ADMIN",
        endsAt: "2026-12-01T12:00:00Z",
        planId: "plan-active",
        featureSnapshotKeys: ["orders", "reports"],
        plan: { code: "PREMIUM", name: "Premium", receivesUpdates: false }
      },
      { uid: "g2", status: "SUPERSEDED", planId: "plan-old" }
    ]);
    const vm = state(wrapper);
    await vm.loadGrants();
    await settle();
    expect(mocks.list).toHaveBeenCalledWith("company-1");
    expect(vm.loading).toBe(false);
    expect(wrapper.text()).toContain("PREMIUM");
    expect(wrapper.text()).toContain("否（买断快照）");
    expect(wrapper.text()).toContain("orders, reports");
    expect(wrapper.text()).toContain("2026-12-01 12:00:00");
    expect(wrapper.find("button").text()).toBe("撤销");
    wrapper.unmount();
  });

  it("normalizes non-array and malformed successes", async () => {
    const wrapper = await mountDialog();
    await settle();
    const vm = state(wrapper);
    mocks.list.mockResolvedValueOnce({ code: 200, data: { invalid: true } });
    await vm.loadGrants();
    expect(vm.grants).toEqual([]);
    mocks.list.mockResolvedValueOnce({ code: 200 });
    await vm.loadGrants();
    expect(vm.grants).toEqual([]);
    wrapper.unmount();
  });

  it("reports envelope failures while loading and clears stale rows", async () => {
    const wrapper = await mountDialog("company-1", [
      { uid: "old", status: "EXPIRED" }
    ]);
    await settle();
    const vm = state(wrapper);
    mocks.list.mockResolvedValueOnce({ code: 500, msg: "backend down" });
    await vm.loadGrants();
    expect(vm.grants).toEqual([]);
    expect(mocks.message).toHaveBeenCalledWith("backend down", {
      type: "error"
    });

    mocks.list.mockResolvedValueOnce({ code: 500 });
    await vm.loadGrants();
    expect(mocks.message).toHaveBeenCalledWith("加载授予历史失败", {
      type: "error"
    });
    wrapper.unmount();
  });

  it("handles rejected loads and skips missing company ids", async () => {
    const wrapper = await mountDialog();
    await settle();
    const vm = state(wrapper);
    mocks.list.mockRejectedValueOnce(new Error("down"));
    await vm.loadGrants();
    expect(vm.grants).toEqual([]);
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "加载授予历史失败"
    );

    mocks.list.mockClear();
    await wrapper.setProps({ companyId: "" });
    await vm.loadGrants();
    expect(mocks.list).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("submits normalized grant payloads and resets the form", async () => {
    const wrapper = await mountDialog();
    await settle();
    const vm = state(wrapper);
    vm.grantForm.planCode = "BUYOUT";
    vm.grantForm.endsAt = "2026-12-31 10:30:00";
    vm.grantForm.note = "  channel  ";
    await vm.submitGrant();
    expect(mocks.grant).toHaveBeenCalledWith("company-1", {
      planCode: "BUYOUT",
      endsAt: new Date("2026-12-31T10:30:00").toISOString(),
      note: "channel"
    });
    expect(vm.grantForm).toMatchObject({
      planCode: "BUYOUT",
      endsAt: "",
      note: ""
    });
    expect(mocks.message).toHaveBeenCalledWith(
      expect.stringContaining("已授予 BUYOUT"),
      { type: "success" }
    );
    wrapper.unmount();
  });

  it("submits grants without optional values and handles envelope/rejection failures", async () => {
    const wrapper = await mountDialog();
    await settle();
    const vm = state(wrapper);
    vm.grantForm.endsAt = "";
    vm.grantForm.note = "   ";
    mocks.grant.mockResolvedValueOnce({ code: 400, msg: "duplicate" });
    await vm.submitGrant();
    expect(mocks.grant).toHaveBeenCalledWith("company-1", {
      planCode: "PREMIUM",
      endsAt: undefined,
      note: undefined
    });
    expect(mocks.message).toHaveBeenCalledWith("duplicate", { type: "error" });

    mocks.grant.mockResolvedValueOnce({ code: 500 });
    await vm.submitGrant();
    expect(mocks.message).toHaveBeenCalledWith("授予失败", { type: "error" });

    mocks.grant.mockRejectedValueOnce(new Error("down"));
    await vm.submitGrant();
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "授予计划失败");
    expect(vm.loading).toBe(false);
    wrapper.unmount();
  });

  it("skips grants and revokes without company or active grant", async () => {
    const wrapper = await mountDialog();
    await settle();
    const vm = state(wrapper);
    mocks.grant.mockClear();
    await wrapper.setProps({ companyId: "" });
    await vm.submitGrant();
    await vm.submitRevoke();
    expect(mocks.grant).not.toHaveBeenCalled();
    expect(mocks.prompt).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("revokes active grants with trimmed or absent reason", async () => {
    const wrapper = await mountDialog("company-1", [
      { uid: "g1", status: "ACTIVE", planId: "abcdefghijk" }
    ]);
    const vm = state(wrapper);
    await vm.loadGrants();
    await settle();
    expect(vm.activeGrant.uid).toBe("g1");
    await vm.submitRevoke();
    expect(mocks.prompt).toHaveBeenCalledWith(
      expect.stringContaining("abcdefghijk"),
      "撤销计划授予",
      expect.any(Object)
    );
    expect(mocks.revoke).toHaveBeenCalledWith("company-1", { note: "policy" });
    expect(mocks.message).toHaveBeenCalledWith(
      expect.stringContaining("已撤销"),
      { type: "success" }
    );

    mocks.prompt.mockResolvedValueOnce({});
    await vm.submitRevoke();
    expect(mocks.revoke).toHaveBeenLastCalledWith("company-1", {
      note: undefined
    });
    wrapper.unmount();
  });

  it("reports revoke envelope failures, API failures and cancels", async () => {
    const wrapper = await mountDialog("company-1", [
      { uid: "g1", status: "ACTIVE", plan: { code: "PREMIUM" } }
    ]);
    const vm = state(wrapper);
    await vm.loadGrants();
    await settle();
    mocks.revoke.mockResolvedValueOnce({ code: 500, msg: "locked" });
    await vm.submitRevoke();
    expect(mocks.message).toHaveBeenCalledWith("locked", { type: "error" });
    mocks.revoke.mockResolvedValueOnce({ code: 500 });
    await vm.submitRevoke();
    expect(mocks.message).toHaveBeenCalledWith("撤销失败", { type: "error" });
    mocks.revoke.mockRejectedValueOnce(new Error("down"));
    await vm.submitRevoke();
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "撤销授予失败");

    mocks.prompt.mockRejectedValueOnce("cancel");
    await vm.submitRevoke();
    expect(vm.loading).toBe(false);
    wrapper.unmount();
  });

  it("resets forms when reopened and formats history columns", async () => {
    const wrapper = await mountDialog();
    await settle();
    const vm = state(wrapper);
    const columns = vm.historyColumns;
    expect(
      columns[0].formatter({ plan: { code: "FREE" }, planId: "ignored" })
    ).toBe("FREE");
    expect(columns[0].formatter({ planId: "1234567890" })).toBe("12345678");
    expect(columns[0].formatter({})).toBe("—");
    expect(columns[3].formatter({ endsAt: "2026-01-02T03:04:05Z" })).toBe(
      "2026-01-02 03:04:05"
    );
    expect(columns[3].formatter({})).toBe("长期");
    expect(
      columns[4].formatter({ featureSnapshotKeys: ["a", "b", "c", "d", "e"] })
    ).toBe("a, b, c, d…");
    expect(columns[4].formatter({ featureSnapshotKeys: ["a"] })).toBe("a");
    expect(columns[4].formatter({ featureSnapshotKeys: [] })).toBe("—");
    expect(columns[5].formatter({ note: "" })).toBe("—");
    expect(columns[6].formatter({ createdAt: "2026-01-02T03:04:05Z" })).toBe(
      "2026-01-02 03:04:05"
    );
    expect(columns[6].formatter({})).toBe("—");
    expect(
      ["ACTIVE", "SUPERSEDED", "EXPIRED", "REVOKED"].map(vm.grantStatusType)
    ).toEqual(["success", "info", "warning", "danger"]);

    vm.grantForm.planCode = "BUYOUT";
    vm.grantForm.note = "stale";
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });
    await settle();
    expect(vm.grantForm).toMatchObject({
      planCode: "PREMIUM",
      endsAt: "",
      note: ""
    });
    wrapper.unmount();
  });
});
