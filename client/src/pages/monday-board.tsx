import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { type Project } from "@shared/schema";
import { Plus, Settings, Calendar, Users, Hash, Tag, User, Type, ChevronDown, ChevronRight, ArrowLeft, Undo2, Folder, Columns, Trash2, MessageCircle, UserPlus, Mail, Phone, Check, Clock, BarChart3, Calculator, Globe, MapPin, Link, UserCheck, ThumbsUp, Palette, FileUp, History, Timer, Zap, Flag, Save } from "lucide-react";

interface BoardColumn {
  id: string;
  name: string;
  type: 'text' | 'status' | 'people' | 'date' | 'number' | 'tags' | 'subitems' | 'checkbox' | 'auto_number' | 'item_id' | 'timeline' | 'progress' | 'formula' | 'week' | 'world_clock' | 'email' | 'phone' | 'location' | 'link' | 'custom_url' | 'team' | 'vote' | 'color_picker' | 'files' | 'creation_log' | 'last_updated' | 'time_tracking' | 'api_action' | 'country';
  order: number;
  settings?: any;
}

interface BoardItem {
  id: number;
  groupName: string;
  values: Record<string, any>;
  subItems?: SubItem[];
  subItemFolders?: SubItemFolder[];
}

interface SubItem {
  id: number;
  folderId?: number;
  values: Record<string, any>;
}

interface SubItemFolder {
  id: number;
  name: string;
  order: number;
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
  const [location] = useLocation();
  
  // Extract projectId from URL
  const urlProjectId = location.startsWith('/projects/') 
    ? parseInt(location.split('/')[2]) || null 
    : null;
  
  // Load projects to get default project ID if none specified in URL
  const { data: availableProjects = [], isLoading: projectsLoading } = useQuery<any[]>({
    queryKey: ['/api/projects'],
  });
  
  // Use URL projectId if available, otherwise use first project for column management
  const projectId = urlProjectId || (Array.isArray(availableProjects) && availableProjects.length > 0 ? availableProjects[0]?.id : null);
  
