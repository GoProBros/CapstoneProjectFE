/**
 * API Endpoints Configuration
 * Centralized management of all API endpoints used across the application
 */

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/api/v1/auth/register',
    LOGIN: '/api/v1/auth/login',
    GOOGLE_LOGIN: '/api/v1/auth/google',
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
    TICKERS: '/api/v1/symbol/tickers',
  },
  
  // Sector endpoints
  SECTORS: {
    BASE: '/api/v1/sectors',
    BY_ID: (id: string) => `/api/v1/sectors/${id}`,
  },

  // Market Index endpoints
  MARKET_INDICES: {
    BASE: '/api/v1/market-indices',
    BY_CODE: (code: string) => `/api/v1/market-indices/${code}`,
    CONSTITUENTS: (code: string) => `/api/v1/market-indices/${code}/constituents`,
    LIVE: '/api/v1/market-indices/live',
    INTRADAY: (code: string) => `/api/v1/market-indices/${code}/intraday`,
  },
  
  // Financial Report endpoints (in development)
  FINANCIAL_REPORTS: {
    FINANCIAL_REPORTS: `/api/v1/financial-reports`,
    BY_ID: (id: string) => `/api/v1/financial-reports/${id}`,
  },

  // Data fetching endpoints
  DATA_FETCHING: {
    FINANCIAL_REPORT_SPECIFIC: '/api/v1/data-fetching/financial-reports/specific',
    IMPORT_SECTORS_FROM_SSI: '/api/v1/data-fetching/import-sectors-from-ssi',
    IMPORT_SYMBOLS_FROM_SSI: '/api/v2/data-fetching/import-symbols-from-ssi',
    MAP_SYMBOLS_SECTORS_FROM_SSI: '/api/v1/data-fetching/map-symbols-sector-from-ssi',
    IMPORT_INDEX_CONSTITUENTS_FROM_SSI: '/api/v1/data-fetching/import-index-constituents-from-ssi',
  },

  // System log endpoints
  LOGS: {
    DATES: '/api/v1/logs/dates',
    BASE: '/api/v1/logs',
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
    BY_TICKER: (ticker: string) => `/api/v1/ohlcv/${ticker}`,
  },
  
  // Workspace endpoints
  WORKSPACE: {
    MY_WORKSPACES: '/api/v1/workspace/my-workspaces',
    BASE: '/api/v1/workspace',
    BY_ID: (id: number) => `/api/v1/workspace/${id}`,
    APPLY: (shareCode: string) => `/api/v1/workspace/apply/${shareCode}`,
  },
  
  // Subscription endpoints
  SUBSCRIPTIONS: {
    BASE: '/api/v1/subscriptions',
    ME: '/api/v1/subscriptions/me',
    STATISTICS: '/api/v1/subscriptions/statistics',
    UPDATE_STATUS: (id: number) => `/api/v1/subscriptions/${id}/status`,
    UPDATE_BY_ID: (id: number) => `/api/v1/subscriptions/${id}`,
  },

  // AI Chat & Direct Message endpoints
  CHAT: {
    SESSIONS: '/api/v1/chat/sessions',
    SESSION_BY_ID: (id: number) => `/api/v1/chat/sessions/${id}`,
    SEND_MESSAGE: (sessionId: number) => `/api/v1/chat/sessions/${sessionId}/messages`,
    SUMMARIZE: (sessionId: number) => `/api/v1/chat/sessions/${sessionId}/summarize`,
    SYSTEM_NOTIFICATIONS: '/api/v1/chat/system-notifications',
    DIRECT: '/api/v1/chat/direct',
    SEND_DIRECT_MESSAGE: (sessionId: number) => `/api/v1/chat/sessions/${sessionId}/direct-messages`,
    MARK_AS_READ: (sessionId: number) => `/api/v1/chat/sessions/${sessionId}/read`,
  },

  // Payment endpoints
  PAYMENTS: {
    CREATE_LINK: '/api/v1/payments/create-link',
    STATUS: (orderCode: number) => `/api/v1/payments/status/${orderCode}`,
    CANCEL: (orderCode: number) => `/api/v1/payments/cancel/${orderCode}`,
    MOMO_SYNC: (orderCode: number) => `/api/v1/payments/momo/sync/${orderCode}`,
  },

  // User Management endpoints
  USER_MANAGEMENT: {
    BASE: '/api/v1/users',
    BY_ID: (id: string) => `/api/v1/users/${id}`,
    UPDATE_STATUS: (id: string) => `/api/v1/users/${id}/status`,
    CREATE_STAFF: '/api/v1/users/staff',
  },

  // Macroeconomic data endpoints
  MACROECONOMIC_DATA: {
    BASE: '/api/v1/macroeconomic-data',
  },

  // SignalR Hub
  HUBS: {
    MARKET_DATA: '/hubs/marketdata',
  },

  // Heatmap endpoints
  HEATMAP: {
    BASE: '/api/v1/heatmap',
  },

  // Market general endpoints (Smart Market Board etc.)
  MARKET: {
    AVG_VOLUME: '/api/v1/market/avg-volume',
  },
  
  // Legacy endpoints (to be removed)
  USERS: '/users',
  POSTS: '/posts',
} as const;
