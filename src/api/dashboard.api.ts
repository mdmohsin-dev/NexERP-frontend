import { api } from '@/lib/axios';
import type { ApiSingleResponse, DashboardStats } from '@/types';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get<ApiSingleResponse<DashboardStats>>('/dashboard/stats');
  return data.data;
};
