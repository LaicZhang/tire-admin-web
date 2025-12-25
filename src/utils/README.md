# Utils 工具函数目录

本目录包含项目中的通用工具函数，按功能分类组织。

## 目录结构

```
utils/
├── __tests__/          # 单元测试
│   ├── auth.test.ts
│   └── tree.test.ts
├── http/               # HTTP 请求封装
│   ├── index.ts        # PureHttp 类
│   └── types.d.ts      # 类型定义
├── localforage/        # 本地存储封装
│   └── index.ts
├── progress/           # 进度条工具
│   └── index.ts
├── auth.ts            # 认证相关（Token、用户信息）
├── tree.ts            # 树形结构操作
├── file.ts            # 文件操作
├── message.ts         # 消息提示封装
├── print.ts           # 打印功能
├── security.ts        # 安全相关
├── time.ts            # 时间处理
└── index.ts           # 统一导出
```

## 使用方式

```typescript
// 推荐：从 index.ts 导入
import { message, formatToken } from "@/utils";

// 特定模块导入
import { http } from "@/utils/http";
import { buildHierarchyTree } from "@/utils/tree";
```

## 各模块说明

| 模块          | 说明                              | 关键函数                                                |
| ------------- | --------------------------------- | ------------------------------------------------------- |
| `auth.ts`     | Token 管理、用户信息存储          | `getToken`, `setToken`, `removeToken`, `formatToken`    |
| `tree.ts`     | 树形数据操作                      | `buildHierarchyTree`, `handleTree`, `getNodeByUniqueId` |
| `file.ts`     | 文件上传、下载、Base64转换        | `downloadByUrl`, `downloadByData`, `fileToBase64`       |
| `message.ts`  | 消息提示封装                      | `message`                                               |
| `http/`       | Axios 封装，支持 Token 刷新和重试 | `http.get`, `http.post`, `http.patch`, `http.delete`    |
| `security.ts` | XSS 防护                          | `escapeHtml`                                            |
| `print.ts`    | 打印功能封装                      | `usePrint`                                              |

## 注意事项

1. 新增工具函数时，如果功能独立请创建单独文件
2. 相关功能可以放在同一目录下（如 `http/`）
3. 记得在 `index.ts` 中导出公共函数
4. 为公共函数添加 JSDoc 注释
