// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import TireSelect from "@/components/EntitySelect/TireSelect.vue";
import RepoSelect from "@/components/EntitySelect/RepoSelect.vue";
import CustomerSelect from "@/components/EntitySelect/CustomerSelect.vue";
import ProviderSelect from "@/components/EntitySelect/ProviderSelect.vue";
import PaymentSelect from "@/components/EntitySelect/PaymentSelect.vue";
import {
  getTireBatchApi,
  getTireListApi,
  type Tire
} from "@/api/business/tire";
import { getCustomerListApi, type Customer } from "@/api/business/customer";
import { getProviderBatchApi, type Provider } from "@/api/business/provider";
import { getRepoBatchApi, getRepoListApi, type Repo } from "@/api/company/repo";
import { getPaymentApi, getPaymentListApi } from "@/api/payment";
import type { PaymentAccount } from "@/api/type";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";

function okPage<T>(list: T[]): CommonResult<PaginatedResponseDto<T>> {
  return {
    code: 200,
    msg: "",
    data: {
      list,
      total: list.length,
      count: list.length
    }
  };
}

function okList<T>(data: T[]): CommonResult<T[]> {
  return {
    code: 200,
    msg: "",
    data
  };
}

vi.mock("@/utils", async () => {
  const actual = await vi.importActual<object>("@/utils");
  return {
    ...actual,
    message: vi.fn(),
    handleApiError: vi.fn()
  };
});

vi.mock("@/api/business/tire", () => ({
  getTireListApi: vi.fn(),
  getTireBatchApi: vi.fn()
}));

vi.mock("@/api/business/customer", () => ({
  getCustomerListApi: vi.fn(),
  getCustomerBatchApi: vi.fn()
}));

vi.mock("@/api/business/provider", () => ({
  getProviderListApi: vi.fn(),
  getProviderBatchApi: vi.fn()
}));

vi.mock("@/api/company/repo", () => ({
  getRepoListApi: vi.fn(),
  getRepoBatchApi: vi.fn()
}));

vi.mock("@/api/payment", () => ({
  getPaymentListApi: vi.fn(),
  getPaymentApi: vi.fn()
}));

const ElSelectStub = defineComponent({
  name: "ElSelect",
  props: {
    modelValue: { type: [String, Number, Boolean], default: undefined },
    remoteMethod: { type: Function, default: undefined },
    loading: { type: Boolean, default: false }
  },
  emits: ["update:modelValue", "focus"],
  setup(_props, { emit, slots }) {
    return () =>
      h(
        "div",
        {
          "data-testid": "el-select",
          onFocus: () => emit("focus")
        },
        slots.default?.()
      );
  }
});

const ElOptionStub = defineComponent({
  name: "ElOption",
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number, Boolean], required: true }
  },
  setup(props) {
    return () =>
      h(
        "div",
        { "data-testid": "el-option", "data-value": String(props.value) },
        props.label
      );
  }
});

