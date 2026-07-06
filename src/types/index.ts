export type Role = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  createdAt: string;
}

export interface SaleItem {
  product: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Sale {
  _id: string;
  customer: Customer;
  items: SaleItem[];
  grandTotal: number;
  soldBy: { name: string; role: Role };
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiSingleResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalSales: number;
  totalRevenue: number;
  lowStockThreshold: number;
  lowStockProducts: Product[];
}
