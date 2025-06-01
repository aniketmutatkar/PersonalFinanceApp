import React, { useState } from 'react';
import { DrillDownOption, InvestigationContext as IInvestigationContext } from '../../types';
import { useInvestigation } from '../../contexts/InvestigationContext';

interface DrillDownOptionsProps {
  options: DrillDownOption[];
  onDrillDown?: (optionId: string) => void;
  layout?: 'grid' | 'list' | 'horizontal';
  showPreview?: boolean;
  maxOptions?: number;
}

const DrillDownOptions: React.FC<DrillDownOptionsProps> = ({
  options,
  onDrillDown,
  layout = 'grid',
  showPreview = true,
  maxOptions = 6
}) => {
  const { actions } = useInvestigation();
  const [executingOption, setExecutingOption] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Filter and limit options
  const displayOptions = showAll ? options : options.slice(0, maxOptions);

  // Handle drill down execution
  const handleDrillDown = async (option: DrillDownOption) => {
    if (executingOption) return;

    try {
      setExecutingOption(option.id);
      
      await actions.drillDown(option);
      onDrillDown?.(option.id);
    } catch (error) {
      console.error('Failed to execute drill down:', error);
    } finally {
      setExecutingOption(null);
    }
  };

  // Get complexity styling
  const getComplexityBadge = (complexity: DrillDownOption['estimated_complexity']) => {
    const config = {
      simple: { color: 'bg-green-100 text-green-800', icon: '🟢', label: 'Quick' },
      moderate: { color: 'bg-yellow-100 text-yellow-800', icon: '🟡', label: 'Moderate' },
      complex: { color: 'bg-red-100 text-red-800', icon: '🔴', label: 'Complex' }
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config[complexity].color}`}>
        <span className="mr-1">{config[complexity].icon}</span>
        {config[complexity].label}
      </span>
    );
  };

  // Get investigation type icon
  const getInvestigationTypeIcon = (type: IInvestigationContext['type']) => {
    const icons = {
      category: '🏷️',
      monthly: '📅',
      anomaly: '⚠️',
      pattern: '🔍',
      transaction: '💳',
      comparison: '⚖️',
      trend: '📈'
    };
    return icons[type] || '📊';
  };

  // Layout classes
  const getLayoutClasses = () => {
    switch (layout) {
      case 'list':
        return 'space-y-3';
      case 'horizontal':
        return 'flex space-x-4 overflow-x-auto pb-2';
      case 'grid':
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
    }
  };

  if (options.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">🎯</div>
        <p>No drill-down options available</p>
        <p className="text-sm mt-2">More options may become available as the investigation progresses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Options grid/list */}
      <div className={getLayoutClasses()}>
        {displayOptions.map((option) => (
          <DrillDownOptionCard
            key={option.id}
            option={option}
            isExecuting={executingOption === option.id}
            onExecute={() => handleDrillDown(option)}
            showPreview={showPreview}
            layout={layout}
          />
        ))}
      </div>

      {/* Show more/less button */}
      {options.length > maxOptions && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            {showAll ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Show less
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Show {options.length - maxOptions} more options
              </>
            )}
          </button>
        </div>
      )}

      {/* Summary stats */}
      <div className="text-center text-xs text-gray-500">
        {options.length} drill-down option{options.length !== 1 ? 's' : ''} available
        {executingOption && (
          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
            <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-1"></div>
            Executing investigation...
          </span>
        )}
      </div>
    </div>
  );
};

// Individual drill-down option card
const DrillDownOptionCard: React.FC<{
  option: DrillDownOption;
  isExecuting: boolean;
  onExecute: () => void;
  showPreview: boolean;
  layout: 'grid' | 'list' | 'horizontal';
}> = ({ option, isExecuting, onExecute, showPreview, layout }) => {
  
  const getInvestigationTypeIcon = (type: IInvestigationContext['type']) => {
    const icons = {
      category: '🏷️',
      monthly: '📅',
      anomaly: '⚠️',
      pattern: '🔍',
      transaction: '💳',
      comparison: '⚖️',
      trend: '📈'
    };
    return icons[type] || '📊';
  };

  const getComplexityBadge = (complexity: DrillDownOption['estimated_complexity']) => {
    const config = {
      simple: { color: 'bg-green-100 text-green-800', icon: '🟢', label: 'Quick' },
      moderate: { color: 'bg-yellow-100 text-yellow-800', icon: '🟡', label: 'Moderate' },
      complex: { color: 'bg-red-100 text-red-800', icon: '🔴', label: 'Complex' }
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config[complexity].color}`}>
        <span className="mr-1">{config[complexity].icon}</span>
        {config[complexity].label}
      </span>
    );
  };

  // Card styling based on layout
  const getCardClasses = () => {
    const baseClasses = `
      relative
      bg-white
      border-2
      border-gray-200
      rounded-xl
      p-4
      transition-all
      duration-200
      cursor-pointer
      group
      hover:border-blue-300
      hover:shadow-lg
      ${isExecuting ? 'scale-95 opacity-75 cursor-not-allowed' : 'hover:scale-105'}
    `;
    
    if (layout === 'horizontal') {
      return `${baseClasses} flex-shrink-0 w-72`;
    }
    
    return baseClasses;
  };

  return (
    <div className={getCardClasses()} onClick={onExecute}>
      {/* Loading overlay */}
      {isExecuting && (
        <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center z-10">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-sm font-medium text-gray-600">Starting investigation...</span>
          </div>
        </div>
      )}

      {/* Card content */}
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{getInvestigationTypeIcon(option.investigation_type)}</span>
            <h4 className="font-semibold text-gray-900 text-sm">{option.title}</h4>
          </div>
          {getComplexityBadge(option.estimated_complexity)}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">{option.description}</p>

        {/* Preview data */}
        {showPreview && option.preview_data && (
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-xs text-gray-600 mb-2">Preview:</div>
            <div className="text-xs text-gray-700">
              {typeof option.preview_data === 'object' 
                ? Object.entries(option.preview_data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))
                : String(option.preview_data)
              }
            </div>
          </div>
        )}

        {/* Scope information */}
        <div className="text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>Type: {option.investigation_type}</span>
            {option.scope.category && (
              <span>Category: {option.scope.category}</span>
            )}
            {option.scope.month && (
              <span>Month: {option.scope.month}</span>
            )}
          </div>
        </div>

        {/* Action hint */}
        <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Click to start this investigation →
        </div>
      </div>
    </div>
  );
};

export default DrillDownOptions;