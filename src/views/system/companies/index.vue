<script setup lang="ts">
import { ref, onMounted, reactive, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useColumns } from "./columns";
import { FormItemProps } from "./utils/types";
import CompanyForm from "./form.vue";
import { addDialog } from "@/composables/useDialogService";
import { message, handleApiError } from "@/utils";
import {
  getCompanyListApi,
  addCompanyApi,
  updateCompanyApi,
  deleteCompanyApi,
  restoreCompanyApi,
  getCompanyClosePrecheckApi,
  transferCompanyBossApi
} from "@/api/company";
import { ElMessageBox } from "element-plus";
import { useUserStoreHook } from "@/store/modules/user";
import { v7 as uuid } from "uuid";

// Icons
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { resolveDialogFullscreen } from "@/utils/viewport";

defineOptions({
  name: "CompanyManagement"
});

const searchFormRef = ref();
const formRef = ref();
const { loading, columns, dataList, pagination, onSizeChange } = useColumns();

const form = reactive({
  scope: "nonDeleted" as "nonDeleted" | "deleted" | "all",
  name: undefined as string | undefined
});

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getCompanyListApi(pagination.currentPage, {
      ...form,
      name: form.name || undefined
    });
    dataList.value = (data as { list: FormItemProps[]; count: number }).list;
    pagination.total = (data as { list: FormItemProps[]; count: number }).count;
  } catch (e) {
    handleApiError(e, "查询失败");
  } finally {
    loading.value = false;
  }
}

const resetForm = (formEl: { resetFields: () => void } | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

const openDialog = (title = "新增", row?: FormItemProps) => {
  const userStore = useUserStoreHook();
  const companyUid = row?.uid ?? uuid();
  addDialog({
    title: `${title}公司`,
    props: {
      formInline: {
        uid: companyUid,
        name: row?.name ?? "",
        province: row?.province ?? "",
        city: row?.city ?? "",
        principalName: row?.principalName ?? "",
        principalPhone: row?.principalPhone ?? "",
        desc: row?.desc ?? ""
      }
    },
    width: "45%",
    draggable: true,
    fullscreen: resolveDialogFullscreen(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(CompanyForm, {
        ref: formRef,
        formInline: (options.props as { formInline: FormItemProps }).formInline
      }),
    beforeSure: (done, { options }) => {
      const curData = (options.props as { formInline: FormItemProps })
        .formInline;
      const FormRef = formRef.value.formRef;
      FormRef.validate((valid: boolean) => {
        if (valid) {
          const companyUid = curData.uid || row?.uid;
          if (!companyUid) {
            message("缺少公司ID", { type: "error" });
            return;
          }
          const promise =
            title === "新增"
              ? addCompanyApi({
                  company: {
                    uid: companyUid,
                    name: curData.name,
                    province: curData.province || null,
                    city: curData.city || null,
                    desc: curData.desc || null,
                    principalName: curData.principalName || null,
                    principalPhone: curData.principalPhone || null,
                    boss: { connect: { uid: userStore.uid } }
                  },
                  info: { company: { connect: { uid: companyUid } } }
                })
              : updateCompanyApi(row?.uid ?? "", {
                  name: curData.name,
                  province: curData.province || null,
                  city: curData.city || null,
                  desc: curData.desc || null,
                  principalName: curData.principalName || null,
                  principalPhone: curData.principalPhone || null
                });

          promise.then(() => {
            message("操作成功", { type: "success" });
            done();
            onSearch();
          });
        }
      });
    }
  });
};

const handleDelete = async (row: FormItemProps) => {
  if (!row.uid) return;
  try {
    const { data: precheck } = await getCompanyClosePrecheckApi(row.uid);
    let force = false;
    let reason: string | undefined;

    if (precheck && !precheck.canCloseWithoutForce) {
      const blockers = (precheck.blockers ?? []).join("；") || "存在阻断项";
      const { value } = await ElMessageBox.prompt(
        `关停前置检查未通过：${blockers}。如需强制关停，请填写原因：`,
        "强制关停公司",
        {
          confirmButtonText: "强制关停",
          cancelButtonText: "取消",
          inputPattern: /\S+/,
          inputErrorMessage: "强制关停必须填写原因",
          type: "warning"
        }
      );
      force = true;
      reason = String(value ?? "").trim();
      if (!reason) {
        message("已取消关停", { type: "info" });
        return;
      }
    }

    await deleteCompanyApi(
      row.uid,
      force ? { force, reason, massLayoff: true } : { massLayoff: false }
    );
    message(
      force
        ? "强制关停成功（可恢复壳；默认已批量离职在职员工）"
        : "删除成功（可恢复壳；干净关闭不自动裁员）",
      { type: "success" }
    );
    onSearch();
  } catch (e) {
    // user cancel on prompt
    if (
      e === "cancel" ||
      e === "close" ||
      (typeof e === "object" &&
        e !== null &&
        "message" in e &&
        String((e as { message?: unknown }).message ?? "").includes("cancel"))
    ) {
      return;
    }
    // Element Plus cancel is often 'cancel' string
    if (e === "cancel") return;
    handleApiError(e, "关停公司失败");
  }
};

const handleRestore = async (row: FormItemProps) => {
  if (!row.uid) return;
  try {
    await restoreCompanyApi(row.uid);
    message("恢复成功（仅公司壳与 Info/Card；不自动复职/恢复排班与账户）", {
      type: "success"
    });
    onSearch();
  } catch (e) {
    handleApiError(e, "恢复公司失败");
  }
};

const handleTransferBoss = async (row: FormItemProps) => {
  if (!row.uid) return;
  try {
    const { value } = await ElMessageBox.prompt(
      `将公司「${row.name}」老板移交给指定在职员工（填写员工 UID）：`,
      "移交老板",
      {
        confirmButtonText: "确认移交",
        cancelButtonText: "取消",
        inputPattern: /\S+/,
        inputErrorMessage: "请填写新老板员工 UID",
        inputPlaceholder: "新老板 user/employee uid"
      }
    );
    const newBossUserId = String(value ?? "").trim();
    if (!newBossUserId) return;
    await transferCompanyBossApi(row.uid, newBossUserId);
    message("老板移交成功", { type: "success" });
    onSearch();
  } catch (e) {
    if (e === "cancel" || e === "close") return;
    handleApiError(e, "老板移交失败");
  }
};

function handleSizeChange(val: number) {
  onSizeChange(val);
  pagination.currentPage = 1;
  onSearch();
}

function handleCurrentChange(val: number) {
  pagination.currentPage = val;
  onSearch();
}

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="page-container">
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="resetForm(searchFormRef)"
    >
      <el-form-item label="范围" prop="scope">
        <el-select v-model="form.scope" class="w-[120px]!">
          <el-option label="未删除" value="nonDeleted" />
          <el-option label="已删除" value="deleted" />
          <el-option label="全部" value="all" />
        </el-select>
      </el-form-item>
      <el-form-item label="公司名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入公司名称"
          clearable
          class="w-[200px]!"
        />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="公司管理" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增公司
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          row-key="uid"
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <template #operation="{ row }">
            <template v-if="row.deleteAt">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                @click="handleRestore(row)"
              >
                恢复
              </el-button>
            </template>
            <template v-else>
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="warning"
                :size="size"
                @click="handleTransferBoss(row)"
              >
                移交老板
              </el-button>
              <DeleteButton
                :size="size"
                :show-icon="false"
                @confirm="handleDelete(row)"
              />
            </template>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}

.search-form {
  @extend .search-form;
}
</style>
