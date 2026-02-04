import { describe, expect, it, vi } from "vitest";

vi.mock("@pureadmin/utils", () => ({
  deviceDetection: () => false
}));

vi.mock("@/api", () => ({
  getCompanyId: vi.fn(),
  addTireApi: vi.fn(),
  updateTireApi: vi.fn()
}));

vi.mock("@/views/business/tire/store", () => ({
  clearUploadedImages: vi.fn(),
  getUploadedImages: vi.fn().mockResolvedValue([])
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

describe("business/tire/table", () => {
  it("openDialog sets expected defaults", () => {
    openDialog();

    const options = vi
      .mocked(addDialog)
      .mock.calls.at(-1)?.[0] as unknown as DialogOptions;
    expect(options.title).toBe("新增轮胎");
    expect(options.fullscreen).toBe(false);
    const props = options.props as { formInline: FormItemProps };
    expect(props.formInline).toMatchObject({
      group: "默认",
      unit: "套",
      commissionType: 0,
      covers: []
    });
  });

  it("openDialog normalizes salePrice from string/number/null", () => {
    openDialog("修改", {
      group: "G1",
      unit: "条",
      pattern: "P",
      brand: "B",
      loadIndex: "LI",
      speedLevel: "SL",
      format: "F",
      commissionType: 1,
      salePrice: "12.5",
      covers: []
    } as unknown as FormItemProps);
    let options = vi
      .mocked(addDialog)
      .mock.calls.at(-1)?.[0] as unknown as DialogOptions;
    expect(
      (options.props as { formInline: FormItemProps }).formInline.salePrice
    ).toBe(12.5);

    openDialog("修改", {
      group: "G1",
      unit: "条",
      pattern: "P",
      brand: "B",
      loadIndex: "LI",
      speedLevel: "SL",
      format: "F",
      commissionType: 1,
      salePrice: 9,
      covers: []
    } as unknown as FormItemProps);
    options = vi
      .mocked(addDialog)
      .mock.calls.at(-1)?.[0] as unknown as DialogOptions;
    expect(
      (options.props as { formInline: FormItemProps }).formInline.salePrice
    ).toBe(9);

    openDialog("修改", {
      group: "G1",
      unit: "条",
      pattern: "P",
      brand: "B",
      loadIndex: "LI",
      speedLevel: "SL",
      format: "F",
      commissionType: 1,
      salePrice: null,
      covers: []
    } as unknown as FormItemProps);
    options = vi
      .mocked(addDialog)
      .mock.calls.at(-1)?.[0] as unknown as DialogOptions;
    expect(
      (options.props as { formInline: FormItemProps }).formInline.salePrice
    ).toBeUndefined();
  });
});
