import { ref, type Ref, type ComputedRef } from "vue";
import { message } from "@/utils/message";
import { chatApi } from "@/api";
import { ALL_LIST, localForage } from "@/utils";
import type {
  UploadMethod,
  ImageType,
  AIRecognitionResult,
  RecognizedProduct
} from "../types";

type DocumentTypeConfig = {
  label: string;
  partyType: "customer" | "supplier";
  partyLabel: string;
};

export function useAiEntryRecognition(
  chatUid: Ref<string | undefined> | ComputedRef<string | undefined>,
  batchId: Ref<string | undefined> | ComputedRef<string | undefined>,
  enableAutoCreate: Ref<boolean> | ComputedRef<boolean>,
  currentDocConfig: Ref<DocumentTypeConfig> | ComputedRef<DocumentTypeConfig>
) {
  const recognitionResult = ref<AIRecognitionResult | null>(null);

  function extractJsonText(input: string): string | null {
    const codeBlockMatch = input.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const text = (codeBlockMatch?.[1] || input).trim();

    const objectStart = text.indexOf("{");
    const objectEnd = text.lastIndexOf("}");
    if (objectStart >= 0 && objectEnd > objectStart) {
      return text.slice(objectStart, objectEnd + 1);
    }

    const arrayStart = text.indexOf("[");
    const arrayEnd = text.lastIndexOf("]");
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return text.slice(arrayStart, arrayEnd + 1);
    }

    return null;
  }

  function toNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  }

  function toString(value: unknown): string | undefined {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    return undefined;
  }

  function normalizeName(name: string) {
    return name.trim().replace(/\s+/g, "").toLowerCase();
  }

  async function parseAIResponse(response: string) {
    const jsonText = extractJsonText(response);
    if (!jsonText) {
      message("AI 返回内容未包含可解析的 JSON", { type: "error" });
      throw new Error("AI 返回内容未包含可解析的 JSON");
    }

    const parsed: unknown = (() => {
      try {
        return JSON.parse(jsonText);
      } catch {
        return null;
      }
    })();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      message("AI 返回 JSON 解析失败", { type: "error" });
      throw new Error("AI 返回 JSON 解析失败");
    }

    const obj = parsed as Record<string, unknown>;
    const partyRaw =
      obj.party && typeof obj.party === "object" && !Array.isArray(obj.party)
        ? (obj.party as Record<string, unknown>)
        : undefined;

    const partyName = toString(partyRaw?.name);
    const partyTypeFromAI = toString(partyRaw?.type);
    const expectedPartyType = currentDocConfig.value.partyType;
    const partyType =
      partyTypeFromAI === "customer" || partyTypeFromAI === "supplier"
        ? (partyTypeFromAI as "customer" | "supplier")
        : expectedPartyType;

    const productsRaw: unknown =
      (Array.isArray(obj.products) && obj.products) ||
      (Array.isArray(obj.items) && obj.items) ||
      [];

    const productList = Array.isArray(productsRaw) ? productsRaw : [];

    const [customerData, providerData, tireData] = await Promise.all([
      localForage().getItem(ALL_LIST.customer),
      localForage().getItem(ALL_LIST.provider),
      localForage().getItem(ALL_LIST.tire)
    ]);

    const customers = Array.isArray(customerData)
      ? customerData
          .filter(
            (c): c is { uid: string; name: string } =>
              !!c &&
              typeof c === "object" &&
              typeof (c as { uid?: unknown }).uid === "string" &&
              typeof (c as { name?: unknown }).name === "string"
          )
          .map(c => ({ uid: c.uid, name: c.name }))
      : [];

    const providers = Array.isArray(providerData)
      ? providerData
          .filter(
            (p): p is { uid: string; name: string } =>
              !!p &&
              typeof p === "object" &&
              typeof (p as { uid?: unknown }).uid === "string" &&
              typeof (p as { name?: unknown }).name === "string"
          )
          .map(p => ({ uid: p.uid, name: p.name }))
      : [];

    const tires = Array.isArray(tireData)
      ? tireData
          .filter(
            (t): t is { uid: string; name: string } =>
              !!t &&
              typeof t === "object" &&
              typeof (t as { uid?: unknown }).uid === "string" &&
              typeof (t as { name?: unknown }).name === "string"
          )
          .map(t => ({ uid: t.uid, name: t.name }))
      : [];

    const partyCandidates = partyType === "customer" ? customers : providers;
    const normalizedPartyName = partyName ? normalizeName(partyName) : "";
    const matchedParty =
      normalizedPartyName.length > 0
        ? partyCandidates.find(
            p => normalizeName(p.name) === normalizedPartyName
          ) ||
          partyCandidates.find(p =>
            normalizeName(p.name).includes(normalizedPartyName)
          )
        : undefined;

    const recognizedProducts = productList
      .map((p, index) => {
        if (!p || typeof p !== "object" || Array.isArray(p)) return null;
        const productObj = p as Record<string, unknown>;
        const name = toString(productObj.name) || "";
        const quantity = toNumber(productObj.quantity) ?? 1;
        const unit = toString(productObj.unit);
        const price = toNumber(productObj.price);
        const spec = toString(productObj.spec);

        if (!name) return null;

        const normalizedProductName = normalizeName(name);
        const matchedTire =
          tires.find(t => normalizeName(t.name) === normalizedProductName) ||
          tires.find(t =>
            normalizeName(t.name).includes(normalizedProductName)
          );

        return {
          id: toString(productObj.id) || String(index + 1),
          name,
          quantity,
          unit,
          price,
          spec,
          matchStatus: matchedTire
            ? ("matched" as const)
            : enableAutoCreate.value
              ? ("new" as const)
              : ("unmatched" as const),
          matchedProductUid: matchedTire?.uid,
          matchedProductName: matchedTire?.name,
          confidence: matchedTire ? 95 : 60
        };
      })
      .filter((p): p is RecognizedProduct => !!p);

    const remark = toString(obj.remark);
    const totalAmountFromAI = toNumber(obj.totalAmount);
    const computedTotal = recognizedProducts.reduce((sum, p) => {
      return sum + (p.quantity || 0) * (p.price || 0);
    }, 0);

    recognitionResult.value = {
      success: true,
      party: partyName
        ? {
            name: partyName,
            type: partyType,
            matchStatus: matchedParty
              ? "matched"
              : enableAutoCreate.value
                ? "new"
                : "unmatched",
            matchedUid: matchedParty?.uid,
            matchedName: matchedParty?.name
          }
        : undefined,
      products: recognizedProducts,
      totalAmount: totalAmountFromAI ?? computedTotal,
      remark,
      rawText: response,
      confidence: recognizedProducts.length > 0 ? 85 : 60
    };
  }

  async function startRecognition(
    uploadMethod: UploadMethod,
    textInput: string,
    uploadedImages: UploadedFile[],
    uploadedFile: UploadedFile | null,
    imageType: ImageType,
    initChatSession: () => Promise<void>
  ) {
    if (!chatUid.value) {
      await initChatSession();
    }

    let contentDescription = "";
    switch (uploadMethod) {
      case UploadMethod.TEXT:
        contentDescription = `请从以下文本中识别订单信息，提取商品名称、数量、单价、往来单位等信息，并以JSON格式返回：\n\n${textInput}`;
        break;
      case UploadMethod.IMAGE:
        contentDescription = `请识别上传的${uploadedImages.length}张图片中的订单信息（图片类型：${imageType === ImageType.PRINTED ? "打印单据" : "手写单/聊天截图"}），提取商品名称、数量、单价等信息。`;
        break;
      case UploadMethod.FILE:
        contentDescription = `请识别上传的文件"${uploadedFile?.name}"中的订单信息，提取商品名称、数量、单价、往来单位等信息。`;
        break;
    }

    const { data, code, msg } = await chatApi({
      uid: chatUid.value,
      batchId: batchId.value,
      messages: [
        {
          role: "system",
          content: `你是一个专业的订单识别助手。请从用户提供的内容中识别订单信息，包括：
1. 往来单位（客户或供应商）
2. 商品明细（商品名称、数量、单位、单价）
3. 总金额
4. 备注信息

请以JSON格式返回识别结果，格式如下：
{
  "party": { "name": "xxx", "type": "customer|supplier" },
  "products": [
    { "name": "商品名", "quantity": 10, "unit": "条", "price": 100, "spec": "规格" }
  ],
  "totalAmount": 1000,
  "remark": "备注"
}`
        },
        {
          role: "user",
          content: contentDescription
        }
      ]
    });

    if (code === 200 && data.messages) {
      const aiResponse = data.messages[data.messages.length - 1]?.content || "";
      await parseAIResponse(aiResponse);
    } else {
      throw new Error(msg || "识别失败");
    }
  }

  const reset = () => {
    recognitionResult.value = null;
  };

  return {
    recognitionResult,
    startRecognition,
    reset
  };
}
