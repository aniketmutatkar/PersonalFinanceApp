import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  InvestigationContext as IInvestigationContext,
  InvestigationState,
  InvestigationAction,
  InvestigationScope,
  BreadcrumbItem,
  DrillDownOption,
  InvestigationFilter,
  BookmarkedInvestigation,
  InvestigationShareConfig
} from '../types';

// ==================== Investigation State Management ====================

interface InvestigationContextValue {
  state: InvestigationState;
  actions: {
    startInvestigation: (config: Partial<IInvestigationContext>) => Promise<IInvestigationContext>;
    updateInvestigation: (updates: Partial<IInvestigationContext>) => void;
    completeInvestigation: () => void;
    drillDown: (drillDownOption: DrillDownOption) => Promise<IInvestigationContext>;
    addFilter: (filter: InvestigationFilter) => void;
    removeFilter: (filterId: string) => void;
    navigateToBreadcrumb: (breadcrumbId: string) => void;
    bookmarkInvestigation: (notes?: string, customTitle?: string) => void;
    shareInvestigation: (shareConfig: InvestigationShareConfig) => string;
    clearHistory: () => void;
    togglePanel: () => void;
    setPanelPosition: (position: 'right' | 'bottom') => void;
    setPanelWidth: (width: number) => void;
  };
  utils: {
    generateInvestigationId: () => string;
    buildBreadcrumbs: (context: IInvestigationContext) => BreadcrumbItem[];
    createInvestigationUrl: (context: IInvestigationContext) => string;
    parseInvestigationUrl: (url: string) => Partial<IInvestigationContext> | null;
    getInvestigationFromHistory: (id: string) => IInvestigationContext | null;
  };
}

// ==================== Initial State ====================

const initialState: InvestigationState = {
  currentInvestigation: null,
  isInvestigating: false,
  investigationPanel: {
    isOpen: false,
    width: 400,
    position: 'right'
  },
  history: [],
  bookmarks: [],
  recentInvestigations: [],
  investigationCache: {}
};

// ==================== Investigation Reducer ====================

type InvestigationActionType = 
  | 'START_INVESTIGATION'
  | 'UPDATE_INVESTIGATION'
  | 'COMPLETE_INVESTIGATION'
  | 'DRILL_DOWN'
  | 'ADD_FILTER'
  | 'REMOVE_FILTER'
  | 'NAVIGATE_BREADCRUMB'
  | 'BOOKMARK_INVESTIGATION'
  | 'TOGGLE_PANEL'
  | 'SET_PANEL_POSITION'
  | 'SET_PANEL_WIDTH'
  | 'CLEAR_HISTORY'
  | 'LOAD_FROM_URL';

interface InvestigationReducerAction {
  type: InvestigationActionType;
  payload?: any;
}

const investigationReducer = (
  state: InvestigationState,
  action: InvestigationReducerAction
): InvestigationState => {
  switch (action.type) {
    case 'START_INVESTIGATION': {
      const investigation = action.payload as IInvestigationContext;
      
      // Add to history if not already there
      const updatedHistory = state.history.filter(h => h.id !== investigation.id);
      updatedHistory.unshift(investigation);
      
      // Keep only last 50 investigations in history
      const trimmedHistory = updatedHistory.slice(0, 50);
      
      // Update recent investigations (last 10)
      const recentInvestigations = [
        investigation,
        ...state.recentInvestigations.filter(r => r.id !== investigation.id)
      ].slice(0, 10);

      return {
        ...state,
        currentInvestigation: investigation,
        isInvestigating: true,
        investigationPanel: {
          ...state.investigationPanel,
          isOpen: true
        },
        history: trimmedHistory,
        recentInvestigations
      };
    }

    case 'UPDATE_INVESTIGATION': {
      if (!state.currentInvestigation) return state;
      
      const updates = action.payload as Partial<IInvestigationContext>;
      const updatedInvestigation = {
        ...state.currentInvestigation,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      // Update in history as well
      const updatedHistory = state.history.map(h => 
        h.id === updatedInvestigation.id ? updatedInvestigation : h
      );

      return {
        ...state,
        currentInvestigation: updatedInvestigation,
        history: updatedHistory
      };
    }

    case 'COMPLETE_INVESTIGATION': {
      return {
        ...state,
        currentInvestigation: null,
        isInvestigating: false,
        investigationPanel: {
          ...state.investigationPanel,
          isOpen: false
        }
      };
    }

    case 'DRILL_DOWN': {
      const childInvestigation = action.payload as IInvestigationContext;
      
      // Update parent to include child reference
      if (state.currentInvestigation) {
        const updatedParent = {
          ...state.currentInvestigation,
          metadata: {
            ...state.currentInvestigation.metadata,
            child_investigation_ids: [
              ...(state.currentInvestigation.metadata.child_investigation_ids || []),
              childInvestigation.id
            ]
          }
        };

        // Update parent in history
        const updatedHistory = state.history.map(h => 
          h.id === updatedParent.id ? updatedParent : h
        );

        // Add child to history
        const finalHistory = [childInvestigation, ...updatedHistory];

        return {
          ...state,
          currentInvestigation: childInvestigation,
          history: finalHistory
        };
      }

      return state;
    }

    case 'ADD_FILTER': {
      if (!state.currentInvestigation) return state;
      
      const filter = action.payload as InvestigationFilter;
      const currentFilters = state.currentInvestigation.scope.filters || [];
      
      // Remove existing filter with same id if it exists
      const updatedFilters = [
        ...currentFilters.filter(f => f.id !== filter.id),
        filter
      ];

      const updatedInvestigation = {
        ...state.currentInvestigation,
        scope: {
          ...state.currentInvestigation.scope,
          filters: updatedFilters
        },
        lastUpdated: new Date().toISOString()
      };

      return {
        ...state,
        currentInvestigation: updatedInvestigation
      };
    }

    case 'REMOVE_FILTER': {
      if (!state.currentInvestigation) return state;
      
      const filterId = action.payload as string;
      const currentFilters = state.currentInvestigation.scope.filters || [];
      
      const updatedFilters = currentFilters.filter(f => f.id !== filterId);

      const updatedInvestigation = {
        ...state.currentInvestigation,
        scope: {
          ...state.currentInvestigation.scope,
          filters: updatedFilters
        },
        lastUpdated: new Date().toISOString()
      };

      return {
        ...state,
        currentInvestigation: updatedInvestigation
      };
    }

    case 'NAVIGATE_BREADCRUMB': {
      const breadcrumbId = action.payload as string;
      
      // Find the investigation from history
      const targetInvestigation = state.history.find(h => h.id === breadcrumbId);
      
      if (!targetInvestigation) return state;

      return {
        ...state,
        currentInvestigation: targetInvestigation,
        investigationPanel: {
          ...state.investigationPanel,
          isOpen: true
        }
      };
    }

    case 'BOOKMARK_INVESTIGATION': {
      if (!state.currentInvestigation) return state;
      
      const { notes, customTitle } = action.payload || {};
      
      const bookmark: BookmarkedInvestigation = {
        id: `bookmark_${Date.now()}`,
        investigation: state.currentInvestigation,
        bookmarked_at: new Date().toISOString(),
        notes,
        custom_title: customTitle,
        tags: []
      };

      return {
        ...state,
        bookmarks: [bookmark, ...state.bookmarks]
      };
    }

    case 'TOGGLE_PANEL': {
      return {
        ...state,
        investigationPanel: {
          ...state.investigationPanel,
          isOpen: !state.investigationPanel.isOpen
        }
      };
    }

    case 'SET_PANEL_POSITION': {
      const position = action.payload as 'right' | 'bottom';
      return {
        ...state,
        investigationPanel: {
          ...state.investigationPanel,
          position
        }
      };
    }

    case 'SET_PANEL_WIDTH': {
      const width = action.payload as number;
      return {
        ...state,
        investigationPanel: {
          ...state.investigationPanel,
          width: Math.max(300, Math.min(800, width)) // Constrain between 300-800px
        }
      };
    }

    case 'CLEAR_HISTORY': {
      return {
        ...state,
        history: [],
        recentInvestigations: []
      };
    }

    case 'LOAD_FROM_URL': {
      const investigation = action.payload as IInvestigationContext;
      return {
        ...state,
        currentInvestigation: investigation,
        isInvestigating: true,
        investigationPanel: {
          ...state.investigationPanel,
          isOpen: true
        }
      };
    }

    default:
      return state;
  }
};

// ==================== Context Creation ====================

const InvestigationContext = createContext<InvestigationContextValue | undefined>(undefined);

// ==================== Provider Component ====================

interface InvestigationProviderProps {
  children: React.ReactNode;
}

export const InvestigationProvider: React.FC<InvestigationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(investigationReducer, initialState);
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== Utility Functions ====================

  const generateInvestigationId = useCallback((): string => {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const buildBreadcrumbs = useCallback((context: IInvestigationContext): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        investigationType: 'monthly',
        scope: {},
        active: false,
        clickable: true
      }
    ];

    // Add parent investigations if this is a drill-down
    if (context.metadata.parent_investigation_id) {
      const parent = state.history.find(h => h.id === context.metadata.parent_investigation_id);
      if (parent) {
        breadcrumbs.push({
          id: parent.id,
          label: parent.title,
          investigationType: parent.type,
          scope: parent.scope,
          active: false,
          clickable: true
        });
      }
    }

    // Add current investigation
    breadcrumbs.push({
      id: context.id,
      label: context.title,
      investigationType: context.type,
      scope: context.scope,
      active: true,
      clickable: false
    });

    return breadcrumbs;
  }, [state.history]);

  const createInvestigationUrl = useCallback((context: IInvestigationContext): string => {
    const params = new URLSearchParams();
    params.set('type', context.type);
    params.set('id', context.id);
    
    if (context.scope.category) params.set('category', context.scope.category);
    if (context.scope.month) params.set('month', context.scope.month);
    if (context.scope.year) params.set('year', context.scope.year.toString());
    if (context.scope.dateRange) {
      params.set('start', context.scope.dateRange.start);
      params.set('end', context.scope.dateRange.end);
    }

    return `/investigate?${params.toString()}`;
  }, []);

  const parseInvestigationUrl = useCallback((url: string): Partial<IInvestigationContext> | null => {
    try {
      const urlObj = new URL(url, window.location.origin);
      const params = urlObj.searchParams;

      if (!params.get('type')) return null;

      const scope: InvestigationScope = {};
      
      if (params.get('category')) scope.category = params.get('category')!;
      if (params.get('month')) scope.month = params.get('month')!;
      if (params.get('year')) scope.year = parseInt(params.get('year')!);
      if (params.get('start') && params.get('end')) {
        scope.dateRange = {
          start: params.get('start')!,
          end: params.get('end')!
        };
      }

      return {
        id: params.get('id') || generateInvestigationId(),
        type: params.get('type') as IInvestigationContext['type'],
        scope,
        title: `Investigation: ${params.get('type')}`,
        startedAt: new Date().toISOString(),
        metadata: {
          source: 'manual',
          depth_level: 0
        },
        tags: []
      };
    } catch {
      return null;
    }
  }, [generateInvestigationId]);

  const getInvestigationFromHistory = useCallback((id: string): IInvestigationContext | null => {
    return state.history.find(h => h.id === id) || null;
  }, [state.history]);

  // ==================== Action Functions ====================

  const startInvestigation = useCallback(async (
    config: Partial<IInvestigationContext>
  ): Promise<IInvestigationContext> => {
    const investigationId = config.id || generateInvestigationId();
    
    const investigation: IInvestigationContext = {
      id: investigationId,
      type: config.type || 'monthly',
      scope: config.scope || {},
      title: config.title || 'Investigation',
      description: config.description,
      startedAt: new Date().toISOString(),
      breadcrumbs: [],
      metadata: {
        source: config.metadata?.source || 'manual',
        trigger_data: config.metadata?.trigger_data,
        depth_level: config.metadata?.depth_level || 0,
        parent_investigation_id: config.metadata?.parent_investigation_id,
        child_investigation_ids: []
      },
      tags: config.tags || [],
      ...config
    };

    // Build breadcrumbs
    investigation.breadcrumbs = buildBreadcrumbs(investigation);

    // Update URL
    const investigationUrl = createInvestigationUrl(investigation);
    navigate(investigationUrl, { replace: false });

    // Dispatch action
    dispatch({ type: 'START_INVESTIGATION', payload: investigation });

    return investigation;
  }, [generateInvestigationId, buildBreadcrumbs, createInvestigationUrl, navigate]);

  const updateInvestigation = useCallback((updates: Partial<IInvestigationContext>) => {
    dispatch({ type: 'UPDATE_INVESTIGATION', payload: updates });
  }, []);

  const completeInvestigation = useCallback(() => {
    // Navigate back to dashboard
    navigate('/dashboard', { replace: true });
    dispatch({ type: 'COMPLETE_INVESTIGATION' });
  }, [navigate]);

  const drillDown = useCallback(async (drillDownOption: DrillDownOption): Promise<IInvestigationContext> => {
    if (!state.currentInvestigation) {
      throw new Error('No current investigation to drill down from');
    }

    const childInvestigation = await startInvestigation({
      type: drillDownOption.investigation_type,
      scope: drillDownOption.scope,
      title: drillDownOption.title,
      metadata: {
        source: 'manual',
        depth_level: state.currentInvestigation.metadata.depth_level + 1,
        parent_investigation_id: state.currentInvestigation.id
      }
    });

    dispatch({ type: 'DRILL_DOWN', payload: childInvestigation });

    return childInvestigation;
  }, [state.currentInvestigation, startInvestigation]);

  const addFilter = useCallback((filter: InvestigationFilter) => {
    dispatch({ type: 'ADD_FILTER', payload: filter });
  }, []);

  const removeFilter = useCallback((filterId: string) => {
    dispatch({ type: 'REMOVE_FILTER', payload: filterId });
  }, []);

  const navigateToBreadcrumb = useCallback((breadcrumbId: string) => {
    const targetInvestigation = getInvestigationFromHistory(breadcrumbId);
    if (targetInvestigation) {
      const investigationUrl = createInvestigationUrl(targetInvestigation);
      navigate(investigationUrl, { replace: true });
    }
    dispatch({ type: 'NAVIGATE_BREADCRUMB', payload: breadcrumbId });
  }, [getInvestigationFromHistory, createInvestigationUrl, navigate]);

  const bookmarkInvestigation = useCallback((notes?: string, customTitle?: string) => {
    dispatch({ 
      type: 'BOOKMARK_INVESTIGATION', 
      payload: { notes, customTitle } 
    });
  }, []);

  const shareInvestigation = useCallback((shareConfig: InvestigationShareConfig): string => {
    if (!state.currentInvestigation) {
      throw new Error('No current investigation to share');
    }

    // Create shareable URL
    const investigationUrl = createInvestigationUrl(state.currentInvestigation);
    const fullUrl = `${window.location.origin}${investigationUrl}`;

    // In a real implementation, you might save the shared investigation to a backend
    // and return a short URL. For now, we'll return the full URL.
    
    return fullUrl;
  }, [state.currentInvestigation, createInvestigationUrl]);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const togglePanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_PANEL' });
  }, []);

  const setPanelPosition = useCallback((position: 'right' | 'bottom') => {
    dispatch({ type: 'SET_PANEL_POSITION', payload: position });
  }, []);

  const setPanelWidth = useCallback((width: number) => {
    dispatch({ type: 'SET_PANEL_WIDTH', payload: width });
  }, []);

  // ==================== URL Synchronization ====================

  useEffect(() => {
    // Parse URL on mount and location changes
    if (location.pathname === '/investigate' && location.search) {
      const urlInvestigation = parseInvestigationUrl(location.pathname + location.search);
      if (urlInvestigation && urlInvestigation.type) {
        // Check if this investigation is already current
        if (!state.currentInvestigation || state.currentInvestigation.id !== urlInvestigation.id) {
          dispatch({ type: 'LOAD_FROM_URL', payload: urlInvestigation });
        }
      }
    } else if (location.pathname !== '/investigate' && state.isInvestigating) {
      // User navigated away from investigation
      dispatch({ type: 'COMPLETE_INVESTIGATION' });
    }
  }, [location, parseInvestigationUrl, state.currentInvestigation, state.isInvestigating]);

  // ==================== Context Value ====================

  const contextValue: InvestigationContextValue = {
    state,
    actions: {
      startInvestigation,
      updateInvestigation,
      completeInvestigation,
      drillDown,
      addFilter,
      removeFilter,
      navigateToBreadcrumb,
      bookmarkInvestigation,
      shareInvestigation,
      clearHistory,
      togglePanel,
      setPanelPosition,
      setPanelWidth
    },
    utils: {
      generateInvestigationId,
      buildBreadcrumbs,
      createInvestigationUrl,
      parseInvestigationUrl,
      getInvestigationFromHistory
    }
  };

  return (
    <InvestigationContext.Provider value={contextValue}>
      {children}
    </InvestigationContext.Provider>
  );
};

// ==================== Hook for Using Context ====================

export const useInvestigation = (): InvestigationContextValue => {
  const context = useContext(InvestigationContext);
  if (context === undefined) {
    throw new Error('useInvestigation must be used within an InvestigationProvider');
  }
  return context;
};

// ==================== Additional Hooks ====================

export const useCurrentInvestigation = () => {
  const { state } = useInvestigation();
  return state.currentInvestigation;
};

export const useInvestigationHistory = () => {
  const { state } = useInvestigation();
  return {
    history: state.history,
    recent: state.recentInvestigations,
    bookmarks: state.bookmarks
  };
};

export const useInvestigationPanel = () => {
  const { state, actions } = useInvestigation();
  return {
    panel: state.investigationPanel,
    isOpen: state.investigationPanel.isOpen,
    toggle: actions.togglePanel,
    setPosition: actions.setPanelPosition,
    setWidth: actions.setPanelWidth
  };
};