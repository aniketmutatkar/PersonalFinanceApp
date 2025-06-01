import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useInvestigation } from '../../contexts/InvestigationContext';
import { useInvestigationResults } from '../../hooks/useApi';
import InvestigationResults from '../investigation/InvestigationResults';
import InsightCard from '../investigation/InsightCard';
import DrillDownOptions from '../investigation/DrillDownOptions';

interface InvestigationPanelProps {
  className?: string;
}

type TabType = 'overview' | 'insights' | 'data' | 'suggestions' | 'history';

const InvestigationPanel: React.FC<InvestigationPanelProps> = ({ className = '' }) => {
  const { state, actions } = useInvestigation();
  const { isOpen, width, position } = state.investigationPanel;
  const { currentInvestigation } = state;
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Get investigation results - but handle errors gracefully
  const { results: investigationResults, loading: resultsLoading, error: resultsError } = 
    useInvestigationResults(currentInvestigation);

  // Handle panel resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = window.innerWidth - e.clientX;
    const constrainedWidth = Math.max(400, Math.min(800, newWidth)); // Better min width
    actions.setPanelWidth(constrainedWidth);
  }, [isResizing, actions]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Mouse event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Reset to overview tab when investigation changes
  useEffect(() => {
    if (currentInvestigation) {
      setActiveTab('overview');
    }
  }, [currentInvestigation?.id]);

  // Handle drill down from results
  const handleDrillDown = useCallback((optionId: string) => {
    console.log('Drill down executed:', optionId);
  }, []);

  // Handle investigation actions
  const handleBookmark = useCallback(() => {
    if (currentInvestigation) {
      actions.bookmarkInvestigation();
    }
  }, [currentInvestigation, actions]);

  const handleShare = useCallback(() => {
    if (currentInvestigation) {
      try {
        const shareUrl = actions.shareInvestigation({
          include_raw_data: false,
          include_charts: true,
          include_insights: true,
          include_recommendations: true,
          format: 'url',
          access_level: 'public'
        });
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
          console.log('Investigation URL copied to clipboard');
        });
      } catch (error) {
        console.error('Failed to share investigation:', error);
      }
    }
  }, [currentInvestigation, actions]);

  const handleExport = useCallback(() => {
    console.log('Export investigation results');
  }, []);

  // Handle close - this was broken!
  const handleClose = useCallback(() => {
    actions.completeInvestigation();
  }, [actions]);

  if (!isOpen || !currentInvestigation) {
    return null;
  }

  // Tab configuration
  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { id: 'insights' as TabType, label: 'Insights', icon: '💡' },
    { id: 'data' as TabType, label: 'Data', icon: '📈' },
    { id: 'suggestions' as TabType, label: 'Suggestions', icon: '🎯' },
    { id: 'history' as TabType, label: 'History', icon: '🕒' }
  ];

  // Render tab content with better error handling
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-6">
            {resultsError ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Investigation Analysis Pending</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Investigation system is being enhanced. Showing basic investigation info for now.
                    </p>
                  </div>
                </div>
                
                {/* Show basic investigation info */}
                <div className="mt-4 bg-white rounded p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Investigation Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Type:</strong> {currentInvestigation.type}</div>
                    <div><strong>Scope:</strong> {JSON.stringify(currentInvestigation.scope, null, 2)}</div>
                    <div><strong>Started:</strong> {new Date(currentInvestigation.startedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <InvestigationResults
                investigation={currentInvestigation}
                results={investigationResults}
                loading={resultsLoading}
                error={resultsError}
                onDrillDown={handleDrillDown}
                onBookmark={handleBookmark}
                onShare={handleShare}
                onExport={handleExport}
              />
            )}
          </div>
        );
      
      case 'insights':
        return (
          <div className="p-6">
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-4">💡</div>
              <p className="text-lg font-medium">Insights Coming Soon</p>
              <p className="text-sm mt-2">Advanced insights will be available once the investigation analysis is complete.</p>
            </div>
          </div>
        );
      
      case 'data':
        return (
          <div className="p-6">
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-lg font-medium">Data Analysis Coming Soon</p>
              <p className="text-sm mt-2">Detailed data visualization will be available once the investigation analysis is complete.</p>
            </div>
          </div>
        );
      
      case 'suggestions':
        return (
          <div className="p-6">
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-lg font-medium">Suggestions Coming Soon</p>
              <p className="text-sm mt-2">Investigation suggestions will be available once the analysis is complete.</p>
            </div>
          </div>
        );
      
      case 'history':
        return (
          <div className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Investigation History</h3>
              
              {state.recentInvestigations.slice(0, 10).map((investigation) => (
                <div key={investigation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{investigation.title}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="capitalize">{investigation.type}</span> investigation
                        {investigation.scope.category && (
                          <span> • {investigation.scope.category}</span>
                        )}
                        {investigation.scope.month && (
                          <span> • {investigation.scope.month}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Started: {new Date(investigation.startedAt).toLocaleString()}
                      </div>
                    </div>
                    <button className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors">
                      Revisit
                    </button>
                  </div>
                </div>
              ))}
              
              {state.recentInvestigations.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-4xl mb-4">🕒</div>
                  <p>No recent investigations</p>
                  <p className="text-sm mt-2">Your investigation history will appear here.</p>
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {/* Resize handle - improved positioning */}
      <div
        className="fixed top-0 bottom-0 w-2 bg-transparent hover:bg-blue-200 cursor-col-resize z-50 transition-colors duration-150"
        style={{ 
          right: width - 2,
          cursor: isResizing ? 'col-resize' : 'col-resize'
        }}
        onMouseDown={handleMouseDown}
      />

      {/* Panel - improved sizing */}
      <div
        ref={panelRef}
        className={`
          fixed
          top-0
          bottom-0
          right-0
          bg-white
          border-l
          border-gray-200
          shadow-xl
          z-40
          flex
          flex-col
          transition-transform
          duration-300
          ease-in-out
          ${className}
        `}
        style={{ 
          width: `${Math.max(400, width)}px`, // Better minimum width
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
        }}
      >
        {/* Panel Header - improved close button */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {currentInvestigation.title}
              </h2>
              <div className="flex items-center space-x-2">
                {/* Position toggle */}
                <button
                  onClick={() => actions.setPanelPosition(position === 'right' ? 'bottom' : 'right')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                  title="Change panel position"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Close button - FIXED! */}
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                  title="Close investigation"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Investigation metadata */}
            <div className="mt-2 text-sm text-gray-500">
              <span className="capitalize">{currentInvestigation.type}</span> investigation
              {currentInvestigation.scope.category && (
                <span> • Category: {currentInvestigation.scope.category}</span>
              )}
              {currentInvestigation.scope.month && (
                <span> • Month: {currentInvestigation.scope.month}</span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6">
            <nav className="flex space-x-8" aria-label="Investigation tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-150
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </>
  );
};

export default InvestigationPanel;