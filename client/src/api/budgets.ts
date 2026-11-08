import client from './client';
import type { Budget, Pagination } from '@/types';

export async function listBudgets(
  month?: string,
  page?: number,
  limit?: number
): Promise<{ data: Budget[]; pagination: Pagination }> {
  const { data } = await client.get('/budgets', {
    params: month ? { month, page, limit } : { page, limit },
  });
  return data;
}

/** POST /budgets is an upsert on (category, month). */
export async function saveBudget(input: {
  category: string;
  month: string;
  limit: number;
}): Promise<{ data: Budget }> {
  const { data } = await client.post('/budgets', input);
  return data;
}

export async function updateBudget(id: string, limit: number): Promise<{ data: Budget }> {
  const { data } = await client.put(`/budgets/${id}`, { limit });
  return data;
}

export async function deleteBudget(id: string): Promise<void> {
  await client.delete(`/budgets/${id}`);
}
