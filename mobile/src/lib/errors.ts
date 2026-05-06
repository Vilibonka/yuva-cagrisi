import { isAxiosError } from 'axios';

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
};

function normalizeMessage(message: unknown) {
  if (Array.isArray(message)) {
    const messages = message.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    return messages.length > 0 ? messages.join('\n') : null;
  }

  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  return null;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<ApiErrorBody | string>(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.trim().length > 0) {
      return data;
    }

    if (!data || typeof data !== 'object') {
      return fallback;
    }

    const message = normalizeMessage(data?.message) || normalizeMessage(data?.error);
    if (message) return message;
  }

  return fallback;
}
