import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import AdvancePaymentFormDialog from "../AdvancePaymentFormDialog.vue";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  message: vi.fn(),
  handleError: vi.fn(),
  validate: vi.fn()
}));

vi.mock("@/api/business/advance-payment", () => ({
  createAdvancePayment: mocks.create
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message,
  handleApiError: mocks.handleError
}));

const FormStub = defineComponent({
  setup(_, { expose, slots }) {
    expose({ validate: mocks.validate, resetFields: vi.fn() });
    return () => h("form", slots.default?.());
  }
});

async function mountDialog(initialType?: "RECEIPT" | "PAYMENT") {
  const wrapper = mount(AdvancePaymentFormDialog, {
    props: { modelValue: false, initialType },
    global: {
      stubs: {
        ElDialog: defineComponent({
          props: ["modelValue", "title"],
          emits: ["update:modelValue"],
          setup(props, { slots }) {
            return () =>
              h("section", { "data-title": props.title }, slots.default?.());
          }
        }),
        ElForm: FormStub,
        "el-form": FormStub,
        CustomerSelect: true,
        ProviderSelect: true,
        PaymentSelect: true,
        ElFormItem: defineComponent({
          setup:
            (_, { slots }) =>
            () =>
              h("div", slots.default?.())
        }),
        ElRadioGroup: true,
        ElRadio: true,
        ElInputNumber: true,
        ElSelect: true,
        ElOption: true,
        ElDatePicker: true,
        ElInput: true,
        ElButton: true,
        ElAlert: true
      }
    }
  });
  await wrapper.setProps({ modelValue: true });
  await flushPromises();
  return wrapper;
}

type Wrapper = Awaited<ReturnType<typeof mountDialog>>;
const state = (wrapper: Wrapper) =>
  wrapper.vm.$.setupState as Record<string, any>;

function rule(name: string) {
  return state(current).rules[name][0].validator;
}

let current: Wrapper;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.validate.mockResolvedValue(true);
  mocks.create.mockResolvedValue({ code: 200 });
});

afterEach(() => {
  current?.unmount();
});

