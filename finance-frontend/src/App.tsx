import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Transactions } from './pages/Transactions';
import { Monthly } from './pages/Monthly';
import { Budget } from './pages/Budget';
import { Upload } from './pages/Upload';
import { Export } from './pages/Export';
import { ROUTES } from './utils/constants';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Default redirect to dashboard */}
          <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          
          {/* Main application routes */}
          <Route path={ROUTES.TRANSACTIONS} element={<Transactions />} />
          <Route path={ROUTES.MONTHLY} element={<Monthly />} />
          <Route path={ROUTES.BUDGET} element={<Budget />} />
          <Route path={ROUTES.UPLOAD} element={<Upload />} />
          <Route path={ROUTES.EXPORT} element={<Export />} />
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;