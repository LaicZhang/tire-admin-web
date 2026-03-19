import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getStatementList: vi.fn(),
  message: vi.fn()
}));

vi.mock("@/api/business/statement", () => ({
  getStatementList: mocks.getStatementList
}));

vi.mock("@/composables/useOptions", () => ({
  useOptions: () => ({
    customers: {
      value: [{ uid: "cust-1", name: "客户甲" }]
    },
    providers: {
      value: [{ uid: "prov-1", name: "供应商乙" }]
    }
  })
}));

vi.mock("@/utils/message", () => ({
  message: mocks.message
}));

vi.mock("@/components/ReIcon/src/hooks", () => ({
  useRenderIcon: () => "icon"
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

vi.mock("@/components/StatusTag/index.vue", () => ({
  default: {
    name: "StatusTagStub",
    props: ["status"],
    template: "<span class='status-tag'>{{ status }}</span>"
  }
}));

vi.mock("./StatementFormDialog.vue", () => ({
  default: {
    name: "StatementFormDialogStub",
    props: ["modelValue"],
    emits: ["update:modelValue", "success"],
    template: `
      <div data-test="statement-form-dialog">
        {{ modelValue ? "open" : "closed" }}
      </div>
    `
  }
}));

vi.mock("./StatementSummaryDialog.vue", () => ({
  default: {
    name: "StatementSummaryDialogStub",
    props: ["modelValue", "row"],
    emits: ["update:modelValue", "success"],
    template: `
      <div data-test="statement-summary-dialog">
        {{ modelValue ? "open" : "closed" }}:{{ row?.targetName || "" }}
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

const ElSelectStub = defineComponent({
  name: "ElSelectStub",
  props: {
    modelValue: {
      type: String,
      default: undefined
    },
    placeholder: {
      type: String,
      default: ""
    }
  },
  emits: ["update:modelValue"],
  setup(props, { emit, slots }) {
    return () =>
      h("div", [
        h("input", {
          placeholder: props.placeholder,
          value: props.modelValue ?? "",
          onInput: event => {
            const value = (event.target as HTMLInputElement).value;
            emit("update:modelValue", value || undefined);
          }
        }),
        slots.default?.()
      ]);
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
        :key="row.id"
        class="table-row"
        :data-row-id="row.id"
      >
        <span class="target-name">{{ row.targetName }}</span>
        <slot name="operation" :row="row" />
        <slot name="status" :row="row" />
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
        ElSelect: ElSelectStub,
        ElOption: {
          template: "<span />"
        },
        ElButton: ElButtonStub
      }
    }
  });
}

describe("business/finance/statement/index", () => {
  beforeEach(() => {
    mocks.getStatementList.mockReset();
    mocks.message.mockReset();

    mocks.getStatementList.mockResolvedValue({
      data: {
        list: [
          {
            id: 1,
            uid: "stmt-cust-1",
            type: "CUSTOMER",
            targetId: "cust-1",
            targetName: "",
            statementNo: "RS-001",
            status: "DRAFT",
            amount: "10000",
            createTime: "2026-03-19T08:00:00.000Z",
            startTime: "2026-03-01",
            endTime: "2026-03-19"
          },
          {
            id: 2,
            uid: "stmt-prov-1",
            type: "PROVIDER",
            targetId: "prov-1",
            targetName: "",
            statementNo: "PS-001",
            status: "CONFIRMED",
            amount: "8000",
            createTime: "2026-03-18T08:00:00.000Z",
            startTime: "2026-03-01",
            endTime: "2026-03-18"
          }
        ],
        total: 2,
        count: 2
      }
    });
  });

  it("应加载列表并透传筛选参数", async () => {
    const wrapper = mountPage();

    await flushPromises();

    expect(mocks.getStatementList).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      type: undefined,
      targetName: undefined,
      status: undefined
    });
    expect(wrapper.text()).toContain("客户甲");
    expect(wrapper.text()).toContain("供应商乙");

    const inputs = wrapper.findAll("input");
    await inputs[0].setValue("CUSTOMER");
    await inputs[1].setValue("客户甲");
    await wrapper.get("[data-test='search']").trigger("click");
    await flushPromises();

    expect(mocks.getStatementList).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      type: "CUSTOMER",
      targetName: "客户甲",
      status: undefined
    });
  });

  it("应打开新建和摘要弹窗", async () => {
    const wrapper = mountPage();

    await flushPromises();

    const detailButtons = wrapper.findAll("[data-row-id='1'] button");
    const viewButton = detailButtons.find(button => button.text() === "查看");
    expect(viewButton).toBeDefined();
    await viewButton!.trigger("click");
    await flushPromises();

    expect(
      wrapper.get("[data-test='statement-summary-dialog']").text()
    ).toContain("open:客户甲");

    const createButton = wrapper
      .findAll("button")
      .find(button => button.text() === "新建对账");
    expect(createButton).toBeDefined();
    await createButton!.trigger("click");
    await flushPromises();

    expect(wrapper.get("[data-test='statement-form-dialog']").text()).toContain(
      "open"
    );
  });
});
