import { flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";
import { AIEntryStatus, DocumentType, ImageType, UploadMethod } from "../types";

const mocks = vi.hoisted(() => ({
  message: vi.fn(),
  canRecognize: vi.fn(),
  startRecognition: vi.fn(),
  resetRecognition: vi.fn(),
  resetUpload: vi.fn(),
  removeImage: vi.fn(),
  removeFile: vi.fn(),
  handleTextInput: vi.fn(),
  handleImageChange: vi.fn(),
  handleFileChange: vi.fn(),
  submitOrder: vi.fn(),
  resetOrderForm: vi.fn(),
  resetSession: vi.fn(),
  initChatSession: vi.fn(),
  updateDetailRow: vi.fn(),
  removeDetailRow: vi.fn(),
  addDetailRow: vi.fn(),
  formatFileSize: vi.fn((size: number) => `${size}B`),
  refs: {} as Record<string, any>
}));

vi.mock("@/utils/message", () => ({ message: mocks.message }));

vi.mock("../composables/useAiEntrySession", async () => {
  const { ref } = await import("vue");
  mocks.refs.session = {
    chatUid: ref("chat-1"),
    batchId: ref("batch-1"),
    initChatSession: mocks.initChatSession,
    reset: mocks.resetSession
  };
  return { useAiEntrySession: () => mocks.refs.session };
});

vi.mock("../composables/useAiEntryUpload", async () => {
  const { ref } = await import("vue");
  mocks.refs.upload = {
    textInput: ref("轮胎 2 条"),
    textMaxLength: 5000,
    uploadedImages: ref([]),
    maxImages: 5,
    uploadedFile: ref(null),
    imageType: ref(ImageType.PRINTED),
    handleTextInput: mocks.handleTextInput,
    handleImageChange: mocks.handleImageChange,
    removeImage: mocks.removeImage,
    handleFileChange: mocks.handleFileChange,
    removeFile: mocks.removeFile,
    canRecognize: mocks.canRecognize,
    reset: mocks.resetUpload
  };
  return { useAiEntryUpload: () => mocks.refs.upload };
});

vi.mock("../composables/useAiEntryRecognition", async () => {
  const { ref } = await import("vue");
  mocks.refs.recognition = {
    recognitionResult: ref(null),
    startRecognition: mocks.startRecognition,
    reset: mocks.resetRecognition
  };
  return { useAiEntryRecognition: () => mocks.refs.recognition };
});

vi.mock("../composables/useAiEntryOrderSubmit", async () => {
  const { ref, computed } = await import("vue");
  const orderForm = ref({
    documentType: DocumentType.SALE_ORDER,
    partyName: "",
    orderDate: "2026-01-01",
    details: [],
    totalAmount: 0,
    remark: ""
  });
  mocks.refs.order = {
    orderForm,
    historyRecords: ref([]),
    totalAmount: computed(() =>
      orderForm.value.details.reduce(
        (sum: number, row: any) => sum + (row.amount || 0),
        0
      )
    ),
    hasUnmatchedProducts: computed(() => false),
    updateDetailRow: mocks.updateDetailRow,
    removeDetailRow: mocks.removeDetailRow,
    addDetailRow: mocks.addDetailRow,
    submitOrder: mocks.submitOrder,
    resetForm: mocks.resetOrderForm,
    formatFileSize: mocks.formatFileSize
  };
  return { useAiEntryOrderSubmit: () => mocks.refs.order };
});

import AIEntryPage from "../index.vue";

const Table = defineComponent({
  props: { data: { type: Array, default: () => [] } },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        (props.data as any[]).flatMap((row, index) =>
          Object.entries(slots)
            .filter(([name]) => name !== "default")
            .flatMap(([, slot]) => slot?.({ row, index }) ?? [])
        )
      );
  }
});

async function mountPage() {
  return mountSmokeComponent(
    async () => ({ default: AIEntryPage }),
    "other/aiEntry/index.vue",
    {
      keepMounted: true,
      allowRenderErrors: true,
      globalStubs: {
        "pure-table": Table,
        MoneyDisplay: true,
        "money-display": true
      }
    }
  );
}

const state = (wrapper: Awaited<ReturnType<typeof mountPage>>) =>
  wrapper.vm.$.setupState as Record<string, any>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.canRecognize.mockReturnValue(true);
  mocks.startRecognition.mockResolvedValue(undefined);
  mocks.submitOrder.mockResolvedValue(true);
  mocks.refs.session.chatUid.value = "chat-1";
  mocks.refs.session.batchId.value = "batch-1";
  mocks.refs.recognition.recognitionResult.value = null;
  mocks.refs.upload.textInput.value = "轮胎 2 条";
  mocks.refs.upload.uploadedImages.value = [];
  mocks.refs.upload.uploadedFile.value = null;
  mocks.refs.upload.imageType.value = ImageType.PRINTED;
  mocks.refs.order.orderForm.value = {
    documentType: DocumentType.SALE_ORDER,
    partyName: "",
    orderDate: "2026-01-01",
    details: [],
    totalAmount: 0,
    remark: ""
  };
  mocks.refs.order.historyRecords.value = [];
});

