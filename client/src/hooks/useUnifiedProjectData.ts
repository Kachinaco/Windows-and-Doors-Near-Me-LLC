import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Project } from "@shared/schema";

// Unified data structure for all project management views
export interface UnifiedTask {
  id: number;
  parentId?: number; // For sub-items
  projectId: number;
  folderId?: number;
  title: string;
  description?: string;
  status: 'new_lead' | 'in_progress' | 'on_order' | 'scheduled' | 'complete' | 'under_review' | 'not_started';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: number; // User ID
  assignedUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  dueDate?: string;
  startDate?: string;
  timeline?: {
    start: string;
    end: string;
  };
  progress: number; // 0-100
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  formula?: string;
  formulaResult?: number | string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  lastEditedBy?: number;
  children?: UnifiedTask[]; // Sub-items
  isCollapsed?: boolean;
}

export interface UnifiedFolder {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  color: string;
  sortOrder: number;
  isCollapsed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedColumn {
  id: string;
  name: string;
  type: 'status' | 'text' | 'date' | 'people' | 'number' | 'tags' | 'progress' | 'formula' | 'timeline';
  order: number;
  settings?: {
    options?: string[];
    colors?: Record<string, string>;
    formula?: string;
    required?: boolean;
  };
}

export interface UnifiedProjectData {
  project: Project;
  tasks: UnifiedTask[];
  folders: UnifiedFolder[];
  columns: UnifiedColumn[];
  teamMembers: any[];
  filters: {
    status?: string[];
    assignee?: number[];
    folder?: number[];
    search?: string;
  };
  groupBy?: 'status' | 'assignee' | 'folder' | 'none';
  sortBy?: 'dueDate' | 'priority' | 'status' | 'title' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Helper functions (moved to top level to avoid hoisting issues)
const flattenTasks = (tasks: UnifiedTask[]): UnifiedTask[] => {
  const result: UnifiedTask[] = [];
  tasks.forEach(task => {
    result.push(task);
    if (task.children?.length) {
      result.push(...flattenTasks(task.children));
    }
  });
  return result;
};

const groupTasksByAssignee = (tasks: UnifiedTask[]) => {
  const groups: Record<string, UnifiedTask[]> = {};
  tasks.forEach(task => {
    const key = task.assignedUser ? `${task.assignedUser.firstName} ${task.assignedUser.lastName}` : 'Unassigned';
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  });
  return groups;
};

const groupTasksByStatus = (tasks: UnifiedTask[]) => {
  const groups: Record<string, UnifiedTask[]> = {};
  tasks.forEach(task => {
    if (!groups[task.status]) groups[task.status] = [];
    groups[task.status].push(task);
  });
  return groups;
};

const getDefaultColumns = (): UnifiedColumn[] => [
  { id: 'title', name: 'Task', type: 'text', order: 1 },
  { id: 'status', name: 'Status', type: 'status', order: 2, settings: { 
    options: ['not_started', 'in_progress', 'under_review', 'complete'],
    colors: { 'not_started': '#gray', 'in_progress': '#blue', 'under_review': '#yellow', 'complete': '#green' }
  }},
  { id: 'assignee', name: 'Assignee', type: 'people', order: 3 },
  { id: 'dueDate', name: 'Due Date', type: 'date', order: 4 },
  { id: 'progress', name: 'Progress', type: 'progress', order: 5 }
];

export function useUnifiedProjectData(projectId?: number) {
  const queryClient = useQueryClient();
  const [localFilters, setLocalFilters] = useState<UnifiedProjectData['filters']>({});
  const [groupBy, setGroupBy] = useState<UnifiedProjectData['groupBy']>('status');
  const [sortBy, setSortBy] = useState<UnifiedProjectData['sortBy']>('updatedAt');
  const [sortOrder, setSortOrder] = useState<UnifiedProjectData['sortOrder']>('desc');

  // Fetch all projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch project-specific data
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "unified-data"],
    queryFn: async () => {
      if (!projectId) return null;
      
      const [
        projectResponse,
        tasksResponse,
        foldersResponse,
        teamResponse
      ] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/tasks-unified`),
        fetch(`/api/projects/${projectId}/sub-item-folders`),
        fetch(`/api/projects/${projectId}/team-members`)
      ]);

      const project = await projectResponse.json();
      const tasks = await tasksResponse.json();
      const folders = await foldersResponse.json();
      const teamMembers = await teamResponse.json();

      return {
        project,
        tasks: transformTasksToUnified(tasks),
        folders: transformFoldersToUnified(folders),
        teamMembers
      };
    },
    enabled: !!projectId,
  });

  // Transform API data to unified structure
  const transformTasksToUnified = useCallback((apiTasks: any[]): UnifiedTask[] => {
    const taskMap = new Map<number, UnifiedTask>();
    const rootTasks: UnifiedTask[] = [];

    // First pass: create all tasks
    apiTasks.forEach(task => {
      const unifiedTask: UnifiedTask = {
        id: task.id,
        parentId: task.parentProjectId || task.parentId,
        projectId: task.projectId || projectId!,
        folderId: task.folderId,
        title: task.name || task.title || 'Untitled Task',
        description: task.description,
        status: task.status || 'not_started',
        priority: task.priority || 'medium',
        assignedTo: task.assignedTo,
        assignedUser: task.assignedUser,
        dueDate: task.dueDate,
        startDate: task.startDate,
        timeline: task.timeline,
        progress: task.progress || 0,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        tags: task.tags ? (Array.isArray(task.tags) ? task.tags : JSON.parse(task.tags)) : [],
        metadata: task.metadata ? (typeof task.metadata === 'string' ? JSON.parse(task.metadata) : task.metadata) : {},
        formula: task.formula,
        formulaResult: task.formulaResult,
        sortOrder: task.sortOrder || 0,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        createdBy: task.createdBy,
        lastEditedBy: task.lastEditedBy,
        children: [],
        isCollapsed: false
      };

      taskMap.set(task.id, unifiedTask);
    });

    // Second pass: organize hierarchy
    taskMap.forEach(task => {
      if (task.parentId && taskMap.has(task.parentId)) {
        const parent = taskMap.get(task.parentId)!;
        parent.children!.push(task);
      } else {
        rootTasks.push(task);
      }
    });

    return rootTasks;
  }, [projectId]);

  const transformFoldersToUnified = useCallback((apiFolders: any[]): UnifiedFolder[] => {
    return apiFolders.map(folder => ({
      id: folder.id,
      projectId: folder.projectId,
      name: folder.name || 'Untitled Folder',
      description: folder.description,
      color: folder.color || '#3b82f6',
      sortOrder: folder.sortOrder || 0,
      isCollapsed: folder.isCollapsed || false,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt
    }));
  }, []);

  // Computed unified data
  const unifiedData = useMemo((): UnifiedProjectData | null => {
    if (projectId && projectData) {
      return {
        project: projectData.project,
        tasks: projectData.tasks,
        folders: projectData.folders,
        columns: getDefaultColumns(),
        teamMembers: projectData.teamMembers,
        filters: localFilters,
        groupBy,
        sortBy,
        sortOrder
      };
    }

    if (!projectId && projects.length > 0) {
      // Global view - aggregate all projects
      return {
        project: {} as Project,
        tasks: [], // Would need to fetch all tasks
        folders: [],
        columns: getDefaultColumns(),
        teamMembers: [],
        filters: localFilters,
        groupBy,
        sortBy,
        sortOrder
      };
    }

    return null;
  }, [projectData, projects, projectId, localFilters, groupBy, sortBy, sortOrder]);

  // Filtered and sorted tasks
  const processedTasks = useMemo(() => {
    if (!unifiedData?.tasks) return [];

    let filtered = unifiedData.tasks;

    // Apply filters
    if (localFilters.status?.length) {
      filtered = filtered.filter(task => localFilters.status!.includes(task.status));
    }
    if (localFilters.assignee?.length) {
      filtered = filtered.filter(task => task.assignedTo && localFilters.assignee!.includes(task.assignedTo));
    }
    if (localFilters.folder?.length) {
      filtered = filtered.filter(task => task.folderId && localFilters.folder!.includes(task.folderId));
    }
    if (localFilters.search) {
      const search = localFilters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'dueDate':
          comparison = (a.dueDate || '').localeCompare(b.dueDate || '');
          break;
        case 'priority':
          const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'updatedAt':
          comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [unifiedData?.tasks, localFilters, sortBy, sortOrder]);

  // Task statistics
  const taskStats = useMemo(() => {
    const allTasks = unifiedData?.tasks || [];
    const flatTasks = flattenTasks(allTasks);
    
    return {
      total: flatTasks.length,
      completed: flatTasks.filter(t => t.status === 'complete').length,
      inProgress: flatTasks.filter(t => t.status === 'in_progress').length,
      underReview: flatTasks.filter(t => t.status === 'under_review').length,
      notStarted: flatTasks.filter(t => t.status === 'not_started').length,
      overdue: flatTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'complete').length,
      byAssignee: groupTasksByAssignee(flatTasks),
      byStatus: groupTasksByStatus(flatTasks),
      averageProgress: flatTasks.length > 0 ? flatTasks.reduce((sum, t) => sum + t.progress, 0) / flatTasks.length : 0
    };
  }, [unifiedData?.tasks]);

  // Mutations for real-time updates
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: number; updates: Partial<UnifiedTask> }) => {
      const response = await apiRequest('PATCH', `/api/tasks/${taskId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "unified-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (newTask: Partial<UnifiedTask>) => {
      const response = await apiRequest('POST', '/api/tasks', newTask);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "unified-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest('DELETE', `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "unified-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });



  // API functions
  const updateTask = useCallback((taskId: number, updates: Partial<UnifiedTask>) => {
    updateTaskMutation.mutate({ taskId, updates });
  }, [updateTaskMutation]);

  const createTask = useCallback((task: Partial<UnifiedTask>) => {
    createTaskMutation.mutate(task);
  }, [createTaskMutation]);

  const deleteTask = useCallback((taskId: number) => {
    deleteTaskMutation.mutate(taskId);
  }, [deleteTaskMutation]);

  const updateFilters = useCallback((filters: Partial<UnifiedProjectData['filters']>) => {
    setLocalFilters(prev => ({ ...prev, ...filters }));
  }, []);

  const clearFilters = useCallback(() => {
    setLocalFilters({});
  }, []);

  return {
    // Data
    unifiedData,
    processedTasks,
    taskStats,
    isLoading: projectsLoading || projectLoading,
    
    // Actions
    updateTask,
    createTask,
    deleteTask,
    updateFilters,
    clearFilters,
    setGroupBy,
    setSortBy,
    setSortOrder,
    
    // State
    filters: localFilters,
    groupBy,
    sortBy,
    sortOrder,
    
    // Helpers
    flattenTasks,
    groupTasksByAssignee,
    groupTasksByStatus
  };
}