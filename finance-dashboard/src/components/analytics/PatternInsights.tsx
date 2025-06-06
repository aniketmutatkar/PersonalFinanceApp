// src/components/analytics/PatternInsights.tsx
import React from 'react';
import { AlertTriangle, TrendingUp, CheckCircle, Info } from 'lucide-react';
import { SpendingPatternsResponse } from '../../types/api';

interface PatternInsightsProps {
  patternsData: SpendingPatternsResponse | undefined;
  isLoading: boolean;
}

export default function PatternInsights({ patternsData, isLoading }: PatternInsightsProps) {
  const getPatternIcon = (severity: string) => {
    switch (severity) {
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      case 'positive':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      default:
        return <Info className="w-6 h-6 text-blue-400" />;
    }
  };

  const getPatternBorderColor = (severity: string) => {
    switch (severity) {
      case 'warning':
        return 'border-yellow-500';
      case 'positive':
        return 'border-green-500';
      default:
        return 'border-blue-500';
    }
  };

  const getPatternBgColor = (severity: string) => {
    switch (severity) {
      case 'warning':
        return 'bg-yellow-500/10';
      case 'positive':
        return 'bg-green-500/10';
      default:
        return 'bg-blue-500/10';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
        <h3 className="text-white font-semibold text-3xl mb-6">Spending Patterns & Insights</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!patternsData || patternsData.patterns.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
        <h3 className="text-white font-semibold text-3xl mb-6">Spending Patterns & Insights</h3>
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No spending patterns detected</p>
            <p className="text-sm mt-1">More data needed for pattern analysis</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-white font-semibold text-3xl mb-2">Spending Patterns & Insights</h3>
          <p className="text-gray-400">
            Analysis period: {patternsData.analysis_period.start} to {patternsData.analysis_period.end}
          </p>
          <p className="text-gray-500 text-sm">
            {patternsData.analysis_period.months_analyzed} months analyzed (overall data)
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Note: Patterns show overall trends, not filtered by selected years
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-sm">Patterns Found</p>
          <p className="text-white text-2xl font-bold">{patternsData.pattern_count}</p>
        </div>
      </div>

      <div className="space-y-4">
        {patternsData.patterns.map((pattern, index) => (
          <div
            key={index}
            className={`border-l-4 p-4 rounded-lg ${getPatternBorderColor(pattern.severity)} ${getPatternBgColor(pattern.severity)}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                {getPatternIcon(pattern.severity)}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-semibold capitalize">
                    {pattern.type.replace('_', ' ')}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    pattern.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                    pattern.severity === 'positive' ? 'bg-green-500/20 text-green-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {pattern.severity}
                  </span>
                </div>
                
                <p className="text-gray-300 mb-3">{pattern.message}</p>
                
                {/* Pattern-specific data display */}
                {pattern.data && (
                  <div className="text-sm text-gray-400">
                    {pattern.type === 'subscription_creep' && pattern.data.recent_average && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-500">Recent Average:</span>
                          <span className="text-white ml-2">${pattern.data.recent_average}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Previous Average:</span>
                          <span className="text-white ml-2">${pattern.data.previous_average}</span>
                        </div>
                      </div>
                    )}
                    
                    {pattern.type === 'seasonal_spikes' && pattern.data.spikes && (
                      <div>
                        <span className="text-gray-500">High spending months:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {pattern.data.spikes.slice(0, 3).map((spike: any, idx: number) => (
                            <span key={idx} className="bg-gray-700 px-2 py-1 rounded text-xs">
                              {spike.month}: +{spike.spike_percentage}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {pattern.type === 'consistent_investing' && pattern.data.average_monthly && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-500">Monthly Average:</span>
                          <span className="text-white ml-2">${pattern.data.average_monthly}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Consistency Score:</span>
                          <span className="text-green-400 ml-2">{pattern.data.consistency_score}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary insights */}
      <div className="mt-6 pt-6 border-t border-gray-600">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-gray-400 text-sm">Warnings</p>
            <p className="text-yellow-400 text-xl font-semibold">
              {patternsData.patterns.filter(p => p.severity === 'warning').length}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Insights</p>
            <p className="text-blue-400 text-xl font-semibold">
              {patternsData.patterns.filter(p => p.severity === 'info').length}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Positive</p>
            <p className="text-green-400 text-xl font-semibold">
              {patternsData.patterns.filter(p => p.severity === 'positive').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}