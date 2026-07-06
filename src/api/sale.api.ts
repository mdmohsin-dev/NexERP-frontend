import { api } from '@/lib/axios';
import type { ApiListResponse, ApiSingleResponse, Sale } from '@/types';

export interface CreateSalePayload {
  customer: string;
  items: { product: string; quantity: number }[];
}

export interface SaleQueryParams {
  page?: number;
  limit?: number;
}

export const createSale = async (payload: CreateSalePayload) => {
  const { data } = await api.post<ApiSingleResponse<Sale>>('/sales', payload);
  return data.data;
};

export const getSales = async (params: SaleQueryParams) => {
  const { data } = await api.get<ApiListResponse<Sale>>('/sales', { params });
  return data;
};
