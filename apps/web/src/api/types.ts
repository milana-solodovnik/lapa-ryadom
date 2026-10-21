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