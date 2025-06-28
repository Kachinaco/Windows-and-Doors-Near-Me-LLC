import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { type Project } from "@shared/schema";
import { Plus, Settings, Calendar, Users, Hash, Tag, User, Type, ChevronDown, ChevronRight, ArrowLeft, Undo2, Folder, Columns, Trash2, MessageCircle, MoreHorizontal, CheckSquare } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

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
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Board state
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

  const [subItemColumns] = useState<BoardColumn[]>([
    { id: 'name', name: 'Sub-item', type: 'text', order: 0 },
    { id: 'status', name: 'Status', type: 'status', order: 1 },
    { id: 'assignedTo', name: 'Person', type: 'people', order: 2 },
    { id: 'dueDate', name: 'Due Date', type: 'date', order: 3 },
  ]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['New Leads', 'Active Projects', 'Scheduled Work', 'Completed']));
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ itemId: number; columnId: string } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingSubItem, setEditingSubItem] = useState<number | null>(null);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);

  // Data fetching
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/projects', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Projects loaded:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error loading projects:', error);
        return [];
      }
    },
  });

  // Mock sub-items and folders for demonstration
  const createMockSubItems = (projectId: number): SubItem[] => [
    { id: projectId * 100 + 1, projectId, name: 'Site Measurement', status: 'complete', assignedTo: 'John Doe', folderId: projectId * 10 + 1, order: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: projectId * 100 + 2, projectId, name: 'Order Materials', status: 'in progress', assignedTo: 'Jane Smith', folderId: projectId * 10 + 1, order: 2, createdAt: new Date(), updatedAt: new Date() },
    { id: projectId * 100 + 3, projectId, name: 'Schedule Installation', status: 'pending', assignedTo: 'Mike Johnson', folderId: projectId * 10 + 2, order: 1, createdAt: new Date(), updatedAt: new Date() },
  ];

  const createMockFolders = (projectId: number): SubItemFolder[] => [
    { id: projectId * 10 + 1, projectId, name: 'Preparation Phase', order: 1, collapsed: false, createdAt: new Date() },
    { id: projectId * 10 + 2, projectId, name: 'Installation Phase', order: 2, collapsed: false, createdAt: new Date() },
  ];

  // Group projects by status
  const groupedProjects = React.useMemo(() => {
    const projectsByGroup: Record<string, any[]> = {
      'New Leads': [],
      'Active Projects': [],
      'Scheduled Work': [],
      'Completed': [],
    };

    projects.forEach((project: any) => {
      const status = project.status || 'new lead';
      const projectWithSubItems = { 
        ...project, 
        subItems: createMockSubItems(project.id), 
        subItemFolders: createMockFolders(project.id) 
      };
      
      if (status === 'new lead') {
        projectsByGroup['New Leads'].push(projectWithSubItems);
      } else if (['in progress', 'on order'].includes(status)) {
        projectsByGroup['Active Projects'].push(projectWithSubItems);
      } else if (status === 'scheduled') {
        projectsByGroup['Scheduled Work'].push(projectWithSubItems);
      } else if (status === 'complete') {
        projectsByGroup['Completed'].push(projectWithSubItems);
      }
    });

    return projectsByGroup;
  }, [projects]);

  // Mutations
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

  const toggleFolder = useCallback((folderId: number) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
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

  const renderSubItemCell = useCallback((subItem: SubItem, column: BoardColumn) => {
    const isEditing = editingSubItem === subItem.id && editingColumn === column.id;
    const value = (subItem as any)[column.id] || '';

    if (isEditing) {
      return (
        <input
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={() => {
            setEditingSubItem(null);
            setEditingColumn(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setEditingSubItem(null);
              setEditingColumn(null);
            } else if (e.key === 'Escape') {
              setEditingSubItem(null);
              setEditingColumn(null);
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
        onClick={() => {
          setEditingSubItem(subItem.id);
          setEditingColumn(column.id);
          setEditingValue(value?.toString() || '');
        }}
      >
        {column.type === 'status' && value ? (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'complete' ? 'bg-green-500/20 text-green-300' :
            value === 'in progress' ? 'bg-blue-500/20 text-blue-300' :
            value === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
            'bg-gray-500/20 text-gray-300'
          }`}>
            {value}
          </span>
        ) : (
          <span>{value || '-'}</span>
        )}
      </div>
    );
  }, [editingSubItem, editingColumn, editingValue]);

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
                      <React.Fragment key={item.id}>
                        {/* Main Project Row */}
                        <div className="flex hover:bg-blue-500/5 transition-all bg-gradient-to-r from-gray-950/80 to-blue-950/10 border-b border-blue-500/10">
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

                        {/* Sub-item Folders */}
                        {item.subItemFolders?.map((folder: SubItemFolder) => (
                          <React.Fragment key={`folder-${folder.id}`}>
                            {/* Folder Header */}
                            <div className="flex bg-gradient-to-r from-blue-950/20 to-slate-900/20 border-b border-blue-500/20">
                              {/* Checkbox column with folder toggle */}
                              <div className="w-12 px-2 py-3 border-r border-blue-500/20 flex items-center justify-center">
                                <button
                                  onClick={() => toggleFolder(folder.id)}
                                  className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  <ChevronRight className={`w-4 h-4 transition-transform ${
                                    expandedFolders.has(folder.id) ? 'rotate-90' : ''
                                  }`} />
                                </button>
                              </div>
                              
                              {/* Folder name column */}
                              <div 
                                className="px-4 py-3 border-r border-blue-500/20 flex-shrink-0 flex items-center gap-2"
                                style={{ 
                                  width: columnWidths['name'] || 240,
                                  minWidth: '180px',
                                  maxWidth: 'none'
                                }}
                              >
                                <Folder className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-200 text-sm font-semibold">{folder.name}</span>
                              </div>
                              
                              {/* Empty columns for alignment */}
                              {columns.slice(1).map((column) => (
                                <div 
                                  key={`folder-header-${folder.id}-${column.id}`}
                                  className="px-4 py-3 border-r border-blue-500/20 flex-shrink-0"
                                  style={{
                                    width: columnWidths[column.id] || 140,
                                    minWidth: '100px',
                                    maxWidth: 'none'
                                  }}
                                ></div>
                              ))}
                              
                              {/* Actions column */}
                              <div className="w-12 px-2 py-3"></div>
                            </div>

                            {/* Sub-item Column Headers (only when folder is expanded) */}
                            {expandedFolders.has(folder.id) && (
                              <div className="flex bg-gradient-to-r from-blue-950/10 to-slate-900/10 border-b border-blue-500/10">
                                {/* Checkbox column */}
                                <div className="w-12 px-2 py-2 border-r border-blue-500/20"></div>
                                
                                {/* Sub-item column headers */}
                                {subItemColumns.map((column, index) => (
                                  <div
                                    key={`subheader-${column.id}`}
                                    className="px-4 py-2 border-r border-blue-500/20 flex-shrink-0"
                                    style={{
                                      width: index === 0 ? 200 : 120,
                                      minWidth: index === 0 ? '150px' : '100px',
                                      maxWidth: 'none'
                                    }}
                                  >
                                    <span className="text-xs font-medium text-blue-300">{column.name}</span>
                                  </div>
                                ))}
                                
                                {/* Actions column */}
                                <div className="w-12 px-2 py-2"></div>
                              </div>
                            )}

                            {/* Sub-items in folder */}
                            {expandedFolders.has(folder.id) && item.subItems
                              ?.filter((subItem: SubItem) => subItem.folderId === folder.id)
                              .map((subItem: SubItem) => (
                                <div key={`subitem-${subItem.id}`} className="flex hover:bg-blue-500/5 transition-all bg-gradient-to-r from-blue-950/5 to-slate-900/5 border-b border-blue-500/5">
                                  {/* Checkbox column */}
                                  <div className="w-12 px-2 py-2 border-r border-blue-500/20 flex items-center justify-center">
                                    <CheckSquare className="w-3 h-3 text-blue-400/40" />
                                  </div>
                                  
                                  {/* Sub-item data columns */}
                                  {subItemColumns.map((column, colIndex) => (
                                    <div
                                      key={column.id}
                                      className="px-4 py-2 border-r border-blue-500/20 flex-shrink-0 flex items-center"
                                      style={{
                                        width: colIndex === 0 ? 200 : 120,
                                        minWidth: colIndex === 0 ? '150px' : '100px',
                                        maxWidth: 'none'
                                      }}
                                    >
                                      {renderSubItemCell(subItem, column)}
                                    </div>
                                  ))}
                                  
                                  {/* Actions column */}
                                  <div className="w-12 px-2 py-2 flex items-center justify-center">
                                    <button className="text-blue-400/40 hover:text-blue-300 transition-colors">
                                      <MoreHorizontal className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                            {/* Add Sub-item Button (only when folder is expanded) */}
                            {expandedFolders.has(folder.id) && (
                              <div className="flex hover:bg-blue-500/5 transition-all bg-gradient-to-r from-blue-950/10 to-slate-900/5 border-b border-blue-500/10">
                                {/* Button alignment with checkbox column */}
                                <div className="w-12 px-2 py-3 border-r border-blue-500/20 flex items-center justify-center">
                                  <Plus className="w-4 h-4 text-blue-400/60" />
                                </div>
                                
                                {/* Add button spans across all sub-item columns */}
                                <div 
                                  className="flex-1 px-4 py-3 border-r border-blue-500/20 flex items-center cursor-pointer text-blue-400/70 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                                >
                                  <span className="text-sm font-medium">Add sub-item</span>
                                </div>
                                
                                {/* Actions column alignment */}
                                <div className="w-12 px-2 py-3"></div>
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
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