export function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    const message = response?.data?.message;

    if (Array.isArray(message)) return String(message[0] || fallback);
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
}
