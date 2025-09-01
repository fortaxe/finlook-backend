import type { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DatabaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  field: string;
  order: SortOrder;
}
