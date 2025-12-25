/**
 * 全局自定义指令集合
 *
 * @example
 * ```ts
 * // main.ts
 * import { auth, copy, longpress, optimize, ripple } from '@/directives';
 *
 * app.directive('auth', auth);      // 权限控制 v-auth="['btn.add']" / v-auth:remove="['btn.delete']"
 * app.directive('copy', copy);      // 文本复制 v-copy="text" (双击复制)
 * app.directive('longpress', longpress); // 长按事件 v-longpress="handler"
 * app.directive('optimize', optimize);   // 性能优化
 * app.directive('ripple', ripple);  // 水波纹效果 v-ripple
 * ```
 */

export * from "./auth";
export * from "./copy";
export * from "./longpress";
export * from "./optimize";
export * from "./ripple";
