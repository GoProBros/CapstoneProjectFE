const DASHBOARD_PAGES_KEY = 'dashboard-pages';
const DASHBOARD_CURRENT_PAGE_KEY = 'dashboard-current-page';

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

function getWithFallback(key: string): string | null {
  if (!isBrowser()) {
    return null;
  }

  const localValue = localStorage.getItem(key);
  if (localValue !== null) {
    return localValue;
  }

  return sessionStorage.getItem(key);
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

  sessionStorage.setItem(key, value);
}

function removeFromAllStorages(key: string): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

export function getDashboardPagesStorage(): string | null {
  return getWithFallback(DASHBOARD_PAGES_KEY);
}

export function setDashboardPagesStorage(value: string): void {
  setWithFallback(DASHBOARD_PAGES_KEY, value);
}

export function removeDashboardPagesStorage(): void {
  removeFromAllStorages(DASHBOARD_PAGES_KEY);
}

export function getDashboardCurrentPageStorage(): string | null {
  return getWithFallback(DASHBOARD_CURRENT_PAGE_KEY);
}

export function setDashboardCurrentPageStorage(value: string): void {
  setWithFallback(DASHBOARD_CURRENT_PAGE_KEY, value);
}

export function removeDashboardCurrentPageStorage(): void {
  removeFromAllStorages(DASHBOARD_CURRENT_PAGE_KEY);
}