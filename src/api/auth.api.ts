import { api } from '@/lib/axios';
import type { ApiSingleResponse, User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

export const loginRequest = async (payload: LoginPayload): Promise<LoginResult> => {
  const { data } = await api.post<ApiSingleResponse<LoginResult>>('/auth/login', payload);
  return data.data;
};

export const getMeRequest = async (): Promise<User> => {
  const { data } = await api.get<ApiSingleResponse<User>>('/auth/me');
  return data.data;
};
