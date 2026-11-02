import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import OrderDetailTable from "../index.vue";
import type { OrderDetailRow } from "../index.vue";

const tableStub = {
  props: ["data", "columns"],
  setup(props: { data: OrderDetailRow[] }, { slots }: any) {
    return () =>
      h("div", { class: "table-stub" }, [
        ...props.data.flatMap((row, index) =>
          Object.entries(slots)
            .filter(([name]) => name !== "default")
            .map(([, slot]) => slot?.({ row, $index: index }))
        ),
        slots.append?.()
      ]);
  }
};

const base = (): OrderDetailRow => ({
  tireId: "t1",
  count: 2,
  unitPrice: 5,
  total: 10,
  repoId: "r1"
});

function mountTable(props: Record<string, unknown>) {
  return mount(OrderDetailTable, {
    props: {
      details: [base()],
      columns: [],
      tireList: [{ uid: "t1", name: "Tire" }],
      repoList: [{ uid: "r1", name: "Repo" }],
      ...props
    },
    global: {
      stubs: {
        "pure-table": tableStub,
        "el-option": true,
        "el-input-number": true,
        "el-select": true,
        "el-input": true,
        "el-switch": true,
        "el-popconfirm": defineComponent({
          setup(_, { slots, emit }) {
            return () =>
              h("div", { onClick: () => emit("confirm") }, slots.reference?.());
          }
        })
      }
    }
  });
}

describe("OrderDetailTable", () => {
  it("adds a discount row with defaults and emits add", async () => {
    const details: OrderDetailRow[] = [];
    const onAdd = vi.fn();
    const wrapper = mountTable({ details, showDiscount: true, onAdd });
    await wrapper.find('[aria-label="添加商品明细"]').trigger("click");
    expect(details).toHaveLength(1);
    expect(details[0]).toMatchObject({
      tireId: "",
      count: 1,
      unitPrice: 0,
      total: 0,
      repoId: "",
      discountRate: 0,
      discountAmount: 0
    });
    expect(wrapper.emitted("add")).toHaveLength(1);
    expect(onAdd).toHaveBeenCalledWith(details[0]);
  });

  it("adds arrival and shipping fields for their variants", async () => {
    const arrival: OrderDetailRow[] = [];
    await mountTable({ details: arrival, showIsArrival: true })
      .find('[aria-label="添加商品明细"]')
      .trigger("click");
    expect(arrival[0]).toMatchObject({ isArrival: false });

    const shipped: OrderDetailRow[] = [];
    await mountTable({ details: shipped, showIsShipped: true })
      .find('[aria-label="添加商品明细"]')
      .trigger("click");
    expect(shipped[0]).toMatchObject({ isShipped: false, isDelivered: false });
  });

  it("deletes a row, recalculates totals and reports the removed detail", async () => {
    const rows = [
      { ...base(), count: 3, total: 12 },
      { ...base(), tireId: "t2", count: 4, total: 9 }
    ];
    const onDelete = vi.fn();
    const onRecalcTotal = vi.fn();
    const wrapper = mountTable({ details: rows, onDelete, onRecalcTotal });
    await nextTick();
    await wrapper.find('[aria-label="删除第 1 行"]').trigger("click");
    expect(rows).toEqual([
      expect.objectContaining({ tireId: "t2", count: 4, total: 9 })
    ]);
    expect(wrapper.emitted("delete")?.[0]).toEqual([0]);
    expect(onDelete).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ tireId: "t1" })
    );
    expect(onRecalcTotal).toHaveBeenCalledWith(rows);
  });

  it("exposes recalculation and tolerates missing numeric values", async () => {
    const rows: OrderDetailRow[] = [
      { tireId: "a" },
      { tireId: "b", count: 2, total: 3 }
    ];
    const onRecalcTotal = vi.fn();
    const wrapper = mountTable({ details: rows, onRecalcTotal });
    (wrapper.vm as unknown as { recalcTotal: () => void }).recalcTotal();
    expect(onRecalcTotal).toHaveBeenCalledWith(rows);
  });

  it("hides add and delete actions when read-only", async () => {
    const wrapper = mountTable({ isReadOnly: true });
    expect(wrapper.find('[aria-label="添加商品明细"]').exists()).toBe(false);
    expect(wrapper.find('[aria-label="删除第 1 行"]').exists()).toBe(false);
    const selects = wrapper.findAll("el-select-stub");
    expect(selects).toHaveLength(2);
    expect(selects[0].attributes("disabled")).toBeDefined();
    expect(selects[1].attributes("disabled")).toBeDefined();
  });
});
