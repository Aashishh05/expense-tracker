import client from './client';
import type { Recurring, RecurringFrequency, TransactionType } from '@/types';

export interface RecurringInput {
  type: TransactionType;
  amount: number;
  category: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string | null;
  note: string;
}

export async function listRecurring(active?: boolean): Promise<{ data: Recurring[] }> {
  const { data } = await client.get('/recurring', {
    params: active === undefined ? undefined : { active: String(active) },
  });
  return data;
}

export async function createRecurring(input: RecurringInput): Promise<{ message?: string; data: Recurring }> {
  const { data } = await client.post('/recurring', input);
  return data;
}

export async function updateRecurring(
  id: string,
  input: Partial<RecurringInput> & { active?: boolean }
): Promise<{ message?: string; data: Recurring }> {
  const { data } = await client.put(`/recurring/${id}`, input);
  return data;
}

export async function deleteRecurring(id: string): Promise<void> {
  await client.delete(`/recurring/${id}`);
}
