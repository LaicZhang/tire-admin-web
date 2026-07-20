import { flushPromises, mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Index from "./index.vue";
import { statusMap } from "./columns";

const mocks = vi.hoisted(() => ({
  getSerialNumberList: vi.fn(),
  push: vi.fn()
}));

// Mock APIs
vi.mock("@/api/business/serialNumber", () => ({
  getSerialNumberList: mocks.getSerialNumberList,
  getSerialNumberLogs: vi.fn(),
  createSerialNumber: vi.fn(),
  createSerialNumberBatch: vi.fn()
}));

vi.mock("@/utils/message", () => ({
  message: vi.fn()
}));

vi.mock("@/components/ReIcon/src/hooks", () => ({
  useRenderIcon: () => "icon"
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

const PureTableBar = {
  template: "<div><slot name='buttons'></slot><slot :size='size'></slot></div>",
  data() {
    return { size: "default" };
  }
};

const PureTable = {
  name: "PureTable",
  props: ["columns", "data"],
  template: `
    <div>
      <div
        v-for="row in data"
        :key="row.serialNo"
        :data-row-serial-no="row.serialNo"
      >
        <slot name="operation" :row="row" :size="'default'" />
      </div>
    </div>
  `
};

describe("Serial Number List", () => {
  beforeEach(() => {
    mocks.getSerialNumberList.mockReset();
    mocks.push.mockReset();
    mocks.getSerialNumberList.mockResolvedValue({
      code: 200,
      data: {
        list: [
          {
            serialNo: "SN-001",
            status: "IN_STOCK",
            tire: { name: "测试轮胎" },
            repo: { name: "主仓" }
          }
        ],
        total: 1
      }
    });
  });

  it("uses the backend serial number status set", () => {
    expect(Object.keys(statusMap)).toEqual([
      "IN_STOCK",
      "RESERVED",
      "IN_TRANSIT",
      "OUTBOUND",
      "INSTALLED",
      "SOLD",
      "RETURNED_PENDING_QC",
      "GOOD_RETURN",
      "DEFECTIVE",
      "SCRAPPED"
    ]);
  });

  it("renders correctly", async () => {
    const wrapper = mount(Index, {
      global: {
        components: {
          PureTableBar,
          PureTable
        },
        stubs: {
          ElForm: { template: "<form><slot /></form>" },
          ElFormItem: { template: "<div><slot /></div>" },
          ElInput: true,
          ElSelect: { template: "<div><slot /></div>" },
          ElOption: {
            props: ["label"],
            template: "<span>{{ label }}</span>"
          },
          ElButton: true,
          ElDialog: true,
          ElTag: true
        }
      }
    });

    await flushPromises();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain("在途");
    expect(wrapper.text()).toContain("退回待检");
    expect(wrapper.text()).not.toContain("已退");
  });

  it("provides a trace entry for each serial number row", async () => {
    const wrapper = mount(Index, {
      global: {
        components: {
          PureTableBar,
          PureTable
        },
        stubs: {
          ElForm: { template: "<form><slot /></form>" },
          ElFormItem: { template: "<div><slot /></div>" },
          ElInput: true,
          ElSelect: { template: "<div><slot /></div>" },
          ElOption: {
            props: ["label"],
            template: "<span>{{ label }}</span>"
          },
          ElButton: {
            props: ["link", "type", "size"],
            emits: ["click"],
            template:
              "<button type='button' @click=\"$emit('click')\"><slot /></button>"
          },
          ElDialog: true,
          ElTag: true
        }
      }
    });

    await flushPromises();

    const traceButton = wrapper
      .findAll("[data-row-serial-no='SN-001'] button")
      .find(button => button.text() === "溯源分析");

    expect(traceButton).toBeDefined();
    await traceButton?.trigger("click");

    expect(mocks.push).toHaveBeenCalledWith({
      path: "/analysis/serial-trace",
      query: {
        serialNo: "SN-001"
      }
    });
  });
});
