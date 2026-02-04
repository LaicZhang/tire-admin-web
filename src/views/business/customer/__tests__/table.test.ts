import { describe, expect, it, vi } from "vitest";

vi.mock("@pureadmin/utils", () => ({
  deviceDetection: () => false
}));

vi.mock("@/api", () => ({
  getCompanyId: vi.fn(),
  addCustomerApi: vi.fn(),
  updateCustomerApi: vi.fn()
}));

vi.mock("../../../../components/ReDialog", () => ({
  addDialog: vi.fn()
}));

vi.mock("../form.vue", () => ({
  default: { template: "<div />" }
}));

import { addDialog } from "../../../../components/ReDialog";
import type { DialogOptions } from "../../../../components/ReDialog";
import { openDialog } from "../table";
import type { FormItemProps } from "../table";

describe("business/customer/table", () => {
  it("openDialog calls addDialog with expected defaults", () => {
    openDialog();

    expect(addDialog).toHaveBeenCalledTimes(1);
    const options = vi.mocked(addDialog).mock
      .calls[0]?.[0] as unknown as DialogOptions;

    expect(options.title).toBe("新增客户");
    expect(options.fullscreen).toBe(false);
    expect(options.hideFooter).toBe(false);

    const props = options.props as { formInline: FormItemProps };
    expect(props.formInline).toMatchObject({
      name: "",
      uid: "",
      desc: "",
      tagIds: [],
      creditLimit: 0,
      initialBalance: 0,
      totalTransactionAmount: 0,
      isPublic: false
    });
    expect(typeof options.contentRenderer).toBe("function");
    expect(typeof options.beforeSure).toBe("function");
  });

  it("openDialog maps row fields into props", () => {
    openDialog("查看", {
      name: "ACME",
      uid: "u1",
      desc: "d1",
      id: 99,
      operator: { uid: "op1" },
      level: { id: 2 },
      tags: [{ id: 1 }, { id: 3 }],
      creditLimit: 500,
      totalTransactionAmount: 123,
      isPublic: true,
      province: "ZJ",
      isIndividual: true,
      from: "referral"
    });

    const options = vi
      .mocked(addDialog)
      .mock.calls.at(-1)?.[0] as unknown as DialogOptions;
    expect(options.title).toBe("查看客户");
    expect(options.hideFooter).toBe(true);
    const props = options.props as { formInline: FormItemProps };
    expect(props.formInline).toMatchObject({
      name: "ACME",
      uid: "u1",
      desc: "d1",
      id: 99,
      operatorId: "op1",
      levelId: 2,
      tagIds: [1, 3],
      creditLimit: 500,
      totalTransactionAmount: 123,
      isPublic: true,
      province: "ZJ",
      isIndividual: true,
      from: "referral"
    });
  });
});
