export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function buildPagination(page?: number, limit?: number) {
  const currentPage = page || 1;
  const pageLimit = limit || 10;
  const skip = (currentPage - 1) * pageLimit;

  return {
    skip,
    take: pageLimit,
    page: currentPage,
    limit: pageLimit,
  };
}

export function buildSort(sortBy?: string, sortOrder: "asc" | "desc" = "desc") {
  if (!sortBy) return { createdAt: "desc" };

  return {
    [sortBy]: sortOrder,
  };
}

export function buildInclude(relations: string[]) {
  const include: any = {};
  
  for (const relation of relations) {
    const parts = relation.split(".");
    let current = include;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = true;
  }
  
  return include;
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(errorMessage, error);
    throw error;
  }
}

