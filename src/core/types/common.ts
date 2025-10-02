export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageRequest {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PageResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type CrudActions<T> = {
  create: (data: Omit<T, keyof BaseEntity>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
};

export interface UseEntityResult<T> {
  data: T[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  actions: CrudActions<T>;
}

export interface UseEntityDetailsResult<T> {
  entity: T | null;
  loading: boolean;
  error: string | null;
}