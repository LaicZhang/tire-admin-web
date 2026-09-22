import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import TableOperations from "@/components/TableOperations/index.vue";
import { canCollectApprovedOrder } from "@/utils/moneyAmount";
import { purchaseOrderColumns } from "@/views/purchase/order/columns";
import { salesOrderColumns } from "./columns";

vi.mock("@/utils/viewport", () => ({
  hideOnMobile: () => false
}));

function moneyProp(columns: TableColumnList, prop: string, raw: unknown) {
  const column = columns.find(item => item.prop === prop);
  const renderer = column?.cellRenderer as
    | ((data: { row: Record<string, unknown> }) => {
        props?: { value?: unknown };
      })
    | undefined;
  return renderer?.({ row: { [prop]: raw } })?.props?.value;
}

describe("sales/purchase order bigint money display T3-ADM-002", () => {
  it("renders string totals instead of dropping them to empty", () => {
    expect(moneyProp(salesOrderColumns, "total", "1000")).toBe(1000);
    expect(moneyProp(salesOrderColumns, "paidAmount", "900")).toBe(900);
    expect(moneyProp(purchaseOrderColumns, "total", "1000")).toBe(1000);
    expect(moneyProp(purchaseOrderColumns, "paidAmount", "900")).toBe(900);
    expect(moneyProp(salesOrderColumns, "total", "not-a-number")).toBeNull();
  });

  it("shows 收款 when paidAmount and total are outstanding bigint strings", () => {
    const row = {
      uid: "order-1",
      isApproved: true,
      isLocked: true,
      paidAmount: "900",
      total: "1000"
    };
    const wrapper = mount(TableOperations, {
      props: {
        row,
        showView: false,
        showEdit: false,
        showAudit: false,
        showDelete: false,
        customActions: [
          {
            label: "收款",
            type: "primary",
            visible: row.isApproved && canCollectApprovedOrder(row),
            onClick: () => undefined
          }
        ]
      },
      global: {
        stubs: {
          "el-button": { template: "<button><slot /></button>" },
          DeleteButton: true
        }
      }
    });
    expect(wrapper.text()).toContain("收款");

    const settled = mount(TableOperations, {
      props: {
        row: { ...row, paidAmount: "1000", total: "900" },
        showView: false,
        showEdit: false,
        showAudit: false,
        showDelete: false,
        customActions: [
          {
            label: "收款",
            visible:
              true &&
              canCollectApprovedOrder({
                ...row,
                paidAmount: "1000",
                total: "900"
              }),
            onClick: () => undefined
          }
        ]
      },
      global: {
        stubs: {
          "el-button": { template: "<button><slot /></button>" },
          DeleteButton: true
        }
      }
    });
    // "1000" < "900" is true in dictionary order; numeric compare must hide it
    expect("1000" < "900").toBe(true);
    expect(settled.text()).not.toContain("收款");
  });
});
