/**
 * Application Routes Configuration
 * Centralized management of all application routes
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  ERROR: '/error',
  ABOUT: '/about',
  CONTACT: '/contact',
  SYSTEM_MANAGER: '/system-manager',
  SYSTEM_MANAGER_USERS: '/system-manager/users',
  SYSTEM_MANAGER_REVENUE: '/system-manager/revenue',
  SYSTEM_MANAGER_FINANCIAL_REPORTS: '/system-manager/financial-reports',
  SYSTEM_MANAGER_ANALYSIS_REPORTS: '/system-manager/analysis-reports',
  SYSTEM_MANAGER_NEWS: '/system-manager/news',
  SYSTEM_MANAGER_ALERTS: '/system-manager/alerts',
  SYSTEM_MANAGER_DATA: '/system-manager/data',
  SYSTEM_MANAGER_MACROECONOMIC: '/system-manager/macroeconomic-simulation',
} as const;
