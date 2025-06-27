import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { type Project } from "@shared/schema";
import { Plus, Settings, Calendar, Users, Hash, Tag, User, Type, ChevronDown, ChevronRight, ArrowLeft, Undo2 } from "lucide-react";

interface BoardColumn {
  id: string;
  name: string;
  type: 'status' | 'text' | 'date' | 'people' | 'number' | 'tags';
  order: number;
}

interface BoardItem {
  id: number;
  groupName: string;
  values: Record<string, any>;
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
  
  // Default board columns
  const [columns, setColumns] = useState<BoardColumn[]>([
    { id: 'item', name: 'Item', type: 'text', order: 1 },
    { id: 'status', name: 'Status', type: 'status', order: 2 },
    { id: 'assignedTo', name: 'People', type: 'people', order: 3 },
    { id: 'dueDate', name: 'Due Date', type: 'date', order: 4 },
    { id: 'priority', name: 'Priority', type: 'number', order: 5 },
    { id: 'tags', name: 'Tags', type: 'tags', order: 6 },
  ]);

  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<BoardColumn['type']>('text');
  const [undoStack, setUndoStack] = useState<Array<{action: string, data: any, timestamp: number}>>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    item: 250,
    status: 120,
    assignedTo: 150,
    location: 200,
    phone: 140,
    dueDate: 120,
    priority: 100,
    tags: 120
  });
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{projectId: number, field: string} | null>(null);
  const [newlyCreatedItem, setNewlyCreatedItem] = useState<number | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const debounceTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);

  // Fetch projects and transform to board items
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!user, // Only fetch when user is available
    refetchInterval: 5000,
  });

  // Transform projects to board items safely
  const boardItems: BoardItem[] = Array.isArray(projects) ? projects.map((project: any) => {
    // Group projects by status
    let groupName = 'Active Projects';
    if (project.status === 'new lead') groupName = 'New Leads';
    else if (project.status === 'complete') groupName = 'Completed';
    else if (project.status === 'scheduled') groupName = 'Scheduled Work';
    
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
      }
    };
  }) : [];

  // Define fixed group order to prevent automatic reordering
  const groupOrder = ['New Leads', 'Active Projects', 'Scheduled Work', 'Completed'];

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
                    groupName === 'Active Projects' ? 'in progress' :
                    groupName === 'Scheduled Work' ? 'scheduled' : 
                    groupName === 'Completed' ? 'complete' : 'new lead';
      
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
              value === 'scheduled' ? 'bg-purple-500/20 text-purple-400' :
              value === 'on order' ? 'bg-orange-500/20 text-orange-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="new lead">New Lead</SelectItem>
              <SelectItem value="in progress">Working on it</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="on order">On Order</SelectItem>
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
              placeholder="Enter text"
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
            className="h-4 text-xs text-gray-300 cursor-text hover:bg-gray-800/50 flex items-center px-1 rounded transition-colors"
            onClick={() => setEditingCell({ projectId: item.id, field: column.id })}
            title="Click to edit"
          >
            {value || <span className="text-gray-500">Click to add...</span>}
          </div>
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
      {/* Ultra-Slim Header */}
      <header className="bg-gray-950/80 backdrop-blur-sm border-b border-gray-800/50 px-3 py-1.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
              className="text-gray-500 hover:text-white text-xs px-1.5 py-1 h-6"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Back
            </Button>
            <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-sm" />
            </div>
            <h1 className="text-sm font-medium">Project Board</h1>
            <div className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
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
            
            <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-blue-400 text-xs px-1.5 py-1 h-6"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </DialogTrigger>
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
          </div>
        </div>
      </header>

      {/* Compact Board */}
      <div className="flex-1 overflow-auto bg-gray-950">
        <div className="min-w-max">
          {/* Ultra-Slim Column Headers */}
          <div className="sticky top-0 bg-gray-950/95 backdrop-blur-sm z-10 border-b border-gray-800/50">
            <div className="flex">
              {/* Selection checkbox header */}
              <div className="w-8 px-1 py-1.5 border-r border-gray-800/30 flex items-center justify-center sticky left-0 bg-gray-950/95 backdrop-blur-sm z-30">
                <input
                  type="checkbox"
                  checked={selectedItems.size > 0 && selectedItems.size === boardItems.length}
                  onChange={selectedItems.size === boardItems.length ? handleSelectNone : handleSelectAll}
                  className="w-3 h-3 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-1"
                />
              </div>
              {columns.map((column, index) => (
                <div 
                  key={column.id} 
                  className={`px-2 py-1.5 border-r border-gray-800/30 relative group flex-shrink-0 ${
                    index === 0 ? 'sticky left-8 bg-gray-950/95 backdrop-blur-sm z-20' : ''
                  }`}
                  style={{ 
                    width: columnWidths[column.id] || (index === 0 ? 200 : 100),
                    minWidth: index === 0 ? '150px' : '70px',
                    maxWidth: 'none'
                  }}
                >
                  <div className="flex items-center space-x-1">
                    {getColumnIcon(column.type)}
                    <span className="font-medium text-xs text-gray-400">{column.name}</span>
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
              {/* Ultra-Slim Group Header */}
              <div 
                className="bg-gray-900/20 px-2 py-1 border-b border-gray-800/20 cursor-pointer hover:bg-gray-900/40 transition-all"
                onClick={() => toggleGroup(group.name)}
              >
                <div className="flex items-center space-x-1.5">
                  {group.collapsed ? (
                    <ChevronRight className="w-2.5 h-2.5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-2.5 h-2.5 text-gray-500" />
                  )}
                  <span className="text-xs font-medium text-gray-400">{group.name}</span>
                  <span className="text-xs text-gray-600">({group.items.length})</span>
                </div>
              </div>

              {/* Group Items */}
              {!group.collapsed && (
                <>
                  {group.items.map((item) => (
                    <div key={item.id} className="flex hover:bg-gray-900/10 transition-all border-b border-gray-800/10 last:border-b-0">
                      {/* Selection checkbox */}
                      <div className="w-8 px-1 py-0.5 border-r border-gray-800/10 flex items-center justify-center sticky left-0 bg-gray-950 z-20">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-3 h-3 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-1"
                        />
                      </div>
                      {columns.map((column, index) => (
                        <div 
                          key={`${item.id}-${column.id}`} 
                          className={`px-2 py-0.5 border-r border-gray-800/10 flex-shrink-0 ${
                            index === 0 ? 'sticky left-8 bg-gray-950 z-10' : ''
                          }`}
                          style={{ 
                            width: columnWidths[column.id] || (index === 0 ? 200 : 100),
                            minWidth: index === 0 ? '150px' : '70px',
                            maxWidth: 'none'
                          }}
                        >
                          {renderCell(item, column)}
                        </div>
                      ))}
                    </div>
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
                        className="text-gray-600 hover:text-blue-400 text-xs h-5 w-full justify-start px-1"
                      >
                        <Plus className="w-2.5 h-2.5 mr-1" />
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
  );
}