// Application constants

export const APP_NAME = 'Capstone Project';
export const APP_VERSION = '1.0.0';

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
} as const;

export const API_ENDPOINTS = {
  USERS: '/users',
  POSTS: '/posts',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