describe("advance payment dialog behavior", () => {
  it("uses receipt defaults, titles, helper copy and emits close through dialog state", async () => {
    current = await mountDialog();
    const vm = state(current);
    expect(vm.dialogTitle).toBe("新建预收款");
    expect(vm.helperTitle).toContain("销售单");
    expect(vm.formData).toMatchObject({
      type: "RECEIPT",
      targetId: "",
      paymentId: "",
      paymentMethod: "BANK_TRANSFER",
      amount: 0
    });
    vm.dialogVisible = false;
    await flushPromises();
    expect(current.emitted("update:modelValue")).toEqual([[false]]);
  });

  it("honors payment initial type and renders payment-only copy", async () => {
    current = await mountDialog("PAYMENT");
    expect(state(current).dialogTitle).toBe("新建预付款");
    expect(state(current).helperTitle).toContain("生成付款单草稿");
    expect(current.html()).toContain("新建预付款");
  });

  it("validates target and payment account messages for both types", async () => {
    current = await mountDialog("PAYMENT");
    const targetErrors: unknown[] = [];
    rule("targetId")!({}, "", (error?: unknown) => targetErrors.push(error));
    expect((targetErrors[0] as Error).message).toBe("请选择供应商");

    targetErrors.length = 0;
    rule("targetId")!({}, "provider-1", (error?: unknown) =>
      targetErrors.push(error)
    );
    expect(targetErrors[0]).toBeUndefined();

    const paymentErrors: unknown[] = [];
    rule("paymentId")!({}, "", (error?: unknown) => paymentErrors.push(error));
    expect((paymentErrors[0] as Error).message).toBe("请选择结算账户");
    rule("paymentId")!({}, "account-1", (error?: unknown) =>
      paymentErrors.push(error)
    );
    expect(paymentErrors[1]).toBeUndefined();

    state(current).formData.type = "RECEIPT";
    await flushPromises();
    rule("paymentId")!({}, "", (error?: unknown) => paymentErrors.push(error));
    expect(paymentErrors[2]).toBeUndefined();
  });

  it("validates the receipt target message and resets dependent fields on type changes", async () => {
    current = await mountDialog("PAYMENT");
    const vm = state(current);
    vm.formData.targetId = "provider-1";
    vm.formData.paymentId = "account-1";
    vm.formData.paymentMethod = "CASH";
    vm.formData.paymentDate = "1999-01-01";
    vm.formData.type = "RECEIPT";
    await flushPromises();
    expect(vm.formData.targetId).toBe("");
    expect(vm.formData.paymentId).toBe("");
    expect(vm.formData.paymentMethod).toBe("BANK_TRANSFER");
    expect(vm.formData.paymentDate).not.toBe("1999-01-01");

    const errors: unknown[] = [];
    rule("targetId")!({}, "", (error?: unknown) => errors.push(error));
    expect((errors[0] as Error).message).toBe("请选择客户");

    vm.formData.type = "PAYMENT";
    vm.formData.paymentId = "keep-account";
    await flushPromises();
    expect(vm.formData.targetId).toBe("");
    expect(vm.formData.paymentId).toBe("keep-account");
  });

  it("resets the whole form whenever the dialog opens", async () => {
    current = await mountDialog("PAYMENT");
    const vm = state(current);
    vm.formData.targetId = "stale";
    vm.formData.amount = 8;
    await current.setProps({ modelValue: false });
    await current.setProps({ modelValue: true });
    await flushPromises();
    expect(vm.formData).toMatchObject({
      type: "PAYMENT",
      targetId: "",
      paymentId: "",
      amount: 0
    });
  });

  it("stops before creating when validation is absent, false or rejected", async () => {
    current = await mountDialog();
    const vm = state(current);
    mocks.validate.mockResolvedValueOnce(false);
    await vm.handleSubmit();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(vm.loading).toBe(false);

    mocks.validate.mockRejectedValueOnce(new Error("invalid"));
    await vm.handleSubmit();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("creates an optional-field receipt payload and closes after success", async () => {
    current = await mountDialog("RECEIPT");
    const vm = state(current);
    Object.assign(vm.formData, {
      type: "RECEIPT",
      targetId: "customer-1",
      paymentId: "ignored",
      paymentMethod: "CASH",
      paymentDate: "2025-01-01",
      amount: 12.34,
      remark: "receipt"
    });
    await vm.handleSubmit();
    expect(mocks.create).toHaveBeenCalledWith({
      type: "RECEIPT",
      targetId: "customer-1",
      amount: 1234,
      paymentId: undefined,
      paymentMethod: undefined,
      paymentDate: undefined,
      remark: "receipt"
    });
    expect(mocks.message).toHaveBeenCalledWith("预收款创建成功", {
      type: "success"
    });
    expect(current.emitted("update:modelValue")?.at(-1)).toEqual([false]);
    expect(current.emitted("success")).toHaveLength(1);
    expect(vm.loading).toBe(false);
  });

  it("creates a payment payload and falls back to undefined optional values", async () => {
    current = await mountDialog("PAYMENT");
    const vm = state(current);
    Object.assign(vm.formData, {
      targetId: "provider-1",
      paymentId: "",
      paymentMethod: "",
      paymentDate: "",
      amount: 200,
      remark: ""
    });
    await vm.handleSubmit();
    expect(mocks.create).toHaveBeenCalledWith({
      type: "PAYMENT",
      targetId: "provider-1",
      amount: 20000,
      paymentId: undefined,
      paymentMethod: undefined,
      paymentDate: undefined,
      remark: undefined
    });
    expect(mocks.message).toHaveBeenCalledWith("预付款草稿创建成功", {
      type: "success"
    });
  });

  it("keeps the dialog open and reports payment or receipt failures", async () => {
    current = await mountDialog("PAYMENT");
    const vm = state(current);
    Object.assign(vm.formData, { targetId: "provider-1", amount: 1 });
    const error = new Error("create");
    mocks.create.mockRejectedValueOnce(error);
    await vm.handleSubmit();
    expect(mocks.handleError).toHaveBeenLastCalledWith(error, "创建预付款失败");

    vm.formData.type = "RECEIPT";
    await flushPromises();
    vm.formData.targetId = "customer-1";
    mocks.create.mockRejectedValueOnce(error);
    await vm.handleSubmit();
    expect(mocks.handleError).toHaveBeenLastCalledWith(error, "创建预收款失败");
    expect(current.emitted("success")).toBeUndefined();
    expect(vm.loading).toBe(false);
  });
});
