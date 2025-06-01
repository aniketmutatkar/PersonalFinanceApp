import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EnhancedAppContextProvider } from './contexts/AppContextProvider';
import { Layout } from './components/layout/Layout';
import { Transactions } from './pages/Transactions';
import { Monthly } from './pages/Monthly';
import { Budget } from './pages/Budget';
import { Upload } from './pages/Upload';
import { Export } from './pages/Export';
import InvestigationPanel from './components/ui/InvestigationPanel';
import { ROUTES } from './utils/constants';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <EnhancedAppContextProvider>
      <Layout>
        <Routes>
          {/* Default redirect to dashboard */}
          <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          
          {/* Main application routes */}
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.TRANSACTIONS} element={<Transactions />} />
          <Route path={ROUTES.MONTHLY} element={<Monthly />} />
          <Route path={ROUTES.BUDGET} element={<Budget />} />
          <Route path={ROUTES.UPLOAD} element={<Upload />} />
          <Route path={ROUTES.EXPORT} element={<Export />} />
          
          {/* Investigation route */}
          <Route path="/investigate" element={<Dashboard />} />
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
        
        {/* Investigation Panel - always mounted */}
        <InvestigationPanel />
      </Layout>
    </EnhancedAppContextProvider>
  );
}

export default App;