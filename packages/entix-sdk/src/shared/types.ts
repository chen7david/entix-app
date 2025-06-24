/**
 * Common utility types for the Entix SDK
 */

/**
 * Generic API response wrapper
 */
export type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
};

/**
 * Generic pagination parameters
 */
export type PaginationParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

/**
 * Generic paginated response
 */
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Generic ID parameter
 */
export type IdParam = {
  id: string;
};

/**
 * Generic filter parameters
 */
export type FilterParams = {
  search?: string;
  filters?: Record<string, unknown>;
};

/**
 * Common date fields
 */
export type TimestampFields = {
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Soft delete fields
 */
export type SoftDeleteFields = {
  deletedAt: Date | null;
};

/**
 * Base entity with common fields
 */
export type BaseEntity = {
  id: string;
} & TimestampFields;

/**
 * Optional fields helper - makes all properties optional except id
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Create request type - excludes auto-generated fields
 */
export type CreateRequest<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Update request type - makes all fields optional except id
 */
export type UpdateRequest<T extends BaseEntity> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> & { id: string };
