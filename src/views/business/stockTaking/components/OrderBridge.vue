<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { openDialog } from "@/views/business/order/table";
import { CUR_FORM_TITLE, CUR_ORDER_TYPE, ORDER_TYPE } from "@/utils/const";
import { localForage } from "@/utils/localforage";
import { message } from "@/utils/message";
import {
  createStockTakingOrderFormData,
  getStockTakingStorageKey,
  readStockTakingDraft,
  type StockTakingOrderType
} from "../orderBridge";

const props = defineProps<{
  orderType: StockTakingOrderType;
}>();

const router = useRouter();

async function restoreLocalState(
  previousOrderType: ORDER_TYPE | null,
  previousFormTitle: string | null
) {
  const storage = localForage();
  if (previousOrderType) {
    await storage.setItem(CUR_ORDER_TYPE, previousOrderType);
  } else {
    await storage.removeItem(CUR_ORDER_TYPE);
  }

  if (previousFormTitle) {
    await storage.setItem(CUR_FORM_TITLE, previousFormTitle);
  } else {
    await storage.removeItem(CUR_FORM_TITLE);
  }
}

async function goBack() {
  await router.replace("/business/stockTaking");
}

onMounted(async () => {
  const storageKey = getStockTakingStorageKey(props.orderType);
  const items = readStockTakingDraft(props.orderType);

  if (!items) {
    sessionStorage.removeItem(storageKey);
    message("盘点结果已失效，请返回盘点页面重新生成", { type: "error" });
    await goBack();
    return;
  }

  sessionStorage.removeItem(storageKey);

  const storage = localForage();
  const previousOrderType = await storage.getItem<ORDER_TYPE>(CUR_ORDER_TYPE);
  const previousFormTitle = await storage.getItem<string>(CUR_FORM_TITLE);

  await storage.setItem(CUR_ORDER_TYPE, props.orderType);
  await storage.setItem(CUR_FORM_TITLE, "新增");

  try {
    openDialog("新增", props.orderType, createStockTakingOrderFormData(items), {
      closeCallBack: async () => {
        await restoreLocalState(previousOrderType, previousFormTitle);
        await goBack();
      }
    });
  } catch (error: unknown) {
    await restoreLocalState(previousOrderType, previousFormTitle);
    const msg = error instanceof Error ? error.message : "打开单据失败";
    message(msg, { type: "error" });
    await goBack();
  }
});
</script>

<template>
  <div
    class="main flex min-h-[240px] items-center justify-center text-gray-500"
  >
    正在打开盘点单据...
  </div>
</template>
