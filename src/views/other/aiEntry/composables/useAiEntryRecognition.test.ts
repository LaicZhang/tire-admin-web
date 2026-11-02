import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageType, UploadMethod } from "../types";

const mocks = vi.hoisted(() => ({
  chatApi: vi.fn(),
  message: vi.fn(),
  getItem: vi.fn()
}));

vi.mock("@/api", () => ({ chatApi: mocks.chatApi }));
vi.mock("@/utils/message", () => ({ message: mocks.message }));
vi.mock("@/utils", () => ({
  ALL_LIST: { customer: "customer", provider: "provider", tire: "tire" },
  localForage: () => ({ getItem: mocks.getItem })
}));

import { useAiEntryRecognition } from "./useAiEntryRecognition";

function setup(
  autoCreate = false,
  partyType: "customer" | "supplier" = "customer"
) {
  return useAiEntryRecognition(
    ref("chat-1"),
    ref("batch-1"),
    ref(autoCreate),
    ref({ label: "订单", partyType, partyLabel: "往来单位" })
  );
}

function respond(value: unknown) {
  mocks.chatApi.mockResolvedValueOnce(
    typeof value === "string" ? value : JSON.stringify(value)
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getItem.mockResolvedValue([]);
});

describe("startRecognition request composition", () => {
  it("initializes a missing chat session and describes text", async () => {
    respond({ products: [] });
    const chatUid = ref<string | undefined>(undefined);
    const api = useAiEntryRecognition(
      chatUid,
      ref("batch-1"),
      ref(false),
      ref({ label: "订单", partyType: "customer", partyLabel: "往来单位" })
    );
    const init = vi.fn().mockImplementation(async () => {
      chatUid.value = "chat-1";
    });

    await api.startRecognition(
      UploadMethod.TEXT,
      "轮胎两条",
      [],
      null,
      ImageType.PRINTED,
      init
    );

    expect(init).toHaveBeenCalledOnce();
    expect(mocks.chatApi).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: "chat-1",
        batchId: "batch-1",
        messages: [
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("轮胎两条")
          })
        ]
      })
    );
  });

  it.each([
    [ImageType.PRINTED, "打印单据", 2],
    [ImageType.HANDWRITTEN, "手写单/聊天截图", 1]
  ])("describes images for %s", async (imageType, label, count) => {
    respond({ products: [] });
    await setup().startRecognition(
      UploadMethod.IMAGE,
      "",
      Array.from({ length: count }, (_, index) => ({
        uid: String(index),
        name: `${index}.png`,
        size: 1,
        type: "image/png",
        status: "ready" as const
      })),
      null,
      imageType,
      vi.fn()
    );

    const content = mocks.chatApi.mock.calls[0][0].messages[1].content;
    expect(content).toContain(`${count}张图片`);
    expect(content).toContain(label);
  });

  it("describes a selected file", async () => {
    respond({ products: [] });
    await setup().startRecognition(
      UploadMethod.FILE,
      "",
      [],
      { uid: "1", name: "order.xlsx", size: 1, type: "sheet", status: "ready" },
      ImageType.PRINTED,
      vi.fn()
    );

    expect(mocks.chatApi.mock.calls[0][0].messages[1].content).toContain(
      "order.xlsx"
    );
  });
});

describe("response validation", () => {
  it("rejects text without JSON", async () => {
    respond("没有结构化内容");
    await expect(
      setup().startRecognition(
        UploadMethod.TEXT,
        "x",
        [],
        null,
        ImageType.PRINTED,
        vi.fn()
      )
    ).rejects.toThrow("未包含可解析的 JSON");
    expect(mocks.message).toHaveBeenCalledWith(
      "AI 返回内容未包含可解析的 JSON",
      { type: "error" }
    );
  });

  it("rejects malformed and primitive JSON", async () => {
    respond("{broken}");
    await expect(
      setup().startRecognition(
        UploadMethod.TEXT,
        "x",
        [],
        null,
        ImageType.PRINTED,
        vi.fn()
      )
    ).rejects.toThrow("JSON 解析失败");

    respond("42");
    await expect(
      setup().startRecognition(
        UploadMethod.TEXT,
        "x",
        [],
        null,
        ImageType.PRINTED,
        vi.fn()
      )
    ).rejects.toThrow("未包含可解析的 JSON");
  });

  it.each([
    ["products", { products: "bad" }],
    ["items", { items: "bad" }]
  ])("rejects invalid %s shapes", async (_name, payload) => {
    respond(payload);
    await expect(
      setup().startRecognition(
        UploadMethod.TEXT,
        "x",
        [],
        null,
        ImageType.PRINTED,
        vi.fn()
      )
    ).rejects.toThrow("JSON 结构不合法");
  });

  it("accepts fenced and surrounding JSON and defaults products to empty", async () => {
    respond('prefix\n```json\n{"remark":"备注"}\n```\nsuffix');
    const api = setup();

    await api.startRecognition(
      UploadMethod.TEXT,
      "x",
      [],
      null,
      ImageType.PRINTED,
      vi.fn()
    );

    expect(api.recognitionResult.value).toMatchObject({
      success: true,
      products: [],
      totalAmount: 0,
      remark: "备注",
      confidence: 60
    });
  });

  it("handles an array payload as a malformed record", async () => {
    respond("[1,2]");
    await expect(
      setup().startRecognition(
        UploadMethod.TEXT,
        "x",
        [],
        null,
        ImageType.PRINTED,
        vi.fn()
      )
    ).rejects.toThrow("JSON 解析失败");
  });
});