  // Load columns from database
  const { data: projectColumns = [], isLoading: columnsLoading } = useQuery({
    queryKey: ['/api/projects', projectId, 'columns'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/columns`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to load columns');
      }
      
      return response.json();
    },
    enabled: !!projectId,
  });

  // Convert database columns to BoardColumn format or use defaults
  const columns: BoardColumn[] = projectColumns.length > 0 
    ? projectColumns.map((col: any) => ({
        id: col.id,
        name: col.name,
        type: col.type as BoardColumn['type'],
        order: col.order,
        settings: col.settings || {}
      }))
    : [
        { id: 'item', name: 'Item', type: 'text', order: 1 },
        { id: 'status', name: 'Status', type: 'status', order: 2, settings: { 
            options: ['New', 'In Progress', 'Complete'],
            colors: { 'New': '#3b82f6', 'In Progress': '#f59e0b', 'Complete': '#22c55e' }
          }
        },
        { id: 'assignedTo', name: 'Person', type: 'people', order: 3 },
        { id: 'dueDate', name: 'Date', type: 'date', order: 4 },
      ];

  // Quick column creation mutation
  const addColumnMutation = useMutation({
    mutationFn: async (columnType: BoardColumn['type']) => {
      if (!projectId) return;
      
      const defaultNames: Record<string, string> = {
        formula: 'Formula',
        checkbox: 'Checkbox', 
        number: 'Number',
        date: 'Date',
        text: 'Text',
        status: 'Status',
        people: 'People',
        tags: 'Tags',
        subitems: 'Subitems',
        auto_number: 'Auto Number',
        item_id: 'Item ID',
        timeline: 'Timeline',
        progress: 'Progress',
        week: 'Week',
        world_clock: 'World Clock',
        email: 'Email',
        phone: 'Phone',
        location: 'Location',
        link: 'Link',
        custom_url: 'Custom URL',
        team: 'Team',
        vote: 'Vote',
        color_picker: 'Color Picker',
        files: 'Files',
        creation_log: 'Creation Log',
        last_updated: 'Last Updated',
        time_tracking: 'Time Tracking',
        api_action: 'API Action',
        country: 'Country'
      };
      
      return apiRequest('POST', `/api/projects/${projectId}/columns`, {
        name: defaultNames[columnType] || 'New Column',
        type: columnType,
        settings: columnType === 'formula' ? { formula: '' } : {}
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'columns'] });
      setIsQuickColumnMenuOpen(false);
      toast({
        title: "Column Added",
        description: "Click the column title to rename it"
      });
    },
    onError: (error: any) => {
      console.error('Add column error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || error?.toString() || "Unknown error occurred";
      
      toast({
        title: "Failed to add column",
        description: `Error: ${errorMessage}`,
        variant: "destructive"
      });
    }
  });

  // State management
  const [isQuickColumnMenuOpen, setIsQuickColumnMenuOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{projectId: number, field: string} | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  
  // Group management
  const [groupOrder] = useState<string[]>(['New Leads', 'In Progress', 'Complete']);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Fetch projects and transform to board items
  const { data: projects = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
    refetchInterval: 5000,
  });

  // Transform projects to board items with proper grouping
  const getGroupName = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'new lead':
      case 'new':
        return 'New Leads';
      case 'in progress':
      case 'active':
        return 'In Progress';
      case 'complete':
      case 'completed':
        return 'Complete';
      default:
        return 'New Leads';
    }
  };

  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);

  // Update board items when projects change
  useEffect(() => {
    if (projects && projects.length > 0) {
      const newBoardItems = projects.map((project: any) => {
        const groupName = getGroupName(project.status);
        
        return {
          id: project.id || 0,
          groupName,
          values: {
            item: project.name || '',
            status: project.status || 'new',
            assignedTo: project.assignedTo || '',
            dueDate: project.endDate || '',
            location: project.projectAddress || '',
            phone: project.clientPhone || '',
          },
          subItems: [],
          subItemFolders: []
        };
      });
      
      // Only update if the data has actually changed
      setBoardItems(prevItems => {
        if (prevItems.length !== newBoardItems.length) {
          return newBoardItems;
        }
        
        // Simple comparison to avoid unnecessary updates
        const hasChanged = newBoardItems.some((newItem, index) => {
          const prevItem = prevItems[index];
          return !prevItem || prevItem.id !== newItem.id || 
                 prevItem.values.item !== newItem.values.item ||
                 prevItem.values.status !== newItem.values.status;
        });
        
        return hasChanged ? newBoardItems : prevItems;
      });
    }
  }, [projects]);

  // Group items by group name
  const groupedItems = boardItems.reduce((groups: Record<string, BoardItem[]>, item) => {
    if (!groups[item.groupName]) {
      groups[item.groupName] = [];
    }
    groups[item.groupName].push(item);
    return groups;
  }, {});

  // Create board groups in order
  const boardGroups: BoardGroup[] = groupOrder.map(groupName => ({
    name: groupName,
    items: groupedItems[groupName] || [],
    collapsed: collapsedGroups[groupName] || false
  }));

  // Toggle group collapse
  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Selection handlers
  const handleToggleSelect = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isGroupSelected = (groupName: string): boolean => {
    const group = boardGroups.find(g => g.name === groupName);
    return group ? group.items.every(item => selectedItems.has(item.id)) : false;
  };

  const handleSelectGroup = (groupName: string) => {
    const group = boardGroups.find(g => g.name === groupName);
    if (!group) return;

    const groupItemIds = group.items.map(item => item.id);
    const allSelected = groupItemIds.every(id => selectedItems.has(id));

    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        groupItemIds.forEach(id => newSet.delete(id));
      } else {
        groupItemIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  // Cell editing
  const handleCellUpdate = (itemId: number, field: string, value: string) => {
    setBoardItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, values: { ...item.values, [field]: value } }
        : item
    ));
  };

  const renderCell = (item: BoardItem, column: BoardColumn) => {
    const value = item.values[column.id] || '';
    const isEditing = editingCell?.projectId === item.id && editingCell?.field === column.id;

    if (isEditing) {
      return (
        <Input
          value={localValues[`${item.id}-${column.id}`] || value}
          onChange={(e) => setLocalValues(prev => ({ ...prev, [`${item.id}-${column.id}`]: e.target.value }))}
          onBlur={() => {
            const newValue = localValues[`${item.id}-${column.id}`] || value;
            handleCellUpdate(item.id, column.id, newValue);
            setEditingCell(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const newValue = localValues[`${item.id}-${column.id}`] || value;
              handleCellUpdate(item.id, column.id, newValue);
              setEditingCell(null);
            }
            if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          className="w-full border-0 bg-transparent p-0 focus:ring-0"
          autoFocus
        />
      );
    }

    return (
      <div
        className="w-full cursor-pointer hover:bg-gray-50 p-1 rounded"
        onClick={() => {
          setEditingCell({ projectId: item.id, field: column.id });
          setLocalValues(prev => ({ ...prev, [`${item.id}-${column.id}`]: value }));
        }}
      >
        {column.type === 'status' ? (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            value === 'new' ? 'bg-blue-100 text-blue-700' :
            value === 'in progress' ? 'bg-yellow-100 text-yellow-700' :
            value === 'complete' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {value || 'New'}
          </span>
        ) : (
          <span className="text-sm">{value || ''}</span>
        )}
      </div>
    );
  };

  const getColumnIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4 text-gray-400" />;
      case 'status': return <div className="w-2 h-2 rounded-full bg-blue-400" />;
      case 'people': return <Users className="w-4 h-4 text-gray-400" />;
      case 'date': return <Calendar className="w-4 h-4 text-gray-400" />;
      case 'number': return <Hash className="w-4 h-4 text-gray-400" />;
      case 'tags': return <Tag className="w-4 h-4 text-gray-400" />;
      case 'formula': return <Calculator className="w-4 h-4 text-gray-400" />;
      case 'checkbox': return <Check className="w-4 h-4 text-gray-400" />;
      default: return <Type className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading board</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Project Board</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Quick Column Menu */}
            <DropdownMenu open={isQuickColumnMenuOpen} onOpenChange={setIsQuickColumnMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Column
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem
                  onClick={() => addColumnMutation.mutate('formula')}
                  disabled={addColumnMutation.isPending}
                >
                  🧮 Formula
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => addColumnMutation.mutate('checkbox')}
                  disabled={addColumnMutation.isPending}
                >
                  ✅ Checkbox
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => addColumnMutation.mutate('number')}
                  disabled={addColumnMutation.isPending}
                >
                  🔢 Number
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => addColumnMutation.mutate('date')}
                  disabled={addColumnMutation.isPending}
                >
                  📅 Date
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => addColumnMutation.mutate('status')}
                  disabled={addColumnMutation.isPending}
                >
                  📊 Status
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => addColumnMutation.mutate('people')}
                  disabled={addColumnMutation.isPending}
                >
                  👥 People
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => addColumnMutation.mutate('text')}
                  disabled={addColumnMutation.isPending}
                >
                  📝 Text
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => addColumnMutation.mutate('tags')}
                  disabled={addColumnMutation.isPending}
                >
                  🏷️ Tags
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* Column Headers */}
          <div className="bg-white border-b border-gray-200 flex sticky top-0 z-10">
            {/* Selection Column */}
            <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center bg-white">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-400"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedItems(new Set(boardItems.map(item => item.id)));
                  } else {
                    setSelectedItems(new Set());
                  }
                }}
              />
            </div>
            
            {/* Column Headers */}
            {columns.map((column, index) => (
              <div 
                key={column.id} 
                className="px-4 py-3 border-r border-gray-200 flex-shrink-0 bg-white min-w-[120px]"
              >
                <div className="flex items-center space-x-2">
                  {getColumnIcon(column.type)}
                  <span className="font-medium text-sm text-gray-700">{column.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Groups and Items */}
          {boardGroups.map((group) => (
            <div key={group.name} className="border-b border-gray-200">
              {/* Group Header */}
              <div className="flex bg-gray-50 hover:bg-gray-100 transition-colors">
                {/* Group Selection */}
                <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isGroupSelected(group.name)}
                    onChange={() => handleSelectGroup(group.name)}
                    className="w-4 h-4 rounded border-gray-400"
                  />
                </div>
                
                {/* Group Info */}
                <div 
                  className="px-4 py-3 border-r border-gray-200 flex items-center space-x-2 cursor-pointer min-w-[120px]"
                  onClick={() => toggleGroup(group.name)}
                >
                  {group.collapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                  <div className={`w-3 h-3 rounded-full ${
                    group.name === 'New Leads' ? 'bg-blue-500' :
                    group.name === 'In Progress' ? 'bg-yellow-500' :
                    group.name === 'Complete' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-700">{group.name}</span>
                  <span className="text-sm text-gray-500">({group.items.length})</span>
                </div>
                
                {/* Empty column spaces */}
                {columns.slice(1).map((column) => (
                  <div 
                    key={`group-${group.name}-${column.id}`}
                    className="px-4 py-3 border-r border-gray-200 flex-shrink-0 min-w-[120px]"
                  />
                ))}
              </div>

              {/* Group Items */}
              {!group.collapsed && (
                <>
                  {group.items.map((item) => (
                    <div key={item.id} className="flex hover:bg-gray-50 transition-colors bg-white border-b border-gray-100">
                      {/* Selection checkbox */}
                      <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 rounded border-gray-400"
                        />
                      </div>
                      
                      {/* Item cells */}
                      {columns.map((column) => (
                        <div 
                          key={`${item.id}-${column.id}`} 
                          className="px-4 py-3 border-r border-gray-200 flex-shrink-0 min-w-[120px]"
                        >
                          {renderCell(item, column)}
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  {/* Add Item Button */}
                  <div className="flex bg-white border-b border-gray-100">
                    <div className="w-12 px-2 py-2 border-r border-gray-200" />
                    <div className="px-4 py-2 border-r border-gray-200 min-w-[120px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-500 hover:text-gray-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                    {columns.slice(1).map((column) => (
                      <div 
                        key={`add-${group.name}-${column.id}`}
                        className="px-4 py-2 border-r border-gray-200 min-w-[120px]"
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}