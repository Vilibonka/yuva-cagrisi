export function getRedirectTarget(value?: string | string[], fallback = '/') {
  const target = Array.isArray(value) ? value[0] : value;

  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return fallback;
  }

  return target;
}
