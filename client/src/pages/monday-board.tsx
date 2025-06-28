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
import { Plus, Settings, Calendar, Users, Hash, Tag, User, Type, ChevronDown, ChevronRight, ArrowLeft, Undo2, Folder, Columns, Trash2 } from "lucide-react";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default board columns - Main Item Columns + Sub Items
  const [columns, setColumns] = useState<BoardColumn[]>([
    { id: 'item', name: 'Main Item', type: 'text', order: 1 },
    { id: 'subitems', name: 'Sub Items', type: 'subitems', order: 2 },
    { id: 'status', name: 'Status', type: 'status', order: 3 },
    { id: 'assignedTo', name: 'People', type: 'people', order: 4 },
    { id: 'dueDate', name: 'Due Date', type: 'date', order: 5 },
    { id: 'priority', name: 'Priority', type: 'number', order: 6 },
    { id: 'tags', name: 'Tags', type: 'tags', order: 7 },
  ]);

  // Sub-item specific columns
  const [subItemColumns, setSubItemColumns] = useState<BoardColumn[]>([
    { id: 'subitem_name', name: 'Task', type: 'text', order: 1 },
    { id: 'subitem_status', name: 'Status', type: 'status', order: 2 },
    { id: 'subitem_assignedTo', name: 'Owner', type: 'people', order: 3 },
    { id: 'subitem_priority', name: 'Priority', type: 'number', order: 4 },
    { id: 'subitem_dueDate', name: 'Due', type: 'date', order: 5 },
  ]);

  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<BoardColumn['type']>('text');
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [undoStack, setUndoStack] = useState<Array<{action: string, data: any, timestamp: number}>>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [editingFolder, setEditingFolder] = useState<number | null>(null);
  const [folderNames, setFolderNames] = useState<Record<number, string>>({});
  
  // Sub-item state management
  const [editingSubItem, setEditingSubItem] = useState<number | null>(null);
  const [subItemNames, setSubItemNames] = useState<Record<number, string>>({});
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    item: 250,
    subitems: 120,
    status: 120,
    assignedTo: 150,
    location: 200,
    phone: 140,
    dueDate: 120,
    priority: 100,
    tags: 120,
    // Sub-item column widths
    subitem_name: 180,
    subitem_status: 100,
    subitem_assignedTo: 120,
    subitem_priority: 80,
    subitem_dueDate: 100
  });
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{projectId: number, field: string} | null>(null);
  const [newlyCreatedItem, setNewlyCreatedItem] = useState<number | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const debounceTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [expandedSubItems, setExpandedSubItems] = useState<Set<number>>(new Set());
  
  // Side panel drawer state
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [selectedMainItem, setSelectedMainItem] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);

  // Fetch projects and transform to board items
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!user, // Only fetch when user is available
    refetchInterval: 5000,
  });

  // Transform projects to board items safely
  const boardItems: BoardItem[] = Array.isArray(projects) ? projects.map((project: any) => {
    // Map project status to pipeline groups
    let groupName = 'New Leads';
    if (project.status === 'new lead') groupName = 'New Leads';
    else if (project.status === 'need attention') groupName = 'Need Attention';
    else if (project.status === 'sent estimate') groupName = 'Sent Estimate';
    else if (project.status === 'signed') groupName = 'Signed';
    else if (project.status === 'in progress') groupName = 'In Progress';
    else if (project.status === 'complete') groupName = 'Complete';
    


    return {
      id: project.id || 0,
      groupName,
      values: {
        item: project.name || '',
        status: project.status || 'new lead',
        assignedTo: project.assignedTo || '',
        dueDate: project.endDate || '',
        priority: 3,
        tags: [],
        location: project.projectAddress || '',
        phone: project.clientPhone || '',
      },
      subItems: project.subItems || [],
      subItemFolders: project.subItemFolders || []
    };
  }) : [];

  // Define fixed group order to match project pipeline exactly
  const groupOrder = ['New Leads', 'Need Attention', 'Sent Estimate', 'Signed', 'In Progress', 'Complete'];

  // Group items by group name
  const groupedItems = boardItems.reduce((groups: Record<string, BoardItem[]>, item) => {
    if (!groups[item.groupName]) {
      groups[item.groupName] = [];
    }
    groups[item.groupName].push(item);
    return groups;
  }, {});

  // Create board groups with collapse state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  
  // Create groups in fixed order, only including groups that have items
  const boardGroups: BoardGroup[] = groupOrder
    .filter(groupName => groupedItems[groupName] && groupedItems[groupName].length > 0)
    .map(groupName => ({
      name: groupName,
      items: groupedItems[groupName],
      collapsed: collapsedGroups[groupName] || false
    }));

  // Update cell mutation with proper auth
  const updateCellMutation = useMutation({
    mutationFn: async ({ projectId, field, value }: { projectId: number; field: string; value: any }) => {
      console.log('Updating cell:', { projectId, field, value });
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        throw new Error('Failed to update cell');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Update successful:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
    onError: (error) => {
      console.error('Update mutation error:', error);
    },
  });

  // Add new item mutation with proper auth
  const addItemMutation = useMutation({
    mutationFn: async (groupName: string = 'New Leads') => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const status = groupName === 'New Leads' ? 'new lead' : 
                    groupName === 'Need Attention' ? 'need attention' :
                    groupName === 'Sent Estimate' ? 'sent estimate' :
                    groupName === 'Signed' ? 'signed' :
                    groupName === 'In Progress' ? 'in progress' : 
                    groupName === 'Complete' ? 'complete' : 'new lead';
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: '',
          status: status,
          description: '',
          projectAddress: '',
          clientPhone: '',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add item');
      }
      
      return response.json();
    },
    onSuccess: (newProjectData) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      // Set the newly created item for auto-editing
      setNewlyCreatedItem(newProjectData.id);
      setEditingCell({ projectId: newProjectData.id, field: 'item' });
      
      // Save to undo stack
      setUndoStack(prev => [
        ...prev.slice(-9),
        {
          action: 'create_project',
          data: { projectData: newProjectData },
          timestamp: Date.now()
        }
      ]);
    },
  });

  // Bulk operations mutations
  const bulkArchiveMutation = useMutation({
    mutationFn: async (projectIds: number[]) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/api/projects/bulk/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ projectIds }),
      });
      if (!response.ok) throw new Error('Failed to archive items');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setSelectedItems(new Set());
      toast({ title: "Success", description: "Items archived successfully" });
    },
  });

  const bulkTrashMutation = useMutation({
    mutationFn: async (projectIds: number[]) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/api/projects/bulk/trash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ projectIds }),
      });
      if (!response.ok) throw new Error('Failed to trash items');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setSelectedItems(new Set());
      toast({ title: "Success", description: "Items moved to trash successfully" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (projectIds: number[]) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/api/projects/bulk/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ projectIds }),
      });
      if (!response.ok) throw new Error('Failed to delete items');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setSelectedItems(new Set());
      toast({ title: "Success", description: "Items deleted permanently" });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ projectIds, updates }: { projectIds: number[]; updates: any }) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/api/projects/bulk/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ projectIds, updates }),
      });
      if (!response.ok) throw new Error('Failed to update items');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setSelectedItems(new Set());
      toast({ title: "Success", description: "Items updated successfully" });
    },
  });

  const handleCellUpdate = useCallback((projectId: number, field: string, value: any) => {
    console.log('handleCellUpdate called:', { projectId, field, value });
    
    // Save current value to undo stack before updating
    const project = (projects as any)?.find((p: any) => p.id === projectId);
    if (project) {
      setUndoStack(prev => [
        ...prev.slice(-9),
        {
          action: 'update_cell',
          data: { projectId, field, previousValue: project[field as keyof Project], newValue: value },
          timestamp: Date.now()
        }
      ]);
    }

    // Map board fields to project fields
    const fieldMapping: Record<string, string> = {
      item: 'name',
      assignedTo: 'assignedTo',
      status: 'status',
      location: 'projectAddress',
      phone: 'clientPhone',
    };

    const actualField = fieldMapping[field] || field;
    console.log('Field mapping:', { field, actualField });
    updateCellMutation.mutate({ projectId, field: actualField, value });
  }, [updateCellMutation, projects]);

  // Bulk operations helpers
  const handleSelectAll = useCallback(() => {
    const allIds = new Set(boardItems.map(item => item.id));
    setSelectedItems(allIds);
  }, [boardItems]);

  const handleSelectNone = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectGroup = useCallback((groupName: string) => {
    const group = boardGroups.find(g => g.name === groupName);
    if (!group) return;
    
    const groupItemIds = group.items.map(item => item.id);
    const allGroupItemsSelected = groupItemIds.every(id => selectedItems.has(id));
    
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (allGroupItemsSelected) {
        // Deselect all items in this group
        groupItemIds.forEach(id => newSet.delete(id));
      } else {
        // Select all items in this group
        groupItemIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }, [boardGroups, selectedItems]);

  const isGroupSelected = useCallback((groupName: string) => {
    const group = boardGroups.find(g => g.name === groupName);
    if (!group || group.items.length === 0) return false;
    return group.items.every(item => selectedItems.has(item.id));
  }, [boardGroups, selectedItems]);

  const isGroupPartiallySelected = useCallback((groupName: string) => {
    const group = boardGroups.find(g => g.name === groupName);
    if (!group || group.items.length === 0) return false;
    const selectedInGroup = group.items.filter(item => selectedItems.has(item.id));
    return selectedInGroup.length > 0 && selectedInGroup.length < group.items.length;
  }, [boardGroups, selectedItems]);

  const handlePointerDown = (columnId: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(columnId);
    
    const startX = e.clientX;
    const startWidth = columnWidths[columnId] || 120;
    
    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();
      const newWidth = Math.max(80, startWidth + (e.clientX - startX)); // No maximum limit
      setColumnWidths(prev => ({ ...prev, [columnId]: newWidth }));
    };
    
    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault();
      setIsResizing(null);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
    
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
  };

  const addColumn = () => {
    if (!newColumnName.trim()) return;
    
    const newColumn: BoardColumn = {
      id: `custom_${Date.now()}`,
      name: newColumnName,
      type: newColumnType,
      order: columns.length + 1,
    };
    
    setColumns([...columns, newColumn]);
    setIsAddColumnOpen(false);
    setNewColumnName('');
    setNewColumnType('text');
    toast({ title: "Column added" });
  };

  const addGroup = () => {
    if (!newGroupName.trim()) return;
    
    // Add the new group to the group order
    const newGroupOrder = [...groupOrder, newGroupName];
    
    // Update local storage to persist custom groups
    localStorage.setItem('customGroups', JSON.stringify(newGroupOrder));
    
    setIsAddGroupOpen(false);
    setNewGroupName('');
    toast({ 
      title: "Group added", 
      description: `New group "${newGroupName}" has been added to the pipeline.` 
    });
    
    // Note: In a full implementation, this would also update the backend
    // For now, custom groups will be session-based
  };

  const getColumnIcon = (type: BoardColumn['type']) => {
    switch (type) {
      case 'status': return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
      case 'people': return <User className="w-2.5 h-2.5 text-purple-400" />;
      case 'date': return <Calendar className="w-2.5 h-2.5 text-orange-400" />;
      case 'number': return <Hash className="w-2.5 h-2.5 text-yellow-400" />;
      case 'tags': return <Tag className="w-2.5 h-2.5 text-red-400" />;
      default: return <Type className="w-2.5 h-2.5 text-gray-400" />;
    }
  };

  // Handle local state changes for fast typing
  const handleLocalChange = useCallback((projectId: number, field: string, value: string) => {
    const key = `${projectId}-${field}`;
    setLocalValues(prev => ({ ...prev, [key]: value }));
    
    // Clear existing timeout for this field
    if (debounceTimeoutRef.current[key]) {
      clearTimeout(debounceTimeoutRef.current[key]);
    }
    
    // Set new debounced timeout
    debounceTimeoutRef.current[key] = setTimeout(() => {
      handleCellUpdate(projectId, field, value);
      delete debounceTimeoutRef.current[key];
    }, 500); // 500ms debounce
  }, [handleCellUpdate]);

  const renderCell = (item: BoardItem, column: BoardColumn) => {
    const value = item.values[column.id] || '';
    
    switch (column.type) {
      case 'status':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleCellUpdate(item.id, column.id, newValue)}
          >
            <SelectTrigger className={`h-4 text-xs font-medium rounded-full px-1.5 border-none ${
              value === 'complete' ? 'bg-green-500/20 text-green-400' :
              value === 'in progress' ? 'bg-blue-500/20 text-blue-400' :
              value === 'signed' ? 'bg-emerald-500/20 text-emerald-400' :
              value === 'sent estimate' ? 'bg-purple-500/20 text-purple-400' :
              value === 'need attention' ? 'bg-yellow-500/20 text-yellow-400' :
              value === 'new lead' ? 'bg-cyan-500/20 text-cyan-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="new lead">New Leads</SelectItem>
              <SelectItem value="need attention">Need Attention</SelectItem>
              <SelectItem value="sent estimate">Sent Estimate</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        );
      
      case 'people':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleCellUpdate(item.id, column.id, newValue)}
          >
            <SelectTrigger className="h-4 text-xs border-none bg-transparent text-gray-300">
              <SelectValue placeholder="Assign" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="John Doe">John Doe</SelectItem>
              <SelectItem value="Jane Smith">Jane Smith</SelectItem>
              <SelectItem value="Bob Wilson">Bob Wilson</SelectItem>
              <SelectItem value="Alice Brown">Alice Brown</SelectItem>
            </SelectContent>
          </Select>
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
            className="h-4 text-xs border-none bg-transparent text-gray-300"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleCellUpdate(item.id, column.id, parseInt(e.target.value) || 0)}
            className="h-4 text-xs border-none bg-transparent text-gray-300"
            placeholder="0"
          />
        );
      
      case 'tags':
        return (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(value) && value.map((tag: string, idx: number) => (
              <span key={idx} className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                {tag}
              </span>
            ))}
            <Input
              placeholder="Add tag"
              className="h-5 text-xs border-none bg-transparent text-gray-300 flex-1 min-w-16"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const newTags = [...(Array.isArray(value) ? value : []), e.currentTarget.value.trim()];
                  handleCellUpdate(item.id, column.id, newTags);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        );

      case 'subitems':
        const isExpanded = expandedSubItems.has(item.id);
        const subItemCount = item.subItems?.length || 0;
        
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedSubItems(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(item.id)) {
                    newSet.delete(item.id);
                  } else {
                    newSet.add(item.id);
                  }
                  return newSet;
                });
              }}
              className="flex items-center gap-1 hover:bg-gray-800/50 px-1 py-0.5 rounded text-xs text-gray-400 hover:text-gray-300"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Folder className="w-3 h-3" />
              <span>{subItemCount} items</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement add sub-item functionality
                toast({ title: "Add Sub-item", description: "Sub-item creation coming soon!" });
              }}
              className="text-xs text-gray-500 hover:text-gray-300 px-1"
              title="Add sub-item"
            >
              +
            </button>
          </div>
        );
      
      default:
        const isNewItem = newlyCreatedItem === item.id && editingCell?.projectId === item.id && editingCell?.field === column.id;
        const isEditing = editingCell?.projectId === item.id && editingCell?.field === column.id;
        
        if (isEditing || isNewItem) {
          const localKey = `${item.id}-${column.id}`;
          const localValue = localValues[localKey] !== undefined ? localValues[localKey] : value;
          
          return (
            <Input
              value={localValue}
              onChange={(e) => handleLocalChange(item.id, column.id, e.target.value)}
              className="h-4 text-xs border-none bg-transparent text-gray-300"
              placeholder={column.id === 'item' ? "Enter project name" : "Enter text"}
              autoFocus
              onBlur={() => {
                setEditingCell(null);
                if (isNewItem) {
                  setNewlyCreatedItem(null);
                }
                // Clear local value when exiting edit mode
                const key = `${item.id}-${column.id}`;
                setLocalValues(prev => {
                  const newValues = { ...prev };
                  delete newValues[key];
                  return newValues;
                });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setEditingCell(null);
                  if (isNewItem) {
                    setNewlyCreatedItem(null);
                  }
                  // Clear local value when exiting edit mode
                  const key = `${item.id}-${column.id}`;
                  setLocalValues(prev => {
                    const newValues = { ...prev };
                    delete newValues[key];
                    return newValues;
                  });
                }
                if (e.key === 'Escape') {
                  setEditingCell(null);
                  if (isNewItem) {
                    setNewlyCreatedItem(null);
                  }
                  // Clear local value when escaping
                  const key = `${item.id}-${column.id}`;
                  setLocalValues(prev => {
                    const newValues = { ...prev };
                    delete newValues[key];
                    return newValues;
                  });
                }
              }}
            />
          );
        }
        
        return (
          <div
            className={`h-4 text-xs cursor-text hover:bg-gray-800/50 flex items-center px-1 rounded transition-colors ${
              column.id === 'item' 
                ? 'text-gray-100 font-medium flex items-center gap-1.5' 
                : 'text-gray-300'
            }`}
            onClick={() => setEditingCell({ projectId: item.id, field: column.id })}
            title="Click to edit"
          >
            {column.id === 'item' && (
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                item.values['status'] === 'complete' ? 'bg-green-500' :
                item.values['status'] === 'in progress' ? 'bg-blue-500' :
                item.values['status'] === 'signed' ? 'bg-emerald-500' :
                item.values['status'] === 'sent estimate' ? 'bg-purple-500' :
                item.values['status'] === 'need attention' ? 'bg-yellow-500' :
                item.values['status'] === 'new lead' ? 'bg-cyan-500' :
                'bg-gray-500'
              }`} />
            )}
            {value || <span className="text-gray-500">{column.id === 'item' ? 'Untitled Project' : 'Click to add...'}</span>}
          </div>
        );
    }
  };

  // Sub-item cell update handler
  const handleSubItemCellUpdate = useCallback(async (subItemId: number, field: string, value: any) => {
    console.log('Sub-item cell update triggered:', { subItemId, field, value });
    
    // TODO: Implement sub-item update API endpoint
    toast({ 
      title: "Sub-item Update", 
      description: `Updated ${field} to ${value} for sub-item ${subItemId}` 
    });
  }, [toast]);

  // Sub-item mutations
  const createSubItemMutation = useMutation({
    mutationFn: async ({ projectId, name, folderId }: { projectId: number; name: string; folderId?: number }) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/sub-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, folderId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create sub-item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Sub-item created", description: "New sub-item has been added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create sub-item", variant: "destructive" });
    }
  });

  const createSubItemFolderMutation = useMutation({
    mutationFn: async ({ projectId, name }: { projectId: number; name: string }) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/sub-item-folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create sub-item folder');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Folder created", description: "New sub-item folder has been added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create sub-item folder", variant: "destructive" });
    }
  });

  // Delete mutations
  const deleteSubItemMutation = useMutation({
    mutationFn: async (subItemId: number) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/api/sub-items/${subItemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete sub-item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Sub-item deleted", description: "Sub-item has been deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete sub-item", variant: "destructive" });
    }
  });

  const deleteSubItemFolderMutation = useMutation({
    mutationFn: async (folderId: number) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/api/sub-item-folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete sub-item folder');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Folder deleted", description: "Folder and all its sub-items have been deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete folder", variant: "destructive" });
    }
  });

  // Handler functions for sub-item operations
  const handleAddSubItem = useCallback((projectId: number) => {
    createSubItemMutation.mutate({ 
      projectId, 
      name: "" // Create with empty name
    }, {
      onSuccess: (newSubItem) => {
        console.log('Sub-item created successfully:', newSubItem);
        // Automatically start editing the new sub-item name
        setTimeout(() => {
          setEditingSubItem(newSubItem.id);
          setSubItemNames(prev => ({...prev, [newSubItem.id]: ""})); // Start with empty name
          console.log('Starting to edit sub-item:', newSubItem.id);
        }, 100);
      }
    });
  }, [createSubItemMutation]);

  const handleAddSubItemFolder = useCallback((projectId: number) => {
    createSubItemFolderMutation.mutate({ 
      projectId, 
      name: "" // Create with empty name
    }, {
      onSuccess: (newFolder) => {
        console.log('Folder created successfully:', newFolder);
        // Automatically expand the new folder and start editing its name
        setTimeout(() => {
          setExpandedFolders(prev => {
            const newExpanded = new Set(prev);
            newExpanded.add(newFolder.id);
            return newExpanded;
          });
          setEditingFolder(newFolder.id);
          setFolderNames(prev => ({...prev, [newFolder.id]: ""})); // Start with empty name
          console.log('Starting to edit folder:', newFolder.id);
        }, 100);
      }
    });
  }, [createSubItemFolderMutation]);

  const handleDeleteSubItem = useCallback((subItemId: number) => {
    deleteSubItemMutation.mutate(subItemId);
  }, [deleteSubItemMutation]);

  const handleDeleteSubItemFolder = useCallback((folderId: number) => {
    deleteSubItemFolderMutation.mutate(folderId);
  }, [deleteSubItemFolderMutation]);

  // Handler for adding sub-items to specific folders
  const handleAddSubItemToFolder = useCallback((projectId: number, folderId: number) => {
    createSubItemMutation.mutate({ 
      projectId, 
      name: "", // Create with empty name
      folderId 
    }, {
      onSuccess: (newSubItem) => {
        console.log('Sub-item created successfully:', newSubItem);
        // Automatically start editing the new sub-item name
        setTimeout(() => {
          setEditingSubItem(newSubItem.id);
          setSubItemNames(prev => ({...prev, [newSubItem.id]: ""})); // Start with empty name
          console.log('Starting to edit sub-item:', newSubItem.id);
        }, 100);
      }
    });
  }, [createSubItemMutation]);

  // Handler for updating sub-item names
  const handleUpdateSubItemName = useCallback(async (subItemId: number, newName: string) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/api/sub-items/${subItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update sub-item name');
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Sub-item updated", description: "Sub-item name has been updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update sub-item name", variant: "destructive" });
    }
  }, [queryClient, toast]);

  // Render sub-item cells with dedicated column types
  const renderSubItemCell = (subItem: SubItem, column: BoardColumn, projectId: number) => {
    // Map sub-item data to column values
    let value = '';
    switch (column.id) {
      case 'subitem_name':
        value = subItem.name;
        break;
      case 'subitem_status':
        value = subItem.status;
        break;
      case 'subitem_assignedTo':
        value = subItem.assignedTo || '';
        break;
      case 'subitem_priority':
        value = '3'; // Default priority
        break;
      case 'subitem_dueDate':
        value = ''; // No due date in current schema
        break;
      default:
        value = '';
    }
    
    switch (column.type) {
      case 'status':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleSubItemCellUpdate(subItem.id, column.id, newValue)}
          >
            <SelectTrigger className={`h-4 text-xs font-medium rounded-full px-1.5 border-none ${
              value === 'complete' ? 'bg-green-500/20 text-green-400' :
              value === 'in progress' ? 'bg-blue-500/20 text-blue-400' :
              value === 'signed' ? 'bg-emerald-500/20 text-emerald-400' :
              value === 'sent estimate' ? 'bg-purple-500/20 text-purple-400' :
              value === 'need attention' ? 'bg-yellow-500/20 text-yellow-400' :
              value === 'new lead' ? 'bg-cyan-500/20 text-cyan-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="new lead">New</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        );
        
      case 'people':
        return (
          <Input
            value={value}
            onChange={(e) => handleSubItemCellUpdate(subItem.id, column.id, e.target.value)}
            className="h-4 text-xs border-none bg-transparent text-gray-300"
            placeholder="Assign to..."
          />
        );
        
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleSubItemCellUpdate(subItem.id, column.id, e.target.value)}
            className="h-4 text-xs border-none bg-transparent text-gray-300"
            placeholder="0"
          />
        );
        
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleSubItemCellUpdate(subItem.id, column.id, e.target.value)}
            className="h-4 text-xs border-none bg-transparent text-gray-300"
          />
        );
        
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleSubItemCellUpdate(subItem.id, column.id, e.target.value)}
            className="h-4 text-xs border-none bg-transparent text-gray-300"
            placeholder="Enter text..."
          />
        );
    }
  };

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Authentication Required</div>
          <div className="text-sm text-gray-400 mb-4">Please log in to access the project board</div>
          <Button 
            onClick={() => window.location.href = '/auth'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading Monday.com-style board...</div>
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4 text-red-400">Error loading board</div>
          <div className="text-sm text-gray-400">Check console for details</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Responsive Header */}
      <header className="bg-gray-950/80 backdrop-blur-sm border-b border-gray-800/50 px-2 md:px-3 py-2 md:py-1.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 md:space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
              className="text-gray-500 hover:text-white text-xs px-1 md:px-1.5 py-1 h-7 md:h-6"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-sm" />
            </div>
            <h1 className="text-xs md:text-sm font-medium truncate">
              <span className="hidden sm:inline">Project Board</span>
              <span className="sm:hidden">Board</span>
            </h1>
            <div className="px-1 md:px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
              Monday
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {undoStack.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  const lastAction = undoStack[undoStack.length - 1];
                  if (lastAction && lastAction.action === 'update_cell') {
                    const { projectId, field, previousValue } = lastAction.data;
                    updateCellMutation.mutate({ projectId, field, value: previousValue });
                    setUndoStack(prev => prev.slice(0, -1));
                  }
                }}
                className="text-gray-500 hover:text-white text-xs px-1 md:px-1.5 py-1 h-7 md:h-6"
              >
                <Undo2 className="w-3 h-3" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-blue-400 text-xs px-1 md:px-1.5 py-1 h-7 md:h-6"
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden sm:inline ml-1">Add</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-700 text-white" align="end">
                <DropdownMenuItem 
                  onClick={() => addItemMutation.mutate('New Leads')}
                  className="text-xs hover:bg-gray-800 focus:bg-gray-800"
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Add Item
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsAddGroupOpen(true)}
                  className="text-xs hover:bg-gray-800 focus:bg-gray-800"
                >
                  <Folder className="w-3 h-3 mr-2" />
                  Add Group
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsAddColumnOpen(true)}
                  className="text-xs hover:bg-gray-800 focus:bg-gray-800"
                >
                  <Columns className="w-3 h-3 mr-2" />
                  Add Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Column Dialog */}
            <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
              <DialogContent className="bg-gray-900 text-white border-gray-700">
                <DialogHeader>
                  <DialogTitle>Add Column</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white h-8"
                      placeholder="Column name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={newColumnType} onValueChange={(value) => setNewColumnType(value as BoardColumn['type'])}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="people">People</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="tags">Tags</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={addColumn} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 h-8">
                      Add
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddColumnOpen(false)}
                      size="sm"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Group Dialog */}
            <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
              <DialogContent className="bg-gray-900 text-white border-gray-700">
                <DialogHeader>
                  <DialogTitle>Add Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Group Name</Label>
                    <Input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white h-8"
                      placeholder="Enter group name"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={addGroup} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 h-8">
                      Add Group
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddGroupOpen(false)} 
                      size="sm" 
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Modern Board Container */}
      <div className="flex-1 overflow-hidden bg-gray-950">
        {/* Mobile View - Card Layout */}
        <div className="block md:hidden h-full overflow-auto p-4">
          {boardGroups.map((group) => (
            <div key={group.name} className="mb-6">
              {/* Mobile Group Header */}
              <div className="flex items-center justify-between mb-3 px-3 py-2 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className="p-1 hover:bg-gray-800 rounded"
                  >
                    {group.collapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <h3 className="font-medium text-sm text-gray-200">{group.name}</h3>
                  <span className="text-xs text-gray-500">({group.items.length})</span>
                </div>
                <Button
                  onClick={() => addItemMutation.mutate(group.name)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {/* Mobile Cards */}
              {!group.collapsed && (
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item.id} className="bg-gray-900/80 rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleToggleSelect(item.id)}
                            className="w-4 h-4 rounded border-gray-600"
                          />
                          <span className="font-medium text-sm text-white">
                            {item.values.item || 'Untitled'}
                          </span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.values.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                          item.values.status === 'in progress' ? 'bg-blue-500/20 text-blue-400' :
                          item.values.status === 'signed' ? 'bg-emerald-500/20 text-emerald-400' :
                          item.values.status === 'sent estimate' ? 'bg-purple-500/20 text-purple-400' :
                          item.values.status === 'need attention' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {item.values.status || 'New Lead'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                        <div>
                          <span className="text-gray-500">Assigned:</span> {item.values.assignedTo || 'Unassigned'}
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span> {item.values.phone || 'N/A'}
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Location:</span> {item.values.location || 'No address'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop View - Table Layout */}
        <div className="hidden md:block h-full overflow-auto">
          <div className="min-w-max">
            {/* Modern Column Headers */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700/50 z-10">
              <div className="flex items-center h-10">
                {/* Selection checkbox header */}
                <div className="w-10 flex items-center justify-center border-r border-gray-700/30">
                  <input
                    type="checkbox"
                    checked={selectedItems.size > 0 && selectedItems.size === boardItems.length}
                    onChange={selectedItems.size === boardItems.length ? handleSelectNone : handleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500"
                  />
                </div>
                {columns.map((column, index) => (
                  <div 
                    key={column.id} 
                    className="px-4 py-2 border-r border-gray-700/30 relative group flex-shrink-0 bg-gray-900"
                    style={{ 
                      width: columnWidths[column.id] || (index === 0 ? 240 : 120),
                      minWidth: index === 0 ? '200px' : '100px'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{getColumnIcon(column.type)}</span>
                      <span className="font-medium text-sm text-gray-300">{column.name}</span>
                    </div>
                    {/* Column Resizer */}
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-transparent hover:bg-blue-500/50"
                      onPointerDown={(e) => handlePointerDown(column.id, e)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Modern Groups and Items */}
            {boardGroups.map((group) => (
              <div key={group.name}>
                {/* Clean Group Header */}
                <div className="bg-gray-900/60 border-b border-gray-700/30 h-9 flex items-center px-3 sticky top-10 z-5">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="p-1 hover:bg-gray-800 rounded"
                    >
                      {group.collapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    
                    <div className={`w-3 h-3 rounded-sm ${
                      group.name === 'New Leads' ? 'bg-pink-500' :
                      group.name === 'Need Attention' ? 'bg-orange-500' :
                      group.name === 'Sent Estimate' ? 'bg-purple-500' :
                      group.name === 'Signed' ? 'bg-green-500' :
                      group.name === 'In Progress' ? 'bg-blue-500' :
                      group.name === 'Complete' ? 'bg-emerald-500' :
                      'bg-gray-500'
                    }`} />
                    
                    <span className="text-sm font-medium text-white">{group.name}</span>
                    <span className="text-sm text-gray-400">{group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <Button
                    onClick={() => addItemMutation.mutate(group.name)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Group Items */}
                {!group.collapsed && (
                  <div className="bg-gray-950">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-center h-12 hover:bg-gray-900/30 border-b border-gray-800/20 transition-colors">
                        {/* Selection checkbox */}
                        <div className="w-10 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleToggleSelect(item.id)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500"
                          />
                        </div>
                        
                        {columns.map((column, index) => (
                          <div 
                            key={`${item.id}-${column.id}`} 
                            className="px-4 py-2 border-r border-gray-700/30 flex-shrink-0 flex items-center"
                            style={{ 
                              width: columnWidths[column.id] || (index === 0 ? 240 : 120),
                              minWidth: index === 0 ? '200px' : '100px'
                            }}
                          >
                            {renderCell(item, column)}
                          </div>
                        ))}
                      </div>
                    ))}
                    
                    {/* Add Item Row */}
                    <div className="flex items-center h-10 hover:bg-gray-900/20 border-b border-gray-800/10 transition-colors">
                      <div className="w-10"></div>
                      <div className="px-4 py-2 flex items-center text-gray-500 text-sm">
                        <button
                          onClick={() => addItemMutation.mutate(group.name)}
                          className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add item
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      
      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg px-4 py-2 flex items-center gap-3">
            <span className="text-sm text-gray-300">
              {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
            </span>
            <div className="w-px h-4 bg-gray-600"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => bulkArchiveMutation.mutate(Array.from(selectedItems))}
              disabled={bulkArchiveMutation.isPending}
              className="text-xs h-7 px-3 text-gray-300 hover:text-white hover:bg-gray-700"
            >
              Archive
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => bulkTrashMutation.mutate(Array.from(selectedItems))}
              disabled={bulkTrashMutation.isPending}
              className="text-xs h-7 px-3 text-orange-400 hover:text-orange-300 hover:bg-orange-900/20"
            >
              Trash
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedItems))}
              disabled={bulkDeleteMutation.isPending}
              className="text-xs h-7 px-3 text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              Delete
            </Button>
            <div className="w-px h-4 bg-gray-700"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItems(new Set())}
              className="text-xs h-7 px-2 text-gray-500 hover:text-gray-300"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
