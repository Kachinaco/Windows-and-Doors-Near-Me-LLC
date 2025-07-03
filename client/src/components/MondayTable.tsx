import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Folder, Trash2, User, Calendar, Hash, Tag, Check, Mail, Phone, MapPin, BarChart3, Undo2, MessageCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MondayTableProps {
  className?: string;
  height?: string;
}

interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  avatar: string;
}

interface Column {
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
  priority: string;
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
    progress: number;
    priority: string;
  };
  folders: Folder[];
}

const MondayTable = ({ className = "", height = "600px" }: MondayTableProps) => {
  // Mock team members
  const [teamMembers] = useState([
    { id: 1, firstName: 'John', lastName: 'Doe', avatar: 'JD' },
    { id: 2, firstName: 'Jane', lastName: 'Smith', avatar: 'JS' },
    { id: 3, firstName: 'Bob', lastName: 'Wilson', avatar: 'BW' },
    { id: 4, firstName: 'Alice', lastName: 'Johnson', avatar: 'AJ' }
  ]);

  // Board columns configuration
  const [columns] = useState([
    { id: 'item', name: 'Main Item', type: 'text', order: 1 },
    { id: 'subitems', name: 'Sub Items', type: 'subitems', order: 2 },
    { id: 'status', name: 'Status', type: 'status', order: 3 },
    { id: 'assignedTo', name: 'People', type: 'people', order: 4 },
    { id: 'dueDate', name: 'Due Date', type: 'date', order: 5 },
    { id: 'progress', name: 'Progress', type: 'progress', order: 6 },
    { id: 'priority', name: 'Priority', type: 'priority', order: 7 }
  ]);

  // Initial board data
  const [boardItems, setBoardItems] = useState([
    {
      id: 1,
      groupName: 'New Leads',
      values: {
        item: 'Website Redesign Project',
        status: 'new lead',
        assignedTo: '1',
        dueDate: '2025-07-15',
        progress: 0,
        priority: 'high'
      },
      folders: [
        {
          id: 1001,
          name: 'Design Phase',
          collapsed: false,
          subItems: [
            { id: 10001, name: 'Research user requirements', status: 'not_started', assignedTo: '2', priority: 'high', folderId: 1001 },
            { id: 10002, name: 'Create wireframes', status: 'in_progress', assignedTo: '1', priority: 'medium', folderId: 1001 }
          ]
        }
      ]
    },
    {
      id: 2,
      groupName: 'In Progress',
      values: {
        item: 'E-commerce Platform',
        status: 'in progress',
        assignedTo: '3',
        dueDate: '2025-07-30',
        progress: 60,
        priority: 'high'
      },
      folders: [
        {
          id: 2001,
          name: 'Backend Development',
          collapsed: false,
          subItems: [
            { id: 20001, name: 'Database design', status: 'completed', assignedTo: '3', priority: 'high', folderId: 2001 },
            { id: 20002, name: 'API development', status: 'in_progress', assignedTo: '3', priority: 'high', folderId: 2001 }
          ]
        }
      ]
    }
  ]);

  // State management
  const [columnWidths, setColumnWidths] = useState({
    item: 250,
    subitems: 150,
    status: 130,
    assignedTo: 150,
    dueDate: 130,
    progress: 150,
    priority: 120
  });

  const [selectedItems, setSelectedItems] = useState(new Set());
  const [expandedSubItems, setExpandedSubItems] = useState(new Set([1, 2]));
  const [expandedFolders, setExpandedFolders] = useState(new Set([1001, 2001]));
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingSubItem, setEditingSubItem] = useState(null);
  const [isResizing, setIsResizing] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [newItemCounter, setNewItemCounter] = useState(3);
  const [newFolderCounter, setNewFolderCounter] = useState(3000);
  const [newSubItemCounter, setNewSubItemCounter] = useState(30000);
  
  // Updates modal state
  const [updatesModal, setUpdatesModal] = useState({
    isOpen: false,
    itemType: null,
    itemId: null,
    itemName: ''
  });
  const [itemUpdates, setItemUpdates] = useState({});
  const [newUpdate, setNewUpdate] = useState('');
  
  const [columnMenuOpen, setColumnMenuOpen] = useState(null);
  const tableRef = useRef(null);

  // Groups configuration
  const groupOrder = ['New Leads', 'In Progress', 'Complete'];

  // Helper functions
  const getMemberDisplayName = (memberId: string | number) => {
    if (!memberId || memberId === '' || memberId === 'unassigned') return 'Unassigned';
    const member = teamMembers.find(m => m.id.toString() === memberId.toString());
    return member ? `${member.firstName} ${member.lastName}` : 'Unassigned';
  };

  const getMemberAvatar = (memberId: string | number) => {
    if (!memberId || memberId === '' || memberId === 'unassigned') return '?';
    const member = teamMembers.find(m => m.id.toString() === memberId.toString());
    return member ? member.avatar : '?';
  };

  const getColumnWidth = (columnId: string) => {
    return columnWidths[columnId as keyof typeof columnWidths] || 140;
  };

  const getColumnIcon = (type: string) => {
    switch (type) {
      case 'status': return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
      case 'people': return <User className="w-3 h-3 text-purple-400" />;
      case 'date': return <Calendar className="w-3 h-3 text-orange-400" />;
      case 'subitems': return <Folder className="w-3 h-3 text-blue-400" />;
      case 'progress': return <BarChart3 className="w-3 h-3 text-green-400" />;
      case 'priority': return <Star className="w-3 h-3 text-yellow-400" />;
      default: return <Hash className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new lead': return 'bg-cyan-100 text-cyan-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'complete': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  // Event handlers
  const handleCellUpdate = useCallback((projectId, field, value) => {
    setBoardItems(prev => 
      prev.map(item => 
        item.id === projectId 
          ? { ...item, values: { ...item.values, [field]: value } }
          : item
      )
    );
  }, []);

  const handleSelectToggle = (itemId) => {
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

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const toggleSubItems = (itemId) => {
    setExpandedSubItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
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

  const handleAddItem = (groupName = 'New Leads') => {
    const newItem = {
      id: newItemCounter,
      groupName,
      values: {
        item: '',
        status: groupName === 'New Leads' ? 'new lead' : 
                groupName === 'In Progress' ? 'in progress' : 'complete',
        assignedTo: 'unassigned',
        dueDate: '',
        progress: 0,
        priority: 'medium'
      },
      folders: []
    };
    
    setBoardItems(prev => [...prev, newItem]);
    setNewItemCounter(prev => prev + 1);
    setEditingCell({ projectId: newItemCounter, field: 'item' });
  };

  const handleAddFolder = (projectId) => {
    const newFolder = {
      id: newFolderCounter,
      name: '',
      collapsed: false,
      subItems: []
    };

    setBoardItems(prev => prev.map(item => 
      item.id === projectId 
        ? { ...item, folders: [...(item.folders || []), newFolder] }
        : item
    ));

    setExpandedSubItems(prev => new Set([...prev, projectId]));
    setExpandedFolders(prev => new Set([...prev, newFolderCounter]));
    setEditingFolder(newFolderCounter);
    setNewFolderCounter(prev => prev + 1);
  };

  const handleAddSubItem = (projectId, folderId) => {
    const newSubItem = {
      id: newSubItemCounter,
      name: '',
      status: 'not_started',
      assignedTo: 'unassigned',
      priority: 'medium',
      folderId: folderId
    };

    setBoardItems(prev => prev.map(item => 
      item.id === projectId 
        ? {
            ...item,
            folders: item.folders.map(folder =>
              folder.id === folderId
                ? { ...folder, subItems: [...folder.subItems, newSubItem] }
                : folder
            )
          }
        : item
    ));

    setExpandedSubItems(prev => new Set([...prev, projectId]));
    setExpandedFolders(prev => new Set([...prev, folderId]));
    setEditingSubItem(newSubItemCounter);
    setNewSubItemCounter(prev => prev + 1);
  };

  // Column resizing
  const handlePointerDown = (columnId, e) => {
    e.preventDefault();
    setIsResizing(columnId);
    
    const handlePointerMove = (e) => {
      if (!tableRef.current) return;
      
      const rect = tableRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newWidth = Math.max(80, Math.min(400, x));
      
      setColumnWidths(prev => ({
        ...prev,
        [columnId]: newWidth
      }));
    };
    
    const handlePointerUp = () => {
      setIsResizing(null);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
    
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  // Cell renderer
  const renderCell = (item, column) => {
    const isEditing = editingCell?.projectId === item.id && editingCell?.field === column.id;
    const value = item.values[column.id];

    switch (column.type) {
      case 'text':
        return (
          <div className="flex items-center space-x-2">
            {column.id === 'item' && (
              <button
                onClick={() => toggleSubItems(item.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {expandedSubItems.has(item.id) ? (
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                )}
              </button>
            )}
            {isEditing ? (
              <Input
                value={value || ''}
                onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
                onBlur={() => setEditingCell(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    setEditingCell(null);
                  }
                }}
                className="h-8 text-sm border-blue-300 focus:border-blue-500"
                autoFocus
              />
            ) : (
              <span
                className="text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                onClick={() => setEditingCell({ projectId: item.id, field: column.id })}
              >
                {value || 'Click to edit'}
              </span>
            )}
          </div>
        );

      case 'subitems':
        return (
          <button
            onClick={() => handleAddFolder(item.id)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Add folder
          </button>
        );

      case 'status':
        return (
          <Badge className={`${getStatusColor(value)} text-xs`}>
            {value || 'Not set'}
          </Badge>
        );

      case 'people':
        return (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
              {getMemberAvatar(value)}
            </div>
            <span className="text-sm">{getMemberDisplayName(value)}</span>
          </div>
        );

      case 'date':
        return <span className="text-sm">{value || 'No date'}</span>;

      case 'progress':
        return (
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${value || 0}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{value || 0}%</span>
          </div>
        );

      case 'priority':
        return (
          <Badge className={`${getPriorityColor(value)} text-xs`}>
            {value || 'Medium'}
          </Badge>
        );

      default:
        return <span className="text-sm text-gray-600">{value || '-'}</span>;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Board</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{boardItems.length} items</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{selectedItems.size} selected</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setUndoStack([])}>
              <Undo2 className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button variant="default" size="sm" onClick={() => handleAddItem()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </div>

      {/* Table Container with fixed height */}
      <div className="overflow-auto" style={{ height }}>
        <div ref={tableRef} className="min-w-full">
          {/* Column Headers */}
          <div className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
            <div className="flex">
              <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-400 text-blue-500" />
              </div>
              {columns.map((column, index) => (
                <div
                  key={column.id}
                  className="px-3 py-3 border-r border-gray-200 relative group flex-shrink-0 bg-gray-100"
                  style={{ width: getColumnWidth(column.id) }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getColumnIcon(column.type)}
                      <span className="font-medium text-sm text-gray-700">{column.name}</span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      ⋯
                    </button>
                  </div>
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
                group.name === 'In Progress' ? 'bg-blue-50' :
                group.name === 'Complete' ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-400 text-blue-500" />
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
                    group.name === 'In Progress' ? 'bg-blue-500' :
                    group.name === 'Complete' ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-700">{group.name}</span>
                  <span className="text-sm text-gray-500">({group.items.length})</span>
                </div>
                
                {columns.slice(1).map((column) => (
                  <div 
                    key={column.id}
                    className="px-3 py-3 border-r border-gray-200"
                    style={{ width: getColumnWidth(column.id) }}
                  >
                    <span className="text-xs font-medium text-gray-500 uppercase">{column.name}</span>
                  </div>
                ))}
                
                <div className="w-12 px-2 py-3 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-500">💬</span>
                </div>
              </div>

              {/* Group Items */}
              {!group.collapsed && (
                <>
                  {group.items.map((item) => (
                    <React.Fragment key={item.id}>
                      {/* Main Item Row */}
                      <div className="flex hover:bg-gray-50 border-b border-gray-200 group">
                        <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleSelectToggle(item.id)}
                            className="w-4 h-4 rounded border-gray-400 text-blue-500"
                          />
                        </div>
                        {columns.map((column) => (
                          <div 
                            key={`${item.id}-${column.id}`}
                            className="px-4 py-3 border-r border-gray-200 flex items-center relative"
                            style={{ width: getColumnWidth(column.id) }}
                          >
                            {renderCell(item, column)}
                          </div>
                        ))}
                        <div className="w-12 px-2 py-3 flex items-center justify-center">
                          <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Folders and Sub-Items */}
                      {expandedSubItems.has(item.id) && (
                        <>
                          {(item.folders || []).map((folder) => (
                            <React.Fragment key={folder.id}>
                              {/* Folder Header */}
                              <div className="flex hover:bg-blue-50 bg-blue-25 border-b border-blue-200 group">
                                <div className="w-12 px-2 py-2 border-r border-blue-200 flex items-center justify-center">
                                  <button className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                
                                <div 
                                  className="px-4 py-2 border-r border-blue-200 flex items-center"
                                  style={{ width: getColumnWidth('item') }}
                                >
                                  <div className="flex items-center gap-2 text-sm w-full">
                                    <div className="w-4 h-px bg-blue-400"></div>
                                    <button onClick={() => toggleFolder(folder.id)} className="p-0.5 hover:bg-blue-100 rounded">
                                      <ChevronRight className={`w-3 h-3 text-blue-600 transition-transform ${
                                        expandedFolders.has(folder.id) ? 'rotate-90' : ''
                                      }`} />
                                    </button>
                                    <span className="text-blue-600 text-xs bg-blue-100 px-1.5 rounded">
                                      ({folder.subItems.length})
                                    </span>
                                    <Folder className="w-4 h-4 text-blue-600" />
                                    <span className="text-blue-900 text-sm font-medium cursor-pointer hover:text-blue-700 flex-1">
                                      {folder.name || 'Untitled Folder'}
                                    </span>
                                  </div>
                                </div>
                                
                                {columns.slice(1).map((column) => (
                                  <div 
                                    key={column.id}
                                    className="px-3 py-2 border-r border-blue-200"
                                    style={{ width: getColumnWidth(column.id) }}
                                  >
                                    <span className="text-xs font-medium text-blue-600 uppercase">{column.name}</span>
                                  </div>
                                ))}
                                
                                <div className="w-12 px-2 py-2 flex items-center justify-center">
                                  <button className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors">
                                    <MessageCircle className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Sub-items */}
                              {expandedFolders.has(folder.id) && (
                                <>
                                  {folder.subItems.map((subItem) => (
                                    <div key={subItem.id} className="flex hover:bg-blue-25 border-b border-blue-100 group">
                                      <div className="w-12 px-2 py-2 border-r border-blue-200 flex items-center justify-center">
                                        <button className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                      
                                      <div 
                                        className="px-4 py-2 border-r border-blue-200 flex items-center"
                                        style={{ width: getColumnWidth('item') }}
                                      >
                                        <div className="flex items-center gap-2 text-sm w-full">
                                          <div className="w-8 h-px bg-blue-300"></div>
                                          <Hash className="w-3 h-3 text-blue-500" />
                                          <span className="text-blue-900 text-sm cursor-pointer hover:text-blue-700 flex-1">
                                            {subItem.name || 'Untitled Sub-item'}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="px-3 py-2 border-r border-blue-200">
                                        <span className="text-xs text-blue-600">Sub-item</span>
                                      </div>
                                      
                                      <div className="px-3 py-2 border-r border-blue-200">
                                        <Badge className={`${getStatusColor(subItem.status)} text-xs`}>
                                          {subItem.status}
                                        </Badge>
                                      </div>
                                      
                                      <div className="px-3 py-2 border-r border-blue-200">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                                            {getMemberAvatar(subItem.assignedTo)}
                                          </div>
                                          <span className="text-xs text-blue-900">{getMemberDisplayName(subItem.assignedTo)}</span>
                                        </div>
                                      </div>
                                      
                                      {columns.slice(4).map((column) => (
                                        <div 
                                          key={column.id}
                                          className="px-3 py-2 border-r border-blue-200"
                                          style={{ width: getColumnWidth(column.id) }}
                                        >
                                          {column.id === 'priority' ? (
                                            <Badge className={`${getPriorityColor(subItem.priority)} text-xs`}>
                                              {subItem.priority}
                                            </Badge>
                                          ) : (
                                            <span className="text-xs text-blue-600">-</span>
                                          )}
                                        </div>
                                      ))}
                                      
                                      <div className="w-12 px-2 py-2 flex items-center justify-center">
                                        <button className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors">
                                          <MessageCircle className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {/* Add sub-item button */}
                                  <div className="flex border-b border-blue-100">
                                    <div className="w-12 px-2 py-2 border-r border-blue-200"></div>
                                    <div 
                                      className="px-4 py-2 border-r border-blue-200 flex items-center"
                                      style={{ width: getColumnWidth('item') }}
                                    >
                                      <button
                                        onClick={() => handleAddSubItem(item.id, folder.id)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                      >
                                        <Plus className="w-3 h-3" />
                                        Add sub-item
                                      </button>
                                    </div>
                                    {columns.slice(1).map((column) => (
                                      <div 
                                        key={column.id}
                                        className="px-3 py-2 border-r border-blue-200"
                                        style={{ width: getColumnWidth(column.id) }}
                                      ></div>
                                    ))}
                                    <div className="w-12 px-2 py-2"></div>
                                  </div>
                                </>
                              )}
                            </React.Fragment>
                          ))}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                  
                  {/* Add item button for group */}
                  <div className="flex border-b border-gray-200 hover:bg-gray-50">
                    <div className="w-12 px-2 py-3 border-r border-gray-200"></div>
                    <div 
                      className="px-4 py-3 border-r border-gray-200 flex items-center"
                      style={{ width: getColumnWidth('item') }}
                    >
                      <button
                        onClick={() => handleAddItem(group.name)}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add item
                      </button>
                    </div>
                    {columns.slice(1).map((column) => (
                      <div 
                        key={column.id}
                        className="px-3 py-3 border-r border-gray-200"
                        style={{ width: getColumnWidth(column.id) }}
                      ></div>
                    ))}
                    <div className="w-12 px-2 py-3"></div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MondayTable;