describe("data normalization", () => {
  it("matches exact and partial parties and products", async () => {
    mocks.getItem.mockImplementation((key: string) => {
      if (key === "customer")
        return Promise.resolve([
          null,
          { uid: 1, name: "ignored" },
          { uid: "c1", name: "杭州轮胎客户" },
          { uid: "c2", name: "杭州轮胎客户有限公司" }
        ]);
      if (key === "provider")
        return Promise.resolve([{ uid: "p1", name: "供应商甲" }]);
      if (key === "tire")
        return Promise.resolve([
          { uid: 1, name: "ignored" },
          { uid: "t1", name: "米其林 轮胎" },
          { uid: "t2", name: "米其林轮胎 225/55" }
        ]);
      return Promise.resolve(null);
    });
    respond({
      party: { name: " 杭州轮胎客户 ", type: "customer" },
      products: [
        null,
        [],
        { name: "" },
        {
          id: 8,
          name: "米其林 轮胎",
          quantity: "2",
          price: "100",
          unit: true,
          spec: 225
        },
        { name: "米其林轮胎", quantity: "bad", price: 50 }
      ],
      totalAmount: "999",
      remark: 7
    });
    const api = setup();

    await api.startRecognition(
      UploadMethod.TEXT,
      "x",
      [],
      null,
      ImageType.PRINTED,
      vi.fn()
    );

    expect(api.recognitionResult.value).toMatchObject({
      party: {
        name: "杭州轮胎客户",
        type: "customer",
        matchStatus: "matched",
        matchedUid: "c1",
        matchedName: "杭州轮胎客户"
      },
      totalAmount: 999,
      remark: "7",
      confidence: 85
    });
    expect(api.recognitionResult.value?.products).toEqual([
      expect.objectContaining({
        id: "8",
        name: "米其林 轮胎",
        quantity: 2,
        price: 100,
        unit: "true",
        spec: "225",
        matchStatus: "matched",
        matchedProductUid: "t1",
        confidence: 95
      }),
      expect.objectContaining({
        id: "5",
        name: "米其林轮胎",
        quantity: 1,
        price: 50,
        matchStatus: "matched",
        matchedProductUid: "t1",
        confidence: 95
      })
    ]);
  });

  it("marks unmatched records and computes total when created is disabled", async () => {
    mocks.getItem.mockImplementation((key: string) => {
      if (key === "provider")
        return Promise.resolve([{ uid: "p1", name: "另一家" }]);
      return Promise.resolve("not-array");
    });
    respond({
      party: { name: "找不到", type: "supplier" },
      items: [{ name: "新胎", quantity: 3, price: 20 }]
    });
    const api = setup(false, "customer");

    await api.startRecognition(
      UploadMethod.TEXT,
      "x",
      [],
      null,
      ImageType.PRINTED,
      vi.fn()
    );

    expect(api.recognitionResult.value).toMatchObject({
      party: {
        type: "supplier",
        matchStatus: "unmatched"
      },
      totalAmount: 60
    });
    expect(api.recognitionResult.value?.products[0]).toMatchObject({
      matchStatus: "unmatched",
      confidence: 60
    });
  });

  it("marks new parties and products when auto-create is enabled", async () => {
    respond({
      party: { name: "新客户", type: "unknown" },
      products: [{ name: "新胎" }]
    });
    const api = setup(true);

    await api.startRecognition(
      UploadMethod.TEXT,
      "x",
      [],
      null,
      ImageType.PRINTED,
      vi.fn()
    );

    expect(api.recognitionResult.value?.party).toMatchObject({
      type: "customer",
      matchStatus: "new"
    });
    expect(api.recognitionResult.value?.products[0]).toMatchObject({
      matchStatus: "new"
    });
  });

  it("omits a party without a name and resets the result", async () => {
    respond({ party: [], products: [] });
    const api = setup();
    await api.startRecognition(
      UploadMethod.TEXT,
      "x",
      [],
      null,
      ImageType.PRINTED,
      vi.fn()
    );
    expect(api.recognitionResult.value?.party).toBeUndefined();

    api.reset();
    expect(api.recognitionResult.value).toBeNull();
  });
});
