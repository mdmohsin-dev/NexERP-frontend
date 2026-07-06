import { api } from '@/lib/axios';
import type { ApiSingleResponse, DashboardStats, DailySalesPoint } from '@/types';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get<ApiSingleResponse<DashboardStats>>('/dashboard/stats');
  return data.data;
};

export const getDailySalesChart = async (days = 30): Promise<DailySalesPoint[]> => {
  const { data } = await api.get<ApiSingleResponse<DailySalesPoint[]>>('/dashboard/sales-chart', {
    params: { days },
  });
  return data.data;
};