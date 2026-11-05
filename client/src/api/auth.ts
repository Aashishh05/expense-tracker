import client, { TOKEN_KEY } from './client';
import type { User } from '@/types';

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  data: User;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface ProfileInput {
  name?: string;
  currency?: string;
}

/** Persist the token and let the app know it changed. */
function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function hasToken(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export async function registerApi(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/auth/register', input);
  saveToken(data.token);
  return data;
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/auth/login', { email, password });
  saveToken(data.token);
  return data;
}

export async function getMe(): Promise<{ data: User }> {
  const { data } = await client.get('/auth/me');
  return data;
}

export async function updateProfile(input: ProfileInput): Promise<{ data: User }> {
  const { data } = await client.put('/auth/profile', input);
  return data;
}

export async function changePassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
  await client.put('/auth/password', input);
}

/** Storage-only logout — the context clears its state separately. */
export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
}
