export interface ShelterRef {
  id: string;
  name: string;
  city: string;
  receivingHours: string;
}

export interface Need {
  id: string;
  title: string;
  details: string | null;
  category: string;
  unit: string;
  priority: 'normal' | 'urgent';
  status: string;
  targetQty: string;
  reservedQty: string;
  receivedQty: string;
  availableQty: string;
  shelter: ShelterRef;
}

export interface Shelter {
  id: string;
  name: string;
  city: string;
  description: string | null;
  address: string;
  receivingHours: string;
  activeNeedsCount: number;
}

export interface ShelterWithNeeds extends Shelter {
  needs: Need[];
}

export interface CreateDeliveryPayload {
  code: string;
  receivedQty: number;
  accountId: string;
}

export interface DeliveryResult {
  deliveryId: string;
  offerId: string;
  needId: string;
  needTitle: string;
  needUnit: string;
  offerQty: string;
  receivedQty: string;
  receivedAt: string;
  remaining: string;
  notice: string;
}

export interface DeliveryError {
  error: string;
  message: string;
  available?: string;
}

export const REP_ACCOUNTS = [
  // Demo seed: real authentication (DEV-09) will replace this with a session
  // cookie and a server-side lookup.
  { id: 'aaaaaaaa-bbbb-4ccc-aaaa-aaaaaaaaaa01', label: 'rep_a — «Добрые лапы», Москва' },
  { id: 'aaaaaaaa-bbbb-4ccc-aaaa-aaaaaaaaaa02', label: 'rep_b — «Приют Северный», Москва' },
  { id: 'aaaaaaaa-bbbb-4ccc-aaaa-aaaaaaaaaa03', label: 'rep_c — «Спасение на юге», Омск' },
];

export interface Paged<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export const CATEGORY_LABELS: Record<string, string> = {
  food: 'Корм',
  hygiene: 'Гигиена',
  textile: 'Текстиль',
  equipment: 'Оборудование',
  carriers: 'Переноски',
  other: 'Другое',
};

export const UNIT_LABELS: Record<string, string> = {
  piece: 'шт',
  pack: 'уп',
  kg: 'кг',
};

export function categoryLabel(c: string): string {
  return CATEGORY_LABELS[c] ?? c;
}

export function unitLabel(u: string): string {
  return UNIT_LABELS[u] ?? u;
}