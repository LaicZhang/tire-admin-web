import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQuickStockTaking } from "./useQuickStockTaking";
import { getStockBalancePage } from "@/api";
import { message } from "@/utils/message";

vi.mock("@/api", () => ({
  getStockBalancePage: vi.fn(),
  batchStockTakingApi: vi.fn()
}));

vi.mock("@/utils/message", () => ({
  message: vi.fn()
}));

describe("useQuickStockTaking", () => {
  beforeEach(() => {
    vi.mocked(getStockBalancePage).mockReset();
    vi.mocked(message).mockReset();
  });

  it("passes current page size to stock balance page query", async () => {
    vi.mocked(getStockBalancePage).mockResolvedValue({
      code: 200,
      data: {
        count: 1,
        list: [
          {
            id: 1,
            uid: "balance-1",
            repoId: "repo-1",
            tireId: "tire-1",
            availableQuantity: 8,
            reservedQuantity: 0,
            pickedQuantity: 0,
            inTransitQuantity: 0,
            qcQuantity: 0,
            frozenQuantity: 0,
            atpQuantity: 8,
            tire: { name: "轮胎A" }
          }
        ]
      }
    } as never);

    const composable = useQuickStockTaking(ref("repo-1"));
    composable.pagination.value.pageSize = 5;

    await composable.loadData();

    expect(getStockBalancePage).toHaveBeenCalledWith(1, {
      repoId: "repo-1",
      limit: 5
    });
    expect(composable.tableData.value).toHaveLength(1);
    expect(composable.tableData.value[0]).toMatchObject({
      tireId: "tire-1",
      count: 8,
      actualCount: 8,
      tireName: "轮胎A"
    });
  });
});
