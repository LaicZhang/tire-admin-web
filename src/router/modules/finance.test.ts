import { describe, expect, it } from "vitest";
import financeRoute from "./finance";

describe("finance routes", () => {
  it("exposes a unified stock reservation entry", () => {
    const reservationRoute = financeRoute.children?.find(
      route => route.path === "/finance/stock-reservation"
    );

    expect(reservationRoute).toMatchObject({
      name: "FinanceStockReservation",
      meta: {
        title: "统一预占"
      }
    });
  });
});
