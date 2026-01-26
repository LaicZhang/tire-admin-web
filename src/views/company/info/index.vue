<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { getCompanyInfoApi } from "@/api";
import { message } from "@/utils/message";
import { formatDateTime } from "@/utils";
import { openDialog } from "./table";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import StatusTag from "@/components/StatusTag/index.vue";
import OfficeBuilding from "~icons/ep/office-building";
import User from "~icons/ep/user";
import Phone from "~icons/ep/phone";
import Location from "~icons/ep/location";
import Calendar from "~icons/ep/calendar";
import EditPen from "~icons/ep/edit-pen";
import type { CompanyInfo } from "@/api/type";

defineOptions({
  name: "companyInfo"
});

const loading = ref(false);
const companyInfo = ref<Partial<CompanyInfo>>({});

const companyStatusMap = {
  1: { label: "正常运营", type: "success" },
  0: { label: "异常", type: "danger" }
} as const;

const companyStatus = computed(() =>
  companyInfo.value?.status === true ? 1 : 0
);

const getCompanyInfo = async () => {
  loading.value = true;
  try {
    const { data, code, msg } = await getCompanyInfoApi("only-info");
    if (code === 200) {
      companyInfo.value = data as CompanyInfo;
    } else {
      message(msg, { type: "error" });
    }
  } finally {
    loading.value = false;
  }
};

const handleEdit = () => {
  openDialog("更新", companyInfo.value, getCompanyInfo);
};

onMounted(async () => {
  await getCompanyInfo();
});
</script>

<template>
  <div v-loading="loading" class="company-info-container">
    <!-- 公司概览卡片 -->
    <el-card shadow="hover" class="overview-card">
      <div class="overview-content">
        <div class="overview-icon">
          <component :is="useRenderIcon(OfficeBuilding)" />
        </div>
        <div class="overview-info">
          <div class="company-name">
            {{ companyInfo.name || "—" }}
            <StatusTag
              :status="companyStatus"
              :status-map="companyStatusMap"
              class="ml-2"
            />
          </div>
          <div class="company-desc">
            {{ companyInfo.desc || "暂无备注信息" }}
          </div>
          <div class="company-id">ID: {{ companyInfo.id || "—" }}</div>
        </div>
        <div class="overview-action">
          <el-button
            type="primary"
            :icon="useRenderIcon(EditPen)"
            @click="handleEdit"
          >
            更新信息
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 详细信息区域 -->
    <el-row :gutter="16" class="detail-row">
      <!-- 负责人信息 -->
      <el-col :xs="24" :sm="12" :md="8" class="detail-col">
        <el-card shadow="hover" class="detail-card detail-card--contact">
          <div class="detail-header">
            <div class="detail-icon detail-icon--primary">
              <component :is="useRenderIcon(User)" />
            </div>
            <span class="detail-title">负责人信息</span>
          </div>
          <div class="detail-body">
            <div class="detail-item">
              <span class="detail-label">姓名</span>
              <span class="detail-value">{{
                companyInfo.principalName || "—"
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">电话</span>
              <span class="detail-value">{{
                companyInfo.principalPhone || "—"
              }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 地址信息 -->
      <el-col :xs="24" :sm="12" :md="8" class="detail-col">
        <el-card shadow="hover" class="detail-card detail-card--location">
          <div class="detail-header">
            <div class="detail-icon detail-icon--success">
              <component :is="useRenderIcon(Location)" />
            </div>
            <span class="detail-title">地址信息</span>
          </div>
          <div class="detail-body">
            <div class="detail-item">
              <span class="detail-label">省份</span>
              <span class="detail-value">{{
                companyInfo.province || "—"
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">城市</span>
              <span class="detail-value">{{ companyInfo.city || "—" }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 时间信息 -->
      <el-col :xs="24" :sm="12" :md="8" class="detail-col">
        <el-card shadow="hover" class="detail-card detail-card--time">
          <div class="detail-header">
            <div class="detail-icon detail-icon--warning">
              <component :is="useRenderIcon(Calendar)" />
            </div>
            <span class="detail-title">时间信息</span>
          </div>
          <div class="detail-body">
            <div class="detail-item">
              <span class="detail-label">创建时间</span>
              <span class="detail-value">{{
                formatDateTime(companyInfo.createAt) || "—"
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">更新时间</span>
              <span class="detail-value">{{
                formatDateTime(companyInfo.updateAt) || "—"
              }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.company-info-container {
  max-width: 1200px;
  padding: 16px;
  margin: 0 auto;
}

.overview-card {
  margin-bottom: 16px;
  overflow: hidden;
  border-radius: 16px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow:
      0 12px 24px -10px rgb(0 0 0 / 12%),
      0 0 0 1px rgb(0 0 0 / 4%);
    transform: translateY(-2px);
  }

  :deep(.el-card__body) {
    padding: 24px;
  }
}

.overview-content {
  display: flex;
  gap: 20px;
  align-items: center;
}

.overview-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  font-size: 32px;
  color: #3b82f6;
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  border-radius: 16px;
}

.overview-info {
  flex: 1;
  min-width: 0;
}

.company-name {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
}

.company-desc {
  margin-bottom: 6px;
  font-size: 14px;
  color: #6b7280;
}

.company-id {
  font-size: 12px;
  color: #9ca3af;
}

.overview-action {
  flex-shrink: 0;
}

.detail-row {
  margin-bottom: 0;
}

.detail-col {
  margin-bottom: 16px;
}

.detail-card {
  height: 100%;
  overflow: hidden;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow:
      0 8px 16px -8px rgb(0 0 0 / 12%),
      0 0 0 1px rgb(0 0 0 / 4%);
    transform: translateY(-2px);
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.detail-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.detail-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  border-radius: 10px;

  &--primary {
    color: #3b82f6;
    background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  }

  &--success {
    color: #22c55e;
    background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);
  }

  &--warning {
    color: #f97316;
    background: linear-gradient(135deg, #fef0e5 0%, #fff7ed 100%);
  }
}

.detail-title {
  font-size: 15px;
  font-weight: 500;
  color: #374151;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.detail-label {
  font-size: 13px;
  color: #6b7280;
}

.detail-value {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

@media (width <= 768px) {
  .overview-content {
    flex-direction: column;
    text-align: center;
  }

  .company-name {
    justify-content: center;
  }

  .overview-action {
    width: 100%;

    .el-button {
      width: 100%;
    }
  }
}
</style>
