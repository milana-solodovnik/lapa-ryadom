import type { Need, Paged, Shelter, ShelterWithNeeds } from './types.js';

const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {
      // keep the status-based message
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

export interface NeedsParams {
  city?: string;
  category?: string;
  priority?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

function toQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function fetchNeeds(params: NeedsParams = {}, signal?: AbortSignal) {
  return request<Paged<Need>>(`/needs${toQuery({ ...params })}`, { signal });
}

export function fetchNeed(id: string, signal?: AbortSignal) {
  return request<Need>(`/needs/${id}`, { signal });
}

export function fetchShelters(params: { city?: string } = {}, signal?: AbortSignal) {
  return request<Paged<Shelter>>(`/shelters${toQuery({ ...params })}`, { signal });
}

export function fetchShelter(id: string, signal?: AbortSignal) {
  return request<ShelterWithNeeds>(`/shelters/${id}`, { signal });
}