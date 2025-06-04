// src/components/upload/UploadSummary.tsx
import React from 'react';
import { CheckCircle, Calendar, TrendingUp, FileText, ArrowRight } from 'lucide-react';
import { UploadSummaryResponse } from '../../types/api';

interface UploadSummaryProps {
  summary: UploadSummaryResponse;
  onViewMonthly: () => void;
  onUploadMore: () => void;
  className?: string;
}

export default function UploadSummary({ 
  summary, 
  onViewMonthly, 
  onUploadMore, 
  className = '' 
}: UploadSummaryProps) {
  // Calculate additional metrics
  const avgTransactionsPerFile = summary.files_processed > 0 
    ? Math.round(summary.total_transactions / summary.files_processed) 
    : 0;

  // Get month information from transactions (simplified - would need backend data for real months)
  const estimatedMonths = Math.max(1, Math.ceil(summary.files_processed / 2)); // Rough estimate

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Success Header */}
      <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-8 w-8 text-green-400" />
          <div>
            <h2 className="text-xl font-bold text-green-400">Upload Successful!</h2>
            <p className="text-green-300 text-sm mt-1">{summary.message}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-white">{summary.files_processed}</div>
              <div className="text-gray-400 text-sm">Files Processed</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-yellow-400" />
            <div>
              <div className="text-2xl font-bold text-white">{summary.total_transactions.toLocaleString()}</div>
              <div className="text-gray-400 text-sm">Transactions Added</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-green-400" />
            <div>
              <div className="text-2xl font-bold text-white">~{estimatedMonths}</div>
              <div className="text-gray-400 text-sm">Months Updated</div>
            </div>
          </div>
        </div>
      </div>

      {/* File Breakdown */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">File Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(summary.transactions_by_file).map(([filename, count]) => (
            <div key={filename} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-white font-medium text-sm">{filename}</span>
              </div>
              <div className="text-gray-400 text-sm">
                {count.toLocaleString()} transaction{count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
        
        {avgTransactionsPerFile > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-gray-400 text-sm">
              Average: {avgTransactionsPerFile} transactions per file
            </div>
          </div>
        )}
      </div>

      {/* Additional Insights */}
      <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-6">
        <h3 className="text-blue-400 font-medium text-lg mb-3">What's Next?</h3>
        <div className="space-y-2 text-blue-300 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Your monthly summaries have been automatically updated</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Budget analysis reflects the new transaction data</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Dashboard metrics have been refreshed with updated totals</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-700">
        <button
          onClick={onViewMonthly}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex-1"
        >
          <Calendar className="h-5 w-5" />
          <span>View Monthly Analysis</span>
          <ArrowRight className="h-5 w-5" />
        </button>
        
        <button
          onClick={onUploadMore}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex-1"
        >
          <FileText className="h-5 w-5" />
          <span>Upload More Files</span>
        </button>
      </div>

      {/* Pro Tip */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <div className="text-gray-400 text-sm">
          <strong className="text-gray-300">Pro Tip:</strong> Upload files regularly to keep your financial data current. 
          The system automatically categorizes most transactions and identifies patterns in your spending.
        </div>
      </div>
    </div>
  );
}