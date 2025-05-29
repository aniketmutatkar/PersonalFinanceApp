// API Configuration
export const API_BASE_URL = 'http://localhost:8000/api';

// Navigation routes
export const ROUTES = {
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  MONTHLY: '/monthly',
  BUDGET: '/budget',
  UPLOAD: '/upload',
  EXPORT: '/export',
} as const;

// Page titles
export const PAGE_TITLES = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.TRANSACTIONS]: 'Transactions',
  [ROUTES.MONTHLY]: 'Monthly Summary',
  [ROUTES.BUDGET]: 'Budget Analysis',
  [ROUTES.UPLOAD]: 'Upload Files',
  [ROUTES.EXPORT]: 'Export Data',
} as const;

// Default pagination
export const DEFAULT_PAGE_SIZE = 50;