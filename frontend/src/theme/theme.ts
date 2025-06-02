import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#047857',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#047857',
    },
    divider: '#475569',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    body1: {
      fontSize: '1rem',
      color: '#e2e8f0',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#cbd5e1',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #475569',
          backgroundImage: 'none',
          '&:hover': {
            border: '1px solid #64748b',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1e293b',
          borderRight: '1px solid #475569',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          border: 'none',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: '#3b82f6',
            '&:hover': {
              backgroundColor: '#2563eb',
            },
          },
        },
      },
    },
  },
});