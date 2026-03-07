/**
 * API Endpoints Configuration
 * Centralized management of all API endpoints used across the application
 */

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/api/v1/auth/register',
    LOGIN: '/api/v1/auth/login',
    REFRESH_TOKEN: '/api/v1/auth/refresh-token',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
  },
  
  // Module Layout endpoints
  MODULE_LAYOUTS: {
    BASE: '/api/v1/module-layouts',
    BY_ID: (id: number) => `/api/v1/module-layouts/${id}`,
  },
  
  // Symbol endpoints
  SYMBOL: {
    SEARCH: '/api/v1/symbol/search',
    LIST: '/api/v1/symbol',
  },
  
  // Sector endpoints
  SECTORS: {
    BASE: '/api/v1/sectors',
    BY_ID: (id: string) => `/api/v1/sectors/${id}`,
  },
  
  // Financial Report endpoints (in development)
  FINANCIAL_REPORTS: {
    FINANCIAL_REPORTS: `/api/v1/financial-reports`,
  },
  
  // Analysis Report endpoints
  ANALYSIS_REPORTS: {
    BASE: '/api/v1/analysis-reports',
    REPORT_BY_ID: (id: string) => `/api/v1/analysis-reports/${id}`,
    SOURCES: '/api/v1/analysis-reports/sources',
    SOURCE_BY_ID: (id: string) => `/api/v1/analysis-reports/sources/${id}`,
    CATEGORIES: '/api/v1/analysis-reports/categories',
  },
  
  // File endpoints
  FILES: {
    UPLOAD: '/api/v1/files/upload',
    DOWNLOAD: '/api/v1/files/download',
    DELETE: '/api/v1/files',
  },
  
  // Watch List endpoints
  WATCH_LIST: {
    BASE: '/api/v1/watch-lists',
    BY_ID: (id: number) => `/api/v1/watch-lists/${id}`,
  },
  
  // OHLCV endpoints
  OHLCV: {
    BY_TICKER: (ticker: string) => `/api/Ohlcv/${ticker}`,
  },
  
  // Workspace endpoints
  WORKSPACE: {
    MY_WORKSPACES: '/api/v1/workspace/my-workspaces',
    BASE: '/api/v1/workspace',
    BY_ID: (id: number) => `/api/v1/workspace/${id}`,
  },
  
  // Subscription endpoints
  SUBSCRIPTIONS: {
    BASE: '/api/v1/subscriptions',
    ME: '/api/v1/subscriptions/me',
  },

  // Payment endpoints
  PAYMENTS: {
    CREATE_LINK: '/api/v1/payments/create-link',
    STATUS: (orderCode: number) => `/api/v1/payments/status/${orderCode}`,
    CANCEL: (orderCode: number) => `/api/v1/payments/cancel/${orderCode}`,
  },

  // SignalR Hub
  HUBS: {
    MARKET_DATA: '/hubs/marketdata',
  },
  
  // Legacy endpoints (to be removed)
  USERS: '/users',
  POSTS: '/posts',
} as const;
