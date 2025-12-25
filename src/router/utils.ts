/**
 * 路由工具函数
 *
 * 重构说明：
 * 原 487 行文件已按功能职责拆分为以下子模块：
 * - utils/filter.ts: 菜单过滤相关（ascending, filterTree, filterNoPermissionTree 等）
 * - utils/finder.ts: 路由查找相关（getParentPaths, findRouteByPath, getTopMenu）
 * - utils/dynamic.ts: 动态路由处理（handleAsyncRoutes, addAsyncRoutes 等）
 * - utils/cache.ts: 路由缓存相关（initRouter, handleAliveRoute）
 * - utils/permission.ts: 权限相关（hasAuth, getAuths）
 *
 * 本文件作为主入口，保持原有导出接口不变
 */

// 从子模块重新导出所有函数
export {
  // filter.ts
  ascending,
  filterTree,
  isOneOfArray,
  filterNoPermissionTree,
  // finder.ts
  getParentPaths,
  findRouteByPath,
  getTopMenu,
  // dynamic.ts
  addPathMatch,
  addAsyncRoutes,
  getHistoryMode,
  formatTwoStageRoutes,
  formatFlatteningRoutes,
  // cache.ts
  initRouter,
  handleAliveRoute,
  // permission.ts
  hasAuth,
  getAuths
} from "./utils/index";
