import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  GlobalFilters,
  InvestigationFilter,
  InvestigationContext as IInvestigationContext
} from '../types';

// ==================== Filter State Management ====================

interface FilterState {
  globalFilters: GlobalFilters;
  investigationFilters: InvestigationFilter[];
  filterPresets: FilterPreset[];
  activePreset: string | null;
}

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: GlobalFilters;
  isDefault: boolean;
  createdAt: string;
}

interface FilterContextValue {
  state: FilterState;
  actions: {
    setDateRange: (start: string, end: string, preset?: string) => void;
    addCategory: (category: string) => void;
    removeCategory: (category: string) => void;
    excludeCategory: (category: string) => void;
    includeCategory: (category: string) => void;
    setAmountRange: (min?: number, max?: number) => void;
    addSource: (source: string) => void;
    removeSource: (source: string) => void;
    addInvestigationFilter: (filter: InvestigationFilter) => void;
    removeInvestigationFilter: (filterId: string) => void;
    clearAllFilters: () => void;
    applyPreset: (presetId: string) => void;
    saveAsPreset: (name: string, description?: string) => void;
    deletePreset: (presetId: string) => void;
    setInvestigationContext: (context: IInvestigationContext | null) => void;
  };
  computed: {
    hasActiveFilters: boolean;
    filterCount: number;
    investigationFilterCount: number;
    isFiltered: boolean;
  };
}

// ==================== Initial State ====================

const initialGlobalFilters: GlobalFilters = {
  dateRange: {
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
    end: new Date().toISOString().split('T')[0], // today
    preset: 'last_year'
  },
  categories: [],
  excludeCategories: [],
  amountRange: undefined,
  sources: [],
  investigationContext: undefined
};

const defaultPresets: FilterPreset[] = [
  {
    id: 'last_30_days',
    name: 'Last 30 Days',
    description: 'Recent transactions from the last month',
    filters: {
      ...initialGlobalFilters,
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        preset: 'last_30_days'
      }
    },
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'last_3_months',
    name: 'Last 3 Months',
    description: 'Quarterly view of spending patterns',
    filters: {
      ...initialGlobalFilters,
      dateRange: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        preset: 'last_3_months'
      }
    },
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ytd',
    name: 'Year to Date',
    description: 'Current year financial data',
    filters: {
      ...initialGlobalFilters,
      dateRange: {
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        preset: 'ytd'
      }
    },
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'expenses_only',
    name: 'Expenses Only',
    description: 'Exclude income and investment transactions',
    filters: {
      ...initialGlobalFilters,
      excludeCategories: ['Pay', 'Payment', 'Acorns', 'Wealthfront', 'Robinhood', 'Schwab']
    },
    isDefault: true,
    createdAt: new Date().toISOString()
  }
];

const initialState: FilterState = {
  globalFilters: initialGlobalFilters,
  investigationFilters: [],
  filterPresets: defaultPresets,
  activePreset: 'last_year'
};

// ==================== Filter Reducer ====================

type FilterActionType = 
  | 'SET_DATE_RANGE'
  | 'ADD_CATEGORY'
  | 'REMOVE_CATEGORY'
  | 'EXCLUDE_CATEGORY'
  | 'INCLUDE_CATEGORY'
  | 'SET_AMOUNT_RANGE'
  | 'ADD_SOURCE'
  | 'REMOVE_SOURCE'
  | 'ADD_INVESTIGATION_FILTER'
  | 'REMOVE_INVESTIGATION_FILTER'
  | 'CLEAR_ALL_FILTERS'
  | 'APPLY_PRESET'
  | 'SAVE_PRESET'
  | 'DELETE_PRESET'
  | 'SET_INVESTIGATION_CONTEXT';

interface FilterReducerAction {
  type: FilterActionType;
  payload?: any;
}

