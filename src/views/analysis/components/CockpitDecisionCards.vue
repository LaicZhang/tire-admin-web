<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  getProfitStatementApi,
  getReceivableAgingApi,
  type AgingData
} from "@/api/analysis";
import { handleApiError } from "@/utils";
import {
  formatYuanAmount,
  mapProfitStatementCards,
  toChartNumber
} from "../transformers";

defineOptions({
  name: "CockpitDecisionCards"
});

const props = defineProps<{
  startDate?: string;
  endDate?: string;
}>();

const router = useRouter();
const loading = ref(false);
const profit = ref(mapProfitStatementCards(null));
const aging = ref<AgingData | null>(null);

const dateParams = computed(() => ({
  startDate: props.startDate,
  endDate: props.endDate
}));

const overdueBuckets = computed(() => {
  const buckets = aging.value?.buckets ?? [];
  return buckets.map(item => ({
    label: item.label,
    amount: toChartNumber(item.amount),
    count: item.count ?? 0
  }));
});

const maxBucketAmount = computed(() =>
  Math.max(1, ...overdueBuckets.value.map(item => item.amount))
);

const totalReceivable = computed(() =>
  formatYuanAmount(aging.value?.totalAmount ?? "0")
);

async function loadProfit() {
  const { code, data } = await getProfitStatementApi(dateParams.value);
  if (code === 200) {
    profit.value = mapProfitStatementCards(data);
  }
}

async function loadAging() {
  const { code, data } = await getReceivableAgingApi(dateParams.value);
  if (code === 200 && data) {
    aging.value = data;
  }
}

async function loadCards() {
  loading.value = true;
  try {
    await Promise.all([loadProfit(), loadAging()]);
  } catch (error) {
    handleApiError(error, "加载驾驶舱决策卡失败");
  } finally {
    loading.value = false;
  }
}

function go(path: string) {
  void router.push({
    path,
    query: {
      startDate: props.startDate,
      endDate: props.endDate
    }
  });
}

watch(
  () => [props.startDate, props.endDate],
  () => {
    void loadCards();
  }
);

onMounted(() => {
  void loadCards();
});
</script>

<template>
  <div v-loading="loading" class="decision-cards">
    <el-card
      class="decision-card"
      shadow="hover"
      @click="go('/analysis/profit')"
    >
      <div class="decision-card__title">利润健康（A2）</div>
      <div class="decision-card__grid">
        <div>
          <div class="decision-card__label">毛利</div>
          <div class="decision-card__value text-emerald-600">
            ¥{{ formatYuanAmount(profit.grossProfit) }}
          </div>
          <div class="decision-card__meta">
            毛利率 {{ profit.grossProfitRate.toFixed(1) }}%
          </div>
        </div>
        <div>
          <div class="decision-card__label">净利</div>
          <div class="decision-card__value text-blue-600">
            ¥{{ formatYuanAmount(profit.netProfit) }}
          </div>
          <div class="decision-card__meta">
            订单 {{ profit.salesOrderCount }} · 点此下钻利润页
          </div>
        </div>
      </div>
    </el-card>

    <el-card
      class="decision-card"
      shadow="hover"
      @click="go('/analysis/aging')"
    >
      <div class="decision-card__title">应收逾期风险（A3）</div>
      <div class="decision-card__meta mb-3">
        总应收 ¥{{ totalReceivable }} · 点此下钻账龄
      </div>
      <div v-if="overdueBuckets.length" class="risk-bars">
        <div
          v-for="bucket in overdueBuckets"
          :key="bucket.label"
          class="risk-bar-row"
        >
          <span class="risk-bar-label">{{ bucket.label }}</span>
          <div class="risk-bar-track">
            <div
              class="risk-bar-fill"
              :style="{
                width: `${Math.round((bucket.amount / maxBucketAmount) * 100)}%`
              }"
            />
          </div>
          <span class="risk-bar-value"
            >¥{{ formatYuanAmount(bucket.amount) }}</span
          >
        </div>
      </div>
      <el-empty v-else description="暂无应收账龄数据" :image-size="64" />
    </el-card>
  </div>
</template>

<style scoped>
.decision-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.decision-card {
  cursor: pointer;
  border-radius: 16px;
}

.decision-card__title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.decision-card__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.decision-card__label {
  font-size: 12px;
  color: #64748b;
}

.decision-card__value {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.decision-card__meta {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.risk-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.risk-bar-row {
  display: grid;
  grid-template-columns: 88px 1fr 96px;
  gap: 8px;
  align-items: center;
}

.risk-bar-label {
  font-size: 12px;
  color: #475569;
}

.risk-bar-track {
  height: 10px;
  overflow: hidden;
  background: #e2e8f0;
  border-radius: 999px;
}

.risk-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #ef4444);
  border-radius: 999px;
}

.risk-bar-value {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  text-align: right;
}

@media (width <= 960px) {
  .decision-cards {
    grid-template-columns: 1fr;
  }
}
</style>
