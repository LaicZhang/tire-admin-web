import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCompanySettingGroupApi: vi.fn(),
  patchCompanySettingGroupApi: vi.fn()
}));

vi.mock("@/api/setting", () => ({
  getCompanySettingGroupApi: mocks.getCompanySettingGroupApi,
  patchCompanySettingGroupApi: mocks.patchCompanySettingGroupApi
}));

import { getColumnSettingsApi } from "./column-settings";

describe("column-settings api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when stored column settings contain malformed items", async () => {
    mocks.getCompanySettingGroupApi.mockResolvedValueOnce({
      code: 200,
      msg: "success",
      data: [
        {
          key: "tire",
          value: JSON.stringify([
            {
              id: 1,
              uid: "1",
              module: "tire",
              field: "name",
              label: "名称",
              sortOrder: 1
            }
          ])
        }
      ]
    });

    await expect(getColumnSettingsApi("tire")).resolves.toBeNull();
  });

  it("returns parsed column settings when every item is valid", async () => {
    const stored = [
      {
        id: 1,
        uid: "1",
        module: "tire",
        field: "name",
        label: "名称",
        visible: true,
        sortOrder: 1
      }
    ];

    mocks.getCompanySettingGroupApi.mockResolvedValueOnce({
      code: 200,
      msg: "success",
      data: [{ key: "tire", value: JSON.stringify(stored) }]
    });

    await expect(getColumnSettingsApi("tire")).resolves.toEqual(stored);
  });
});