const filterReducer = (state: FilterState, action: FilterReducerAction): FilterState => {
  switch (action.type) {
    case 'SET_DATE_RANGE': {
      const { start, end, preset } = action.payload;
      return {
        ...state,
        globalFilters: {
          ...state.globalFilters,
          dateRange: { start, end, preset }
        },
        activePreset: preset || null
      };
    }

    case 'ADD_CATEGORY': {
      const category = action.payload as string;
      const categories = [...state.globalFilters.categories];
      if (!categories.includes(category)) {
        categories.push(category);
      }
      
      // Remove from excludeCategories if it's there
      const excludeCategories = state.globalFilters.excludeCategories.filter(c => c !== category);
      
      return {
        ...state,
        globalFilters: {
          ...state.globalFilters,
          categories,
          excludeCategories
        },
        activePreset: null // Clear preset when manually filtering
      };
    }

    case 'EXCLUDE_CATEGORY': {
      const category = action.payload as string;
      const excludeCategories = [...state.globalFilters.excludeCategories];
      if (!excludeCategories.includes(category)) {
        excludeCategories.push(category);
      }
      
      // Remove from categories if it's there
      const categories = state.globalFilters.categories.filter(c => c !== category);
      
      return {
        ...state,
        globalFilters: {
          ...state.globalFilters,
          categories,
          excludeCategories
        },
        activePreset: null
      };
    }

    case 'INCLUDE_CATEGORY': {
      const category = action.payload as string;
      return {
        ...state,
        globalFilters: {
          ...state.globalFilters,
          excludeCategories: state.globalFilters.excludeCategories.filter(c => c !== category)
        },
        activePreset: null
      };
    }

    case 'SET_AMOUNT_RANGE': {
      const { min, max } = action.payload;
      return {
        ...state,
        globalFilters: {
          ...state.globalFilters,
          amountRange: min !== undefined || max !== undefined ? { min, max } : undefined
        },
        activePreset: null
      };
    }

    case 'ADD_SOURCE': {
      const source = action.payload as string;
      const sources = [...(state.globalFilters.sources || [])];
      if (!sources.includes(source)) {
        sources.push(source);
      }
      return {
        ...state,
        globalFilters: {
          ...state.globalFilters,
          sources
        },
        activePreset: null
      };
    }

    case 'REMOVE_SOURCE': {
      const source = action.payload as string;
      return {
        ...state,
        globalFilters: {
          ...state.globalFilters,
          sources: (state.globalFilters.sources || []).filter(s => s !== source)
        },
        activePreset: null
      };
    }

    case 'ADD_INVESTIGATION_FILTER': {
      const filter = action.payload as InvestigationFilter;
      const existingFilters = state.investigationFilters.filter(f => f.id !== filter.id);
      return {
        ...state,
        investigationFilters: [...existingFilters, filter]
      };
    }

    case 'REMOVE_INVESTIGATION_FILTER': {
      const filterId = action.payload as string;
      return {
        ...state,
        investigationFilters: state.investigationFilters.filter(f => f.id !== filterId)
      };
    }

    case 'CLEAR_ALL_FILTERS': {
      return {
        ...state,
        globalFilters: initialGlobalFilters,
        investigationFilters: [],
        activePreset: 'last_year'
      };
    }

    case 'APPLY_PRESET': {
      const presetId = action.payload as string;
      const preset = state.filterPresets.find(p => p.id === presetId);
      if (!preset) return state;

      return {
        ...state,
        globalFilters: { ...preset.filters },
        activePreset: presetId,
        investigationFilters: [] // Clear investigation filters when applying preset
      };
    }

    case 'SAVE_PRESET': {
      const { name, description } = action.payload;
      const newPreset: FilterPreset = {
        id: `preset_${Date.now()}`,
        name,
        description: description || '',
        filters: { ...state.globalFilters },
        isDefault: false,
        createdAt: new Date().toISOString()
      };

      return {
        ...state,
        filterPresets: [...state.filterPresets, newPreset],
        activePreset: newPreset.id
      };
    }

    case 'DELETE_PRESET': {
      const presetId = action.payload as string;
      const preset = state.filterPresets.find(p => p.id === presetId);
      
      // Don't delete default presets
      if (preset?.isDefault) return state;

      return {
        ...state,
        filterPresets: state.filterPresets.filter(p => p.id !== presetId),
        activePreset: state.activePreset === presetId ? 'last_year' : state.activePreset
      };
    }

    case 'SET_INVESTIGATION_CONTEXT': {
      const context = action.payload as IInvestigationContext | null;
      return {
        ...state,
        globalFilters: {
          ...state.globalFilters,
          investigationContext: context || undefined
        }
      };
    }

    default:
      return state;
  }
};

// ==================== Context Creation ====================

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

// ==================== Provider Component ====================

