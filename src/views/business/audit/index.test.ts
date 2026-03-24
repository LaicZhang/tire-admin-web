// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ElMessageBox } from "element-plus";

const push = vi.fn();

vi.mock("vue-router", async importOriginal => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return {
    ...actual,
    useRouter: () => ({ push })
  };
});

vi.mock("@/api/business/order", () => ({
  getPendingAuditOrdersApi: vi.fn(),
  auditOrderApi: vi.fn()
}));

vi.mock("@/utils/message", () => ({
  message: vi.fn(),
  confirmBox: vi.fn()
}));

import AuditCenter from "./index.vue";
import { getPendingAuditOrdersApi, auditOrderApi } from "@/api/business/order";
import { confirmBox, message } from "@/utils/message";

const PureTableBar = defineComponent({
  name: "PureTableBar",
  props: {
    columns: {
      type: Array,
      default: () => []
    }
  },
  template:
    "<div><slot :size='\"default\"' :dynamicColumns='columns'></slot></div>"
});

const PureTable = defineComponent({
  name: "PureTable",
  props: {
    columns: {
      type: Array,
      default: () => []
    },
    data: {
      type: Array,
      default: () => []
    }
  },
  template: `
    <div>
      <div class="columns-count">{{ columns.length }}</div>
      <div
        v-for="row in data"
        :key="row.uid"
        class="row"
      >
        <slot name="operation" :row="row" />
      </div>
    </div>
  `
});

const ElCard = defineComponent({
  name: "ElCard",
  template: "<div><slot name='header' /><slot /></div>"
});

const ElButton = defineComponent({
  name: "ElButton",
  emits: ["click"],
  template: "<button @click=\"$emit('click')\"><slot /></button>"
});

const ElTabs = defineComponent({
  name: "ElTabs",
  props: {
    modelValue: {
      type: String,
      default: ""
    }
  },
  emits: ["update:modelValue", "tab-change"],
  template: "<div><slot /></div>"
});

const ElTabPane = defineComponent({
  name: "ElTabPane",
  props: {
    label: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      default: ""
    }
  },
  template: "<div class='tab-pane' :data-label='label' :data-name='name'></div>"
});

describe("AuditCenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPendingAuditOrdersApi).mockResolvedValue({
      code: 200,
      msg: "",
      data: {
        list: [
          {
            uid: "order-1",
            orderNo: "1001",
            subjectName: "客户 A",
            totalAmount: "12345",
            createdAt: "2026-01-01T00:00:00.000Z",
            creatorName: "张三",
            auditStatus: "pending"
          }
        ],
        total: 1,
        count: 1
      }
    } as never);
    vi.mocked(auditOrderApi).mockResolvedValue({ code: 200 } as never);
    vi.mocked(confirmBox).mockResolvedValue("confirm" as never);
    vi.spyOn(ElMessageBox, "prompt").mockResolvedValue({
      value: "库存不足"
    } as never);
  });

  function mountPage() {
    return mount(AuditCenter, {
      global: {
        components: {
          PureTableBar,
          PureTable
        },
        stubs: {
          ElCard,
          ElButton,
          ElTabs,
          ElTabPane
        }
      }
    });
  }

  it("renders 8 audit tabs and passes columns into table bar", async () => {
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.findAll(".tab-pane")).toHaveLength(8);
    expect(wrapper.find(".columns-count").text()).not.toBe("0");
    expect(getPendingAuditOrdersApi).toHaveBeenCalledWith("sale-order", 1, {
      pageSize: 20
    });
  });

  it("approves from audit center and refreshes data", async () => {
    const wrapper = mountPage();
    await flushPromises();

    const approveButton = wrapper
      .findAll("button")
      .find(button => button.text() === "通过");
    expect(approveButton).toBeDefined();

    await approveButton!.trigger("click");
    await flushPromises();

    expect(confirmBox).toHaveBeenCalled();
    expect(auditOrderApi).toHaveBeenCalledWith("order-1", {
      type: "sale-order",
      isApproved: true,
      desc: null
    });
    expect(message).toHaveBeenCalledWith("审核成功", { type: "success" });
    expect(getPendingAuditOrdersApi).toHaveBeenCalledTimes(2);
  });

  it("rejects from audit center and refreshes data", async () => {
    const wrapper = mountPage();
    await flushPromises();

    const rejectButton = wrapper
      .findAll("button")
      .find(button => button.text() === "驳回");
    expect(rejectButton).toBeDefined();

    await rejectButton!.trigger("click");
    await flushPromises();

    expect(ElMessageBox.prompt).toHaveBeenCalled();
    expect(auditOrderApi).toHaveBeenCalledWith("order-1", {
      type: "sale-order",
      isApproved: false,
      desc: "库存不足"
    });
    expect(message).toHaveBeenCalledWith("已拒绝", { type: "success" });
  });
});
