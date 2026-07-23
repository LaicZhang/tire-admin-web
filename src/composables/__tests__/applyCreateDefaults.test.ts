import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../useInventoryDefaults", () => ({
  loadInventoryDefaults: vi.fn()
}));

vi.mock("../useSettlementDefaults", () => ({
  loadSettlementDefaults: vi.fn()
}));

vi.mock("@/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }
}));

import {
  applyCreateDefaults,
  isDateOutsideBackdateWindow
} from "../applyCreateDefaults";
import { loadInventoryDefaults } from "../useInventoryDefaults";
import { loadSettlementDefaults } from "../useSettlementDefaults";

describe("applyCreateDefaults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (
      loadInventoryDefaults as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      defaultWarehouseId: "repo-default"
    });
    (
      loadSettlementDefaults as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      defaultReceivableAccount: "recv-1",
      defaultPayableAccount: "pay-1",
      defaultPaymentMethod: "CASH",
      allowBackdateDays: 7
    });
  });

  it("does nothing when not create", async () => {
    const target = { repoId: "" };
    await applyCreateDefaults(target, { isCreate: false, warehouse: true });
    expect(target.repoId).toBe("");
    expect(loadInventoryDefaults).not.toHaveBeenCalled();
  });

  it("fills empty warehouse and detail rows", async () => {
    const target = {
      repoId: "",
      details: [{ repoId: "" }, { repoId: "kept" }]
    };
    await applyCreateDefaults(target, {
      isCreate: true,
      warehouse: true,
      detailWarehouse: true
    });
    expect(target.repoId).toBe("repo-default");
    expect(target.details[0].repoId).toBe("repo-default");
    expect(target.details[1].repoId).toBe("kept");
  });

  it("does not overwrite non-empty fields", async () => {
    const target = {
      repoId: "existing",
      paymentId: "acc-x",
      paymentMethod: "BANK_TRANSFER"
    };
    await applyCreateDefaults(target, {
      isCreate: true,
      warehouse: true,
      settlement: "receivable"
    });
    expect(target.repoId).toBe("existing");
    expect(target.paymentId).toBe("acc-x");
    expect(target.paymentMethod).toBe("BANK_TRANSFER");
  });

  it("fills receivable settlement", async () => {
    const target = { paymentId: "", paymentMethod: "" };
    await applyCreateDefaults(target, {
      isCreate: true,
      settlement: "receivable"
    });
    expect(target.paymentId).toBe("recv-1");
    expect(target.paymentMethod).toBe("CASH");
  });

  it("fills transfer from payment with payable first", async () => {
    const target = { fromPaymentId: "" };
    await applyCreateDefaults(target, {
      isCreate: true,
      settlement: "transferFrom"
    });
    expect(target.fromPaymentId).toBe("pay-1");
  });

  it("fills transfer from warehouse only", async () => {
    const target = { fromRepositoryId: "", toRepositoryId: "" };
    await applyCreateDefaults(target as CreateDefaultsLoose, {
      isCreate: true,
      transferFromWarehouse: true
    });
    expect(target.fromRepositoryId).toBe("repo-default");
    expect(target.toRepositoryId).toBe("");
  });
});

type CreateDefaultsLoose = {
  fromRepositoryId: string;
  toRepositoryId: string;
};

describe("isDateOutsideBackdateWindow", () => {
  const now = new Date(2026, 6, 23); // 2026-07-23 local

  it("disables future dates", () => {
    expect(isDateOutsideBackdateWindow(new Date(2026, 6, 24), 7, now)).toBe(
      true
    );
  });

  it("allows today when allowBackdateDays is 0", () => {
    expect(isDateOutsideBackdateWindow(new Date(2026, 6, 23), 0, now)).toBe(
      false
    );
    expect(isDateOutsideBackdateWindow(new Date(2026, 6, 22), 0, now)).toBe(
      true
    );
  });

  it("allows previous N days", () => {
    expect(isDateOutsideBackdateWindow(new Date(2026, 6, 16), 7, now)).toBe(
      false
    );
    expect(isDateOutsideBackdateWindow(new Date(2026, 6, 15), 7, now)).toBe(
      true
    );
  });
});