describe("EntitySelect components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("TireSelect remote searches with debounce", async () => {
    vi.useFakeTimers();
    const tires: Tire[] = [{ uid: "t1", id: 1, name: "轮胎A", barcode: "BC" }];
    vi.mocked(getTireListApi).mockResolvedValue(okPage(tires));

    const wrapper = mount(TireSelect, {
      props: { modelValue: undefined },
      global: {
        stubs: {
          "el-select": ElSelectStub,
          "el-option": ElOptionStub
        }
      }
    });

    const remoteMethod = wrapper
      .findComponent(ElSelectStub)
      .props("remoteMethod") as ((q: string) => void) | undefined;
    expect(remoteMethod).toBeTypeOf("function");

    (remoteMethod as (q: string) => void)("a");
    (remoteMethod as (q: string) => void)("ab");
    (remoteMethod as (q: string) => void)("abc");

    vi.advanceTimersByTime(310);
    await flushPromises();

    expect(getTireListApi).toHaveBeenCalledTimes(1);
    expect(getTireListApi).toHaveBeenCalledWith(1, { keyword: "abc" });
    expect(wrapper.text()).toContain("轮胎A");
  });

  it("TireSelect backfills label with batch api for existing value", async () => {
    const tires: Tire[] = [{ uid: "t2", id: 2, name: "轮胎B" }];
    vi.mocked(getTireBatchApi).mockResolvedValue(okList(tires));

    const wrapper = mount(TireSelect, {
      props: { modelValue: "t2" },
      global: {
        stubs: {
          "el-select": ElSelectStub,
          "el-option": ElOptionStub
        }
      }
    });

    await flushPromises();

    expect(getTireBatchApi).toHaveBeenCalledWith(["t2"]);
    expect(wrapper.text()).toContain("轮胎B");
  });

  it("RepoSelect emits empty string when cleared", async () => {
    const repos: Repo[] = [{ uid: "r1", id: 1, name: "仓库1", status: true }];
    vi.mocked(getRepoBatchApi).mockResolvedValue(okList(repos));
    vi.mocked(getRepoListApi).mockResolvedValue(okPage<Repo>([]));

    const wrapper = mount(RepoSelect, {
      props: { modelValue: "r1" },
      global: {
        stubs: {
          "el-select": ElSelectStub,
          "el-option": ElOptionStub
        }
      }
    });

    await flushPromises();

    wrapper
      .findComponent(ElSelectStub)
      .vm.$emit("update:modelValue", undefined);
    await flushPromises();

    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([""]);
  });

  it("CustomerSelect remote searches with debounce", async () => {
    vi.useFakeTimers();
    const customers: Customer[] = [{ uid: "c1", id: 1, name: "客户A" }];
    vi.mocked(getCustomerListApi).mockResolvedValue(okPage(customers));

    const wrapper = mount(CustomerSelect, {
      props: { modelValue: undefined },
      global: {
        stubs: {
          "el-select": ElSelectStub,
          "el-option": ElOptionStub
        }
      }
    });

    const remoteMethod = wrapper
      .findComponent(ElSelectStub)
      .props("remoteMethod") as ((q: string) => void) | undefined;
    expect(remoteMethod).toBeTypeOf("function");

    (remoteMethod as (q: string) => void)("客");
    (remoteMethod as (q: string) => void)("客户");
    vi.advanceTimersByTime(310);
    await flushPromises();

    expect(getCustomerListApi).toHaveBeenCalledWith(1, { keyword: "客户" });
    expect(wrapper.text()).toContain("客户A");
  });

  it("ProviderSelect backfills existing option with batch api", async () => {
    const providers: Provider[] = [{ uid: "p1", id: 1, name: "供应商A" }];
    vi.mocked(getProviderBatchApi).mockResolvedValue(okList(providers));

    const wrapper = mount(ProviderSelect, {
      props: { modelValue: "p1" },
      global: {
        stubs: {
          "el-select": ElSelectStub,
          "el-option": ElOptionStub
        }
      }
    });

    await flushPromises();

    expect(getProviderBatchApi).toHaveBeenCalledWith(["p1"]);
    expect(wrapper.text()).toContain("供应商A");
  });

  it("PaymentSelect normalizes paged data and filters locally by keyword", async () => {
    vi.useFakeTimers();
    const accounts: PaymentAccount[] = [
      { uid: "pay-1", id: 1, name: "现金账户", balance: 1000 },
      { uid: "pay-2", id: 2, name: "对公账户", balance: 2000 }
    ];
    vi.mocked(getPaymentListApi).mockResolvedValue({
      code: 200,
      msg: "",
      data: {
        list: accounts,
        count: 2
      }
    });
    vi.mocked(getPaymentApi).mockResolvedValue({
      code: 200,
      msg: "",
      data: accounts[0]
    });

    const wrapper = mount(PaymentSelect, {
      props: { modelValue: undefined, companyUid: "company-1" },
      global: {
        stubs: {
          "el-select": ElSelectStub,
          "el-option": ElOptionStub
        }
      }
    });

    await flushPromises();
    wrapper.findComponent(ElSelectStub).vm.$emit("focus");
    await flushPromises();

    const remoteMethod = wrapper
      .findComponent(ElSelectStub)
      .props("remoteMethod") as ((q: string) => void) | undefined;

    (remoteMethod as (q: string) => void)("现金");
    vi.advanceTimersByTime(160);
    await flushPromises();

    expect(getPaymentListApi).toHaveBeenCalledWith("company-1");
    expect(wrapper.text()).toContain("现金账户");
    expect(wrapper.text()).not.toContain("对公账户");
  });
});
