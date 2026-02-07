/**
 * 分页相关常量
 */

/** 小分页大小（用于弹窗、嵌套表格等空间受限场景） */
export const PAGE_SIZE_SMALL = 10;

/** 中等分页大小（用于库存、单据等中等复杂度列表） */
export const PAGE_SIZE_MEDIUM = 15;

/** 默认分页大小（用于资金、报表等需要更多数据的列表） */
export const DEFAULT_PAGE_SIZE = 20;

/** 批量获取时使用的分页大小（用于下拉列表等需要较多数据的场景） */
export const BATCH_FETCH_PAGE_SIZE = 100;

/** 获取全部数据时使用的最大分页大小 */
export const MAX_FETCH_PAGE_SIZE = 1000;
