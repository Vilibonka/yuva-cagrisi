import { AnimalSize, Gender, NotificationType, PostStatus, PostType, ReportReason, RequestStatus, Species } from '@/types';

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

export const postStatusLabels: Record<PostStatus, string> = {
  DRAFT: 'Taslak',
  ACTIVE: 'Aktif',
  PENDING: 'Beklemede',
  ADOPTED: 'Sahiplendirildi',
  CLOSED: 'Kapatıldı',
};

export const reportReasonLabels: Record<ReportReason, string> = {
  SPAM: 'Spam / Sahte İlan',
  INAPPROPRIATE: 'Uygunsuz İçerik',
  SCAM: 'Dolandırıcılık Şüphesi',
  OTHER: 'Diğer',
};

export const notificationTypeLabels: Record<NotificationType, string> = {
  REQUEST_CREATED: 'Yeni Başvuru',
  REQUEST_APPROVED: 'Başvuru Onaylandı',
  REQUEST_REJECTED: 'Başvuru Reddedildi',
  NEW_MESSAGE: 'Yeni Mesaj',
  SYSTEM: 'Bildirim',
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

export function formatTimeAgo(value?: string | null) {
  if (!value) return 'Az önce';

  const diffMs = Date.now() - new Date(value).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'Az önce';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} dk önce`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} sa önce`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} gün önce`;

  return formatDate(value);
}