describe("AI entry page recognition and submission", () => {
  it("requires content before starting recognition", async () => {
    mocks.canRecognize.mockReturnValue(false);
    const wrapper = await mountPage();
    const vm = state(wrapper);
    await vm.handleStartRecognition();

    expect(mocks.message).toHaveBeenCalledWith("请先上传内容", {
      type: "warning"
    });
    expect(mocks.startRecognition).not.toHaveBeenCalled();
    expect(vm.status).toBe(AIEntryStatus.IDLE);
    wrapper.unmount();
  });

  it("maps recognized data into the editable order and selected document type", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.documentType = DocumentType.PURCHASE_ORDER;
    mocks.refs.session.chatUid.value = "";
    mocks.refs.upload.uploadedImages.value = [{ uid: "img-1" }];
    mocks.refs.upload.uploadedFile.value = { uid: "file-1", name: "order.pdf" };
    mocks.refs.upload.imageType.value = ImageType.HANDWRITTEN;
    mocks.refs.recognition.recognitionResult.value = {
      party: {
        name: "供应商甲",
        matchedUid: "provider-1",
        matchStatus: "matched"
      },
      products: [
        {
          id: "",
          name: "轮胎",
          quantity: 2,
          price: 50,
          matchStatus: "new",
          spec: "205/55"
        }
      ],
      totalAmount: 100,
      remark: "识别备注"
    };
    await vm.handleStartRecognition();

    expect(mocks.startRecognition).toHaveBeenCalledWith(
      UploadMethod.TEXT,
      "轮胎 2 条",
      [{ uid: "img-1" }],
      { uid: "file-1", name: "order.pdf" },
      ImageType.HANDWRITTEN,
      mocks.initChatSession
    );
    expect(vm.orderForm).toMatchObject({
      documentType: DocumentType.PURCHASE_ORDER,
      partyUid: "provider-1",
      partyName: "供应商甲",
      details: [
        {
          id: "1",
          productName: "轮胎",
          quantity: 2,
          price: 50,
          amount: 100,
          isNew: true,
          productSpec: "205/55"
        }
      ],
      totalAmount: 100,
      remark: "识别备注"
    });
    expect(vm.status).toBe(AIEntryStatus.EDITING);
    expect(wrapper.text()).toContain("供应商：");
    expect(wrapper.text()).toContain("已匹配");
    wrapper.unmount();
  });

  it("enters editing with an empty result and handles recognition failure", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    mocks.refs.upload.textInput.value = "";

    await vm.handleStartRecognition();
    expect(vm.status).toBe(AIEntryStatus.EDITING);

    mocks.startRecognition.mockRejectedValueOnce(new Error("network"));
    await vm.handleStartRecognition();
    expect(mocks.message).toHaveBeenCalledWith("AI识别失败，请重试", {
      type: "error"
    });
    expect(vm.status).toBe(AIEntryStatus.IDLE);
    wrapper.unmount();
  });

  it("shows submitting, success and resets after the redirect delay", async () => {
    vi.useFakeTimers();
    const wrapper = await mountPage();
    const vm = state(wrapper);

    let resolveSubmit!: (success: boolean) => void;
    mocks.submitOrder.mockReturnValueOnce(
      new Promise(resolve => {
        resolveSubmit = resolve;
      })
    );
    const submit = vm.handleSubmitOrder();
    expect(vm.status).toBe(AIEntryStatus.SUBMITTING);
    await nextTick();
    expect(wrapper.text()).toContain("提交中...");
    resolveSubmit(true);
    await submit;
    expect(mocks.submitOrder).toHaveBeenCalledWith(
      UploadMethod.TEXT,
      DocumentType.SALE_ORDER
    );
    expect(vm.status).toBe(AIEntryStatus.SUCCESS);
    expect(wrapper.text()).toContain("单据创建成功");

    await vi.advanceTimersByTimeAsync(3000);
    expect(vm.status).toBe(AIEntryStatus.IDLE);
    expect(mocks.resetUpload).toHaveBeenCalledOnce();
    expect(mocks.resetRecognition).toHaveBeenCalledOnce();
    expect(mocks.resetOrderForm).toHaveBeenCalledWith(DocumentType.SALE_ORDER);
    expect(mocks.resetSession).toHaveBeenCalledOnce();
    vi.useRealTimers();
    wrapper.unmount();
  });

  it("shows an error state when submission fails", async () => {
    mocks.submitOrder.mockResolvedValue(false);
    const wrapper = await mountPage();
    const vm = state(wrapper);
    await vm.handleSubmitOrder();

    expect(vm.status).toBe(AIEntryStatus.ERROR);
    expect(wrapper.text()).toContain("操作失败");
    expect(wrapper.text()).toContain("重新开始");
    wrapper.unmount();
  });

  it("clears a pending redirect timer on reset and unmount", async () => {
    vi.useFakeTimers();
    const wrapper = await mountPage();
    const vm = state(wrapper);
    await vm.handleSubmitOrder();
    vm.handleResetForm();
    expect(vm.status).toBe(AIEntryStatus.IDLE);
    await vi.advanceTimersByTimeAsync(4000);
    expect(mocks.resetUpload).toHaveBeenCalledOnce();

    mocks.resetUpload.mockClear();
    await vm.handleSubmitOrder();
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(4000);
    expect(mocks.resetUpload).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("keeps the order document type synchronized", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.documentType = DocumentType.SALE_RETURN;
    await nextTick();
    expect(vm.orderForm.documentType).toBe(DocumentType.SALE_RETURN);
    wrapper.unmount();
  });
});

