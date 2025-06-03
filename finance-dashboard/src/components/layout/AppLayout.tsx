// src/components/layout/AppLayout.tsx
import React from 'react';
import Navigation from './Navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-900">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-10 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}