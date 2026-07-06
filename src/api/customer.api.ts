import { api } from '@/lib/axios';
import type { ApiListResponse, ApiSingleResponse, Customer } from '@/types';

export interface CustomerQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const getCustomers = async (params: CustomerQueryParams) => {
  const { data } = await api.get<ApiListResponse<Customer>>('/customers', { params });
  return data;
};

export const createCustomer = async (payload: Partial<Customer>) => {
  const { data } = await api.post<ApiSingleResponse<Customer>>('/customers', payload);
  return data.data;
};
