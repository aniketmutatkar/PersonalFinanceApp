import React from 'react';
import { InvestigationResult, InvestigationContext as IInvestigationContext } from '../../types';
import InsightCard from './InsightCard';
import DrillDownOptions from './DrillDownOptions';

interface InvestigationResultsProps {
  investigation: IInvestigationContext;
  results: InvestigationResult | null;
  loading: boolean;
  error?: string | null;
  onDrillDown?: (optionId: string) => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onExport?: () => void;
}

const InvestigationResults: React.FC<InvestigationResultsProps> = ({
  investigation,
  results,
  loading,
  error,
  onDrillDown,
  onBookmark,
  onShare,
  onExport
}) => {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!results) {
    return <EmptyState investigation={investigation} />;
  }

  return (
    <div className="space-y-6">
      {/* Investigation Summary */}
      <InvestigationSummary summary={results.summary} confidence={results.confidence} />
      
      {/* Key Insights */}
      {results.insights.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-3">
            {results.insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                investigation={investigation}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats Grid */}
      {results.summary.quick_stats && results.summary.quick_stats.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {results.summary.quick_stats.map((stat, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
                <div className="text-xl font-bold text-gray-900 flex items-center">
                  {stat.value}
                  {stat.trend && (
                    <TrendIndicator trend={stat.trend} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Data Sections */}
      {results.data_sections.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Analysis</h3>
          <div className="space-y-4">
            {results.data_sections.map((section) => (
              <DataSection key={section.id} section={section} />
            ))}
          </div>
        </section>
      )}

      {/* Related Transactions */}
      {results.related_transactions.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Related Transactions ({results.related_transactions.length})
          </h3>
          <TransactionsList transactions={results.related_transactions.slice(0, 10)} />
          {results.related_transactions.length > 10 && (
            <div className="mt-3 text-center">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View all {results.related_transactions.length} transactions →
              </button>
            </div>
          )}
        </section>
      )}

      {/* Drill Down Options */}
      {results.drill_down_options.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Drill Down Further</h3>
          <DrillDownOptions
            options={results.drill_down_options}
            onDrillDown={onDrillDown}
          />
        </section>
      )}

      {/* Suggestions */}
      {results.suggestions.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggestions</h3>
          <div className="space-y-3">
            {results.suggestions.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <section className="border-t pt-6">
        <div className="flex flex-wrap gap-3">
          {onBookmark && (
            <button
              onClick={onBookmark}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              Bookmark
            </button>
          )}
          
          {onShare && (
            <button
              onClick={onShare}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M15.707 4.293a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 8.586V3a1 1 0 012 0v5.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Share
            </button>
          )}
          
          {onExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

// Sub-components
const InvestigationSummary: React.FC<{
  summary: any;
  confidence: number;
}> = ({ summary, confidence }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
    <div className="flex items-start justify-between mb-4">
      <h2 className="text-xl font-bold text-blue-900">{summary.title}</h2>
      <div className="flex items-center space-x-2">
        <span className="text-xs px-2 py-1 rounded-full bg-blue-200 text-blue-800">
          {Math.round(confidence * 100)}% confidence
        </span>
        <ImpactBadge level={summary.impact_level} />
      </div>
    </div>
    
    <p className="text-blue-800 text-lg mb-4">{summary.key_finding}</p>
    
    {summary.primary_metric && (
      <div className="bg-white rounded-md p-4">
        <div className="text-sm text-gray-600 mb-1">Primary Metric</div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-gray-900">
            {typeof summary.primary_metric.value === 'number' 
              ? summary.primary_metric.value.toLocaleString() 
              : summary.primary_metric.value}
          </span>
          {summary.primary_metric.change !== 0 && (
            <span className={`text-sm font-medium ${
              summary.primary_metric.change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary.primary_metric.change > 0 ? '+' : ''}{summary.primary_metric.change_percentage}%
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {summary.primary_metric.period_comparison}
        </div>
      </div>
    )}
  </div>
);

const ImpactBadge: React.FC<{ level: 'high' | 'medium' | 'low' }> = ({ level }) => {
  const config = {
    high: { color: 'bg-red-100 text-red-800', icon: '🔴' },
    medium: { color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
    low: { color: 'bg-green-100 text-green-800', icon: '🟢' }
  };
  
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${config[level].color}`}>
      {config[level].icon} {level} impact
    </span>
  );
};

const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'stable' }> = ({ trend }) => {
  const config = {
    up: { icon: '↗️', color: 'text-green-600' },
    down: { icon: '↘️', color: 'text-red-600' },
    stable: { icon: '→', color: 'text-gray-600' }
  };
  
  return (
    <span className={`ml-2 text-sm ${config[trend].color}`}>
      {config[trend].icon}
    </span>
  );
};

const DataSection: React.FC<{ section: any }> = ({ section }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <h4 className="font-semibold text-gray-900 mb-2">{section.title}</h4>
    <div className="text-sm text-gray-600">
      {section.type === 'chart' && (
        <div className="h-48 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
          <span className="text-gray-500">📊 Chart visualization placeholder</span>
        </div>
      )}
      {section.type === 'text' && (
        <p>{JSON.stringify(section.data)}</p>
      )}
      {section.type === 'metrics' && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(section.data).map(([key, value]) => (
            <div key={key} className="text-center p-2 bg-white rounded">
              <div className="font-medium">{String(value)}</div>
              <div className="text-xs text-gray-500">{key}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const TransactionsList: React.FC<{ transactions: any[] }> = ({ transactions }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <div className="divide-y divide-gray-200">
      {transactions.map((transaction, index) => (
        <div key={index} className="px-4 py-3 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {transaction.description}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              ${Math.abs(transaction.amount).toFixed(2)}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SuggestionCard: React.FC<{ suggestion: any }> = ({ suggestion }) => (
  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 mb-1">{suggestion.action}</h4>
        <p className="text-sm text-gray-600">{suggestion.description}</p>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${
        suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
        suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
        'bg-green-100 text-green-800'
      }`}>
        {suggestion.priority}
      </span>
    </div>
  </div>
);

// Loading and Error States
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-32 bg-gray-200 rounded-lg"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-20 bg-gray-200 rounded"></div>
      <div className="h-20 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const ErrorDisplay: React.FC<{ error: string }> = ({ error }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <div className="text-red-400 text-4xl mb-4">⚠️</div>
    <h3 className="text-lg font-semibold text-red-900 mb-2">Investigation Error</h3>
    <p className="text-red-700">{error}</p>
    <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
      Retry Investigation
    </button>
  </div>
);

const EmptyState: React.FC<{ investigation: IInvestigationContext }> = ({ investigation }) => (
  <div className="text-center py-12">
    <div className="text-4xl mb-4">🔍</div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Investigation in Progress</h3>
    <p className="text-gray-600">
      Analyzing {investigation.type} data for {investigation.title.toLowerCase()}...
    </p>
    <div className="mt-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
    </div>
  </div>
);

export default InvestigationResults;