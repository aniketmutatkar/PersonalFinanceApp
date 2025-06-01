import React, { useState } from 'react';
import { useInvestigation } from '../../contexts/InvestigationContext';
import { useFinancialOverview, useSpendingPatterns } from '../../hooks/useApi';
import { InvestigationContext as IInvestigationContext, InvestigationScope } from '../../types';

interface QuickInvestigationAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  investigationType: IInvestigationContext['type'];
  scope: InvestigationScope;
  variant?: 'primary' | 'secondary' | 'warning' | 'success';
  enabled?: boolean;
  requiresData?: boolean;
}

interface QuickInvestigationActionsProps {
  className?: string;
  variant?: 'horizontal' | 'grid' | 'vertical';
  showDescriptions?: boolean;
  contextualActions?: boolean; // Show actions based on current data
}

const QuickInvestigationActions: React.FC<QuickInvestigationActionsProps> = ({
  className = '',
  variant = 'grid',
  showDescriptions = true,
  contextualActions = true
}) => {
  const { actions } = useInvestigation();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  // Get data for contextual actions
  const { data: overview } = useFinancialOverview();
  const { data: patterns } = useSpendingPatterns();

  // Base quick actions
  const getBaseActions = (): QuickInvestigationAction[] => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const currentYear = new Date().getFullYear();
    
    return [
      {
        id: 'current-month',
        title: 'This Month Analysis',
        description: 'Deep dive into current month spending',
        icon: '📅',
        investigationType: 'monthly',
        scope: { month: currentMonth },
        variant: 'primary'
      },
      {
        id: 'spending-patterns',
        title: 'Find Patterns',
        description: 'Detect unusual spending patterns',
        icon: '🔍',
        investigationType: 'pattern',
        scope: { 
          dateRange: {
            start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
          }
        },
        variant: 'secondary'
      },
      {
        id: 'high-spending-category',
        title: 'Biggest Expense Category',
        description: 'Investigate your largest spending category',
        icon: '💰',
        investigationType: 'category',
        scope: { 
          category: overview?.top_categories[0]?.category || 'Groceries',
          dateRange: {
            start: new Date(currentYear, 0, 1).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
          }
        },
        variant: 'warning',
        enabled: !!overview?.top_categories?.[0],
        requiresData: true
      },
      {
        id: 'recent-anomalies',
        title: 'Recent Anomalies',
        description: 'Check for unusual transactions or patterns',
        icon: '⚠️',
        investigationType: 'anomaly',
        scope: {
          anomalyType: 'recent',
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
          }
        },
        variant: 'warning'
      },
      {
        id: 'investment-analysis',
        title: 'Investment Review',
        description: 'Analyze investment consistency and gaps',
        icon: '📈',
        investigationType: 'category',
        scope: {
          category: 'Investments',
          dateRange: {
            start: new Date(currentYear, 0, 1).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
          }
        },
        variant: 'success'
      },
      {
        id: 'subscription-review',
        title: 'Subscription Audit',
        description: 'Review recurring subscriptions and services',
        icon: '🔄',
        investigationType: 'category',
        scope: {
          category: 'Subscriptions',
          dateRange: {
            start: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
          }
        },
        variant: 'secondary'
      }
    ];
  };

  // Get contextual actions based on available data
  const getContextualActions = (): QuickInvestigationAction[] => {
    if (!contextualActions || !overview || !patterns) return [];

    const contextual: QuickInvestigationAction[] = [];

    // Add actions for detected patterns
    if (patterns.patterns.length > 0) {
      patterns.patterns.forEach((pattern, index) => {
        if (index < 2) { // Limit to 2 pattern-based actions
          contextual.push({
            id: `pattern-${pattern.type}`,
            title: `Investigate ${pattern.type.replace('_', ' ')}`,
            description: pattern.message,
            icon: pattern.severity === 'warning' ? '🚨' : '🔍',
            investigationType: 'anomaly',
            scope: {
              anomalyType: pattern.type,
              dateRange: {
                start: patterns.analysis_period.start,
                end: patterns.analysis_period.end
              }
            },
            variant: pattern.severity === 'warning' ? 'warning' : 'secondary'
          });
        }
      });
    }

    // Add action for highest volatility category
    if (overview.volatility_rankings.most_volatile.volatility > 0) {
      contextual.push({
        id: 'volatile-category',
        title: `${overview.volatility_rankings.most_volatile.category} Volatility`,
        description: `Investigate high spending volatility in ${overview.volatility_rankings.most_volatile.category}`,
        icon: '📊',
        investigationType: 'category',
        scope: {
          category: overview.volatility_rankings.most_volatile.category,
          dateRange: {
            start: overview.date_range.start_month,
            end: overview.date_range.end_month
          }
        },
        variant: 'warning'
      });
    }

    return contextual;
  };

  // Combine base and contextual actions
  const allActions = [
    ...getBaseActions(),
    ...(contextualActions ? getContextualActions() : [])
  ];

  // Filter enabled actions
  const enabledActions = allActions.filter(action => 
    action.enabled !== false && (!action.requiresData || overview)
  );

  // Handle action execution
  const handleActionClick = async (action: QuickInvestigationAction) => {
    if (loadingAction) return;

    try {
      setLoadingAction(action.id);
      
      await actions.startInvestigation({
        type: action.investigationType,
        scope: action.scope,
        title: action.title,
        description: action.description,
        metadata: {
          source: 'dashboard',
          trigger_data: {
            quick_action: action
          },
          depth_level: 0
        },
        tags: ['quick-action', action.id]
      });
    } catch (error) {
      console.error('Failed to start investigation:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  // Variant styles
  const getVariantClasses = () => {
    switch (variant) {
      case 'horizontal':
        return 'flex space-x-4 overflow-x-auto pb-2';
      case 'vertical':
        return 'flex flex-col space-y-3';
      case 'grid':
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
    }
  };

  // Button variant styles
  const getButtonVariant = (actionVariant: QuickInvestigationAction['variant']) => {
    switch (actionVariant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
      case 'secondary':
      default:
        return 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400';
    }
  };

  if (enabledActions.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className={getVariantClasses()}>
        {enabledActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            disabled={loadingAction === action.id}
            className={`
              relative
              p-4
              border-2
              rounded-xl
              transition-all
              duration-200
              text-left
              group
              ${getButtonVariant(action.variant)}
              ${loadingAction === action.id 
                ? 'scale-95 opacity-75 cursor-not-allowed' 
                : 'hover:scale-105 hover:shadow-lg'
              }
              ${variant === 'horizontal' ? 'flex-shrink-0 w-64' : ''}
            `}
          >
            {/* Loading overlay */}
            {loadingAction === action.id && (
              <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Action content */}
            <div className="flex items-start space-x-3">
              <div className="text-2xl flex-shrink-0">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1 truncate">
                  {action.title}
                </h3>
                {showDescriptions && (
                  <p className="text-xs opacity-75 line-clamp-2">
                    {action.description}
                  </p>
                )}
              </div>
            </div>

            {/* Investigation type indicator */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-xs px-2 py-1 bg-black bg-opacity-20 rounded-full">
                {action.investigationType}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Action count indicator */}
      {contextualActions && (
        <div className="mt-4 text-center">
          <span className="text-xs text-gray-500">
            {enabledActions.length} investigation{enabledActions.length !== 1 ? 's' : ''} available
            {patterns?.patterns && patterns.patterns.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                {patterns.patterns.length} pattern{patterns.patterns.length !== 1 ? 's' : ''} detected
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default QuickInvestigationActions;