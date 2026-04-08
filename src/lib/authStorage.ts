const AUTH_KEYS = new Set([
  'accessToken',
  'refreshToken',
  'expiresAt',
  'user',
]);

const PROTECTED_STORAGE_KEYS = new Set([
  ...AUTH_KEYS,
  'theme',
]);

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof DOMException)) {
    return false;
  }

  return (
    error.code === 22 ||
    error.code === 1014 ||
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
  );
}

function getApproximateSize(value: string | null): number {
  if (!value) {
    return 0;
  }

  // localStorage stores UTF-16 strings, so size is roughly 2 bytes/char.
  return value.length * 2;
}

function freeStorageSpace(
  storage: Storage,
  targetKey: string,
  valueToStore: string,
  protectedKeys: Set<string>
): void {
  if (!isBrowser()) {
    return;
  }

  const requiredBytes = getApproximateSize(valueToStore);
  if (requiredBytes <= 0) {
    return;
  }

  const removableItems: Array<{ key: string; size: number }> = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || key === targetKey || protectedKeys.has(key)) {
      continue;
    }

    removableItems.push({
      key,
      size: getApproximateSize(storage.getItem(key)),
    });
  }

  removableItems.sort((a, b) => b.size - a.size);

  let freedBytes = 0;
  for (const item of removableItems) {
    storage.removeItem(item.key);
    freedBytes += item.size;

    if (freedBytes >= requiredBytes) {
      break;
    }
  }
}

function setWithFallback(key: string, value: string): void {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(key, value);
    sessionStorage.removeItem(key);
    return;
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }
  }

  freeStorageSpace(localStorage, key, value, PROTECTED_STORAGE_KEYS);

  try {
    localStorage.setItem(key, value);
    sessionStorage.removeItem(key);
    return;
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }
  }

  freeStorageSpace(sessionStorage, key, value, AUTH_KEYS);
  sessionStorage.setItem(key, value);
}

export function setAuthStorageItem(key: string, value: string): void {
  setWithFallback(key, value);
}

export function getAuthStorageItem(key: string): string | null {
  if (!isBrowser()) {
    return null;
  }

  const localValue = localStorage.getItem(key);
  if (localValue !== null) {
    return localValue;
  }

  return sessionStorage.getItem(key);
}

export function removeAuthStorageItem(key: string): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

export function clearAuthStorageItems(): void {
  for (const key of AUTH_KEYS) {
    removeAuthStorageItem(key);
  }
}