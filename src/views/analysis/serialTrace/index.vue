<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getSerialProductSummaryApi,
  getSerialRelatedApi,
  getSerialTraceApi,
  type SerialProductSummaryData,
  type SerialRelatedData,
  type SerialTraceData
} from "@/api/analysis";
import { handleApiError } from "@/utils";

defineOptions({
  name: "SerialTraceAnalysis"
});

const STATUS_LABELS: Record<string, string> = {
  IN_STOCK: "在库",
  RESERVED: "已占用",
  IN_TRANSIT: "在途",
  OUTBOUND: "已出库",
  INSTALLED: "已安装",
  SOLD: "已售",
  RETURNED_PENDING_QC: "退回待检",
  GOOD_RETURN: "良品退回",
  DEFECTIVE: "不良",
  SCRAPPED: "已报废"
};

const ACTION_LABELS: Record<string, string> = {
  IN: "入库",
  OUT: "出库",
  TRANSFER: "调拨",
  ADJUST: "调整"
};

const RELATION_LABELS: Record<string, string> = {
  batch: "同批次序列号",
  sourceOrder: "同来源单序列号",
  none: "未识别关联锚点"
};

const route = useRoute();
const router = useRouter();

const serialInput = ref("");
const activeSerialNo = ref("");
const loading = ref(false);
const hasSearched = ref(false);
const traceData = ref<SerialTraceData | null>(null);
const relatedData = ref<SerialRelatedData | null>(null);
const productData = ref<SerialProductSummaryData | null>(null);
const relatedError = ref("");
const productError = ref("");

const summary = computed(() => traceData.value?.summary ?? null);
const logs = computed(() => traceData.value?.logs ?? []);
const claims = computed(() => traceData.value?.claims ?? []);
const relationTypeLabel = computed(() => {
  const relationType = relatedData.value?.relationType ?? "none";
  return RELATION_LABELS[relationType] ?? RELATION_LABELS.none;
});
const productInventoryCards = computed(() => {
  const inventory = productData.value?.inventory;
  if (!inventory) return [];
  return [
    { label: "总序列号", value: inventory.totalSerialCount ?? 0 },
    { label: "在库", value: inventory.inStockCount ?? 0 },
    { label: "预占", value: inventory.reservedCount ?? 0 },
    { label: "在途", value: inventory.inTransitCount ?? 0 },
    { label: "售后态", value: inventory.afterSalesCount ?? 0 },
    { label: "终态", value: inventory.terminalCount ?? 0 }
  ];
});

watch(
  () => route.query.serialNo,
  value => {
    const nextSerialNo = readRouteSerialNo(value);
    serialInput.value = nextSerialNo;
    if (!nextSerialNo) return;
    if (nextSerialNo === activeSerialNo.value && summary.value) return;
    void searchBySerialNo(nextSerialNo);
  },
  { immediate: true }
);

function readRouteSerialNo(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim();
  }
  return "";
}

