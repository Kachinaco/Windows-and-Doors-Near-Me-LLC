import { useState, useEffect, useCallback } from "react";
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
        item: project.name || 'Untitled Project',
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
  
  const boardGroups: BoardGroup[] = Object.entries(groupedItems).map(([name, items]) => ({
    name,
    items,
    collapsed: collapsedGroups[name] || false
  }));

  // Update cell mutation with proper auth
  const updateCellMutation = useMutation({
    mutationFn: async ({ projectId, field, value }: { projectId: number; field: string; value: any }) => {
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
        throw new Error('Failed to update cell');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
    onError: () => {
      console.error('Update failed');
    },
  });

  // Add new item mutation with proper auth
  const addItemMutation = useMutation({
    mutationFn: async (groupName: string = 'New Leads') => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const status = groupName === 'New Leads' ? 'new lead' : 
                    groupName === 'Completed' ? 'complete' : 
                    groupName === 'Scheduled Work' ? 'scheduled' : 'in progress';
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'New Project',
          status: status,
          assignedTo: '',
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

  const handleCellUpdate = useCallback((projectId: number, field: string, value: any) => {
    // Save current value to undo stack before updating
    const project = projects.find(p => p.id === projectId);
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
    updateCellMutation.mutate({ projectId, field: actualField, value });
  }, [updateCellMutation, projects]);

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
      case 'status': return <div className="w-3 h-3 rounded-full bg-emerald-500" />;
      case 'people': return <User className="w-4 h-4 text-purple-400" />;
      case 'date': return <Calendar className="w-4 h-4 text-orange-400" />;
      case 'number': return <Hash className="w-4 h-4 text-yellow-400" />;
      case 'tags': return <Tag className="w-4 h-4 text-red-400" />;
      default: return <Type className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderCell = (item: BoardItem, column: BoardColumn) => {
    const value = item.values[column.id] || '';
    
    switch (column.type) {
      case 'status':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleCellUpdate(item.id, column.id, newValue)}
          >
            <SelectTrigger className={`h-6 text-xs font-medium rounded-full px-2 border-none ${
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
            <SelectTrigger className="h-6 text-xs border-none bg-transparent text-gray-300">
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
            className="h-6 text-xs border-none bg-transparent text-gray-300"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleCellUpdate(item.id, column.id, parseInt(e.target.value) || 0)}
            className="h-6 text-xs border-none bg-transparent text-gray-300"
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
        return (
          <Input
            value={value}
            onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
            className="h-6 text-xs border-none bg-transparent text-gray-300"
            placeholder="Enter text"
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
      {/* Slim Header */}
      <header className="bg-gray-900/50 border-b border-gray-800 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
              className="text-gray-400 hover:text-white text-xs px-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm" />
            </div>
            <h1 className="text-lg font-medium">Project Board</h1>
            <div className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
              Monday Style
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
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
                className="text-gray-400 hover:text-white text-xs"
              >
                <Undo2 className="w-3 h-3 mr-1" />
                Undo
              </Button>
            )}
            
            <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-blue-400 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Column
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
        <div className="min-w-full">
          {/* Column Headers */}
          <div className="sticky top-0 bg-gray-900 z-10 border-b border-gray-800">
            <div className="flex">
              {columns.map((column) => (
                <div key={column.id} className="flex-1 min-w-32 px-3 py-2 border-r border-gray-800">
                  <div className="flex items-center space-x-1.5">
                    {getColumnIcon(column.type)}
                    <span className="font-medium text-xs text-gray-300">{column.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Groups and Items */}
          {boardGroups.map((group) => (
            <div key={group.name} className="border-b border-gray-800/50 last:border-b-0">
              {/* Group Header */}
              <div 
                className="bg-gray-900/30 px-3 py-1.5 border-b border-gray-800/30 cursor-pointer hover:bg-gray-900/50 transition-colors"
                onClick={() => toggleGroup(group.name)}
              >
                <div className="flex items-center space-x-2">
                  {group.collapsed ? (
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-300">{group.name}</span>
                  <span className="text-xs text-gray-500">({group.items.length})</span>
                </div>
              </div>

              {/* Group Items */}
              {!group.collapsed && (
                <>
                  {group.items.map((item) => (
                    <div key={item.id} className="flex hover:bg-gray-900/20 transition-colors border-b border-gray-800/20 last:border-b-0">
                      {columns.map((column) => (
                        <div key={`${item.id}-${column.id}`} className="flex-1 min-w-32 px-3 py-2 border-r border-gray-800/20">
                          {renderCell(item, column)}
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  {/* Add Item Button at bottom of group */}
                  <div className="flex hover:bg-gray-900/20 transition-colors">
                    <div className="flex-1 px-3 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addItemMutation.mutate(group.name)}
                        disabled={addItemMutation.isPending}
                        className="text-gray-500 hover:text-blue-400 text-xs h-6 w-full justify-start"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add item
                      </Button>
                    </div>
                    {columns.slice(1).map((column) => (
                      <div key={column.id} className="flex-1 min-w-32 px-3 py-2 border-r border-gray-800/20"></div>
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
    </div>
  );
}