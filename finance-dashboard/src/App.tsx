// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import MonthlyView from './pages/MonthlyView';
import BudgetView from './pages/BudgetView';
import UploadView from './pages/UploadView';
import TransactionExplorerPage from './pages/TransactionExplorerPage'; // Add this import

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes default
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/monthly" element={<MonthlyView />} />
              <Route path="/budget" element={<BudgetView />} />
              <Route path="/upload" element={<UploadView />} />
              <Route path="/transactions" element={<TransactionExplorerPage />} /> {/* Add this route */}
            </Routes>
          </AppLayout>
        </div>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;