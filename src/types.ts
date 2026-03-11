export interface User {
  id: number;
  username: string;
  role: 'admin' | 'employee';
}

export interface Product {
  id: number;
  name: string;
  category: string;
  sub_category: string;
  retail_price: number;
  wholesale_price: number;
  stock: number;
  unit_type: 'units' | 'packs';
  items_per_pack: number;
}

export interface PredictionData {
  name: string;
  actual?: number;
  predicted: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  privacyMode: boolean;
  currency: 'NGN' | 'USD';
}

export interface Sale {
  id: number;
  product_id?: number;
  product_name?: string;
  amount: number;
  quantity: number;
  description: string;
  timestamp: string;
  username?: string;
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  category: string;
  timestamp: string;
  username?: string;
}

export interface SalesSummary {
  daily: number;
  weekly: number;
  monthly: number;
  annual: number;
}
