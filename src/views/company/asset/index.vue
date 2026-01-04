<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import {
  getAssetListApi,
  addAssetApi,
  updateAssetApi,
  deleteAssetApi
} from "@/api";
import { getCompanyId } from "@/api/company";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { h } from "vue";
import { deviceDetection } from "@pureadmin/utils";
import editForm from "./form.vue";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({
  name: "Asset"
});

const dataList = ref([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  name: undefined
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const getAssetListInfo = async () => {
  loading.value = true;
  try {
    const { data, code, msg } = await getAssetListApi(
      pagination.value.currentPage,
      {
        name: form.value.name
      }
    );
    if (code === 200) {
      dataList.value = data.list;
      pagination.value.total = data.count;
    } else {
      message(msg, { type: "error" });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "获取失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

const onSearch = async () => {
  pagination.value.currentPage = 1;
  await getAssetListInfo();
};

const resetForm = (formEl: { resetFields: () => void } | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getAssetListInfo();
}

async function handleDelete(row: unknown) {
  try {
    await deleteAssetApi(row.uid);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "删除失败";
    message(msg, { type: "error" });
  }
}

function openDialog(title = "新增", row?: unknown) {
  addDialog({
    title: `${title}资产`,
    props: {
      formInline: {
        title,
        uid: row?.uid,
        name: row?.name ?? "",
        type: row?.type ?? 0,
        count: row?.count ?? 1,
        unit: row?.unit ?? "个",
        initValue: row?.initValue?.value ?? 0,
        currentValue: row?.currentValue?.value ?? 0,
        monthlyDepreciation: row?.monthlyDepreciation?.value ?? 0,
        status: row?.status ?? true,
        isAuto: row?.isAuto ?? false,
        desc: row?.desc ?? ""
      }
    },
    width: "50%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(editForm, { ref: formRef }),
    beforeSure: (done, { options }) => {
      const FormRef = formRef.value.getRef();
      const curData = options.props.formInline;
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          try {
            if (title === "新增") {
              const cid = await getCompanyId();
              const uid = useUserStoreHook().uid;
              if (!uid) {
                message("用户信息缺失，请重新登录", { type: "error" });
                return;
              }
              await addAssetApi({
                company: { connect: { uid: cid } },
                creator: { connect: { uid } },
                name: curData.name,
                type: curData.type,
                count: curData.count,
                unit: curData.unit,
                initValue: { value: curData.initValue },
                currentValue: { value: curData.currentValue },
                monthlyDepreciation: { value: curData.monthlyDepreciation },
                status: curData.status,
                isAuto: curData.isAuto,
                desc: curData.desc
              });
            } else {
              await updateAssetApi(curData.uid, {
                name: curData.name,
                type: curData.type,
                count: curData.count,
                unit: curData.unit,
                initValue: { value: curData.initValue },
                currentValue: { value: curData.currentValue },
                monthlyDepreciation: { value: curData.monthlyDepreciation },
                status: curData.status,
                isAuto: curData.isAuto,
                desc: curData.desc
              });
            }
            message(`${title}成功`, { type: "success" });
            done();
            onSearch();
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : `${title}失败`;
            message(msg, { type: "error" });
          }
        }
      });
    }
  });
}

onMounted(() => {
  getAssetListInfo();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-form
        ref="formRef"
        :inline="true"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-3 overflow-auto"
      >
        <el-form-item label="资产名称：" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入资产名称"
            clearable
            class="w-[180px]!"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:search-line')"
            :loading="loading"
            @click="onSearch"
          >
            搜索
          </el-button>
          <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="getAssetListInfo">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增')"
          >
            新增资产
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns
            border
            :data="dataList"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>
              <el-popconfirm
                :title="`是否确认删除${row.name}?`"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button class="reset-margin" link type="danger">
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
