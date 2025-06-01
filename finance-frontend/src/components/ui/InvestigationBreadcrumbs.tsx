import React from 'react';
import { useInvestigation } from '../../contexts/InvestigationContext';
import { BreadcrumbItem } from '../../types';

interface InvestigationBreadcrumbsProps {
  className?: string;
  showInvestigationStatus?: boolean;
}

const InvestigationBreadcrumbs: React.FC<InvestigationBreadcrumbsProps> = ({
  className = '',
  showInvestigationStatus = true
}) => {
  const { state, actions } = useInvestigation();
  const { currentInvestigation, isInvestigating } = state;

  if (!currentInvestigation || !currentInvestigation.breadcrumbs.length) {
    return null;
  }

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (breadcrumb: BreadcrumbItem) => {
    if (!breadcrumb.clickable) return;
    
    if (breadcrumb.id === 'dashboard') {
      // Navigate to dashboard and close investigation
      actions.completeInvestigation();
    } else {
      // Navigate to specific investigation in history
      actions.navigateToBreadcrumb(breadcrumb.id);
    }
  };

  // Get investigation type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'category': return '🏷️';
      case 'monthly': return '📅';
      case 'anomaly': return '⚠️';
      case 'pattern': return '🔍';
      case 'transaction': return '💳';
      case 'comparison': return '⚖️';
      case 'trend': return '📈';
      default: return '📊';
    }
  };

  // Get investigation status
  const getInvestigationStatus = () => {
    if (!showInvestigationStatus) return null;

    const statusConfig = {
      investigating: {
        icon: '🔄',
        text: 'Investigating...',
        color: 'text-blue-600 bg-blue-100'
      },
      complete: {
        icon: '✅',
        text: 'Complete',
        color: 'text-green-600 bg-green-100'
      },
      error: {
        icon: '❌',
        text: 'Error',
        color: 'text-red-600 bg-red-100'
      }
    };

    const status = isInvestigating ? 'investigating' : 'complete';
    const config = statusConfig[status];

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </div>
    );
  };

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Investigation breadcrumb">
      {/* Investigation status */}
      {showInvestigationStatus && (
        <div className="mr-3">
          {getInvestigationStatus()}
        </div>
      )}

      {/* Breadcrumb items */}
      <ol className="inline-flex items-center space-x-1">
        {currentInvestigation.breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.id} className="inline-flex items-center">
            {/* Separator */}
            {index > 0 && (
              <svg 
                className="w-4 h-4 text-gray-400 mx-1" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}

            {/* Breadcrumb item */}
            <div className="inline-flex items-center">
              {breadcrumb.clickable ? (
                <button
                  onClick={() => handleBreadcrumbClick(breadcrumb)}
                  className={`
                    inline-flex items-center px-2 py-1 rounded-md text-sm font-medium transition-colors duration-150
                    ${breadcrumb.active 
                      ? 'text-blue-600 bg-blue-100' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="mr-1">
                    {breadcrumb.id === 'dashboard' ? '🏠' : getTypeIcon(breadcrumb.investigationType)}
                  </span>
                  <span className="truncate max-w-32">
                    {breadcrumb.label}
                  </span>
                </button>
              ) : (
                <span className={`
                  inline-flex items-center px-2 py-1 rounded-md text-sm font-medium
                  ${breadcrumb.active 
                    ? 'text-blue-600 bg-blue-100' 
                    : 'text-gray-500'
                  }
                `}>
                  <span className="mr-1">
                    {breadcrumb.id === 'dashboard' ? '🏠' : getTypeIcon(breadcrumb.investigationType)}
                  </span>
                  <span className="truncate max-w-32">
                    {breadcrumb.label}
                  </span>
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* Investigation metadata */}
      <div className="ml-4 text-xs text-gray-500">
        <span>Depth: {currentInvestigation.metadata.depth_level}</span>
        {currentInvestigation.lastUpdated && (
          <span className="ml-2">
            Updated: {new Date(currentInvestigation.lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>
    </nav>
  );
};

export default InvestigationBreadcrumbs;