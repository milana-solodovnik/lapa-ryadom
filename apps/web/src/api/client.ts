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

export interface CreateOfferPayload {
  needId: string;
  quantity: number;
  idempotencyKey: string;
}

export interface OfferResult {
  offerId: string;
  code: string;
  expiresAt: string;
  remaining: string;
  need: { id: string; title: string; unit: string };
  notice: string;
}

export async function createOffer(payload: CreateOfferPayload): Promise<OfferResult> {
  return request<OfferResult>('/offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * UUIDv4 for the idempotency key.
 * crypto.randomUUID is unavailable on insecure origins in some browsers, so
 * fall back to getRandomValues rather than depending on a secure context.
 */
export function newIdempotencyKey(): string {
  const c: Crypto | undefined = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  if (!c || typeof c.getRandomValues !== 'function') {
    throw new Error('Криптографический генератор недоступен в этом браузере');
  }
  const bytes = c.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}