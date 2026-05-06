import { z } from 'zod';

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const fullNamePattern = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/;
export const phonePattern = /^[0-9\s\-+()]*$/;

export function emptyToUndefined(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function requiredTrimmed(label: string, maxLength?: number) {
  let schema = z.string().refine((value) => value.trim().length > 0, `${label} gerekli.`);

  if (maxLength) {
    schema = schema.refine((value) => value.trim().length <= maxLength, `${label} en fazla ${maxLength} karakter olabilir.`);
  }

  return schema;
}

export function optionalTrimmedText(label: string, maxLength: number) {
  return z.string().refine((value) => value.trim().length <= maxLength, `${label} en fazla ${maxLength} karakter olabilir.`);
}

export function emailField() {
  return z
    .string()
    .refine((value) => value.trim().length > 0, 'E-posta gerekli.')
    .refine((value) => value.trim().length <= 255, 'E-posta en fazla 255 karakter olabilir.')
    .refine((value) => emailPattern.test(value.trim()), 'Geçerli bir e-posta gir.');
}

export function optionalPhoneField() {
  return z
    .string()
    .refine((value) => value.trim().length <= 20, 'Telefon en fazla 20 karakter olabilir.')
    .refine((value) => !value.trim() || phonePattern.test(value.trim()), 'Geçerli bir telefon numarası gir.');
}
