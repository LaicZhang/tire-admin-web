# 系统模块开发指南

## 模块概览

| 模块          | 状态    | 说明               |
| ------------- | ------- | ------------------ |
| user          | ✅ 完整 | 用户管理 CRUD      |
| role          | ✅ 完整 | 角色管理，权限分配 |
| permission    | ✅ 完整 | 权限列表           |
| menu          | ✅ 完整 | 菜单配置           |
| companies     | ✅ 完整 | 公司管理           |
| feedback      | ✅ 完整 | 反馈管理           |
| updateHistory | ✅ 完整 | 更新历史           |
| dict          | 🚧 基础 | 字典管理 - 待完善  |
| document      | 🚧 基础 | 文档管理 - 待完善  |
| file          | 🚧 基础 | 文件管理 - 待完善  |
| log           | 🚧 基础 | 日志查看 - 待完善  |
| notice        | 🚧 基础 | 通知管理 - 待完善  |
| print         | 🚧 基础 | 打印模板 - 待完善  |
| task          | 🚧 基础 | 任务调度 - 待完善  |
| workflow      | 🚧 基础 | 工作流程 - 待完善  |

## 模块开发模板

### 目录结构

```
模块名/
├── index.vue         # 主页面
├── form.vue          # 表单组件
├── columns.ts        # 表格列配置
├── utils/
│   └── types.ts      # 类型定义
└── composables/      # 可复用逻辑（可选）
```

### 基础模块模板

```vue
<script setup lang="ts">
import { onMounted, ref, h } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { useColumns } from "./columns";
import Form from "./form.vue";
import { listApi, createApi, updateApi, deleteApi } from "@/api/模块名";

const {
  loading,
  columns,
  dataList,
  pagination,
  onSizeChange,
  onCurrentChange
} = useColumns();

const handleSearch = async () => {
  loading.value = true;
  try {
    const { data } = await listApi(pagination.currentPage);
    dataList.value = data.list;
    pagination.total = data.count;
  } finally {
    loading.value = false;
  }
};

const openDialog = (title = "新增", row?: FormData) => {
  addDialog({
    title: `${title}记录`,
    contentRenderer: ({ options }) =>
      h(Form, { formInline: options.props.formInline }),
    beforeSure: async (done, { options }) => {
      const data = options.props.formInline;
      await (title === "新增" ? createApi(data) : updateApi(row.uid, data));
      done();
      handleSearch();
    }
  });
};

onMounted(handleSearch);
</script>
```

## 待完善模块清单

1. **dict** - 添加字典项 CRUD
2. **document** - 文档上传下载
3. **file** - 文件管理器界面
4. **log** - 日志筛选和导出
5. **notice** - 通知发布和推送
6. **print** - 模板设计器
7. **task** - 定时任务配置
8. **workflow** - 审批流程配置
