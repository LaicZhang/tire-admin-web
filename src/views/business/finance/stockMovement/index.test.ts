import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getStockMovementPage: vi.fn(),
  push: vi.fn(),
  handleApiError: vi.fn()
}));

vi.mock("@/api/business/stock-ledger", () => ({
  getStockMovementPage: mocks.getStockMovementPage
}));

vi.mock("vue-router", async importOriginal => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return {
    ...actual,
    useRouter: () => ({
      push: mocks.push
    })
  };
});

vi.mock("@/utils/error", () => ({
  handleApiError: mocks.handleApiError
}));

vi.mock("@/components/ReSearchForm/index.vue", () => ({
  default: {
    name: "ReSearchFormStub",
    props: ["form", "loading"],
    emits: ["search", "reset"],
    template: `
      <div>
        <slot />
        <button type="button" data-test="search" @click="$emit('search')">搜索</button>
        <button type="button" data-test="reset" @click="$emit('reset')">重置</button>
      </div>
    `
  }
}));

import Index from "./index.vue";

const ElButtonStub = defineComponent({
  name: "ElButtonStub",
  emits: ["click"],
  setup(_props, { emit, slots }) {
    return () =>
      h(
        "button",
        {
          type: "button",
          onClick: () => emit("click")
        },
        slots.default?.()
      );
  }
});

const PureTableStub = defineComponent({
  name: "PureTableStub",
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  template: `
    <div class="pure-table">
      <div
        v-for="row in data"
        :key="row.uid"
        class="table-row"
        :data-row-uid="row.uid"
      >
        <span class="source-uid">{{ row.sourceUid }}</span>
        <span class="source-type">{{ row.sourceType }}</span>
        <slot name="operation" :row="row" :size="'default'" />
      </div>
    </div>
  `
});

function mountPage() {
  return mount(Index, {
    global: {
      components: {
        PureTableBar: {
          props: ["title", "columns"],
          template: `
            <div>
              <slot name="buttons" />
              <slot :size="'default'" :dynamicColumns="columns" />
            </div>
          `
        },
        "pure-table": PureTableStub
      },
      stubs: {
        ElFormItem: {
          template: "<div><slot /></div>"
        },
        ElInput: {
          props: ["modelValue"],
          emits: ["update:modelValue"],
          template:
            "<input :value='modelValue' @input=\"$emit('update:modelValue', $event.target.value || undefined)\" />"
        },
        ElSelect: {
          props: ["modelValue"],
          emits: ["update:modelValue"],
          template:
            "<input :value='modelValue' @input=\"$emit('update:modelValue', $event.target.value || undefined)\" />"
        },
        ElOption: {
          template: "<span />"
        },
        ElButton: ElButtonStub
      }
    }
  });
}

describe("business/finance/stockMovement/index", () => {
  beforeEach(() => {
    mocks.getStockMovementPage.mockReset();
    mocks.push.mockReset();
    mocks.handleApiError.mockReset();
    mocks.getStockMovementPage.mockResolvedValue({
      data: {
        count: 1,
        list: [
          {
            uid: "stock-movement-1",
            repoId: "repo-1",
            tireId: "tire-1",
            batchNo: "BATCH-001",
            sourceType: "SALE_ALLOCATION",
            sourceUid: "alloc-001",
            fromStatus: "AVAILABLE",
            toStatus: "RESERVED",
            quantity: 12,
            createdAt: "2026-03-27T10:00:00.000Z"
          }
        ]
      }
    });
  });

  it("应加载统一库存流水并透传筛选参数", async () => {
    const wrapper = mountPage();

    await flushPromises();

    expect(mocks.getStockMovementPage).toHaveBeenCalledWith(1, {
      sourceType: undefined,
      fromStatus: undefined,
      toStatus: undefined,
      sourceUid: undefined
    });
    expect(wrapper.text()).toContain("alloc-001");

    const inputs = wrapper.findAll("input");
    await inputs[0].setValue("TRANSFER_SHIPMENT");
    await inputs[1].setValue("RESERVED");
    await inputs[2].setValue("IN_TRANSIT");
    await inputs[3].setValue("transfer-001");
    await wrapper.get("[data-test='search']").trigger("click");
    await flushPromises();

    expect(mocks.getStockMovementPage).toHaveBeenLastCalledWith(1, {
      sourceType: "TRANSFER_SHIPMENT",
      fromStatus: "RESERVED",
      toStatus: "IN_TRANSIT",
      sourceUid: "transfer-001"
    });
  });

  it("应支持跳转到来源工作台", async () => {
    const wrapper = mountPage();

    await flushPromises();

    const viewButton = wrapper
      .findAll("[data-row-uid='stock-movement-1'] button")
      .find(button => button.text() === "查看来源");

    expect(viewButton).toBeDefined();
    expect(viewButton?.exists()).toBe(true);
    await viewButton?.trigger("click");

    expect(mocks.push).toHaveBeenCalledWith("/finance/sale-allocation");
  });
});