function normalizeSerialNo(value: string) {
  return value.trim();
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatStatus(value?: string | null) {
  if (!value) return "-";
  return STATUS_LABELS[value] ?? value;
}

async function submitSearch() {
  const serialNo = normalizeSerialNo(serialInput.value);
  if (!serialNo) return;
  await router.replace({
    path: "/analysis/serial-trace",
    query: { serialNo }
  });
  await searchBySerialNo(serialNo);
}

async function searchBySerialNo(serialNo: string) {
  const normalizedSerialNo = normalizeSerialNo(serialNo);
  if (!normalizedSerialNo) return;

  loading.value = true;
  hasSearched.value = true;
  activeSerialNo.value = normalizedSerialNo;
  relatedData.value = null;
  productData.value = null;
  relatedError.value = "";
  productError.value = "";

  try {
    const response = await getSerialTraceApi(normalizedSerialNo);
    if (response.code !== 200) {
      throw new Error(response.msg || "加载主链路失败");
    }

    traceData.value = response.data ?? null;
    if (!response.data?.summary) return;
    await Promise.all([
      loadRelatedSerials(normalizedSerialNo),
      loadProductSummary(normalizedSerialNo)
    ]);
  } catch (error) {
    traceData.value = null;
    handleApiError(error, "加载轮胎全链路溯源失败");
  } finally {
    loading.value = false;
  }
}

async function loadRelatedSerials(serialNo: string) {
  try {
    const response = await getSerialRelatedApi(serialNo);
    if (response.code !== 200) {
      throw new Error(response.msg || "加载关联序列号失败");
    }
    relatedData.value = response.data ?? null;
  } catch {
    relatedError.value = "关联序列号加载失败";
  }
}

async function loadProductSummary(serialNo: string) {
  try {
    const response = await getSerialProductSummaryApi(serialNo);
    if (response.code !== 200) {
      throw new Error(response.msg || "加载同商品分析失败");
    }
    productData.value = response.data ?? null;
  } catch {
    productError.value = "同商品分析加载失败";
  }
}
</script>

<template>
  <div class="serial-trace-page">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">统计管理 / 轮胎全链路溯源</p>
        <h1>从单条序列号反查整条业务链</h1>
        <p class="hero-desc">
          面向老板、分析与管理角色，聚合入库、调拨、销售、安装到售后/报废的关键证据。
        </p>
      </div>
      <div class="search-card">
        <label class="search-label" for="serial-trace-search">序列号</label>
        <el-input
          id="serial-trace-search"
          v-model="serialInput"
          placeholder="请输入轮胎序列号，例如 SN-001"
          clearable
          @keyup.enter="submitSearch"
        />
        <el-button type="primary" :loading="loading" @click="submitSearch">
          开始溯源
        </el-button>
      </div>
    </section>

    <section v-if="summary" class="summary-strip">
      <article class="summary-card accent">
        <span class="summary-label">当前序列号</span>
        <strong>{{ summary.serialNo || activeSerialNo }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">当前状态</span>
        <strong>{{ formatStatus(summary.status) }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">当前仓库</span>
        <strong>{{ summary.repoId || "-" }}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">关联方式</span>
        <strong>{{ relationTypeLabel }}</strong>
      </article>
    </section>

    <section v-if="summary" class="panel-grid">
      <article class="trace-panel span-2">
        <div class="panel-head">
          <h2>主链路时间线</h2>
          <span class="panel-subtitle">按发生顺序展开</span>
        </div>
        <div v-if="logs.length" class="timeline">
          <div
            v-for="(item, index) in logs"
            :key="`${item.createdAt || 'na'}-${index}`"
            class="timeline-item"
          >
            <div class="timeline-dot" />
            <div class="timeline-body">
              <div class="timeline-title">
                {{ ACTION_LABELS[item.action || ""] || item.action || "-" }}
                <span class="timeline-order">
                  {{ item.orderType || "-" }} / {{ item.orderId || "-" }}
                </span>
              </div>
              <div class="timeline-meta">
                {{ formatDateTime(item.createdAt) }}
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无流转记录" />
      </article>

      <article class="trace-panel">
        <div class="panel-head">
          <h2>业务锚点</h2>
          <span class="panel-subtitle">来源、去向、安装与质保</span>
        </div>
        <dl class="fact-list">
          <div>
            <dt>来源单据</dt>
            <dd>{{ summary.sourceType || "-" }} / {{ summary.sourceOrderId || "-" }}</dd>
          </div>
          <div>
            <dt>去向单据</dt>
            <dd>{{ summary.targetType || "-" }} / {{ summary.targetOrderId || "-" }}</dd>
          </div>
          <div>
            <dt>安装信息</dt>
            <dd>
              {{ summary.installation?.vehiclePlateNo || "-" }}
              / {{ summary.installation?.installPosition || "-" }}
            </dd>
          </div>
          <div>
            <dt>质保周期</dt>
            <dd>
              {{ formatDateTime(summary.warranty?.startAt) }}
              至
              {{ formatDateTime(summary.warranty?.endAt) }}
            </dd>
          </div>
        </dl>
      </article>

      <article class="trace-panel">
        <div class="panel-head">
          <h2>售后/报废记录</h2>
          <span class="panel-subtitle">最近 10 条索赔明细</span>
        </div>
        <div v-if="claims.length" class="claim-list">
          <div
            v-for="(item, index) in claims"
            :key="`${item.orderId || 'claim'}-${index}`"
            class="claim-item"
          >
            <strong>{{ item.orderId || "-" }}</strong>
            <span>{{ item.identificationResult || item.oldTireDisposition || "-" }}</span>
            <span>{{ formatDateTime(item.createAt) }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无售后或报废记录" />
      </article>

      <article class="trace-panel span-2">
        <div class="panel-head">
          <h2>关联序列号</h2>
          <span class="panel-subtitle">{{ relationTypeLabel }}</span>
        </div>
        <el-alert
          v-if="relatedError"
          :title="relatedError"
          type="error"
          :closable="false"
        />
        <div v-else-if="relatedData?.items?.length" class="linked-grid">
          <div
            v-for="item in relatedData.items"
            :key="item.serialNo"
            class="linked-card"
          >
            <strong>{{ item.serialNo || "-" }}</strong>
            <span>{{ item.tireName || "-" }}</span>
            <span>{{ item.repoName || "-" }}</span>
            <span>{{ formatStatus(item.status) }}</span>
          </div>
        </div>
        <el-empty v-else description="未命中关联序列号" />
      </article>

      <article class="trace-panel span-2">
        <div class="panel-head">
          <h2>同商品分析</h2>
          <span class="panel-subtitle">
            {{ productData?.product?.tireName || summary.serialNo || "-" }}
          </span>
        </div>
        <el-alert
          v-if="productError"
          :title="productError"
          type="error"
          :closable="false"
        />
        <template v-else-if="productData">
          <div class="inventory-grid">
            <article
              v-for="card in productInventoryCards"
              :key="card.label"
              class="inventory-card"
            >
              <span>{{ card.label }}</span>
              <strong>{{ card.value }}</strong>
            </article>
          </div>
          <div class="detail-grid">
            <div class="detail-panel">
              <h3>状态分布</h3>
              <div
                v-for="item in productData.statusDistribution"
                :key="item.status"
                class="detail-row"
              >
                <span>{{ formatStatus(item.status) }}</span>
                <strong>{{ item.count ?? 0 }}</strong>
              </div>
            </div>
            <div class="detail-panel">
              <h3>最近流转</h3>
              <div
                v-for="(item, index) in productData.recentMovements"
                :key="`${item.serialNo || 'move'}-${index}`"
                class="detail-row stacked"
              >
                <strong>{{ item.serialNo || "-" }}</strong>
                <span>
                  {{ ACTION_LABELS[item.action || ""] || item.action || "-" }}
                  / {{ item.orderType || "-" }}
                </span>
                <span>{{ formatDateTime(item.createdAt) }}</span>
              </div>
            </div>
          </div>
        </template>
        <el-empty v-else description="暂无同商品分析数据" />
      </article>
    </section>

    <section
      v-else-if="hasSearched && !loading"
      class="trace-panel empty-panel"
      data-test="trace-empty"
    >
      <h2>未找到该序列号的主链路信息</h2>
      <p>请检查序列号是否录入正确，或确认该公司已开启序列号管理。</p>
    </section>
  </div>
</template>

<style scoped>
.serial-trace-page {
  --trace-bg: linear-gradient(135deg, #f4f0e8 0%, #fcfbf7 45%, #eef3f8 100%);
  --trace-panel: rgba(255, 255, 255, 0.84);
  --trace-border: rgba(17, 24, 39, 0.08);
  --trace-strong: #0f172a;
  --trace-muted: #526072;
  --trace-accent: #bb4d00;
  --trace-accent-soft: rgba(187, 77, 0, 0.12);
  min-height: 100%;
  padding: 24px;
  background: var(--trace-bg);
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  gap: 20px;
  margin-bottom: 20px;
}

.hero-copy,
.search-card,
.trace-panel,
.summary-card {
  border: 1px solid var(--trace-border);
  background: var(--trace-panel);
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.hero-copy {
  padding: 28px;
  border-radius: 28px;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--trace-accent);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 0;
  color: var(--trace-strong);
  font-size: 34px;
  line-height: 1.12;
}

.hero-desc {
  margin: 12px 0 0;
  max-width: 640px;
  color: var(--trace-muted);
  font-size: 15px;
  line-height: 1.7;
}

.search-card {
  display: grid;
  gap: 12px;
  align-content: start;
  padding: 24px;
  border-radius: 24px;
}

.search-label,
.summary-label,
.panel-subtitle,
.fact-list dt,
.inventory-card span,
.detail-row span,
.claim-item span {
  color: var(--trace-muted);
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.summary-card {
  display: grid;
  gap: 8px;
  padding: 18px 20px;
  border-radius: 22px;
}

.summary-card strong,
.inventory-card strong,
.linked-card strong,
.detail-row strong,
.claim-item strong {
  color: var(--trace-strong);
}

.summary-card.accent {
  background:
    linear-gradient(135deg, rgba(187, 77, 0, 0.12), rgba(255, 255, 255, 0.84));
  border-color: rgba(187, 77, 0, 0.18);
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.trace-panel {
  padding: 22px;
  border-radius: 26px;
}

.trace-panel.span-2 {
  grid-column: span 2;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
  margin-bottom: 16px;
}

.panel-head h2,
.detail-panel h3,
.empty-panel h2 {
  margin: 0;
  color: var(--trace-strong);
}

.timeline {
  display: grid;
  gap: 14px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 12px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  margin-top: 6px;
  border-radius: 999px;
  background: var(--trace-accent);
  box-shadow: 0 0 0 6px var(--trace-accent-soft);
}

.timeline-title,
.timeline-meta,
.linked-card,
.inventory-card,
.detail-row,
.claim-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.timeline-title {
  color: var(--trace-strong);
  font-weight: 600;
}

.timeline-order {
  color: var(--trace-muted);
  font-weight: 400;
}

.fact-list {
  display: grid;
  gap: 14px;
  margin: 0;
}

.fact-list div {
  display: grid;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--trace-border);
}

.fact-list dd {
  margin: 0;
  color: var(--trace-strong);
}

.claim-list,
.linked-grid,
.inventory-grid,
.detail-grid {
  display: grid;
  gap: 12px;
}

.claim-item,
.linked-card,
.inventory-card,
.detail-panel {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--trace-border);
}

.linked-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.linked-card,
.claim-item,
.detail-row.stacked {
  flex-direction: column;
}

.inventory-grid {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  margin-bottom: 14px;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-panel {
  gap: 10px;
}

.detail-row {
  padding: 10px 0;
  border-bottom: 1px dashed var(--trace-border);
}

.detail-row:last-child {
  border-bottom: 0;
}

.empty-panel p {
  margin: 10px 0 0;
  color: var(--trace-muted);
}

@media (max-width: 1024px) {
  .hero,
  .summary-strip,
  .panel-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .trace-panel.span-2 {
    grid-column: span 1;
  }
}

@media (max-width: 640px) {
  .serial-trace-page {
    padding: 16px;
  }

  .hero-copy,
  .search-card,
  .trace-panel,
  .summary-card {
    border-radius: 20px;
  }

  .hero h1 {
    font-size: 28px;
  }
}
</style>
