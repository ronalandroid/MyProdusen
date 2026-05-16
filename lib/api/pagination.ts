export interface PaginationParams {
  page: number;
  pageSize: number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const rawPage = Number(searchParams.get('page') || DEFAULT_PAGE);
  const rawPageSize = Number(searchParams.get('pageSize') || searchParams.get('limit') || DEFAULT_PAGE_SIZE);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : DEFAULT_PAGE;
  const pageSize = Number.isFinite(rawPageSize) && rawPageSize > 0
    ? Math.min(Math.floor(rawPageSize), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}

export function paginated<T>(items: T[], total: number, params: PaginationParams): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.pageSize);

  return {
    items,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPreviousPage: params.page > 1,
    },
  };
}
