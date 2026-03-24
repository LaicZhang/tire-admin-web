import { describe, expect, it } from "vitest";
import {
  buildDashboardAlertRows,
  buildInventoryMovementRows,
  buildTrackingSummaryCards
} from "../transformers";

describe("analysis transformers", () => {
  it("flattens dashboard alerts with module labels", () => {
    const rows = buildDashboardAlertRows({
      storeMetrics: {
        alerts: [
          {
            key: "completion",
            label: "交付完成率",
            value: "70%",
            level: "warning"
          }
        ]
      },
      warehouseMetrics: {
        alerts: [
          { key: "stock", label: "低库存预警", value: "12", level: "danger" }
        ]
      },
      purchaseMetrics: { alerts: [] },
      salesMetrics: {
        alerts: [
          { key: "receivable", label: "待收款", value: "8", level: "info" }
        ]
      }
    });

    expect(rows).toEqual([
      {
        module: "库存",
        key: "stock",
        label: "低库存预警",
        value: "12",
        level: "danger"
      },
      {
        module: "门店",
        key: "completion",
        label: "交付完成率",
        value: "70%",
        level: "warning"
      },
      {
        module: "销售",
        key: "receivable",
        label: "待收款",
        value: "8",
        level: "info"
      }
    ]);
  });

  it("builds tracking cards with totals", () => {
    expect(
      buildTrackingSummaryCards({
        pending: 4,
        partial: 2,
        completed: 6
      })
    ).toEqual([
      { key: "pending", label: "待处理", value: 4 },
      { key: "partial", label: "处理中", value: 2 },
      { key: "completed", label: "已完成", value: 6 },
      { key: "total", label: "总数", value: 12 }
    ]);
  });

  it("builds inventory movement rows for chart rendering", () => {
    expect(
      buildInventoryMovementRows({
        totalBeginQty: 10,
        totalInQty: 5,
        totalOutQty: 3,
        totalEndQty: 12,
        totalBeginAmount: "1000.00",
        totalInAmount: "500.00",
        totalOutAmount: "200.00",
        totalEndAmount: "1300.00"
      })
    ).toEqual([
      { key: "begin", label: "期初", quantity: 10, amount: 1000 },
      { key: "in", label: "入库", quantity: 5, amount: 500 },
      { key: "out", label: "出库", quantity: 3, amount: 200 },
      { key: "end", label: "期末", quantity: 12, amount: 1300 }
    ]);
  });
});
