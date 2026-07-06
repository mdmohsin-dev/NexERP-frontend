import { api } from '@/lib/axios';
import type { ApiListResponse, ApiSingleResponse, Product } from '@/types';

export interface ProductQueryParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export const getProducts = async (params: ProductQueryParams) => {
  const { data } = await api.get<ApiListResponse<Product>>('/products', { params });
  return data;
};

export const getProductById = async (id: string) => {
  const { data } = await api.get<ApiSingleResponse<Product>>(`/products/${id}`);
  return data.data;
};

export const createProduct = async (formData: FormData) => {
  const { data } = await api.post<ApiSingleResponse<Product>>('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const updateProduct = async (id: string, formData: FormData) => {
  const { data } = await api.put<ApiSingleResponse<Product>>(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const deleteProduct = async (id: string) => {
  await api.delete(`/products/${id}`);
};
