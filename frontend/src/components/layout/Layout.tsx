// Layout.tsx
import React from 'react';
import {
  Box,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Category as CategoryIcon,
  AccountBalance as BudgetIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const SIDEBAR_WIDTH = 450;

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { text: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: '2.5rem' }} />, path: '/dashboard' },
  { text: 'Transactions', icon: <ReceiptIcon sx={{ fontSize: '2.5rem' }} />, path: '/transactions' },
  { text: 'Categories', icon: <CategoryIcon sx={{ fontSize: '2.5rem' }} />, path: '/categories' },
  { text: 'Budget', icon: <BudgetIcon sx={{ fontSize: '2.5rem' }} />, path: '/budget' },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 6, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h3" sx={{ fontWeight: 600, fontSize: '2.5rem' }}>
            Finance Tracker
          </Typography>
        </Box>
        
        {/* Navigation */}
        <List sx={{ px: 4, py: 4 }}>
          {navigationItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 3 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 3,
                  px: 4,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 80 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '1.8rem',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100vw - ${SIDEBAR_WIDTH}px)`,
          height: '100vh',
          overflow: 'auto',
          backgroundColor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export { Layout };