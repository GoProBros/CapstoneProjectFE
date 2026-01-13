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
  },
  
  // Module Layout endpoints
  MODULE_LAYOUTS: {
    BASE: '/api/module-layouts',
    BY_ID: (id: number) => `/api/module-layouts/${id}`,
  },
  
  // Symbol endpoints
  SYMBOL: {
    SEARCH: '/api/v1/symbol/search',
    LIST: '/api/v1/symbol',
  },
  
  // Financial Report endpoints (in development)
  FINANCIAL_REPORTS: {
    LIST: '/financial-reports',
    INDUSTRIES: '/industries',
  },
  
  // SignalR Hub
  HUBS: {
    MARKET_DATA: '/hubs/marketdata',
  },
  
  // Legacy endpoints (to be removed)
  USERS: '/users',
  POSTS: '/posts',
} as const;
