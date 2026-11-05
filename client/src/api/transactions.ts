import client from './client';
import type { Pagination, Transaction, TransactionType } from '@/types';

export interface TransactionFilters {
  type?: TransactionType | '';
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export type TransactionInput = {
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string;
};

function clean(filters: TransactionFilters): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '' && value !== null && value !== undefined) params[key] = value;
  }
  return params;
}

export async function listTransactions(filters: TransactionFilters): Promise<{
  data: Transaction[];
  pagination: Pagination;
}> {
  const { data } = await client.get('/transactions', { params: clean(filters) });
  return data;
}

export async function createTransaction(input: TransactionInput): Promise<{ data: Transaction }> {
  const { data } = await client.post('/transactions', input);
  return data;
}

export async function updateTransaction(
  id: string,
  input: Partial<TransactionInput>
): Promise<{ data: Transaction }> {
  const { data } = await client.put(`/transactions/${id}`, input);
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await client.delete(`/transactions/${id}`);
}
