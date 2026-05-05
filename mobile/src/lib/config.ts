export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000').replace(/\/$/, '');

export function buildImageUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path}`;
}
