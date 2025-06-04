// src/components/budget/BudgetTable.tsx
import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface BudgetTableProps {
  data: any;
  type: 'yearly' | 'monthly';
  year?: number;
  monthYear?: string;
}

export default function BudgetTable({ data, type, year, monthYear }: BudgetTableProps) {
  const { alerts, summary } = useMemo(() => {
    if (type === 'monthly') {
      // Monthly view - show over-budget categories and alerts
      const overBudgetItems = (data.budget_items || [])
        .filter((item: any) => item.is_over_budget)
        .sort((a: any, b: any) => Math.abs(b.variance) - Math.abs(a.variance));

      const alerts = overBudgetItems.map((item: any) => ({
        type: 'over_budget',
        category: item.category,
        message: `${item.category} is $${Math.abs(item.variance).toFixed(0)} over budget`,
        severity: Math.abs(item.variance) > item.budget_amount * 0.2 ? 'high' : 'medium',
        variance: item.variance,
        percentOver: ((Math.abs(item.variance) / item.budget_amount) * 100).toFixed(1)
      }));

      const onTrackCount = (data.budget_items || []).filter((item: any) => !item.is_over_budget).length;
      const totalCategories = (data.budget_items || []).length;

      return {
        alerts,
        summary: {
          onTrackCount,
          totalCategories,
          overBudgetCount: overBudgetItems.length,
          totalVariance: data.total_variance || 0
        }
      };
    } else {
      // Yearly view - show problematic categories across the year
      const months = data.months || [];
      const budgetData = data.budget_data || {};
      
      // Analyze which categories are frequently over budget
      const categoryAnalysis: { [key: string]: { overCount: number, totalVariance: number, months: number } } = {};
      
      months.forEach((month: string) => {
        const monthData = budgetData[month] || {};
        Object.entries(monthData).forEach(([category, item]: [string, any]) => {
          if (!categoryAnalysis[category]) {
            categoryAnalysis[category] = { overCount: 0, totalVariance: 0, months: 0 };
          }
          categoryAnalysis[category].months++;
          categoryAnalysis[category].totalVariance += Number(item.variance) || 0; // Convert to number
          if (item.is_over_budget) {
            categoryAnalysis[category].overCount++;
          }
        });
      });

      // Create alerts for frequently problematic categories
      const alerts = Object.entries(categoryAnalysis)
        .filter(([_, analysis]) => analysis.overCount > 0)
        .map(([category, analysis]) => {
          const overPercentage = (analysis.overCount / analysis.months) * 100;
          const avgVariance = analysis.totalVariance / analysis.months;
          
          return {
            type: 'frequent_over_budget',
            category,
            message: `${category} over budget in ${analysis.overCount}/${analysis.months} months`,
            severity: overPercentage > 50 ? 'high' : overPercentage > 25 ? 'medium' : 'low',
            overPercentage: overPercentage.toFixed(1), // Keep as string for display
            avgVariance,
            overCount: analysis.overCount,
            totalMonths: analysis.months
          };
        })
        .sort((a, b) => Number(b.overPercentage) - Number(a.overPercentage));

      const totalCategoryMonths = Object.values(categoryAnalysis).reduce((sum, analysis) => sum + analysis.months, 0);
      const overBudgetInstances = Object.values(categoryAnalysis).reduce((sum, analysis) => sum + analysis.overCount, 0);

      return {
        alerts,
        summary: {
          totalCategoryMonths,
          overBudgetInstances,
          adherenceRate: totalCategoryMonths > 0 ? ((totalCategoryMonths - overBudgetInstances) / totalCategoryMonths) * 100 : 100,
          monthsAnalyzed: months.length
        }
      };
    }
  }, [data, type]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-yellow-400" />;
      case 'low':
        return <TrendingDown className="h-4 w-4 text-blue-400" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-blue-400';
      default:
        return 'text-green-400';
    }
  };

  const title = type === 'monthly' ? 'Budget Alerts' : 'Yearly Budget Issues';

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-white font-semibold text-base">{title}</h3>
        <p className="text-gray-400 text-sm mt-1">
          {type === 'monthly' 
            ? `${summary.overBudgetCount} of ${summary.totalCategories} categories over budget`
            : `${summary.overBudgetInstances} over-budget instances across ${summary.monthsAnalyzed} months`
          }
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        {type === 'monthly' ? (
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">Budget Status</span>
            <div className="flex items-center space-x-2">
              {summary.overBudgetCount === 0 ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">All on track</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 text-sm font-medium">
                    {summary.overBudgetCount} over budget
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300 text-sm">Overall Adherence</span>
              <span className="text-white text-sm font-medium">
                {(summary.adherenceRate || 0).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300 text-sm">Problem Categories</span>
              <span className="text-yellow-400 text-sm font-medium">
                {alerts.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Alerts List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-center">
            <div>
              <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 text-sm">
                {type === 'monthly' ? 'All categories on budget!' : 'Great budget adherence!'}
              </p>
            </div>
          </div>
        ) : (
          alerts.map((alert: any, index: number) => (
            <div 
              key={index}
              className="flex items-start space-x-3 p-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getSeverityIcon(alert.severity)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-medium truncate">
                    {alert.category}
                  </p>
                  {type === 'monthly' ? (
                    <span className="text-red-400 text-xs font-medium">
                      +{alert.percentOver}%
                    </span>
                  ) : (
                    <span className="text-yellow-400 text-xs">
                      {alert.overCount}/{alert.totalMonths}
                    </span>
                  )}
                </div>
                
                <p className={`text-xs mt-1 ${getSeverityColor(alert.severity)}`}>
                  {alert.message}
                </p>
                
                {type === 'monthly' && alert.variance && (
                  <p className="text-gray-400 text-xs mt-1">
                    {formatCurrency(alert.variance)} over budget
                  </p>
                )}
                
                {type === 'yearly' && alert.avgVariance && (
                  <p className="text-gray-400 text-xs mt-1">
                    Avg: {formatCurrency(alert.avgVariance)} 
                    {alert.avgVariance < 0 ? ' over' : ' under'} per month
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Suggestions */}
      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <p className="text-gray-400 text-xs">
            {type === 'monthly' 
              ? 'Consider adjusting spending or revising budgets for flagged categories'
              : 'Focus on categories with frequent budget overruns'
            }
          </p>
        </div>
      )}
    </div>
  );
}