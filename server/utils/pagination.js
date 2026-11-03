export function pagination(query, defaultLimit = 20) {
  const page = Number(query.page ?? 1), limit = Number(query.limit ?? defaultLimit);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    const error = new Error('Page must be a positive integer and limit must be between 1 and 100.');
    error.statusCode = 400;
    throw error;
  }
  return { page, limit, skip: (page - 1) * limit };
}
export function pageInfo(total, page, limit) { return { total, page, limit, pages: Math.ceil(total / limit) }; }
