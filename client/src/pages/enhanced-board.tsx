import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Folder, Trash2, User, Calendar, Hash, Tag, Check, Mail, Phone, MapPin, BarChart3, ArrowLeft, Undo2, Settings, UserPlus, MessageCircle, Save, Timer, Globe, Link, FolderPlus, MoreVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link as RouterLink, useLocation } from "wouter";
import type { Project } from "@shared/schema";

interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
}

interface BoardColumn {
  id: string;
  name: string;
  type: string;
  order: number;
}

interface SubItem {
  id: number;
  name: string;
  status: string;
  assignedTo: string;
  priority: number;
  folderId: number;
}

interface Folder {
  id: number;
  name: string;
  collapsed: boolean;
  subItems: SubItem[];
}

interface BoardItem {
  id: number;
  groupName: string;
  values: {
    item: string;
    status: string;
    assignedTo: string;
    dueDate: string;
    checkbox: boolean;
    progress: number;
    email: string;
    phone: string;
    location: string;
  };
  folders: Folder[];
}

export default function EnhancedBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Mock team members - in real app, fetch from API
  const [teamMembers] = useState<TeamMember[]>([
    { id: 1, firstName: 'John', lastName: 'Doe' },
    { id: 2, firstName: 'Jane', lastName: 'Smith' },
    { id: 3, firstName: 'Bob', lastName: 'Wilson' },
    { id: 4, firstName: 'Alice', lastName: 'Johnson' }
  ]);

  // Board columns configuration
  const [columns] = useState<BoardColumn[]>([
    { id: 'item', name: 'Main Item', type: 'text', order: 1 },
    { id: 'subitems', name: 'Sub Items', type: 'subitems', order: 2 },
    { id: 'status', name: 'Status', type: 'status', order: 3 },
    { id: 'assignedTo', name: 'People', type: 'people', order: 4 },
    { id: 'dueDate', name: 'Due Date', type: 'date', order: 5 },
    { id: 'checkbox', name: 'Done', type: 'checkbox', order: 6 },
    { id: 'progress', name: 'Progress', type: 'progress', order: 7 },
  ]);

  // State management
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    item: 250,
    subitems: 150,
    status: 130,
    assignedTo: 150,
    dueDate: 130,
    checkbox: 80,
    progress: 150,
    email: 180,
    phone: 140,
    location: 200
  });

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [expandedSubItems, setExpandedSubItems] = useState<Set<number>>(new Set([1, 2]));
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set([1001, 2001, 2002, 3001]));
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [editingCell, setEditingCell] = useState<{projectId: number, field: string} | null>(null);
  const [editingFolder, setEditingFolder] = useState<number | null>(null);
  const [editingSubItem, setEditingSubItem] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [newItemCounter, setNewItemCounter] = useState(4);
  const [newFolderCounter, setNewFolderCounter] = useState(4000);
  const [newSubItemCounter, setNewSubItemCounter] = useState(40000);

  // Updates modal state
  const [updatesModal, setUpdatesModal] = useState<{
    isOpen: boolean;
    itemType: string | null;
    itemId: number | null;
    itemName: string;
  }>({
    isOpen: false,
    itemType: null,
    itemId: null,
    itemName: ''
  });
  const [itemUpdates, setItemUpdates] = useState<Record<string, any[]>>({});
  const [newUpdate, setNewUpdate] = useState('');

  // Fetch projects from API
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Transform projects to board format
  const boardItems = projects.map(project => ({
    id: project.id,
    groupName: project.status === 'new lead' ? 'New Leads' :
               project.status === 'in progress' ? 'In Progress' :
               project.status === 'complete' ? 'Complete' : 'New Leads',
    values: {
      item: project.name,
      status: project.status,
      assignedTo: project.assignedTo || 'unassigned',
      dueDate: project.endDate || '',
      checkbox: project.status === 'complete',
      progress: project.status === 'complete' ? 100 : 
                project.status === 'in progress' ? 60 : 0,
      email: 'client@example.com',
      phone: project.clientPhone || '',
      location: project.projectAddress || ''
    },
    folders: [
      {
        id: project.id * 1000 + 1,
        name: 'Planning Phase',
        collapsed: false,
        subItems: [
          { id: project.id * 10000 + 1, name: 'Initial consultation', status: 'completed', assignedTo: '1', priority: 1, folderId: project.id * 1000 + 1 },
          { id: project.id * 10000 + 2, name: 'Site measurement', status: 'in_progress', assignedTo: '2', priority: 2, folderId: project.id * 1000 + 1 },
        ]
      },
      {
        id: project.id * 1000 + 2,
        name: 'Installation Phase',
        collapsed: true,
        subItems: [
          { id: project.id * 10000 + 3, name: 'Material delivery', status: 'not_started', assignedTo: '3', priority: 1, folderId: project.id * 1000 + 2 },
          { id: project.id * 10000 + 4, name: 'Window installation', status: 'not_started', assignedTo: '4', priority: 2, folderId: project.id * 1000 + 2 },
        ]
      }
    ]
  }));

  // Groups configuration
  const groupOrder = ['New Leads', 'Need Attention', 'Sent Estimate', 'Signed', 'In Progress', 'Complete'];

  // Close column menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (columnMenuOpen && !event.target.closest('.relative')) {
        setColumnMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [columnMenuOpen]);

  // Helper functions
  const getMemberDisplayName = (memberId: any) => {
    if (!memberId || memberId === '' || memberId === 'unassigned') return 'Unassigned';
    const member = teamMembers.find(m => m.id.toString() === memberId.toString());
    return member ? `${member.firstName} ${member.lastName}` : 'Unassigned';
  };

  const getColumnWidth = (columnId: any) => {
    return columnWidths[columnId] || 140;
  };

  const getColumnIcon = (type: any) => {
    switch (type) {
      case 'status': return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
      case 'people': return <User className="w-3 h-3 text-purple-400" />;
      case 'date': return <Calendar className="w-3 h-3 text-orange-400" />;
      case 'number': return <Hash className="w-3 h-3 text-yellow-400" />;
      case 'tags': return <Tag className="w-3 h-3 text-red-400" />;
      case 'subitems': return <Folder className="w-3 h-3 text-blue-400" />;
      case 'checkbox': return <Check className="w-3 h-3 text-green-400" />;
      case 'progress': return <BarChart3 className="w-3 h-3 text-green-400" />;
      case 'email': return <Mail className="w-3 h-3 text-blue-400" />;
      case 'phone': return <Phone className="w-3 h-3 text-green-400" />;
      case 'location': return <MapPin className="w-3 h-3 text-red-400" />;
      default: return <Hash className="w-3 h-3 text-gray-400" />;
    }
  };

  // Group items by group name
  const groupedItems = boardItems.reduce((groups, item) => {
    if (!groups[item.groupName]) {
      groups[item.groupName] = [];
    }
    groups[item.groupName].push(item);
    return groups;
  }, {});

  // Create board groups
  const boardGroups = groupOrder.map(groupName => ({
    name: groupName,
    items: groupedItems[groupName] || [],
    collapsed: collapsedGroups[groupName] || false
  }));

  // Mutations for project updates
  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, updates }) => {
      return apiRequest("PUT", `/api/projects/${projectId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const addProjectMutation = useMutation({
    mutationFn: async (projectData) => {
      return apiRequest("POST", "/api/projects", projectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleCellUpdate = useCallback((projectId, field, value) => {
    // Convert field names to match API schema
    const fieldMapping = {
      'item': 'name',
      'assignedTo': 'assignedTo',
      'dueDate': 'endDate',
      'location': 'projectAddress',
      'phone': 'clientPhone'
    };

    const apiField = fieldMapping[field] || field;
    const updates = { [apiField]: value };

    updateProjectMutation.mutate({ projectId, updates });

    setUndoStack(prev => [
      ...prev.slice(-9),
      { action: 'update_cell', data: { projectId, field, value }, timestamp: Date.now() }
    ]);
  }, [updateProjectMutation]);

  const handleAddItem = (groupName = 'New Leads') => {
    const statusMapping = {
      'New Leads': 'new lead',
      'In Progress': 'in progress',
      'Complete': 'complete'
    };

    const newProject = {
      name: 'New Project',
      status: statusMapping[groupName] || 'new lead',
      assignedTo: '',
      description: '',
      projectAddress: '',
      clientPhone: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    };

    addProjectMutation.mutate(newProject);
  };

  const handleAddFolder = (projectId) => {
    // This would need to be implemented with a proper sub-tasks API
    toast({
      title: "Feature Coming Soon",
      description: "Sub-item folders will be available in the next update",
    });
  };

  const handleAddSubItem = (projectId, folderId) => {
    // This would need to be implemented with a proper sub-tasks API
    toast({
      title: "Feature Coming Soon",
      description: "Sub-items will be available in the next update",
    });
  };

  const handlePointerDown = (columnId, e) => {
    e.preventDefault();
    setIsResizing(columnId);

    const startX = e.clientX;
    const startWidth = columnWidths[columnId] || 140;

    const handlePointerMove = (e) => {
      const newWidth = Math.max(80, startWidth + (e.clientX - startX));
      setColumnWidths(prev => ({ ...prev, [columnId]: newWidth }));
    };

    const handlePointerUp = () => {
      setIsResizing(null);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Column menu component
  const ColumnMenu = ({ columnId, columnName, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="absolute top-full right-0 mt-1 w-64 bg-gray-800 text-white rounded-lg shadow-xl border border-gray-700 z-50">
        <div className="py-2">
          <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </div>
          </div>
          
          <div className="px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 cursor-pointer flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded flex items-center justify-center text-xs">✨</div>
            Autofill with AI
          </div>
          
          <div className="border-t border-gray-700 my-1"></div>
          
          <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2">
            <div className="w-4 h-4">🔍</div>
            Filter
          </div>
          
          <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2">
            <div className="w-4 h-4">↕️</div>
            Sort
            <ChevronRight className="w-3 h-3 ml-auto" />
          </div>
          
          <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2">
            <div className="w-4 h-4">↗️</div>
            Collapse
          </div>
          
          <div className="border-t border-gray-700 my-1"></div>
          
          <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add column to the right
            <ChevronRight className="w-3 h-3 ml-auto" />
          </div>
          
          <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2">
            <div className="w-4 h-4">🔄</div>
            Change column type
            <ChevronRight className="w-3 h-3 ml-auto" />
          </div>
          
          <div className="border-t border-gray-700 my-1"></div>
          
          <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2">
            <div className="w-4 h-4">✏️</div>
            Rename
          </div>
          
          <div className="px-4 py-2 text-sm text-red-400 hover:bg-gray-700 cursor-pointer flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Delete
          </div>
        </div>
      </div>
    );
  };

  const renderCell = (item, column) => {
    const value = item.values[column.id] || '';

    switch (column.type) {
      case 'status':
        return (
          <select
            value={value}
            onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
            className={`h-6 text-xs font-medium rounded-full px-2 border-none outline-none cursor-pointer ${
              value === 'complete' ? 'bg-green-100 text-green-700' :
              value === 'in progress' ? 'bg-blue-100 text-blue-700' :
              value === 'signed' ? 'bg-emerald-100 text-emerald-700' :
              value === 'sent estimate' ? 'bg-purple-100 text-purple-700' :
              value === 'need attention' ? 'bg-yellow-100 text-yellow-700' :
              value === 'new lead' ? 'bg-cyan-100 text-cyan-700' :
              'bg-gray-100 text-gray-700'
            }`}
          >
            <option value="new lead">New Lead</option>
            <option value="need attention">Need Attention</option>
            <option value="sent estimate">Sent Estimate</option>
            <option value="signed">Signed</option>
            <option value="in progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        );
      
      case 'people':
        return (
          <select
            value={value}
            onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
            className="h-6 text-xs border-none bg-transparent text-gray-700 outline-none cursor-pointer"
          >
            <option value="unassigned">Unassigned</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.id.toString()}>
                {member.firstName} {member.lastName}
              </option>
            ))}
          </select>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
            className="h-6 text-xs border-none bg-transparent text-gray-700 outline-none"
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleCellUpdate(item.id, column.id, e.target.checked)}
              className="w-4 h-4 rounded border-gray-400 text-blue-500"
            />
          </div>
        );

      case 'progress':
        const progressValue = parseInt(value) || 0;
        return (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
              />
            </div>
            <span className="text-xs text-gray-600 w-8">{progressValue}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={progressValue}
              onChange={(e) => handleCellUpdate(item.id, column.id, parseInt(e.target.value))}
              className="w-12 h-1 cursor-pointer"
            />
          </div>
        );

      case 'subitems':
        const isExpanded = expandedSubItems.has(item.id);
        const totalSubItems = (item.folders || []).reduce((total, folder) => total + folder.subItems.length, 0);
        
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
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
              className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded text-xs text-gray-600"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Folder className="w-3 h-3" />
              <span>{totalSubItems} items</span>
            </button>
          </div>
        );
      
      default:
        const isEditing = editingCell?.projectId === item.id && editingCell?.field === column.id;
        
        if (isEditing) {
          return (
            <input
              value={value}
              onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
              className="h-6 text-xs border-none bg-transparent text-gray-700 outline-none w-full"
              placeholder={column.id === 'item' ? "Enter project name" : "Enter text"}
              autoFocus
              onBlur={() => setEditingCell(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  setEditingCell(null);
                }
              }}
            />
          );
        }
        
        return (
          <div
            className="h-6 text-xs cursor-text hover:bg-gray-50 flex items-center px-2 rounded"
            onClick={() => setEditingCell({ projectId: item.id, field: column.id })}
          >
            {column.id === 'item' && (
              <div className={`w-2 h-2 rounded-full mr-2 ${
                item.values['status'] === 'complete' ? 'bg-green-500' :
                item.values['status'] === 'in progress' ? 'bg-blue-500' :
                item.values['status'] === 'signed' ? 'bg-emerald-500' :
                item.values['status'] === 'sent estimate' ? 'bg-purple-500' :
                item.values['status'] === 'need attention' ? 'bg-yellow-500' :
                item.values['status'] === 'new lead' ? 'bg-cyan-500' :
                'bg-gray-500'
              }`} />
            )}
            {value || <span className="text-gray-400">Click to add...</span>}
          </div>
        );
    }
  };

  if (projectsLoading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white text-gray-900 flex overflow-hidden">
      {/* Main Board Container */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <RouterLink href="/dashboard">
                <button className="text-gray-600 hover:text-gray-900 text-sm px-3 py-2 rounded-md flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </button>
              </RouterLink>
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-sm" />
              </div>
              <h1 className="text-lg font-medium">Project Board</h1>
            </div>

            <div className="flex items-center space-x-2">
              {undoStack.length > 0 && (
                <button className="text-gray-600 hover:text-gray-900 p-1 rounded">
                  <Undo2 className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => handleAddItem('New Leads')}
                className="text-gray-600 hover:text-gray-900 p-1 rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Board Content */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="min-w-max">
            {/* Column Headers */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
              <div className="flex">
                <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.size > 0 && selectedItems.size === boardItems.length}
                    onChange={() => {
                      if (selectedItems.size === boardItems.length) {
                        setSelectedItems(new Set());
                      } else {
                        setSelectedItems(new Set(boardItems.map(item => item.id)));
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-400 text-blue-500"
                  />
                </div>
                {columns.map((column, index) => (
                  <div 
                    key={column.id} 
                    className="px-3 py-3 border-r border-gray-200 relative group flex-shrink-0 bg-white"
                    style={{ width: getColumnWidth(column.id) }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getColumnIcon(column.type)}
                        <span className="font-medium text-sm text-gray-700">{column.name}</span>
                      </div>
                      <button 
                        onClick={() => setColumnMenuOpen(columnMenuOpen === `main-${column.id}` ? null : `main-${column.id}`)}
                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ⋯
                      </button>
                    </div>
                    <ColumnMenu 
                      columnId={column.id}
                      columnName={column.name}
                      isOpen={columnMenuOpen === `main-${column.id}`}
                      onClose={() => setColumnMenuOpen(null)}
                    />
                    {index < columns.length - 1 && (
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center hover:bg-blue-100"
                        onPointerDown={(e) => handlePointerDown(column.id, e)}
                      >
                        <div className="w-0.5 h-4 bg-gray-400 hover:bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
                {/* Updates column header */}
                <div className="w-12 px-2 py-3 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Groups and Items */}
            {boardGroups.map((group) => (
              <div key={group.name} className="border-b border-gray-200">
                {/* Group Header */}
                <div className={`flex border-b border-gray-200 hover:bg-gray-50 ${
                  group.name === 'New Leads' ? 'bg-cyan-50' :
                  group.name === 'Need Attention' ? 'bg-yellow-50' :
                  group.name === 'Sent Estimate' ? 'bg-purple-50' :
                  group.name === 'Signed' ? 'bg-emerald-50' :
                  group.name === 'In Progress' ? 'bg-blue-50' :
                  group.name === 'Complete' ? 'bg-green-50' :
                  'bg-gray-50'
                }`}>
                  <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-400 text-blue-500"
                    />
                  </div>
                  
                  <div 
                    className="px-4 py-3 border-r border-gray-200 flex items-center space-x-2 cursor-pointer"
                    style={{ width: getColumnWidth('item') }}
                    onClick={() => toggleGroup(group.name)}
                  >
                    {group.collapsed ? (
                      <ChevronRight className="w-3 h-3 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    )}
                    <div className={`w-3 h-3 rounded-full ${
                      group.name === 'New Leads' ? 'bg-cyan-500' :
                      group.name === 'Need Attention' ? 'bg-yellow-500' :
                      group.name === 'Sent Estimate' ? 'bg-purple-500' :
                      group.name === 'Signed' ? 'bg-emerald-500' :
                      group.name === 'In Progress' ? 'bg-blue-500' :
                      group.name === 'Complete' ? 'bg-green-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="text-sm font-medium">{group.name}</span>
                    <span className="text-xs text-gray-500">({group.items.length})</span>
                  </div>
                  
                  {/* Empty cells for other columns */}
                  {columns.slice(1).map((column) => (
                    <div 
                      key={column.id}
                      className="px-3 py-3 border-r border-gray-200"
                      style={{ width: getColumnWidth(column.id) }}
                    />
                  ))}
                  
                  {/* Updates column for group */}
                  <div className="w-12 px-2 py-3 flex items-center justify-center">
                    <button
                      onClick={() => handleAddItem(group.name)}
                      className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                      title="Add item to group"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Group Items */}
                {!group.collapsed && group.items.map((item) => (
                  <div key={item.id}>
                    {/* Main Item Row */}
                    <div className="flex hover:bg-gray-50 border-b border-gray-100 group">
                      <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => {
                            setSelectedItems(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(item.id)) {
                                newSet.delete(item.id);
                              } else {
                                newSet.add(item.id);
                              }
                              return newSet;
                            });
                          }}
                          className="w-4 h-4 rounded border-gray-400 text-blue-500"
                        />
                      </div>
                      
                      {columns.map((column) => (
                        <div 
                          key={column.id}
                          className="px-3 py-3 border-r border-gray-200 relative flex items-center"
                          style={{ width: getColumnWidth(column.id) }}
                        >
                          {renderCell(item, column)}
                        </div>
                      ))}
                      
                      {/* Updates column for item */}
                      <div className="w-12 px-2 py-3 flex items-center justify-center">
                        <button
                          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                          title="Add update to item"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-items (Folders) */}
                    {expandedSubItems.has(item.id) && item.folders && item.folders.map((folder) => (
                      <div key={folder.id}>
                        {/* Folder Header */}
                        <div className="flex bg-blue-50 hover:bg-blue-100 border-b border-blue-200">
                          <div className="w-12 px-2 py-2 border-r border-blue-200 flex items-center justify-center">
                            <button
                              onClick={() => handleAddFolder(item.id)}
                              className="text-blue-500 hover:text-blue-700 p-1"
                            >
                              <FolderPlus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div 
                            className="px-4 py-2 border-r border-blue-200 flex items-center"
                            style={{ width: getColumnWidth('item') }}
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-4 h-px bg-blue-400"></div>
                              <button
                                onClick={() => toggleFolder(folder.id)}
                                className="p-0.5 hover:bg-blue-100 rounded"
                              >
                                <ChevronRight className={`w-3 h-3 text-blue-600 transition-transform ${
                                  expandedFolders.has(folder.id) ? 'rotate-90' : ''
                                }`} />
                              </button>
                              <span className="text-blue-600 text-xs bg-blue-100 px-1.5 rounded">
                                ({folder.subItems.length})
                              </span>
                              <Folder className="w-4 h-4 text-blue-600" />
                              
                              {editingFolder === folder.id ? (
                                <input
                                  type="text"
                                  value={folder.name}
                                  onChange={(e) => {
                                    // Update folder name logic would go here
                                  }}
                                  onBlur={() => setEditingFolder(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'Escape') {
                                      setEditingFolder(null);
                                    }
                                  }}
                                  className="bg-white text-blue-900 text-sm px-2 py-1 border border-blue-300 rounded flex-1"
                                  autoFocus
                                  placeholder="Folder name"
                                />
                              ) : (
                                <span 
                                  className="text-blue-900 text-sm font-medium cursor-pointer hover:text-blue-700 flex-1"
                                  onClick={() => setEditingFolder(folder.id)}
                                >
                                  {folder.name || 'Untitled Folder'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Empty cells for other columns */}
                          {columns.slice(1).map((column) => (
                            <div 
                              key={column.id}
                              className="px-3 py-2 border-r border-blue-200"
                              style={{ width: getColumnWidth(column.id) }}
                            />
                          ))}
                          
                          {/* Updates column for folder */}
                          <div className="w-12 px-2 py-2 flex items-center justify-center">
                            <button
                              onClick={() => handleAddSubItem(item.id, folder.id)}
                              className="text-blue-500 hover:text-blue-700 p-1"
                              title="Add sub-item to folder"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Sub-items in this folder */}
                        {expandedFolders.has(folder.id) && folder.subItems.map((subItem) => (
                          <div key={subItem.id} className="flex hover:bg-blue-50 bg-blue-25 border-b border-blue-200 group">
                            <div className="w-12 px-2 py-2 border-r border-blue-200 flex items-center justify-center">
                              <button
                                onClick={() => {
                                  // Delete sub-item logic would go here
                                }}
                                className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            
                            <div 
                              className="px-4 py-2 border-r border-blue-200 flex items-center"
                              style={{ width: getColumnWidth('item') }}
                            >
                              <div className="flex items-center gap-2 text-sm w-full">
                                <div className="w-6 h-px bg-blue-400"></div>
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                
                                {editingSubItem === subItem.id ? (
                                  <input
                                    type="text"
                                    value={subItem.name}
                                    onChange={(e) => {
                                      // Update sub-item name logic would go here
                                    }}
                                    onBlur={() => setEditingSubItem(null)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === 'Escape') {
                                        setEditingSubItem(null);
                                      }
                                    }}
                                    className="bg-white text-gray-900 text-sm px-2 py-1 border border-gray-300 rounded flex-1"
                                    autoFocus
                                    placeholder="Sub-item name"
                                  />
                                ) : (
                                  <span 
                                    className="cursor-pointer hover:text-blue-700 text-blue-800 text-sm font-medium flex-1"
                                    onClick={() => setEditingSubItem(subItem.id)}
                                  >
                                    {subItem.name || 'Untitled Sub-item'}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Sub-item columns */}
                            <div 
                              className="px-4 py-2 border-r border-blue-200 relative"
                              style={{ width: getColumnWidth('status') }}
                            >
                              <select
                                value={subItem.status}
                                onChange={(e) => {
                                  // Update sub-item status logic would go here
                                }}
                                className={`px-2 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer ${
                                  subItem.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  subItem.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}
                              >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                            
                            <div 
                              className="px-4 py-2 border-r border-blue-200"
                              style={{ width: getColumnWidth('assignedTo') }}
                            >
                              <select
                                value={subItem.assignedTo}
                                onChange={(e) => {
                                  // Update sub-item assignedTo logic would go here
                                }}
                                className="text-xs border-none bg-transparent text-gray-700 outline-none cursor-pointer"
                              >
                                <option value="unassigned">Unassigned</option>
                                {teamMembers.map(member => (
                                  <option key={member.id} value={member.id.toString()}>
                                    {member.firstName} {member.lastName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {/* Empty cells for other columns */}
                            {columns.slice(3).map((column) => (
                              <div 
                                key={column.id}
                                className="px-3 py-2 border-r border-blue-200"
                                style={{ width: getColumnWidth(column.id) }}
                              />
                            ))}
                            
                            {/* Updates column for sub-item */}
                            <div className="w-12 px-2 py-2 flex items-center justify-center">
                              <button
                                className="text-blue-400 hover:text-blue-600 p-1 hover:bg-blue-100 rounded"
                                title="Add update to sub-item"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Add Item Button for Group */}
                {!group.collapsed && (
                  <div className="flex bg-gray-50 hover:bg-gray-100 border-b border-gray-200">
                    <div className="w-12 px-2 py-2 border-r border-gray-200"></div>
                    <div 
                      className="px-4 py-2 border-r border-gray-200 flex items-center"
                      style={{ width: getColumnWidth('item') }}
                    >
                      <button
                        onClick={() => handleAddItem(group.name)}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        <Plus className="w-3 h-3" />
                        Add Item
                      </button>
                    </div>
                    {/* Empty cells for other columns */}
                    {columns.slice(1).map((column) => (
                      <div 
                        key={column.id}
                        className="px-3 py-2 border-r border-gray-200"
                        style={{ width: getColumnWidth(column.id) }}
                      />
                    ))}
                    <div className="w-12 px-2 py-2"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}