import client from './client';
import type { Group, GroupStats, Pagination, Transaction } from '@/types';

export async function listGroups(): Promise<{ data: Group[] }> {
  const { data } = await client.get('/groups');
  return data;
}

export async function createGroup(name: string): Promise<{ data: Group }> {
  const { data } = await client.post('/groups', { name });
  return data;
}

export async function getGroup(id: string): Promise<{ data: Group }> {
  const { data } = await client.get(`/groups/${id}`);
  return data;
}

export async function getGroupStats(id: string): Promise<{ data: GroupStats }> {
  const { data } = await client.get(`/groups/${id}/stats`);
  return data;
}

export async function renameGroup(id: string, name: string): Promise<{ data: Group }> {
  const { data } = await client.put(`/groups/${id}`, { name });
  return data;
}

export async function deleteGroup(id: string): Promise<void> {
  await client.delete(`/groups/${id}`);
}

export async function addGroupMember(id: string, email: string): Promise<{ data: Group }> {
  const { data } = await client.post(`/groups/${id}/members`, { email });
  return data;
}

export async function listGroupTransactions(
  id: string,
  params?: { page?: number; limit?: number }
): Promise<{ data: Transaction[]; pagination?: Pagination }> {
  const { data } = await client.get(`/groups/${id}/transactions`, { params });
  return data;
}
