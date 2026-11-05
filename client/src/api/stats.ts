import client from './client';
import type { CategoryStat, MonthlyStat, StatsSummary } from '@/types';

export async function getSummary(params: { startDate?: string; endDate?: string } = {}): Promise<{
  data: StatsSummary;
}> {
  const { data } = await client.get('/stats/summary', { params });
  return data;
}

export async function getByCategory(
  params: { type?: string; month?: string } = {}
): Promise<{ data: CategoryStat[] }> {
  const { data } = await client.get('/stats/by-category', { params });
  return data;
}

export async function getMonthly(params: { year?: number } = {}): Promise<{
  data: { year: number; months: MonthlyStat[] };
}> {
  const { data } = await client.get('/stats/monthly', { params });
  return data;
}
