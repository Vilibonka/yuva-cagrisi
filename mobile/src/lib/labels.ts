import { AnimalSize, Gender, PostType, RequestStatus, Species } from '@/types';

export const speciesLabels: Record<Species, string> = {
  DOG: 'Köpek',
  CAT: 'Kedi',
  BIRD: 'Kuş',
  RABBIT: 'Tavşan',
  OTHER: 'Diğer',
};

export const genderLabels: Record<Gender, string> = {
  MALE: 'Erkek',
  FEMALE: 'Dişi',
  UNKNOWN: 'Bilinmiyor',
};

export const sizeLabels: Record<AnimalSize, string> = {
  SMALL: 'Küçük',
  MEDIUM: 'Orta',
  LARGE: 'Büyük',
};

export const postTypeLabels: Record<PostType, string> = {
  FOUND_STRAY: 'Sokakta Bulunan',
  REHOME_OWNED_PET: 'Sahiplendirme',
  TEMP_HOME_NEEDED: 'Geçici Yuva',
};

export const requestStatusLabels: Record<RequestStatus, string> = {
  PENDING: 'Beklemede',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  CANCELLED: 'İptal Edildi',
};

export function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