interface FilterProviderProps {
  children: React.ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(filterReducer, initialState);

  // ==================== Action Functions ====================

  const setDateRange = useCallback((start: string, end: string, preset?: string) => {
    dispatch({ type: 'SET_DATE_RANGE', payload: { start, end, preset } });
  }, []);

  const addCategory = useCallback((category: string) => {
    dispatch({ type: 'ADD_CATEGORY', payload: category });
  }, []);

  const removeCategory = useCallback((category: string) => {
    dispatch({ type: 'REMOVE_CATEGORY', payload: category });
  }, []);

  const excludeCategory = useCallback((category: string) => {
    dispatch({ type: 'EXCLUDE_CATEGORY', payload: category });
  }, []);

  const includeCategory = useCallback((category: string) => {
    dispatch({ type: 'INCLUDE_CATEGORY', payload: category });
  }, []);

  const setAmountRange = useCallback((min?: number, max?: number) => {
    dispatch({ type: 'SET_AMOUNT_RANGE', payload: { min, max } });
  }, []);

  const addSource = useCallback((source: string) => {
    dispatch({ type: 'ADD_SOURCE', payload: source });
  }, []);

  const removeSource = useCallback((source: string) => {
    dispatch({ type: 'REMOVE_SOURCE', payload: source });
  }, []);

  const addInvestigationFilter = useCallback((filter: InvestigationFilter) => {
    dispatch({ type: 'ADD_INVESTIGATION_FILTER', payload: filter });
  }, []);

  const removeInvestigationFilter = useCallback((filterId: string) => {
    dispatch({ type: 'REMOVE_INVESTIGATION_FILTER', payload: filterId });
  }, []);

  const clearAllFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    dispatch({ type: 'APPLY_PRESET', payload: presetId });
  }, []);

  const saveAsPreset = useCallback((name: string, description?: string) => {
    dispatch({ type: 'SAVE_PRESET', payload: { name, description } });
  }, []);

  const deletePreset = useCallback((presetId: string) => {
    dispatch({ type: 'DELETE_PRESET', payload: presetId });
  }, []);

  const setInvestigationContext = useCallback((context: IInvestigationContext | null) => {
    dispatch({ type: 'SET_INVESTIGATION_CONTEXT', payload: context });
  }, []);

  // ==================== Computed Values ====================

  const hasActiveFilters = 
    state.globalFilters.categories.length > 0 ||
    state.globalFilters.excludeCategories.length > 0 ||
    (state.globalFilters.sources && state.globalFilters.sources.length > 0) ||
    state.globalFilters.amountRange !== undefined ||
    state.investigationFilters.length > 0;

  const filterCount = 
    state.globalFilters.categories.length +
    state.globalFilters.excludeCategories.length +
    (state.globalFilters.sources?.length || 0) +
    (state.globalFilters.amountRange ? 1 : 0);

  const investigationFilterCount = state.investigationFilters.length;

  const isFiltered = hasActiveFilters || state.activePreset !== 'last_year';

  // ==================== Context Value ====================

  const contextValue: FilterContextValue = {
    state,
    actions: {
      setDateRange,
      addCategory,
      removeCategory,
      excludeCategory,
      includeCategory,
      setAmountRange,
      addSource,
      removeSource,
      addInvestigationFilter,
      removeInvestigationFilter,
      clearAllFilters,
      applyPreset,
      saveAsPreset,
      deletePreset,
      setInvestigationContext
    },
    computed: {
      hasActiveFilters,
      filterCount,
      investigationFilterCount,
      isFiltered
    }
  };

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
};

// ==================== Hook for Using Context ====================

export const useFilters = (): FilterContextValue => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

// ==================== Additional Hooks ====================

export const useGlobalFilters = () => {
  const { state } = useFilters();
  return state.globalFilters;
};

export const useFilterPresets = () => {
  const { state, actions } = useFilters();
  return {
    presets: state.filterPresets,
    activePreset: state.activePreset,
    applyPreset: actions.applyPreset,
    saveAsPreset: actions.saveAsPreset,
    deletePreset: actions.deletePreset
  };
};

export const useInvestigationFilters = () => {
  const { state, actions } = useFilters();
  return {
    filters: state.investigationFilters,
    addFilter: actions.addInvestigationFilter,
    removeFilter: actions.removeInvestigationFilter
  };
};