describe("AI entry upload and history rendering", () => {
  it("renders image and file upload states while idle and busy", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.uploadMethod = UploadMethod.IMAGE;
    mocks.refs.upload.uploadedImages.value = [
      { uid: "img-1", name: "a.png", url: "blob:a" }
    ];
    await nextTick();
    expect(wrapper.html()).toContain('src="blob:a"');
    expect(wrapper.text()).toContain("手写单/聊天截图");
    expect(wrapper.html()).toContain("absolute top-1");

    vm.status = AIEntryStatus.RECOGNIZING;
    await nextTick();
    expect(wrapper.html()).not.toContain("absolute top-1");
    expect(wrapper.text()).toContain("AI 正在识别内容...");
    expect(wrapper.text()).toContain("AI 识别中...");
    vm.removeImage(0);
    expect(mocks.removeImage).toHaveBeenCalledWith(0);

    vm.status = AIEntryStatus.IDLE;
    vm.uploadMethod = UploadMethod.FILE;
    mocks.refs.upload.uploadedFile.value = {
      uid: "f-1",
      name: "order.pdf",
      size: 2048
    };
    await nextTick();
    expect(wrapper.text()).toContain("order.pdf");
    expect(wrapper.text()).toContain("2048B");
    vm.removeFile();
    expect(mocks.removeFile).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it("renders empty and populated history with all upload methods", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.showHistory = true;
    await nextTick();
    expect(wrapper.html()).toContain('description="暂无历史记录"');
    expect(wrapper.text()).not.toContain("使用提示");

    mocks.refs.order.historyRecords.value = [
      {
        id: "1",
        timestamp: "2026-01-01T00:00:00.000Z",
        method: UploadMethod.TEXT,
        summary: "文本订单",
        success: true
      },
      {
        id: "2",
        timestamp: "2026-01-02T00:00:00.000Z",
        method: UploadMethod.IMAGE,
        summary: "图片订单",
        success: false
      },
      {
        id: "3",
        timestamp: "2026-01-03T00:00:00.000Z",
        method: UploadMethod.FILE,
        summary: "文件订单",
        success: true
      }
    ];
    await nextTick();
    expect(wrapper.text()).toContain("文本订单");
    expect(wrapper.text()).toContain("图片订单");
    expect(wrapper.text()).toContain("文件订单");
    expect(wrapper.text()).toContain("失败");

    vm.showHistory = false;
    await nextTick();
    expect(vm.showHistory).toBe(false);
    expect(wrapper.text()).toContain("支持文本粘贴");
    expect(wrapper.html()).toContain('class="mt-6"');
    wrapper.unmount();
  });

  it("exposes the recognition availability and forwards upload handlers", async () => {
    mocks.canRecognize.mockReturnValue(false);
    const wrapper = await mountPage();
    const vm = state(wrapper);
    expect(vm.canRecognizeValue).toBe(false);
    expect(vm.handleTextInput).toBe(mocks.handleTextInput);
    expect(vm.handleImageChange).toBe(mocks.handleImageChange);
    expect(vm.handleFileChange).toBe(mocks.handleFileChange);
    expect(vm.addDetailRow).toBe(mocks.addDetailRow);
    expect(vm.removeDetailRow).toBe(mocks.removeDetailRow);
    expect(vm.updateDetailRow).toBe(mocks.updateDetailRow);
    wrapper.unmount();
  });
});
