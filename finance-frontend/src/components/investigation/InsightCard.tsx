import React, { useState } from 'react';
import { PatternInsight, InvestigationContext as IInvestigationContext } from '../../types';
import { useInvestigation } from '../../contexts/InvestigationContext';

interface InsightCardProps {
  insight: PatternInsight;
  investigation: IInvestigationContext;
  onInvestigate?: (insight: PatternInsight) => void;
  showActions?: boolean;
  expandable?: boolean;
}

const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  investigation,
  onInvestigate,
  showActions = true,
  expandable = true
}) => {
  const { actions } = useInvestigation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(false);

  // Get insight styling based on type and severity
  const getInsightStyling = () => {
    const baseClasses = "rounded-lg border-l-4 p-4 transition-all duration-200";
    
    // Type-based styling
    const typeStyles = {
      anomaly: "bg-red-50 border-red-400",
      trend: "bg-blue-50 border-blue-400", 
      correlation: "bg-purple-50 border-purple-400",
      statistical: "bg-green-50 border-green-400",
      seasonal: "bg-yellow-50 border-yellow-400",
      behavioral: "bg-indigo-50 border-indigo-400"
    };

    // Severity modifiers
    const severityModifiers = {
      high: "shadow-md border-l-8",
      medium: "shadow-sm border-l-6", 
      low: "border-l-4"
    };

    return `${baseClasses} ${typeStyles[insight.type]} ${severityModifiers[insight.severity]}`;
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-700 bg-green-100";
    if (confidence >= 0.6) return "text-yellow-700 bg-yellow-100";
    return "text-red-700 bg-red-100";
  };

  // Get type icon
  const getTypeIcon = (type: PatternInsight['type']) => {
    const icons = {
      anomaly: '⚠️',
      trend: '📈',
      correlation: '🔗',
      statistical: '📊',
      seasonal: '🌤️',
      behavioral: '👤'
    };
    return icons[type] || '💡';
  };

  // Get severity badge
  const getSeverityBadge = (severity: PatternInsight['severity']) => {
    const config = {
      high: { color: 'bg-red-100 text-red-800', label: 'High Priority' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium Priority' },
      low: { color: 'bg-blue-100 text-blue-800', label: 'Low Priority' }
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config[severity].color}`}>
        {config[severity].label}
      </span>
    );
  };

  // Handle investigate action
  const handleInvestigate = async () => {
    if (isInvestigating) return;

    try {
      setIsInvestigating(true);
      
      // Create investigation scope based on insight
      const scope = {
        ...investigation.scope,
        patternType: insight.type,
        anomalyType: insight.type === 'anomaly' ? insight.id : undefined
      };

      await actions.startInvestigation({
        type: 'pattern',
        scope,
        title: `Investigate: ${insight.title}`,
        description: insight.description,
        metadata: {
          source: 'manual',
          trigger_data: { insight },
          depth_level: investigation.metadata.depth_level + 1,
          parent_investigation_id: investigation.id
        },
        tags: ['insight-triggered', insight.type]
      });

      onInvestigate?.(insight);
    } catch (error) {
      console.error('Failed to start insight investigation:', error);
    } finally {
      setIsInvestigating(false);
    }
  };

  return (
    <div className={getInsightStyling()}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getTypeIcon(insight.type)}</span>
          <h4 className="font-semibold text-gray-900">{insight.title}</h4>
        </div>
        
        <div className="flex items-center space-x-2">
          {getSeverityBadge(insight.severity)}
          <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(insight.confidence)}`}>
            {Math.round(insight.confidence * 100)}% confidence
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Description */}
        <p className="text-gray-700">{insight.description}</p>
        
        {/* Expandable explanation */}
        {expandable && insight.explanation && (
          <div>
            {isExpanded ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{insight.explanation}</p>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Show less ↑
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Show detailed explanation ↓
              </button>
            )}
          </div>
        )}

        {/* Supporting data */}
        {insight.supporting_data && Object.keys(insight.supporting_data).length > 0 && (
          <div className="bg-white bg-opacity-50 rounded-md p-3">
            <div className="text-xs text-gray-600 mb-2">Supporting Data:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(insight.supporting_data).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600">{key}:</span>
                  <span className="font-medium">
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual evidence preview */}
        {insight.visual_evidence && (
          <div className="bg-white bg-opacity-50 rounded-md p-3">
            <div className="text-xs text-gray-600 mb-2">Visual Evidence:</div>
            <div className="h-16 bg-gray-200 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-gray-500 text-xs">
                📊 {insight.visual_evidence.chart_type} chart
              </span>
            </div>
          </div>
        )}

        {/* Related patterns */}
        {insight.related_patterns && insight.related_patterns.length > 0 && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Related patterns:</span>
            {' '}
            {insight.related_patterns.join(', ')}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="mt-4 pt-3 border-t border-gray-200 border-opacity-50">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={handleInvestigate}
                disabled={isInvestigating}
                className={`
                  inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-all duration-150
                  ${isInvestigating
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                  }
                `}
              >
                {isInvestigating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent mr-2"></div>
                    Investigating...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    Investigate Further
                  </>
                )}
              </button>

              <button className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                Save
              </button>
            </div>

            {/* Insight metadata */}
            <div className="text-xs text-gray-500">
              <span className="capitalize">{insight.type}</span> insight
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightCard;