import React, { createContext, useContext, useState, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { InvestigationProvider, useInvestigation } from './InvestigationContext';
import { FilterProvider, useFilters } from './FilterContext';
import { NavigationState, BreadcrumbItem, InvestigationContext as IInvestigationContext } from '../types';

// ==================== Combined App Context Provider ====================

interface AppContextProviderProps {
  children: React.ReactNode;
}

/**
 * Combined context provider that wraps all the application contexts
 * in the correct order to ensure proper dependency injection.
 * 
 * Order matters:
 * 1. BrowserRouter - Provides routing context
 * 2. FilterProvider - Provides global filter state
 * 3. InvestigationProvider - Provides investigation state (depends on routing)
 */
export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <FilterProvider>
        <InvestigationProvider>
          {children}
        </InvestigationProvider>
      </FilterProvider>
    </BrowserRouter>
  );
};

// ==================== Navigation Context (Simple Implementation) ====================

interface NavigationContextValue {
  state: NavigationState;
  actions: {
    setCurrentPage: (page: string) => void;
    toggleSidebar: () => void;
    setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
    addBreadcrumb: (breadcrumb: BreadcrumbItem) => void;
    removeBreadcrumb: (breadcrumbId: string) => void;
  };
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [state, setState] = useState<NavigationState>({
    currentPage: 'dashboard',
    investigationOpen: false,
    sidebarCollapsed: false,
    activeFilters: [],
    breadcrumbs: [],
    investigationHistory: [] // Add missing property
  });

  const setCurrentPage = useCallback((page: string) => {
    setState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  const setBreadcrumbs = useCallback((breadcrumbs: BreadcrumbItem[]) => {
    setState(prev => ({ ...prev, breadcrumbs }));
  }, []);

  const addBreadcrumb = useCallback((breadcrumb: BreadcrumbItem) => {
    setState(prev => ({
      ...prev,
      breadcrumbs: [...prev.breadcrumbs, breadcrumb]
    }));
  }, []);

  const removeBreadcrumb = useCallback((breadcrumbId: string) => {
    setState(prev => ({
      ...prev,
      breadcrumbs: prev.breadcrumbs.filter(b => b.id !== breadcrumbId)
    }));
  }, []);

  const contextValue: NavigationContextValue = {
    state,
    actions: {
      setCurrentPage,
      toggleSidebar,
      setBreadcrumbs,
      addBreadcrumb,
      removeBreadcrumb
    }
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// ==================== Enhanced App Context Provider with Navigation ====================

/**
 * Enhanced context provider that includes navigation state management
 */
export const EnhancedAppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <NavigationProvider>
        <FilterProvider>
          <InvestigationProvider>
            {children}
          </InvestigationProvider>
        </FilterProvider>
      </NavigationProvider>
    </BrowserRouter>
  );
};

// ==================== Context Integration Hooks ====================

/**
 * Hook for coordinating investigation state with global filters
 */
export const useCoordinatedState = () => {
  const { state: investigationState, actions: investigationActions } = useInvestigation();
  const { state: filterState, actions: filterActions } = useFilters();

  // Sync investigation context with filters when investigation changes
  React.useEffect(() => {
    if (investigationState.currentInvestigation) {
      filterActions.setInvestigationContext(investigationState.currentInvestigation);
    } else {
      filterActions.setInvestigationContext(null);
    }
  }, [investigationState.currentInvestigation, filterActions]);

  // Helper function to start investigation with current filters applied
  const startInvestigationWithFilters = useCallback(async (
    config: Partial<IInvestigationContext>
  ) => {
    // Apply current global filters to investigation scope
    const enhancedScope = {
      ...config.scope,
      dateRange: config.scope?.dateRange || filterState.globalFilters.dateRange,
      filters: [
        ...(config.scope?.filters || []),
        // Convert global filters to investigation filters
        ...filterState.globalFilters.categories.map(category => ({
          id: `global_category_${category}`,
          type: 'category' as const,
          field: 'category',
          operator: 'equals' as const,
          value: category,
          label: `Category: ${category}`,
          active: true,
          removable: true,
          investigation_impact: 'medium' as const
        })),
        ...filterState.globalFilters.excludeCategories.map(category => ({
          id: `global_exclude_${category}`,
          type: 'category' as const,
          field: 'category',
          operator: 'not_in' as const,
          value: category,
          label: `Exclude: ${category}`,
          active: true,
          removable: true,
          investigation_impact: 'medium' as const
        }))
      ]
    };

    return investigationActions.startInvestigation({
      ...config,
      scope: enhancedScope
    });
  }, [investigationActions, filterState.globalFilters]);

  return {
    investigationState,
    filterState,
    investigationActions,
    filterActions,
    startInvestigationWithFilters
  };
};