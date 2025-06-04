// src/components/ui/LoadingSkeleton.tsx
import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'metric' | 'list' | 'chart' | 'text' | 'table';
  lines?: number;
  rows?: number; // Add rows prop for table variant
  className?: string;
}

export default function LoadingSkeleton({ 
  variant = 'text', 
  lines = 3,
  rows = 5, // Default rows for table
  className = '' 
}: LoadingSkeletonProps) {
  const renderMetricSkeleton = () => (
    <div className={`bg-gray-800 border border-gray-600 rounded-lg p-8 ${className}`}>
      <div className="animate-pulse">
        <div className="h-12 bg-gray-700 rounded mb-4"></div>
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className={`bg-gray-800 border border-gray-600 rounded-lg p-8 ${className}`}>
      <div className="animate-pulse">
        <div className="h-6 bg-gray-700 rounded mb-6 w-1/3"></div>
        <div className="space-y-4">
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChartSkeleton = () => (
    <div className={`bg-gray-800 border border-gray-600 rounded-lg p-8 ${className}`}>
      <div className="animate-pulse">
        <div className="h-6 bg-gray-700 rounded mb-6 w-1/3"></div>
        <div className="h-64 bg-gray-700 rounded"></div>
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className={`animate-pulse ${className}`}>
      {/* Table Header */}
      <div className="flex gap-4 mb-4 p-4 border-b border-gray-700">
        <div className="h-4 bg-gray-700 rounded w-20"></div>
        <div className="h-4 bg-gray-700 rounded w-40"></div>
        <div className="h-4 bg-gray-700 rounded w-24"></div>
        <div className="h-4 bg-gray-700 rounded w-20"></div>
        <div className="h-4 bg-gray-700 rounded w-16"></div>
      </div>
      
      {/* Table Rows */}
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-6 bg-gray-700 rounded w-20"></div>
            <div className="h-6 bg-gray-700 rounded w-40"></div>
            <div className="h-6 bg-gray-700 rounded w-24"></div>
            <div className="h-6 bg-gray-700 rounded w-20"></div>
            <div className="h-6 bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTextSkeleton = () => (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <div 
            key={i} 
            className={`h-4 bg-gray-700 rounded ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );

  switch (variant) {
    case 'metric':
      return renderMetricSkeleton();
    case 'list':
      return renderListSkeleton();
    case 'chart':
      return renderChartSkeleton();
    case 'table':
      return renderTableSkeleton();
    case 'text':
    default:
      return renderTextSkeleton();
  }
}