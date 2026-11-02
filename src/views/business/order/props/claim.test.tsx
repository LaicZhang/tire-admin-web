import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";
import {
  claimOrderColumns,
  claimOrderDetailsColumns,
  getClaimSupplierClaimOrderLines,
  getClaimTraceSummaryLines,
  getSupplierClaimOrderStatusLabel
} from "./claim";

const detailRow = {
  uid: "detail-1",
  number: "CLM-001",
  serialNo: "SN-001"
};

function cell(prop: string) {
  return claimOrderDetailsColumns.find(column => column.prop === prop)!;
}

function renderDetail(prop: string, row: Record<string, unknown>) {
  return mount(
    defineComponent({
      render: () => cell(prop).cellRenderer!({ row } as never)
    }),
    {
      global: {
        stubs: {
          "el-input": true,
          "el-input-number": true,
          "el-select": defineComponent({
            setup:
              (_, { slots }) =>
              () =>
                h("div", slots.default?.())
          }),
          "el-option": true,
          "el-switch": true
        }
      }
    }
  );
}

function listFormatter(prop: string) {
  return claimOrderColumns.find(column => column.prop === prop)!.formatter!;
}

describe("business/order/claim props", () => {
  it("renders complete trace details", () => {
    expect(
      getClaimTraceSummaryLines({
        serialNo: "SN-001",
        status: "IN_STOCK",
        repoId: "repo-1",
        sourceType: "PURCHASE",
        sourceOrderId: "purchase-1",
        targetType: "SALE",
        targetOrderId: "sale-1",
        latestBusiness: {
          type: "SUPPLIER_CLAIM",
          orderId: "supplier-claim-1",
          docNo: "SCO-001",
          status: "APPROVED"
        },
        latestReturnInspection: {
          result: "DEFECT",
          remark: "Sidewall bulge",
          defectCategory: { name: "外观" }
        },
        installation: {
          vehiclePlateNo: "沪A12345",
          vehicleModel: "Model Y",
          installPosition: "前左",
          mileageKm: 0,
          technicianName: "张师傅",
          storeRepoName: "一店"
        },
        warranty: { startAt: "2026-01-01", endAt: "2027-01-01" }
      })
    ).toEqual([
      "状态：IN_STOCK",
      "仓库：repo-1",
      "来源：PURCHASE purchase-1",
      "去向：SALE sale-1",
      "最近业务：SUPPLIER_CLAIM · SCO-001 · APPROVED",
      "最近退货质检：DEFECT · 外观",
      "质检备注：Sidewall bulge",
      "安装车辆：沪A12345 · Model Y",
      "安装位置：前左",
      "技师：张师傅 · 一店",
      "安装里程：0 km",
      "质保：2026-01-01 ~ 2027-01-01"
    ]);
  });

  it("uses trace fallbacks and omits a trace without a serial", () => {
    expect(
      getClaimTraceSummaryLines({
        serialNo: "SN-002",
        sourceOrderId: "purchase-2",
        targetOrderId: "sale-2",
        latestBusiness: {},
        latestReturnInspection: { result: "PASS" },
        installation: { vehiclePlateNo: "沪B00001", technicianName: "李师傅" },
        warranty: { startAt: "2026-02-01" }
      })
    ).toEqual([
      "来源：- purchase-2",
      "去向：- sale-2",
      "最近业务：-",
      "最近退货质检：PASS",
      "安装车辆：沪B00001",
      "技师：李师傅",
      "质保：2026-02-01"
    ]);
    expect(getClaimTraceSummaryLines()).toEqual([]);
    expect(getClaimTraceSummaryLines({ status: "IN_STOCK" })).toEqual([]);
  });

  it("maps supplier claim order labels and safe fallbacks", () => {
    expect(
      getSupplierClaimOrderStatusLabel({ isApproved: true, isReversed: false })
    ).toBe("已审核");
    expect(
      getSupplierClaimOrderStatusLabel({ isApproved: false, isReversed: false })
    ).toBe("待审核");
    expect(
      getSupplierClaimOrderStatusLabel({ isApproved: true, isReversed: true })
    ).toBe("已作废");
    expect(getClaimSupplierClaimOrderLines()).toEqual([]);
    expect(
      getClaimSupplierClaimOrderLines([
        { docNo: "SCO-001", isApproved: true },
        { docNo: "", uid: "claim-2" },
        { uid: "claim-3", isReversed: true },
        {}
      ])
    ).toEqual([
      "SCO-001 · 已审核",
      "claim-2 · 待审核",
      "claim-3 · 已作废",
      "- · 待审核"
    ]);
  });

  it("renders editable detail columns with their contracts", async () => {
    const cases = [
      ["serialNo", "退胎扣库且启用序列号时必填"],
      ["number", "自动生成"],
      ["name", "如：胎侧鼓包"],
      ["cause", "请输入原因"],
      ["causeDesc", "可选"],
      ["oldTireRemark", "可选"],
      ["identificationResult", "可选"]
    ] as const;

    for (const [prop, placeholder] of cases) {
      const wrapper = renderDetail(prop, detailRow);
      expect(wrapper.get("el-input-stub").attributes("placeholder")).toBe(
        placeholder
      );
      wrapper.unmount();
    }

    const remaining = renderDetail("remainingPattern", detailRow);
    expect(remaining.get("el-input-number-stub").attributes()).toMatchObject({
      min: "0",
      precision: "1"
    });
    remaining.unmount();

    const percent = renderDetail("percent", detailRow);
    expect(percent.get("el-input-number-stub").attributes()).toMatchObject({
      min: "0",
      max: "100"
    });
    percent.unmount();

    for (const prop of ["claimFee", "wearFee", "claimTirePrice"]) {
      const wrapper = renderDetail(prop, detailRow);
      expect(wrapper.get("el-input-number-stub").attributes()).toMatchObject({
        min: "0",
        precision: "2"
      });
      wrapper.unmount();
    }

    const claimType = renderDetail("claimType", detailRow);
    expect(
      claimType
        .findAll("el-option-stub")
        .map(option => option.attributes("label"))
    ).toEqual(["不处理", "现金理赔", "退胎扣库"]);
    claimType.unmount();

    const disposition = renderDetail("oldTireDisposition", detailRow);
    expect(
      disposition
        .findAll("el-option-stub")
        .map(option => option.attributes("label"))
    ).toEqual(["客户带走", "门店待处理", "返供应商", "报废"]);
    disposition.unmount();

    const providerClaim = renderDetail("isProviderClaim", detailRow);
    expect(providerClaim.find("el-switch-stub").exists()).toBe(true);
    providerClaim.unmount();

    await Promise.resolve();
  });

  it("renders trace and supplier claim summaries with empty states", () => {
    const missing = renderDetail("serialTrace", detailRow);
    expect(missing.text()).toBe("-");
    missing.unmount();

    const trace = renderDetail("serialTrace", {
      ...detailRow,
      serialTrace: { serialNo: "SN-009", status: "IN_STOCK" }
    });
    expect(trace.text()).toContain("状态：IN_STOCK");
    trace.unmount();

    const emptySupplierClaims = renderDetail("supplierClaimOrders", detailRow);
    expect(emptySupplierClaims.text()).toBe("-");
    emptySupplierClaims.unmount();

    const supplierClaims = renderDetail("supplierClaimOrders", {
      ...detailRow,
      supplierClaimOrders: [
        { docNo: "SCO-009", isApproved: true },
        { uid: "claim-9", isReversed: true }
      ]
    });
    expect(supplierClaims.text()).toContain("SCO-009 · 已审核");
    expect(supplierClaims.text()).toContain("claim-9 · 已作废");
    supplierClaims.unmount();

    const numberKeyed = renderDetail("supplierClaimOrders", {
      number: "CLM-009",
      supplierClaimOrders: [{ uid: "claim-10" }]
    });
    expect(numberKeyed.text()).toContain("claim-10 · 待审核");
    numberKeyed.unmount();
  });

  it("formats list approval and lock states", () => {
    type ListFormatter = (
      row: unknown,
      column: unknown,
      value: unknown,
      index: number
    ) => string;
    const approved = listFormatter("isApproved") as ListFormatter;
    const locked = listFormatter("isLocked") as ListFormatter;
    expect(approved({}, {}, true, 0)).toBe("已批准");
    expect(approved({}, {}, false, 0)).toBe("未批准");
    expect(locked({}, {}, true, 0)).toBe("已锁单");
    expect(locked({}, {}, false, 0)).toBe("未锁单");
  });
});
