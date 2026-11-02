import { ref } from "vue";
import { ORDER_TYPE } from "@/utils";
import { useOrderButtonVisibility } from "../useOrderButtonVisibility";

const approved = {
  uid: "order-1",
  isApproved: true,
  isLocked: false,
  status: "DRAFT",
  logisticsStatus: 0,
  customerId: "customer-1",
  providerId: "provider-1",
  orders: []
} as const;

describe("useOrderButtonVisibility", () => {
  it("derives payment button visibility and label", () => {
    const type = ref(ORDER_TYPE.purchase as string);
    const visibility = useOrderButtonVisibility(type);
    expect(visibility.showPaymentButton.value).toBe(true);
    expect(visibility.paymentButtonText.value).toBe("付款");

    type.value = ORDER_TYPE.sale;
    expect(visibility.paymentButtonText.value).toBe("收款");
    type.value = ORDER_TYPE.return;
    expect(visibility.showPaymentButton.value).toBe(true);
    type.value = ORDER_TYPE.claim;
    expect(visibility.showPaymentButton.value).toBe(false);
  });

  it("matches every order action's business conditions", () => {
    const type = ref(ORDER_TYPE.purchase as string);
    const v = useOrderButtonVisibility(type);
    expect(v.canConfirmPurchaseArrival(approved)).toBe(true);

    type.value = ORDER_TYPE.sale;
    expect(v.canConfirmSaleShipment(approved)).toBe(true);
    expect(v.canConfirmSaleDelivery({ ...approved, logisticsStatus: 1 })).toBe(
      true
    );
    expect(v.canConfirmSaleShipment({ ...approved, logisticsStatus: 2 })).toBe(
      false
    );
    expect(v.canConfirmSaleDelivery({ ...approved, logisticsStatus: 3 })).toBe(
      false
    );

    type.value = ORDER_TYPE.claim;
    expect(v.canProcessClaimPayment(approved)).toBe(true);

    type.value = ORDER_TYPE.return;
    expect(v.canConfirmReturnCustomerArrival(approved)).toBe(true);
    expect(v.canConfirmReturnProviderShipment(approved)).toBe(true);
    expect(
      v.canConfirmReturnProviderDelivery({ ...approved, logisticsStatus: 1 })
    ).toBe(true);
    expect(v.canRefundReturn(approved)).toBe(true);
    expect(
      v.canConfirmReturnProviderDelivery({ ...approved, logisticsStatus: 2 })
    ).toBe(false);

    type.value = ORDER_TYPE.purchasePlan;
    expect(v.canGenerateOrder(approved)).toBe(true);
    expect(v.canGenerateOrder({ ...approved, status: "ordered" })).toBe(false);

    type.value = ORDER_TYPE.purchaseInquiry;
    expect(v.canSendInquiry(approved)).toBe(true);
    expect(v.canSendInquiry({ ...approved, status: "CLOSED" })).toBe(false);

    type.value = ORDER_TYPE.saleQuotation;
    expect(v.canConvertQuotation(approved)).toBe(true);
    expect(v.canConvertQuotation({ ...approved, status: "REJECTED" })).toBe(
      false
    );
    expect(v.canConvertQuotation({ ...approved, status: "EXPIRED" })).toBe(
      false
    );
    expect(
      v.canConvertQuotation({ ...approved, orders: [{ saleOrderUid: "s" }] })
    ).toBe(false);

    type.value = ORDER_TYPE.transfer;
    expect(v.canConfirmTransferShipment(approved)).toBe(true);
    expect(v.canConfirmTransferArrival(approved)).toBe(false);
    expect(
      v.canConfirmTransferArrival({ ...approved, logisticsStatus: 1 })
    ).toBe(true);
    expect(v.canReverseOrder(approved)).toBe(false);

    type.value = ORDER_TYPE.sale;
    expect(v.canReverseOrder(approved)).toBe(true);
    expect(v.canReverseOrder({ ...approved, isReversed: true })).toBe(false);
    expect(v.canReverseOrder({ ...approved, isApproved: false })).toBe(false);
    expect(v.canModify(approved)).toBe(true);
    expect(v.canModify({ ...approved, isLocked: true })).toBe(false);
  });
});
