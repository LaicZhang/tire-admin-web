import { ref } from "vue";
import { shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompanySettingItem } from "@/api/setting";
import type { CostParams } from "./types";

const mocks = vi.hoisted(() => {
  return {
    capturedOptions: null as unknown,
    confirm: vi.fn(),
    handleSave: vi.fn()
  };
});

vi.mock("@/components/ReIcon/src/hooks", () => ({
  useRenderIcon: vi.fn(() => () => null)
}));

vi.mock("@/composables/useConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: mocks.confirm
  })
}));

vi.mock("@/composables", () => ({
  useSettingsForm: (options: unknown) => {
    mocks.capturedOptions = options;
    return {
      loading: ref(false),
      formRef: ref(null),
      formData: ref({
        costMethod: "moving_average",
        costCalcType: "total_warehouse",
        abnormalCostOrder: []
      }),
      handleSave: mocks.handleSave,
      missingSettingKeys: ref<string[]>([]),
      unsetSettingKeys: ref<string[]>([])
    };
  }
}));

import CostParamsPage from "./index.vue";

type SettingsFormOptions = {
  transformLoad: (settings: CompanySettingItem[], form: CostParams) => void;
};

describe("costParams settings loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.capturedOptions = null;
  });

  it("throws when abnormalCostOrder payload is malformed", () => {
    shallowMount(CostParamsPage);

    const options = mocks.capturedOptions as SettingsFormOptions;
    const form: CostParams = {
      costMethod: "moving_average",
      costCalcType: "total_warehouse",
      abnormalCostOrder: [{ id: "1", name: "最近采购价", order: 1 }]
    };

    expect(() =>
      options.transformLoad(
        [
          {
            key: "abnormalCostOrder",
            value: JSON.stringify([
              {
                id: "1",
                name: "最近采购价",
                order: "wrong"
              }
            ])
          }
        ] as CompanySettingItem[],
        form
      )
    ).toThrow("异常成本处理顺序配置不合法");
  });
});
