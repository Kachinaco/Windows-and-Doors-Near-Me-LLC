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
import { Plus, Settings, Calendar, Users, Hash, Tag, User, Type, ChevronDown, ChevronRight, ArrowLeft, Undo2, Folder, Columns, Trash2, MessageCircle } from "lucide-react";

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
  const [openUpdates, setOpenUpdates] = useState<Set<number>>(new Set());
  const [selectedProjectForUpdates, setSelectedProjectForUpdates] = useState<number | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const debounceTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [expandedSubItems, setExpandedSubItems] = useState<Set<number>>(new Set());
  
  // Side panel drawer state
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [selectedMainItem, setSelectedMainItem] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  
  // Update form state
  const [updateContent, setUpdateContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  // Fetch projects and transform to board items
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!user, // Only fetch when user is available
    refetchInterval: 5000,
  });

  // Fetch project updates for selected project
  const { data: projectUpdates = [], isLoading: updatesLoading } = useQuery<any[]>({
    queryKey: ['/api/projects', selectedMainItem?.id, 'updates'],
    enabled: !!selectedMainItem?.id,
    refetchInterval: 3000, // Refresh more frequently for real-time updates
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

  // Project update mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (updateData: { projectId: number; content: string; attachments?: any[] }) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/api/project-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error('Failed to create update');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', selectedMainItem?.id, 'updates'] });
      setUpdateContent('');
      setSelectedFiles([]);
      setIsPosting(false);
      toast({ title: "Success", description: "Update posted successfully" });
    },
    onError: () => {
      setIsPosting(false);
      toast({ title: "Error", description: "Failed to post update", variant: "destructive" });
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

  const handleToggleUpdates = useCallback((projectId: number) => {
    const project = boardItems.find(item => item.id === projectId);
    if (project) {
      setSelectedMainItem(project);
      setSidePanelOpen(true);
    }
  }, [boardItems]);

  // Handle posting new update
  const handlePostUpdate = useCallback(() => {
    if (!updateContent.trim() || !selectedMainItem?.id) return;
    
    setIsPosting(true);
    createUpdateMutation.mutate({
      projectId: selectedMainItem.id,
      content: updateContent.trim(),
      attachments: selectedFiles.length > 0 ? selectedFiles.map(file => ({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })) : undefined
    });
  }, [updateContent, selectedMainItem?.id, selectedFiles, createUpdateMutation]);

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
    <div className="h-screen bg-gray-950 text-white flex overflow-hidden">
      {/* Main Board Container */}
      <div className={`flex flex-col transition-all duration-300 ${selectedProjectForUpdates ? 'flex-1' : 'w-full'}`}>
        {/* Enhanced Header */}
        <header className="bg-gray-950/80 backdrop-blur-sm border-b border-gray-800/50 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
              className="text-gray-500 hover:text-white text-sm px-3 py-2 h-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm" />
            </div>
            <h1 className="text-lg font-medium">Project Board</h1>
            <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
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
                className="text-gray-500 hover:text-white text-xs px-1.5 py-1 h-6"
              >
                <Undo2 className="w-3 h-3" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-blue-400 text-xs px-1.5 py-1 h-6"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-700 text-white">
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

      {/* Compact Board */}
      <div className="flex-1 overflow-auto bg-gray-950">
        <div className="min-w-max">
          {/* Enhanced Column Headers */}
          <div className="sticky top-0 bg-gray-950/95 backdrop-blur-sm z-10 border-b border-gray-800/50">
            <div className="flex">
              {/* Selection checkbox header */}
              <div className="w-12 px-2 py-3 border-r border-gray-800/30 flex items-center justify-center sticky left-0 bg-gray-950/95 backdrop-blur-sm z-30">
                <input
                  type="checkbox"
                  checked={selectedItems.size > 0 && selectedItems.size === boardItems.length}
                  onChange={selectedItems.size === boardItems.length ? handleSelectNone : handleSelectAll}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-1"
                />
              </div>
              {columns.map((column, index) => (
                <div 
                  key={column.id} 
                  className={`px-3 py-3 border-r border-gray-800/30 relative group flex-shrink-0 ${
                    index === 0 ? 'sticky left-12 bg-gray-950/95 backdrop-blur-sm z-20' : ''
                  }`}
                  style={{ 
                    width: columnWidths[column.id] || (index === 0 ? 240 : 120),
                    minWidth: index === 0 ? '180px' : '90px',
                    maxWidth: 'none'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    {getColumnIcon(column.type)}
                    <span className="font-medium text-sm text-gray-300">{column.name}</span>
                  </div>
                  {index < columns.length - 1 && (
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center bg-transparent hover:bg-blue-500/20 transition-all group touch-none"
                      onPointerDown={(e) => handlePointerDown(column.id, e)}
                      title="Resize"
                      style={{ touchAction: 'none' }}
                    >
                      <div className="w-0.5 h-4 bg-gray-600 hover:bg-blue-400 rounded-full transition-all duration-200 group-hover:h-5 group-hover:bg-blue-400"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>


          </div>

          {/* Groups and Items */}
          {boardGroups.map((group) => (
            <div key={group.name} className="border-b border-gray-800/50 last:border-b-0">
              {/* Enhanced Group Header */}
              <div className={`px-3 py-3 border-b border-gray-800/20 flex items-center space-x-2 hover:bg-gray-900/40 transition-all ${
                group.name === 'New Leads' ? 'bg-gradient-to-r from-cyan-900/20 to-gray-900/20' :
                group.name === 'Need Attention' ? 'bg-gradient-to-r from-yellow-900/20 to-gray-900/20' :
                group.name === 'Sent Estimate' ? 'bg-gradient-to-r from-purple-900/20 to-gray-900/20' :
                group.name === 'Signed' ? 'bg-gradient-to-r from-emerald-900/20 to-gray-900/20' :
                group.name === 'In Progress' ? 'bg-gradient-to-r from-blue-900/20 to-gray-900/20' :
                group.name === 'Complete' ? 'bg-gradient-to-r from-green-900/20 to-gray-900/20' :
                'bg-gray-900/20'
              }`}>
                {/* Group Selection Checkbox */}
                <div className="w-8 px-1 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isGroupSelected(group.name)}
                    ref={el => {
                      if (el) {
                        el.indeterminate = isGroupPartiallySelected(group.name);
                      }
                    }}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectGroup(group.name);
                    }}
                    className="w-3 h-3 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-1"
                  />
                </div>
                
                {/* Group Toggle and Info */}
                <div 
                  className="flex-1 flex items-center space-x-1.5 cursor-pointer"
                  onClick={() => toggleGroup(group.name)}
                >
                  {group.collapsed ? (
                    <ChevronRight className="w-2.5 h-2.5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-2.5 h-2.5 text-gray-500" />
                  )}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    group.name === 'New Leads' ? 'bg-cyan-500' :
                    group.name === 'Need Attention' ? 'bg-yellow-500' :
                    group.name === 'Sent Estimate' ? 'bg-purple-500' :
                    group.name === 'Signed' ? 'bg-emerald-500' :
                    group.name === 'In Progress' ? 'bg-blue-500' :
                    group.name === 'Complete' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    group.name === 'New Leads' ? 'text-cyan-300' :
                    group.name === 'Need Attention' ? 'text-yellow-300' :
                    group.name === 'Sent Estimate' ? 'text-purple-300' :
                    group.name === 'Signed' ? 'text-emerald-300' :
                    group.name === 'In Progress' ? 'text-blue-300' :
                    group.name === 'Complete' ? 'text-green-300' :
                    'text-gray-400'
                  }`}>{group.name}</span>
                  <span className="text-sm text-gray-500 font-medium">({group.items.length})</span>
                </div>
                
                {/* Main column headers on group header row */}
                {columns.slice(1).map((column) => (
                  <div 
                    key={`group-${group.name}-${column.id}`}
                    className={`px-2 py-1.5 border-r flex-shrink-0 ${
                      group.name === 'New Leads' ? 'border-cyan-500/20 bg-gradient-to-r from-cyan-950/10 to-slate-950/5' :
                      group.name === 'Need Attention' ? 'border-yellow-500/20 bg-gradient-to-r from-yellow-950/10 to-slate-950/5' :
                      group.name === 'Sent Estimate' ? 'border-purple-500/20 bg-gradient-to-r from-purple-950/10 to-slate-950/5' :
                      group.name === 'Signed' ? 'border-emerald-500/20 bg-gradient-to-r from-emerald-950/10 to-slate-950/5' :
                      group.name === 'In Progress' ? 'border-blue-500/20 bg-gradient-to-r from-blue-950/10 to-slate-950/5' :
                      group.name === 'Complete' ? 'border-green-500/20 bg-gradient-to-r from-green-950/10 to-slate-950/5' :
                      'border-gray-500/20 bg-gradient-to-r from-gray-950/10 to-slate-950/5'
                    }`}
                    style={{ 
                      width: columnWidths[column.id] || 100,
                      minWidth: '70px',
                      maxWidth: 'none'
                    }}
                  >
                    {/* Main column header */}
                    <div className="flex items-center justify-center w-full">
                      <span className={`text-sm font-medium uppercase tracking-wide text-center ${
                        group.name === 'New Leads' ? 'text-cyan-300/80' :
                        group.name === 'Need Attention' ? 'text-yellow-300/80' :
                        group.name === 'Sent Estimate' ? 'text-purple-300/80' :
                        group.name === 'Signed' ? 'text-emerald-300/80' :
                        group.name === 'In Progress' ? 'text-blue-300/80' :
                        group.name === 'Complete' ? 'text-green-300/80' :
                        'text-gray-300/80'
                      }`}>
                        {column.name}
                      </span>
                      <div className="flex items-center gap-1">
                        {/* Column type indicator */}
                        {column.type === 'status' && <div className={`w-2 h-2 rounded-full ${
                          group.name === 'New Leads' ? 'bg-cyan-400/60' :
                          group.name === 'Need Attention' ? 'bg-yellow-400/60' :
                          group.name === 'Sent Estimate' ? 'bg-purple-400/60' :
                          group.name === 'Signed' ? 'bg-emerald-400/60' :
                          group.name === 'In Progress' ? 'bg-blue-400/60' :
                          group.name === 'Complete' ? 'bg-green-400/60' :
                          'bg-gray-400/60'
                        }`}></div>}
                        {column.type === 'text' && <Type className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-400/60' :
                          group.name === 'Need Attention' ? 'text-yellow-400/60' :
                          group.name === 'Sent Estimate' ? 'text-purple-400/60' :
                          group.name === 'Signed' ? 'text-emerald-400/60' :
                          group.name === 'In Progress' ? 'text-blue-400/60' :
                          group.name === 'Complete' ? 'text-green-400/60' :
                          'text-gray-400/60'
                        }`} />}
                        {column.type === 'date' && <Calendar className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-400/60' :
                          group.name === 'Need Attention' ? 'text-yellow-400/60' :
                          group.name === 'Sent Estimate' ? 'text-purple-400/60' :
                          group.name === 'Signed' ? 'text-emerald-400/60' :
                          group.name === 'In Progress' ? 'text-blue-400/60' :
                          group.name === 'Complete' ? 'text-green-400/60' :
                          'text-gray-400/60'
                        }`} />}
                        {column.type === 'people' && <Users className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-400/60' :
                          group.name === 'Need Attention' ? 'text-yellow-400/60' :
                          group.name === 'Sent Estimate' ? 'text-purple-400/60' :
                          group.name === 'Signed' ? 'text-emerald-400/60' :
                          group.name === 'In Progress' ? 'text-blue-400/60' :
                          group.name === 'Complete' ? 'text-green-400/60' :
                          'text-gray-400/60'
                        }`} />}
                        {column.type === 'number' && <Hash className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-400/60' :
                          group.name === 'Need Attention' ? 'text-yellow-400/60' :
                          group.name === 'Sent Estimate' ? 'text-purple-400/60' :
                          group.name === 'Signed' ? 'text-emerald-400/60' :
                          group.name === 'In Progress' ? 'text-blue-400/60' :
                          group.name === 'Complete' ? 'text-green-400/60' :
                          'text-gray-400/60'
                        }`} />}
                        {column.type === 'tags' && <Tag className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-400/60' :
                          group.name === 'Need Attention' ? 'text-yellow-400/60' :
                          group.name === 'Sent Estimate' ? 'text-purple-400/60' :
                          group.name === 'Signed' ? 'text-emerald-400/60' :
                          group.name === 'In Progress' ? 'text-blue-400/60' :
                          group.name === 'Complete' ? 'text-green-400/60' :
                          'text-gray-400/60'
                        }`} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Group Items */}
              {!group.collapsed && (
                <>
                  {group.items.map((item) => (
                    <React.Fragment key={item.id}>
                      {/* Main Item Row - Clickable for Updates */}
                      <div 
                        className="flex hover:bg-gray-900/10 transition-all border-b border-gray-800/10 last:border-b-0 bg-gradient-to-r from-gray-900/5 to-transparent cursor-pointer"
                        onClick={(e) => {
                          // Only trigger if not clicking on a form element or checkbox
                          const target = e.target as HTMLElement;
                          if (!target.closest('input, select, button')) {
                            handleToggleUpdates(item.id);
                          }
                        }}
                      >
                        {/* Selection checkbox - standardized width */}
                        <div className="w-12 px-2 py-3 border-r border-gray-800/10 flex items-center justify-center sticky left-0 bg-gray-950 z-20">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(item.id);
                            }}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-1"
                          />
                        </div>
                        {columns.map((column, index) => (
                          <div 
                            key={`${item.id}-${column.id}`} 
                            className={`px-4 py-3 border-r border-gray-800/10 flex-shrink-0 flex items-center ${
                              index === 0 ? 'sticky left-12 bg-gray-950 z-10 justify-start' : 'justify-center'
                            }`}
                            style={{ 
                              width: columnWidths[column.id] || (index === 0 ? 240 : 140),
                              minWidth: index === 0 ? '180px' : '100px',
                              maxWidth: 'none'
                            }}
                          >
                            {renderCell(item, column)}
                          </div>
                        ))}
                      </div>


                      
                      {/* Sub-Items Rows (when expanded) */}
                      {expandedSubItems.has(item.id) && (
                        <>

                          {/* Render folders and their sub-items */}
                          {item.subItemFolders && item.subItemFolders.length > 0 ? (
                            <>
                              {item.subItemFolders
                                .sort((a, b) => a.order - b.order)
                                .map((folder) => {
                                  const folderSubItems = item.subItems?.filter(subItem => subItem.folderId === folder.id) || [];
                                  const isFolderExpanded = expandedFolders.has(folder.id);
                                  const isEditingThisFolder = editingFolder === folder.id;
                                  const currentFolderName = folderNames[folder.id] || folder.name;
                                  
                                  return (
                                    <React.Fragment key={folder.id}>
                                      {/* Folder Header with Column Headers */}
                                      <div className="group flex hover:bg-blue-500/8 transition-all bg-gradient-to-r from-blue-950/15 to-slate-950/8 border-b-2 border-blue-500/25 shadow-sm">
                                        {/* Empty space where checkbox used to be */}
                                        <div className="w-12 px-2 py-2 border-r border-blue-500/20 flex items-center justify-center sticky left-0 bg-gradient-to-r from-blue-950/15 to-slate-950/8 z-20">
                                        </div>
                                        
                                        {/* Folder name with expand/collapse */}
                                        <div 
                                          className="px-4 py-3 border-r border-blue-500/20 flex-shrink-0 sticky left-12 bg-gradient-to-r from-blue-950/15 to-slate-950/8 z-10 flex items-center"
                                          style={{ 
                                            width: columnWidths['item'] || 240,
                                            minWidth: '180px',
                                            maxWidth: 'none'
                                          }}
                                        >
                                          <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-px bg-blue-400/50"></div>
                                            
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedFolders(prev => 
                                                  prev.has(folder.id) 
                                                    ? new Set(Array.from(prev).filter(id => id !== folder.id))
                                                    : new Set([...Array.from(prev), folder.id])
                                                );
                                              }}
                                              className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                                            >
                                              <ChevronRight className={`w-4 h-4 text-blue-300 transition-transform ${
                                                expandedFolders.has(folder.id) ? 'rotate-90' : ''
                                              }`} />
                                            </button>
                                            
                                            <Folder className="w-5 h-5 text-blue-400 drop-shadow-sm" />
                                            
                                            {isEditingThisFolder ? (
                                              <input
                                                type="text"
                                                value={currentFolderName}
                                                onChange={(e) => setFolderNames(prev => ({...prev, [folder.id]: e.target.value}))}
                                                onBlur={() => setEditingFolder(null)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    setEditingFolder(null);
                                                  } else if (e.key === 'Escape') {
                                                    setFolderNames(prev => ({...prev, [folder.id]: folder.name}));
                                                    setEditingFolder(null);
                                                  }
                                                }}
                                                className="bg-blue-900/20 text-blue-200 text-sm font-semibold px-3 py-1.5 border border-blue-400/60 rounded-md focus:outline-none focus:border-blue-300 focus:bg-blue-900/30 ml-1"
                                                autoFocus
                                              />
                                            ) : (
                                              <span 
                                                className="text-blue-200 text-sm font-semibold cursor-pointer hover:text-blue-100 ml-1 px-3 py-1.5 rounded hover:bg-blue-500/10 transition-colors"
                                                onClick={() => setEditingFolder(folder.id)}
                                              >
                                                {currentFolderName}
                                              </span>
                                            )}
                                            
                                            <span className="text-blue-400/70 text-xs ml-2 font-medium">
                                              ({folderSubItems.length} items)
                                            </span>
                                            
                                            {/* Delete folder button */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSubItemFolder(folder.id);
                                              }}
                                              className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/20 rounded text-red-400 hover:text-red-300 transition-all"
                                              title="Delete folder"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                        
                                        {/* Sub-item column headers with resizers */}
                                        {subItemColumns.map((column, index) => (
                                          <div 
                                            key={`folder-subheader-${folder.id}-${column.id}`}
                                            className="px-4 py-3 border-r border-blue-500/20 flex-shrink-0 flex items-center gap-2 relative group bg-gradient-to-r from-blue-950/10 to-slate-950/5"
                                            style={{ 
                                              width: columnWidths[column.id] || 140,
                                              minWidth: '100px',
                                              maxWidth: 'none'
                                            }}
                                          >
                                            <div className="text-blue-400/80">{getColumnIcon(column.type)}</div>
                                            <span className="font-semibold text-sm text-blue-200">{column.name}</span>
                                            
                                            {/* Sub-item Column Resizer */}
                                            <div 
                                              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-transparent hover:bg-blue-400/50 group-hover:bg-blue-400/30"
                                              onPointerDown={(e) => handlePointerDown(column.id, e)}
                                            />
                                            
                                            {/* Sub-item Column Three-dot Menu */}
                                            <DropdownMenu>
                                              <DropdownMenuTrigger className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 text-gray-500 hover:text-gray-300">
                                                  <span className="text-[10px]">⋯</span>
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                                                <DropdownMenuItem onClick={() => {
                                                  // Add sub-item column to the right
                                                  const newColumn: BoardColumn = {
                                                    id: `subitem_new_${Date.now()}`,
                                                    name: 'New Column',
                                                    type: 'text',
                                                    order: column.order + 1
                                                  };
                                                  setSubItemColumns(prev => [...prev, newColumn].sort((a, b) => a.order - b.order));
                                                }} className="text-gray-300 hover:bg-gray-800">
                                                  Add column to the right
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                  setSubItemColumns(prev => prev.filter(col => col.id !== column.id));
                                                }} className="text-red-400 hover:bg-red-900/20">
                                                  Delete column
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        ))}
                                        
                                        {/* Folder checkbox positioned on the right */}
                                        <div className="w-12 px-2 py-3 flex items-center justify-center ml-auto bg-gradient-to-r from-blue-950/10 to-slate-950/5">
                                          <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-blue-500/50 bg-blue-900/30 text-blue-400 focus:ring-blue-400 focus:ring-1"
                                          />
                                        </div>
                                      </div>
                                      
                                      {/* Sub-items in this folder */}
                                      {expandedFolders.has(folder.id) && (
                                        <>
                                          {/* Folder content container with enhanced visual grouping */}
                                          <div className="relative ml-3">
                                            {/* Vertical connection line for entire folder group */}
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400/60 via-blue-400/40 to-blue-400/20 rounded-full"></div>
                                            
                                            {folderSubItems.map((subItem, index) => (
                                              <div key={`sub-${subItem.id}`} className="group flex hover:bg-blue-500/8 transition-all bg-gradient-to-r from-blue-950/15 to-slate-900/10 border-b border-blue-500/10 relative ml-4">
                                                {/* Enhanced connection line to folder */}
                                                <div className="absolute -left-4 top-0 w-4 h-full flex items-center">
                                                  <div className="w-full h-px bg-gradient-to-r from-amber-400/60 to-blue-400/60"></div>
                                                </div>
                                                
                                                {/* Connection dot */}
                                                <div className="absolute -left-5 top-1/2 transform -translate-y-1/2">
                                                  <div className="w-2 h-2 bg-amber-400/80 rounded-full border border-amber-300/50 shadow-sm"></div>
                                                </div>
                                                
                                                {/* Sub-item checkbox - aligned with main items */}
                                                <div className="w-12 px-2 py-3 border-r border-blue-500/20 flex items-center justify-center sticky left-0 bg-gradient-to-r from-blue-950/20 to-slate-900/15 z-20">
                                                  <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded border-blue-400/60 bg-blue-900/40 text-blue-400 focus:ring-blue-400 focus:ring-1"
                                                    />
                                                </div>
                                                
                                                {/* Sub-item name - aligned with main columns */}
                                                <div 
                                                  className="px-4 py-3 border-r border-blue-500/20 flex-shrink-0 sticky left-12 bg-gradient-to-r from-blue-950/20 to-slate-900/15 z-10 flex items-center"
                                                  style={{ 
                                                    width: (columnWidths['item'] || 240),
                                                    minWidth: '180px',
                                                    maxWidth: 'none'
                                                  }}
                                                >
                                                  <div className="flex items-center gap-2 text-sm">
                                                    {/* Clear visual hierarchy indicator */}
                                                    <div className="flex items-center gap-1 ml-2">
                                                      <div className="w-3 h-px bg-blue-400/60"></div>
                                                      <div className="w-2 h-2 bg-blue-400/80 rounded-full border border-blue-300/40 shadow-sm"></div>
                                                      <div className="w-2 h-px bg-blue-400/40"></div>
                                                    </div>
                                                  {editingSubItem === subItem.id ? (
                                                    <input
                                                      type="text"
                                                      value={subItemNames[subItem.id] || subItem.name}
                                                      onChange={(e) => setSubItemNames(prev => ({...prev, [subItem.id]: e.target.value}))}
                                                      onBlur={() => {
                                                        handleUpdateSubItemName(subItem.id, subItemNames[subItem.id] || subItem.name);
                                                        setEditingSubItem(null);
                                                      }}
                                                      onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                          handleUpdateSubItemName(subItem.id, subItemNames[subItem.id] || subItem.name);
                                                          setEditingSubItem(null);
                                                        } else if (e.key === 'Escape') {
                                                          setSubItemNames(prev => ({...prev, [subItem.id]: subItem.name}));
                                                          setEditingSubItem(null);
                                                        }
                                                      }}
                                                      className="bg-transparent text-gray-300 text-xs px-1 py-0 border border-gray-500/50 rounded focus:outline-none focus:border-blue-400"
                                                      autoFocus
                                                    />
                                                  ) : (
                                                    <span 
                                                      className="cursor-pointer hover:text-gray-300"
                                                      onClick={() => {
                                                        setEditingSubItem(subItem.id);
                                                        setSubItemNames(prev => ({...prev, [subItem.id]: subItem.name}));
                                                      }}
                                                    >
                                                      {subItem.name}
                                                    </span>
                                                    )}
                                                    
                                                    {/* Delete sub-item button with enhanced styling */}
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteSubItem(subItem.id);
                                                      }}
                                                      className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-md text-red-400 hover:text-red-300 transition-all text-xs"
                                                      title="Delete sub-item"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                </div>
                                                
                                                {/* Sub-item cells synchronized with sub-item column headers */}
                                                {subItemColumns.map((column) => (
                                                  <div 
                                                    key={`sub-${subItem.id}-${column.id}`}
                                                    className="px-4 py-3 border-r border-blue-500/20 flex-shrink-0 bg-gradient-to-r from-blue-950/10 to-slate-900/5 flex items-center justify-center"
                                                    style={{ 
                                                      width: columnWidths[column.id] || 140,
                                                      minWidth: '100px',
                                                      maxWidth: 'none'
                                                    }}
                                                  >
                                                    {/* Render sub-item data based on sub-item column types */}
                                                    <div className="text-xs text-gray-300 text-center w-full">
                                                      {column.type === 'status' && (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                          subItem.status === 'not_started' ? 'bg-gray-600/30 text-gray-300' :
                                                          subItem.status === 'in_progress' ? 'bg-blue-600/30 text-blue-300' :
                                                          subItem.status === 'completed' ? 'bg-green-600/30 text-green-300' :
                                                          'bg-gray-600/30 text-gray-300'
                                                        }`}>
                                                          {subItem.status?.replace('_', ' ') || 'Not Started'}
                                                        </span>
                                                      )}
                                                      {column.type === 'people' && (
                                                        <span className="text-blue-300 font-medium">{subItem.assignedTo || '-'}</span>
                                                      )}
                                                      {column.type === 'text' && (
                                                        <span className="text-gray-300">{column.name === 'Notes' ? 'Add notes...' : '-'}</span>
                                                      )}
                                                      {column.type === 'date' && (
                                                        <span className="text-gray-400">-</span>
                                                      )}
                                                      {column.type === 'number' && (
                                                        <span className="text-gray-400">-</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ))}
                                            
                                            {/* Add Sub Item button with enhanced styling */}
                                            <div className="flex hover:bg-blue-500/5 transition-all bg-gradient-to-r from-blue-950/8 to-slate-900/5 border-b border-blue-500/10 relative">
                                              {/* Connection line to folder */}
                                              <div className="absolute left-0 top-0 w-3 h-full flex items-center">
                                                <div className="w-3 h-px bg-amber-400/30"></div>
                                              </div>
                                              
                                              {/* Empty checkbox space with matching spacing */}
                                              <div className="w-8 px-1 py-1.5 border-r border-blue-500/10 sticky left-0 bg-gradient-to-r from-blue-950/8 to-slate-900/5 z-20 ml-4"></div>
                                              <div 
                                                className="px-2 py-1.5 flex-shrink-0 sticky left-12 bg-gradient-to-r from-blue-950/8 to-slate-900/5 z-10"
                                                style={{ 
                                                  width: (columnWidths['item'] || 200) - 16,
                                                  minWidth: '134px',
                                                  maxWidth: 'none'
                                                }}
                                              >
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleAddSubItemToFolder(item.id, folder.id)}
                                                  className="text-blue-400/70 hover:text-blue-300 hover:bg-blue-500/10 text-xs h-6 px-2 flex items-center gap-1.5 ml-2 border border-blue-500/20 rounded-md transition-all"
                                                >
                                                  <Plus className="w-3 h-3" />
                                                  Add Sub Item
                                                </Button>
                                              </div>
                                              
                                              {/* Empty cells synchronized with sub-item columns */}
                                              {subItemColumns.map((column) => (
                                                <div 
                                                  key={`add-sub-${folder.id}-${column.id}`}
                                                  className="px-4 py-3 border-r border-blue-500/20 flex-shrink-0 bg-gradient-to-r from-blue-950/8 to-slate-900/5"
                                                  style={{ 
                                                    width: columnWidths[column.id] || 140,
                                                    minWidth: '100px',
                                                    maxWidth: 'none'
                                                  }}
                                                />
                                              ))}
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </React.Fragment>
                                  );
                                })}

                              {/* Add Folder Section - positioned after all folders */}
                              <div className="flex hover:bg-blue-500/5 transition-all border-b border-blue-500/10">
                                {/* Empty checkbox space - moved to right */}
                                <div className="w-12 px-2 py-2 border-r border-blue-500/20 sticky left-0 bg-gray-950 z-20"></div>
                                <div 
                                  className="px-4 py-2 flex-shrink-0 sticky left-12 bg-gray-950 z-10"
                                  style={{ 
                                    width: columnWidths['item'] || 240,
                                    minWidth: '180px',
                                    maxWidth: 'none'
                                  }}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddSubItemFolder(item.id)}
                                    className="text-blue-400/80 hover:text-blue-300 hover:bg-blue-500/10 text-sm h-8 px-3 flex items-center gap-2 font-medium border border-blue-500/20 hover:border-blue-400/40 rounded-md transition-all"
                                  >
                                    <Folder className="w-4 h-4" />
                                    Add Folder
                                  </Button>
                                </div>
                                
                                {/* Sub-item column spaces synchronized with sub-item headers */}
                                {subItemColumns.map((column) => (
                                  <div 
                                    key={`addfolder-${item.id}-${column.id}`}
                                    className="px-4 py-3 border-r border-blue-500/20 flex-shrink-0"
                                    style={{ 
                                      width: columnWidths[column.id] || 140,
                                      minWidth: '100px',
                                      maxWidth: 'none'
                                    }}
                                  />
                                ))}
                                
                                {/* Checkbox positioned on the right */}
                                <div className="w-12 px-2 py-2 flex items-center justify-center ml-auto">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-blue-500/50 bg-blue-900/30 text-blue-400 focus:ring-blue-400 focus:ring-1"
                                  />
                                </div>
                              </div>
                          </>
                        ) : (
                            // Fallback: render sub-items without folders if no folders exist
                            item.subItems?.map((subItem) => (
                              <div key={`sub-${subItem.id}`} className="flex hover:bg-gray-900/20 transition-all bg-gray-900/5 border-b border-gray-800/5">
                                {/* Empty checkbox space for sub-items */}
                                <div className="w-8 px-1 py-0.5 border-r border-gray-800/10 flex items-center justify-center sticky left-0 bg-gray-950 z-20">
                                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                </div>
                                
                                {/* Sub-item name (first column) */}
                                <div 
                                  className="px-2 py-0.5 border-r border-gray-800/10 flex-shrink-0 sticky left-8 bg-gray-950 z-10 flex items-center"
                                  style={{ 
                                    width: columnWidths['item'] || 200,
                                    minWidth: '150px',
                                    maxWidth: 'none'
                                  }}
                                >
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <div className="w-3 h-px bg-gray-600 mr-1"></div>
                                    <span>{subItem.name}</span>
                                  </div>
                                </div>
                                
                                {/* Sub-item dedicated columns */}
                                {subItemColumns.map((column) => (
                                  <div 
                                    key={`sub-${subItem.id}-${column.id}`}
                                    className="px-2 py-0.5 border-r border-gray-800/10 flex-shrink-0"
                                    style={{ 
                                      width: columnWidths[column.id] || 120,
                                      minWidth: '80px',
                                      maxWidth: 'none'
                                    }}
                                  >
                                    {renderSubItemCell(subItem, column, item.id)}
                                  </div>
                                ))}
                              </div>
                            ))
                          )}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                  
                  {/* Add Item Button at bottom of group */}
                  <div className="flex hover:bg-gray-900/10 transition-all">
                    {/* Empty checkbox space */}
                    <div className="w-8 px-1 py-0.5 border-r border-gray-800/10 sticky left-0 bg-gray-950 z-20"></div>
                    <div 
                      className="px-2 py-0.5 flex-shrink-0 sticky left-8 bg-gray-950 z-10"
                      style={{ 
                        width: columnWidths['item'] || 200,
                        minWidth: '150px',
                        maxWidth: 'none'
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addItemMutation.mutate(group.name)}
                        disabled={addItemMutation.isPending}
                        className="text-gray-500 hover:text-blue-400 text-sm h-7 w-full justify-start px-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add item
                      </Button>
                    </div>
                    {columns.slice(1).map((column) => (
                      <div 
                        key={column.id} 
                        className="px-2 py-1.5 border-r border-gray-800/10 flex-shrink-0"
                        style={{ 
                          width: columnWidths[column.id] || 100,
                          minWidth: '70px',
                          maxWidth: 'none'
                        }}
                      ></div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Compact Status Bar */}
      <div className="bg-gray-900/50 border-t border-gray-800 px-4 py-1.5 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <span>{boardItems.length} items</span>
          <span>•</span>
          <span>{columns.length} columns</span>
          <span>•</span>
          <span>{boardGroups.length} groups</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span>Live</span>
        </div>
      </div>

      {/* Sleek Bulk Operations Popup */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-1 duration-200">
          <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 px-4 py-2 mx-4 mb-4 rounded-lg shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-xs font-medium text-white">
                  {selectedItems.size}
                </div>
                <span className="text-sm text-gray-300">
                  {selectedItems.size === 1 ? 'item selected' : 'items selected'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => bulkArchiveMutation.mutate(Array.from(selectedItems))}
                  disabled={bulkArchiveMutation.isPending}
                  className="text-xs h-7 px-3 text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => bulkTrashMutation.mutate(Array.from(selectedItems))}
                  disabled={bulkTrashMutation.isPending}
                  className="text-xs h-7 px-3 text-gray-300 hover:text-white hover:bg-gray-800"
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
          </div>
        </div>
      )}
      </div>

      {/* Updates Side Panel */}
      {sidePanelOpen && selectedMainItem && (
        <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
          {/* Side Panel Header */}
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-200">Project Updates</h3>
              <p className="text-xs text-gray-400">{selectedMainItem.values.item || `Project #${selectedMainItem.id}`}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSidePanelOpen(false);
                setSelectedMainItem(null);
              }}
              className="text-gray-400 hover:text-gray-200 p-1"
            >
              ✕
            </Button>
          </div>

          {/* Updates Content */}
          <div className="flex-1 overflow-auto p-4">
            {/* Updates List */}
            <div className="space-y-4 mb-6">
              {updatesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : projectUpdates.length > 0 ? (
                projectUpdates.map((update: any) => (
                  <div key={update.id} className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-1">
                        <span className="text-gray-300 font-medium">{user?.username || 'User'}</span> · {new Date(update.createdAt).toLocaleDateString()}
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-sm text-gray-300">{update.content}</p>
                        {update.attachments && update.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {update.attachments.map((file: any, index: number) => (
                              <div key={index} className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                                📎 {file.fileName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No updates yet. Be the first to add an update for this project.
                </div>
              )}
            </div>

            {/* Add Update Form */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white font-medium">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={updateContent}
                    onChange={(e) => setUpdateContent(e.target.value)}
                    placeholder="Add an update or comment..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={isPosting}
                  />
                  
                  {/* File Upload Area */}
                  <div className="mt-2">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                      className="hidden"
                      id="file-upload"
                      accept="image/*,application/pdf,.doc,.docx,.txt"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-2 py-1 text-xs text-gray-400 hover:text-gray-300 cursor-pointer border border-gray-600 rounded hover:border-gray-500 transition-colors"
                    >
                      📎 Attach Files
                    </label>
                    
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-xs text-gray-400 bg-gray-700 rounded px-2 py-1">
                            <span>📎 {file.name}</span>
                            <button
                              onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                              className="text-red-400 hover:text-red-300 ml-2"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-3 space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs border-gray-600 text-gray-400 hover:bg-gray-700"
                      onClick={() => {
                        setUpdateContent('');
                        setSelectedFiles([]);
                      }}
                      disabled={isPosting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="text-xs bg-blue-600 hover:bg-blue-700"
                      onClick={handlePostUpdate}
                      disabled={!updateContent.trim() || isPosting}
                    >
                      {isPosting ? 'Posting...' : 'Post Update'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}