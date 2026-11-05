import client from './client';
import type { Category, TransactionType } from '@/types';

export type CategoryInput = {
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
};

export async function listCategories(): Promise<{ data: Category[] }> {
  const { data } = await client.get('/categories');
  return data;
}

export async function createCategory(input: CategoryInput): Promise<{ data: Category }> {
  const { data } = await client.post('/categories', input);
  return data;
}

export async function updateCategory(
  id: string,
  input: { name?: string; icon?: string; color?: string }
): Promise<{ data: Category }> {
  const { data } = await client.put(`/categories/${id}`, input);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await client.delete(`/categories/${id}`);
}
