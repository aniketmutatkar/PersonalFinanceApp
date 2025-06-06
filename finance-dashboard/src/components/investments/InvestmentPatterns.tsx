// src/components/investments/InvestmentPatterns.tsx
import React from 'react';
import { SpendingPatternsResponse } from '../../types/api';
import LoadingSkeleton from '../ui/LoadingSkeleton';

interface InvestmentPatternsProps {
  patternsData: SpendingPatternsResponse | undefined;
  isLoading: boolean;
}

export default function InvestmentPatterns({ patternsData, isLoading }: InvestmentPatternsProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
        <LoadingSkeleton className="h-8 w-48 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Filter patterns for investment-related insights
  const investmentPatterns = patternsData?.patterns.filter(pattern => 
    pattern.type === 'consistent_investing' || 
    pattern.message.toLowerCase().includes('investment') ||
    pattern.message.toLowerCase().includes('acorns') ||
    pattern.message.toLowerCase().includes('wealthfront') ||
    pattern.message.toLowerCase().includes('robinhood') ||
    pattern.message.toLowerCase().includes('schwab')
  ) || [];

  // Create investment-specific insights
  const investmentInsights = [
    ...investmentPatterns,
    // Add default insights if no specific patterns found
    ...(investmentPatterns.length === 0 ? [
      {
        type: 'investment_analysis',
        severity: 'info' as const,
        message: 'Investment pattern analysis in progress',
        data: {}
      }
    ] : [])
  ];

  const getPatternIcon = (type: string, severity: string) => {
    if (type === 'consistent_investing' || severity === 'positive') return '✅';
    if (severity === 'warning') return '⚠️';
    if (severity === 'info') return 'ℹ️';
    return '📊';
  };

  const getPatternStyles = (severity: string) => {
    switch (severity) {
      case 'positive':
        return 'bg-teal-900/20 border-teal-800/30 text-teal-100';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-800/30 text-yellow-100';
      case 'info':
        return 'bg-blue-900/20 border-blue-800/30 text-blue-100';
      default:
        return 'bg-gray-700/50 border-gray-600/50 text-gray-100';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'positive':
        return 'Good Pattern';
      case 'warning':
        return 'Attention Needed';
      case 'info':
        return 'Insight';
      default:
        return 'Analysis';
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Investment Patterns</h3>
          <p className="text-gray-400 text-sm mt-1">
            {investmentInsights.length > 0 
              ? `${investmentInsights.length} pattern${investmentInsights.length !== 1 ? 's' : ''} detected`
              : 'Analyzing investment behavior...'
            }
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {investmentInsights.length > 0 ? (
          investmentInsights.map((pattern, index) => (
            <div
              key={index}
              className={`rounded-lg border p-4 ${getPatternStyles(pattern.severity)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-lg mt-0.5">
                  {getPatternIcon(pattern.type, pattern.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">
                      {getSeverityLabel(pattern.severity)}
                    </h4>
                    <span className="text-xs opacity-75 uppercase tracking-wide">
                      {pattern.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {pattern.message}
                  </p>
                  
                  {/* Display additional data if available */}
                  {pattern.data && Object.keys(pattern.data).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-current/20">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        {pattern.data.average_monthly && (
                          <div>
                            <span className="opacity-75">Monthly Average:</span>
                            <span className="ml-1 font-medium">
                              ${pattern.data.average_monthly.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {pattern.data.consistency_score && (
                          <div>
                            <span className="opacity-75">Consistency:</span>
                            <span className="ml-1 font-medium">
                              {pattern.data.consistency_score.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📈</div>
            <p className="text-gray-400 text-sm">
              No specific investment patterns detected yet.
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Continue investing regularly to build detectable patterns.
            </p>
          </div>
        )}
      </div>

      {/* Investment Tips */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Investment Tips</h4>
        <div className="grid grid-cols-1 gap-2 text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <span>💡</span>
            <span>Consistency matters more than amount</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📅</span>
            <span>Regular monthly deposits build wealth over time</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🎯</span>
            <span>Aim for 10-20% of income in investments</span>
          </div>
        </div>
      </div>
    </div>
  );
}