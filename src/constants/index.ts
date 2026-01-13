/**
 * Application Constants
 * Main entry point for all application constants
 */

// Re-export from specific constant files
export { API_ENDPOINTS } from './endpoints';
export { ROUTES } from './routes';

// Application metadata
export const APP_NAME = 'kafi-stock';
export const APP_VERSION = '1.0.0';

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
