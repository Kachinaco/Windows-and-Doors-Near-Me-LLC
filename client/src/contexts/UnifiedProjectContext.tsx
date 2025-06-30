import React, { createContext, useContext, ReactNode } from 'react';
import { useUnifiedProjectData, UnifiedProjectData, UnifiedTask } from '@/hooks/useUnifiedProjectData';

interface UnifiedProjectContextType {
  // Data
  unifiedData: UnifiedProjectData | null;
  processedTasks: UnifiedTask[];
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    underReview: number;
    notStarted: number;
    overdue: number;
    byAssignee: Record<string, UnifiedTask[]>;
    byStatus: Record<string, UnifiedTask[]>;
    averageProgress: number;
  };
  isLoading: boolean;
  
  // Actions
  updateTask: (taskId: number, updates: Partial<UnifiedTask>) => void;
  createTask: (task: Partial<UnifiedTask>) => void;
  deleteTask: (taskId: number) => void;
  updateFilters: (filters: Partial<UnifiedProjectData['filters']>) => void;
  clearFilters: () => void;
  setGroupBy: (groupBy: UnifiedProjectData['groupBy']) => void;
  setSortBy: (sortBy: UnifiedProjectData['sortBy']) => void;
  setSortOrder: (sortOrder: UnifiedProjectData['sortOrder']) => void;
  
  // State
  filters: UnifiedProjectData['filters'];
  groupBy: UnifiedProjectData['groupBy'];
  sortBy: UnifiedProjectData['sortBy'];
  sortOrder: UnifiedProjectData['sortOrder'];
  
  // Helpers
  flattenTasks: (tasks: UnifiedTask[]) => UnifiedTask[];
  groupTasksByAssignee: (tasks: UnifiedTask[]) => Record<string, UnifiedTask[]>;
  groupTasksByStatus: (tasks: UnifiedTask[]) => Record<string, UnifiedTask[]>;
}

const UnifiedProjectContext = createContext<UnifiedProjectContextType | null>(null);

interface UnifiedProjectProviderProps {
  children: ReactNode;
  projectId?: number;
}

export function UnifiedProjectProvider({ children, projectId }: UnifiedProjectProviderProps) {
  const unifiedProjectData = useUnifiedProjectData(projectId);

  return (
    <UnifiedProjectContext.Provider value={unifiedProjectData}>
      {children}
    </UnifiedProjectContext.Provider>
  );
}

export function useUnifiedProject() {
  const context = useContext(UnifiedProjectContext);
  if (!context) {
    throw new Error('useUnifiedProject must be used within a UnifiedProjectProvider');
  }
  return context;
}

// Higher-order component for easy integration
export function withUnifiedProject<P extends object>(
  Component: React.ComponentType<P>,
  projectId?: number
) {
  return function WrappedComponent(props: P) {
    return (
      <UnifiedProjectProvider projectId={projectId}>
        <Component {...props} />
      </UnifiedProjectProvider>
    );
  };
}