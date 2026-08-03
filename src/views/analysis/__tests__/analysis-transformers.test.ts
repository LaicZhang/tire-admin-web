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

import {
  formatYuanAmount,
  mapCashFlowSegments,
  mapFundReportBalanceTrend,
  mapIncomeExpenseSummaryCards,
  mapProfitStatementCards,
  mapProfitWaterfall
} from "../transformers";

describe("finance/profit W120 mappers", () => {
  it("formats BE yuan strings without dividing by 100", () => {
    expect(formatYuanAmount("12345.67")).toBe(
      Number(12345.67).toLocaleString("zh-CN", { minimumFractionDigits: 2 })
    );
    expect(formatYuanAmount("0")).toBe(
      Number(0).toLocaleString("zh-CN", { minimumFractionDigits: 2 })
    );
  });

  it("maps income-expense summary cards with netIncome", () => {
    const cards = mapIncomeExpenseSummaryCards(
      {
        totalIncome: "100.00",
        totalExpense: "40.00",
        netIncome: "60.00",
        incomeCount: 2,
        expenseCount: 1,
        incomeByCategory: [],
        expenseByCategory: [],
        incomeByAccount: [],
        expenseByAccount: []
      },
      "88.00"
    );
    expect(cards).toEqual({
      totalIncome: "100.00",
      totalExpense: "40.00",
      netIncome: "60.00",
      currentBalance: "88.00"
    });
  });

  it("maps cash-flow three segments", () => {
    expect(
      mapCashFlowSegments({
        operatingCashFlow: "10.00",
        investingCashFlow: "-2.00",
        financingCashFlow: "1.50",
        netCashFlow: "9.50",
        operatingDetails: [],
        investingDetails: [],
        financingDetails: []
      })
    ).toEqual([
      { name: "经营活动", value: 10 },
      { name: "投资活动", value: -2 },
      { name: "筹资活动", value: 1.5 }
    ]);
  });

  it("maps fund report endBalance as balance trend", () => {
    expect(
      mapFundReportBalanceTrend({
        items: [
          {
            period: "2026-07-01",
            beginBalance: "10.00",
            income: "5.00",
            expense: "2.00",
            endBalance: "13.00"
          },
          {
            period: "2026-07-02",
            beginBalance: "13.00",
            income: "0",
            expense: "1.00",
            endBalance: "12.00"
          }
        ],
        totalBeginBalance: "10.00",
        totalIncome: "5.00",
        totalExpense: "3.00",
        totalEndBalance: "12.00"
      })
    ).toEqual([
      { period: "2026-07-01", balance: 13 },
      { period: "2026-07-02", balance: 12 }
    ]);
  });

  it("maps profit statement cards and waterfall steps", () => {
    const statement = {
      salesRevenue: "100.00",
      salesCost: "40.00",
      grossProfit: "60.00",
      grossProfitRate: 60,
      operatingExpense: "15.00",
      otherIncome: "5.00",
      netProfit: "50.00",
      salesOrderCount: 3,
      unknownCostQuantity: 1,
      startDate: "2026-07-01",
      endDate: "2026-07-31"
    };
    expect(mapProfitStatementCards(statement).grossProfit).toBe("60.00");
    expect(mapProfitStatementCards(statement).netProfit).toBe("50.00");
    const steps = mapProfitWaterfall(statement);
    expect(steps.map(s => s.name)).toEqual([
      "销售收入",
      "销售成本",
      "毛利",
      "营业费用",
      "其他收入",
      "净利润"
    ]);
    expect(steps[1].value).toBe(-40);
    expect(steps[5].value).toBe(50);
  });
});
