import { useOrderConfirmActions } from "../useOrderConfirmActions";

const { messageMock, handleApiErrorMock } = vi.hoisted(() => ({
  messageMock: vi.fn(),
  handleApiErrorMock: vi.fn()
}));

vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: messageMock,
  handleApiError: handleApiErrorMock
}));

describe("useOrderConfirmActions", () => {
  beforeEach(() => {
    messageMock.mockClear();
    handleApiErrorMock.mockClear();
  });

  it("batch-confirms pending details and refreshes", async () => {
    const onSuccess = vi.fn().mockResolvedValue(undefined);
    const confirmApi = vi.fn().mockResolvedValue(undefined);
    const { handleConfirmBatch } = useOrderConfirmActions({ onSuccess });
    await handleConfirmBatch(
      "o1",
      [
        { uid: "d1", isShipped: false },
        { uid: "", isShipped: false },
        { uid: "d2", isShipped: true }
      ],
      {
        filterFn: detail => !detail.isShipped,
        confirmApi,
        emptyMessage: "empty",
        successMessage: "ok",
        errorMessage: "error"
      }
    );
    expect(confirmApi).toHaveBeenCalledTimes(1);
    expect(confirmApi).toHaveBeenCalledWith("o1", { detailUid: "d1" });
    expect(messageMock).toHaveBeenCalledWith("ok", { type: "success" });
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("handles empty and failed batch operations", async () => {
    const onSuccess = vi.fn();
    const { handleConfirmBatch } = useOrderConfirmActions({ onSuccess });
    await handleConfirmBatch("o1", [{ isShipped: true }], {
      filterFn: detail => !detail.isShipped,
      confirmApi: vi.fn(),
      emptyMessage: "没有待处理",
      successMessage: "ok",
      errorMessage: "error"
    });
    expect(messageMock).toHaveBeenCalledWith("没有待处理", { type: "info" });
    expect(onSuccess).not.toHaveBeenCalled();

    const failure = new Error("fail");
    await handleConfirmBatch("o1", [{ uid: "d1" }], {
      filterFn: () => true,
      confirmApi: vi.fn().mockRejectedValue(failure),
      emptyMessage: "empty",
      successMessage: "ok",
      errorMessage: "批量失败"
    });
    expect(handleApiErrorMock).toHaveBeenCalledWith(failure, "批量失败");
  });

  it("confirms shipment, delivery and arrival with the expected filters", async () => {
    const onSuccess = vi.fn().mockResolvedValue(undefined);
    const api = useOrderConfirmActions({ onSuccess });
    const shipment = vi.fn().mockResolvedValue(undefined);
    await api.handleConfirmShipment(
      {
        uid: "s1",
        details: [
          { uid: "d1", isShipped: false, count: 2 },
          { uid: "d2", isShipped: true }
        ]
      },
      shipment
    );
    expect(shipment).toHaveBeenCalledWith("s1", {
      detailUid: "d1",
      shipCount: 2
    });
    expect(messageMock).toHaveBeenCalledWith("确认发货成功", {
      type: "success"
    });

    const delivery = vi.fn().mockResolvedValue(undefined);
    await api.handleConfirmDelivery(
      {
        uid: "s1",
        details: [
          { uid: "d1", isShipped: true, isDelivered: false },
          { uid: "d2", isShipped: false }
        ]
      },
      delivery
    );
    expect(delivery).toHaveBeenCalledWith("s1", { detailUid: "d1" });

    const arrival = vi.fn().mockResolvedValue(undefined);
    await api.handleConfirmArrival(
      {
        uid: "p1",
        details: [
          { uid: "d1", isShipped: true, isArrival: false },
          { uid: "d2", isShipped: false }
        ]
      },
      arrival,
      { requireShipped: true }
    );
    expect(arrival).toHaveBeenCalledWith("p1", { detailUid: "d1" });
    await api.handleConfirmArrival(
      {
        uid: "p1",
        details: [{ uid: "d2", isShipped: false, isArrival: false }]
      },
      arrival
    );
    expect(arrival).toHaveBeenLastCalledWith("p1", { detailUid: "d2" });
    expect(onSuccess).toHaveBeenCalledTimes(4);
  });

  it("handles no-op and failure paths for shipment, delivery and arrival", async () => {
    const api = useOrderConfirmActions({ onSuccess: vi.fn() });
    await api.handleConfirmShipment(
      { uid: "s1", details: [{ isShipped: true }] },
      vi.fn()
    );
    expect(messageMock).toHaveBeenCalledWith("所有商品已发货", {
      type: "info"
    });
    await api.handleConfirmDelivery(
      { uid: "s1", details: [{ isShipped: false }] },
      vi.fn()
    );
    expect(messageMock).toHaveBeenCalledWith("所有商品已送达", {
      type: "info"
    });
    await api.handleConfirmArrival(
      { uid: "p1", details: [{ isArrival: true }] },
      vi.fn()
    );
    expect(messageMock).toHaveBeenCalledWith("所有商品已到货", {
      type: "info"
    });

    const shipmentError = new Error("ship");
    await api.handleConfirmShipment(
      { uid: "s1", details: [{ uid: "d1", isShipped: false }] },
      vi.fn().mockRejectedValue(shipmentError)
    );
    expect(handleApiErrorMock).toHaveBeenCalledWith(
      shipmentError,
      "确认发货失败"
    );
    const deliveryError = new Error("delivery");
    await api.handleConfirmDelivery(
      {
        uid: "s1",
        details: [{ uid: "d1", isShipped: true, isDelivered: false }]
      },
      vi.fn().mockRejectedValue(deliveryError)
    );
    expect(handleApiErrorMock).toHaveBeenCalledWith(
      deliveryError,
      "确认送达失败"
    );
    const arrivalError = new Error("arrival");
    await api.handleConfirmArrival(
      { uid: "p1", details: [{ uid: "d1", isArrival: false }] },
      vi.fn().mockRejectedValue(arrivalError)
    );
    expect(handleApiErrorMock).toHaveBeenCalledWith(
      arrivalError,
      "确认到货失败"
    );
  });
});
