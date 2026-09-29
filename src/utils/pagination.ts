export interface PaginationState {
  currentPage: number;
  pageSize: number;
}

export function resetPagination<T extends PaginationState>(pagination: T): T {
  pagination.currentPage = 1;
  return pagination;
}

export function changePaginationPage<T extends PaginationState>(
  pagination: T,
  page: number
): T {
  pagination.currentPage = page;
  return pagination;
}

export function changePaginationPageSize<T extends PaginationState>(
  pagination: T,
  pageSize: number
): T {
  pagination.pageSize = pageSize;
  pagination.currentPage = 1;
  return pagination;
}
