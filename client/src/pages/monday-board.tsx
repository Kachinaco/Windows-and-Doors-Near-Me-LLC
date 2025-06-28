import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronRight, Plus, MoreHorizontal, Users, Calendar, Phone, MapPin, Edit3, Save, X, CheckSquare } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

// Type definitions
interface BoardColumn {
  id: string;
  name: string;
  type: 'status' | 'text' | 'date' | 'people' | 'number' | 'tags' | 'subitems';
  order: number;
}

interface SubItem {
  id: number;
  projectId: number;
  name: string;
  status: string;
  assignedTo?: string;
  folderId?: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SubItemFolder {
  id: number;
  projectId: number;
  name: string;
  order: number;
  collapsed: boolean;
  createdAt: Date;
}

interface BoardItem {
  id: number;
  groupName: string;
  values: Record<string, any>;
  subItems?: SubItem[];
  subItemFolders?: SubItemFolder[];
}

interface BoardGroup {
  name: string;
  items: BoardItem[];
  collapsed: boolean;
}

export default function MondayBoard() {
  const queryClient = useQueryClient();
  
  // State management
  const [groups, setGroups] = useState<BoardGroup[]>([
    { name: 'New Leads', items: [], collapsed: false },
    { name: 'Active Projects', items: [], collapsed: false },
    { name: 'Scheduled Work', items: [], collapsed: false },
    { name: 'Completed', items: [], collapsed: false },
  ]);
  
  const [columns] = useState<BoardColumn[]>([
    { id: 'name', name: 'Item', type: 'text', order: 0 },
    { id: 'assignedTo', name: 'People', type: 'people', order: 1 },
    { id: 'projectAddress', name: 'Location', type: 'text', order: 2 },
    { id: 'clientPhone', name: 'Phone', type: 'text', order: 3 },
    { id: 'status', name: 'Status', type: 'status', order: 4 },
    { id: 'measureDate', name: 'Measure Date', type: 'date', order: 5 },
    { id: 'deliveryDate', name: 'Delivery Date', type: 'date', order: 6 },
    { id: 'installDate', name: 'Install Date', type: 'date', order: 7 },
  ]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['New Leads', 'Active Projects', 'Scheduled Work', 'Completed']));
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ itemId: number; columnId: string } | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Data fetching
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await apiRequest('/api/projects');
      return response || [];
    },
  });

  // Group projects by status
  const groupedProjects = useMemo(() => {
    const projectsByGroup: Record<string, any[]> = {
      'New Leads': [],
      'Active Projects': [],
      'Scheduled Work': [],
      'Completed': [],
    };

    projects.forEach((project: any) => {
      const status = project.status || 'new lead';
      if (status === 'new lead') {
        projectsByGroup['New Leads'].push(project);
      } else if (['in progress', 'on order'].includes(status)) {
        projectsByGroup['Active Projects'].push(project);
      } else if (status === 'scheduled') {
        projectsByGroup['Scheduled Work'].push(project);
      } else if (status === 'complete') {
        projectsByGroup['Completed'].push(project);
      }
    });

    return projectsByGroup;
  }, [projects]);

  // Mutations for project operations
  const addItemMutation = useMutation({
    mutationFn: async (data: { name: string; status: string; groupName: string }) => {
      return apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          status: data.status,
          groupName: data.groupName,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });

  // Helper functions
  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  }, []);

  const handleCellEdit = useCallback((itemId: number, columnId: string, currentValue: any) => {
    setEditingCell({ itemId, columnId });
    setEditingValue(currentValue?.toString() || '');
  }, []);

  const handleCellSave = useCallback(async () => {
    if (!editingCell) return;
    
    const { itemId, columnId } = editingCell;
    
    try {
      await updateProjectMutation.mutateAsync({
        id: itemId,
        [columnId]: editingValue,
      });
      setEditingCell(null);
      setEditingValue('');
    } catch (error) {
      console.error('Failed to update cell:', error);
    }
  }, [editingCell, editingValue, updateProjectMutation]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
    setEditingValue('');
  }, []);

  const renderCell = useCallback((item: any, column: BoardColumn) => {
    const isEditing = editingCell?.itemId === item.id && editingCell?.columnId === column.id;
    const value = item[column.id] || '';

    if (isEditing) {
      return (
        <input
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={handleCellSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellSave();
            } else if (e.key === 'Escape') {
              handleCellCancel();
            }
          }}
          className="w-full px-2 py-1 text-sm bg-blue-900/20 border border-blue-500/30 rounded text-blue-100 focus:outline-none focus:border-blue-400"
          autoFocus
        />
      );
    }

    return (
      <div
        className="w-full px-2 py-1 text-sm text-blue-100 cursor-pointer hover:bg-blue-500/10 rounded transition-colors"
        onClick={() => handleCellEdit(item.id, column.id, value)}
      >
        {column.type === 'status' && value ? (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'complete' ? 'bg-green-500/20 text-green-300' :
            value === 'in progress' ? 'bg-blue-500/20 text-blue-300' :
            value === 'new lead' ? 'bg-yellow-500/20 text-yellow-300' :
            'bg-gray-500/20 text-gray-300'
          }`}>
            {value}
          </span>
        ) : (
          <span>{value || '-'}</span>
        )}
      </div>
    );
  }, [editingCell, editingValue, handleCellEdit, handleCellSave, handleCellCancel]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-blue-300">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-950 to-blue-950/50 border-b border-blue-500/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </button>
            </Link>
            <h1 className="text-xl font-semibold text-blue-100">Project Board</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-blue-300">
              {projects.length} projects
            </span>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* Column Headers */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-950 to-blue-950/30 border-b border-blue-500/20">
            <div className="flex">
              {/* Checkbox column */}
              <div className="w-12 px-2 py-3 border-r border-blue-500/20"></div>
              
              {/* Data columns */}
              {columns.map((column, index) => (
                <div
                  key={column.id}
                  className="px-4 py-3 border-r border-blue-500/20 flex-shrink-0 flex items-center justify-between group"
                  style={{
                    width: columnWidths[column.id] || (index === 0 ? 240 : 140),
                    minWidth: index === 0 ? '180px' : '100px',
                    maxWidth: 'none'
                  }}
                >
                  <span className="text-sm font-medium text-blue-200">{column.name}</span>
                  <MoreHorizontal className="w-4 h-4 text-blue-400/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              
              {/* Actions column */}
              <div className="w-12 px-2 py-3"></div>
            </div>
          </div>

          {/* Groups and Items */}
          <div className="bg-gray-950">
            {Object.entries(groupedProjects).map(([groupName, groupProjects]) => (
              <React.Fragment key={groupName}>
                {/* Group Header */}
                <div className="bg-gradient-to-r from-blue-950/30 to-slate-900/30 border-b border-blue-500/20">
                  <div className="flex items-center px-6 py-3">
                    <button
                      onClick={() => toggleGroup(groupName)}
                      className="flex items-center gap-2 text-blue-200 hover:text-blue-100 transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${
                        expandedGroups.has(groupName) ? 'rotate-0' : '-rotate-90'
                      }`} />
                      <span className="font-medium">{groupName}</span>
                      <span className="text-blue-400/70 text-sm">({groupProjects.length})</span>
                    </button>
                  </div>
                </div>

                {/* Group Items */}
                {expandedGroups.has(groupName) && (
                  <div>
                    {groupProjects.map((item: any) => (
                      <div key={item.id} className="flex hover:bg-blue-500/5 transition-all bg-gradient-to-r from-gray-950/80 to-blue-950/10 border-b border-blue-500/10">
                        {/* Checkbox column */}
                        <div className="w-12 px-2 py-3 border-r border-blue-500/20 flex items-center justify-center">
                          <CheckSquare className="w-4 h-4 text-blue-400/60" />
                        </div>
                        
                        {/* Data columns */}
                        {columns.map((column, colIndex) => (
                          <div
                            key={column.id}
                            className="px-4 py-3 border-r border-blue-500/20 flex-shrink-0 flex items-center"
                            style={{
                              width: columnWidths[column.id] || (colIndex === 0 ? 240 : 140),
                              minWidth: colIndex === 0 ? '180px' : '100px',
                              maxWidth: 'none'
                            }}
                          >
                            {renderCell(item, column)}
                          </div>
                        ))}
                        
                        {/* Actions column */}
                        <div className="w-12 px-2 py-3 flex items-center justify-center">
                          <button className="text-blue-400/60 hover:text-blue-300 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Item Button */}
                    <div className="flex hover:bg-blue-500/5 transition-all bg-gradient-to-r from-blue-950/5 to-slate-900/5 border-b border-blue-500/10">
                      <div className="w-12 px-2 py-3 border-r border-blue-500/20 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-blue-400/60" />
                      </div>
                      <div 
                        className="flex-1 px-4 py-3 border-r border-blue-500/20 flex items-center cursor-pointer text-blue-400/70 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                        onClick={() => {
                          addItemMutation.mutate({ 
                            name: 'New Project',
                            status: groupName === 'New Leads' ? 'new lead' : groupName.toLowerCase().replace(' ', '_'),
                            groupName: groupName
                          });
                        }}
                      >
                        <span className="text-sm font-medium">Add item</span>
                      </div>
                      <div className="w-12 px-2 py-3"></div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}