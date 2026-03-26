import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageType, UploadMethod } from "../types";

const mocks = vi.hoisted(() => {
  const getItem = vi.fn();
  return {
    chatApi: vi.fn(),
    message: vi.fn(),
    getItem
  };
});

vi.mock("@/api", () => ({
  chatApi: mocks.chatApi
}));

vi.mock("@/utils/message", () => ({
  message: mocks.message
}));

vi.mock("@/utils", () => ({
  ALL_LIST: {
    customer: "customer",
    provider: "provider",
    tire: "tire"
  },
  localForage: () => ({
    getItem: mocks.getItem
  })
}));

import { useAiEntryRecognition } from "./useAiEntryRecognition";

describe("useAiEntryRecognition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getItem.mockResolvedValue([]);
  });

  it("throws when AI returns a products field with the wrong shape", async () => {
    mocks.chatApi.mockResolvedValueOnce(
      JSON.stringify({
        party: { name: "客户A", type: "customer" },
        products: {
          name: "轮胎A",
          quantity: 2
        },
        totalAmount: 100
      })
    );

    const { startRecognition } = useAiEntryRecognition(
      ref("chat-1"),
      ref("batch-1"),
      ref(false),
      ref({
        label: "销售订单",
        partyType: "customer",
        partyLabel: "客户"
      })
    );

    await expect(
      startRecognition(
        UploadMethod.TEXT,
        "测试文本",
        [],
        null,
        ImageType.PRINTED,
        vi.fn()
      )
    ).rejects.toThrow("AI 返回 JSON 结构不合法");
  });
});
