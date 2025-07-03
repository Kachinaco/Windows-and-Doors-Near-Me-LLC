import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Folder, Trash2, User, Calendar, Hash, Tag, Check, Mail, Phone, MapPin, BarChart3, ArrowLeft, Undo2, Settings, UserPlus, MessageCircle, Save, Timer, Globe, Link, FolderPlus, Star, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link as RouterLink } from 'wouter';

const MondayBoard = () => {
  const { user } = useAuth();
  
  // Mock team members - in real app, fetch from API
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
    { id: 'checkbox', name: 'Done', type: 'checkbox', order: 6 },
    { id: 'progress', name: 'Progress', type: 'progress', order: 7 },
    { id: 'priority', name: 'Priority', type: 'priority', order: 8 }
  ]);

  // Initial board data with folders and subitems
  const [boardItems, setBoardItems] = useState([
    {
      id: 1,
      groupName: 'New Leads',
      values: {
        item: 'Website Redesign Project',
        status: 'new lead',
        assignedTo: '1',
        dueDate: '2025-07-15',
        checkbox: false,
        progress: 0,
        priority: 'high',
        email: 'client@example.com',
        phone: '(555) 123-4567',
        location: '123 Main St, City'
      },
      folders: [
        {
          id: 1001,
          name: 'Design Phase',
          collapsed: false,
          subItems: [
            { id: 10001, name: 'Research user requirements', status: 'not_started', assignedTo: '2', priority: 'high', folderId: 1001 },
            { id: 10002, name: 'Create wireframes', status: 'in_progress', assignedTo: '1', priority: 'medium', folderId: 1001 },
            { id: 10003, name: 'Design mockups', status: 'not_started', assignedTo: '1', priority: 'low', folderId: 1001 }
          ]
        },
        {
          id: 1002,
          name: 'Development Phase',
          collapsed: true,
          subItems: [
            { id: 10004, name: 'Set up development environment', status: 'not_started', assignedTo: '3', priority: 'high', folderId: 1002 },
            { id: 10005, name: 'Frontend development', status: 'not_started', assignedTo: '4', priority: 'medium', folderId: 1002 }
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
        checkbox: false,
        progress: 60,
        priority: 'high',
        email: 'store@shop.com',
        phone: '(555) 456-7890',
        location: '789 Commerce Blvd, Downtown'
      },
      folders: [
        {
          id: 2001,
          name: 'Backend Development',
          collapsed: false,
          subItems: [
            { id: 20001, name: 'Database design', status: 'completed', assignedTo: '3', priority: 'high', folderId: 2001 },
            { id: 20002, name: 'API development', status: 'in_progress', assignedTo: '3', priority: 'high', folderId: 2001 },
            { id: 20003, name: 'Payment integration', status: 'in_progress', assignedTo: '4', priority: 'medium', folderId: 2001 }
          ]
        },
        {
          id: 2002,
          name: 'Frontend Development',
          collapsed: false,
          subItems: [
            { id: 20004, name: 'Product catalog UI', status: 'completed', assignedTo: '2', priority: 'medium', folderId: 2002 },
            { id: 20005, name: 'Shopping cart functionality', status: 'in_progress', assignedTo: '1', priority: 'high', folderId: 2002 }
          ]
        }
      ]
    },
    {
      id: 3,
      groupName: 'Complete',
      values: {
        item: 'Blog Setup',
        status: 'complete',
        assignedTo: '4',
        dueDate: '2025-06-15',
        checkbox: true,
        progress: 100,
        priority: 'medium',
        email: 'blog@writer.com',
        phone: '(555) 111-2222',
        location: 'Remote'
      },
      folders: [
        {
          id: 3001,
          name: 'Content Creation',
          collapsed: false,
          subItems: [
            { id: 30001, name: 'Write initial blog posts', status: 'completed', assignedTo: '4', priority: 'medium', folderId: 3001 },
            { id: 30002, name: 'Create content calendar', status: 'completed', assignedTo: '4', priority: 'low', folderId: 3001 }
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
    checkbox: 80,
    progress: 150,
    priority: 120,
    email: 180,
    phone: 140,
    location: 200
  });

  const [selectedItems, setSelectedItems] = useState(new Set());
  const [expandedSubItems, setExpandedSubItems] = useState(new Set([1, 2]));
  const [expandedFolders, setExpandedFolders] = useState(new Set([1001, 2001, 2002, 3001]));
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingSubItem, setEditingSubItem] = useState(null);
  const [isResizing, setIsResizing] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [selectedMainItem, setSelectedMainItem] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [newItemCounter, setNewItemCounter] = useState(4);
  const [newFolderCounter, setNewFolderCounter] = useState(4000);
  const [newSubItemCounter, setNewSubItemCounter] = useState(40000);
  
  // Updates modal state
  const [updatesModal, setUpdatesModal] = useState({
    isOpen: false,
    itemType: null,
    itemId: null,
    itemName: ''
  });
  const [itemUpdates, setItemUpdates] = useState({});
  const [newUpdate, setNewUpdate] = useState('');
  
  // Column menu state
  const [columnMenuOpen, setColumnMenuOpen] = useState(null);

  // Groups configuration
  const groupOrder = ['New Leads', 'Need Attention', 'Sent Estimate', 'Signed', 'In Progress', 'Complete'];

  // Refs for column resizing
  const resizeRef = useRef(null);
  const tableRef = useRef(null);

  // Column resizing handlers
  const handlePointerDown = (columnId, e) => {
    e.preventDefault();
    setIsResizing(columnId);
    
    const handlePointerMove = (e) => {
      if (!tableRef.current) return;
      
      const rect = tableRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      // Calculate new width based on mouse position
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

  // Close column menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnMenuOpen && !event.target.closest('.column-menu-container')) {
        setColumnMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [columnMenuOpen]);

  // Helper functions
  const getMemberDisplayName = (memberId) => {
    if (!memberId || memberId === '' || memberId === 'unassigned') return 'Unassigned';
    const member = teamMembers.find(m => m.id.toString() === memberId.toString());
    return member ? `${member.firstName} ${member.lastName}` : 'Unassigned';
  };

  const getMemberAvatar = (memberId) => {
    if (!memberId || memberId === '' || memberId === 'unassigned') return '?';
    const member = teamMembers.find(m => m.id.toString() === memberId.toString());
    return member ? member.avatar : '?';
  };

  const getColumnWidth = (columnId) => {
    return columnWidths[columnId] || 140;
  };

  const getColumnIcon = (type) => {
    switch (type) {
      case 'status': return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
      case 'people': return <User className="w-3 h-3 text-purple-400" />;
      case 'date': return <Calendar className="w-3 h-3 text-orange-400" />;
      case 'number': return <Hash className="w-3 h-3 text-yellow-400" />;
      case 'tags': return <Tag className="w-3 h-3 text-red-400" />;
      case 'subitems': return <Folder className="w-3 h-3 text-blue-400" />;
      case 'checkbox': return <Check className="w-3 h-3 text-green-400" />;
      case 'progress': return <BarChart3 className="w-3 h-3 text-green-400" />;
      case 'priority': return <Star className="w-3 h-3 text-yellow-400" />;
      case 'email': return <Mail className="w-3 h-3 text-blue-400" />;
      case 'phone': return <Phone className="w-3 h-3 text-green-400" />;
      case 'location': return <MapPin className="w-3 h-3 text-red-400" />;
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
    
    setUndoStack(prev => [
      ...prev.slice(-9),
      { action: 'update_cell', data: { projectId, field, value }, timestamp: Date.now() }
    ]);
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
                groupName === 'In Progress' ? 'in progress' : 
                groupName === 'Complete' ? 'complete' : 'new lead',
        assignedTo: 'unassigned',
        dueDate: '',
        checkbox: false,
        progress: 0,
        priority: 'medium',
        email: '',
        phone: '',
        location: ''
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

  const handleUpdateFolder = (projectId, folderId, newName) => {
    setBoardItems(prev => prev.map(item => 
      item.id === projectId 
        ? {
            ...item,
            folders: item.folders.map(folder =>
              folder.id === folderId
                ? { ...folder, name: newName }
                : folder
            )
          }
        : item
    ));
  };

  const handleUpdateSubItem = (projectId, subItemId, field, value) => {
    setBoardItems(prev => prev.map(item => 
      item.id === projectId 
        ? {
            ...item,
            folders: item.folders.map(folder => ({
              ...folder,
              subItems: folder.subItems.map(subItem =>
                subItem.id === subItemId
                  ? { ...subItem, [field]: value }
                  : subItem
              )
            }))
          }
        : item
    ));
  };

  const handleDeleteFolder = (projectId, folderId) => {
    setBoardItems(prev => prev.map(item => 
      item.id === projectId 
        ? { ...item, folders: item.folders.filter(folder => folder.id !== folderId) }
        : item
    ));
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.delete(folderId);
      return newSet;
    });
  };

  const handleDeleteSubItem = (projectId, subItemId) => {
    setBoardItems(prev => prev.map(item => 
      item.id === projectId 
        ? {
            ...item,
            folders: item.folders.map(folder => ({
              ...folder,
              subItems: folder.subItems.filter(subItem => subItem.id !== subItemId)
            }))
          }
        : item
    ));
  };

  // Updates modal functions
  const openUpdatesModal = (itemType, itemId, itemName) => {
    setUpdatesModal({
      isOpen: true,
      itemType,
      itemId,
      itemName
    });
  };

  const closeUpdatesModal = () => {
    setUpdatesModal({
      isOpen: false,
      itemType: null,
      itemId: null,
      itemName: ''
    });
    setNewUpdate('');
  };

  const getUpdateCount = (itemType, itemId) => {
    const key = `${itemType}-${itemId}`;
    return itemUpdates[key] ? itemUpdates[key].length : 0;
  };

  const addUpdate = () => {
    if (!newUpdate.trim()) return;
    
    const key = `${updatesModal.itemType}-${updatesModal.itemId}`;
    const update = {
      id: Date.now(),
      text: newUpdate,
      author: user?.firstName || 'Current User',
      timestamp: new Date().toISOString()
    };
    
    setItemUpdates(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), update]
    }));
    
    setNewUpdate('');
  };

  // Column menu component
  const ColumnMenu = ({ columnId, columnName, isOpen, onClose }) => {
    if (!isOpen) return null;
    
    return (
      <div className="column-menu-container absolute top-full left-0 z-50 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-2">
          <div className="text-xs font-semibold text-gray-500 mb-2">{columnName}</div>
          <div className="space-y-1">
            <button className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded">Settings</button>
            <button className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded">Filter</button>
            <button className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded">Sort</button>
            <button className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded">Group by</button>
            <div className="border-t border-gray-200 my-1"></div>
            <button className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded">Duplicate column</button>
            <button className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded">Add column to right</button>
            <button className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded">Rename</button>
            <button className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded text-red-600">Delete</button>
          </div>
        </div>
      </div>
    );
  };

  // Cell renderer
  const renderCell = (item, column) => {
    const cellKey = `${item.id}-${column.id}`;
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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleAddFolder(item.id)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add folder
            </button>
          </div>
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
        return (
          <span className="text-sm">{value || 'No date'}</span>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleCellUpdate(item.id, column.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300"
          />
        );

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
        return (
          <span className="text-sm text-gray-600">{value || '-'}</span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <RouterLink href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </RouterLink>
            <h1 className="text-2xl font-bold text-gray-900">Project Management Board</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite
            </Button>
          </div>
        </div>
      </div>

      {/* Board Container */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Board Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">Main Board</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {boardItems.length} items
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    {selectedItems.size} selected
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUndoStack([])}
                  disabled={undoStack.length === 0}
                >
                  <Undo2 className="w-4 h-4 mr-2" />
                  Undo
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleAddItem()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          </div>

          {/* Board Table */}
          <div className="overflow-x-auto">
            <div ref={tableRef} className="min-w-full">
              {/* Table Header */}
              <div className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                <div className="flex">
                  <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-400 text-blue-500"
                    />
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
                        <button 
                          onClick={() => setColumnMenuOpen(columnMenuOpen === `main-${column.id}` ? null : `main-${column.id}`)}
                          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
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
                    
                    {/* Updates column in group header */}
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
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleSelectToggle(item.id);
                                }}
                                className="w-4 h-4 rounded border-gray-400 text-blue-500"
                              />
                            </div>
                            {columns.map((column) => (
                              <div 
                                key={`${item.id}-${column.id}`}
                                className="px-4 py-3 border-r border-gray-200 flex items-center relative"
                                style={{ width: getColumnWidth(column.id) }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {renderCell(item, column)}
                              </div>
                            ))}
                            {/* Updates icon for main item */}
                            <div className="w-12 px-2 py-3 flex items-center justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openUpdatesModal('main', item.id, item.values.item || `Project #${item.id}`);
                                }}
                                className="relative p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Add update"
                              >
                                <MessageCircle className="w-4 h-4" />
                                {getUpdateCount('main', item.id) > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {getUpdateCount('main', item.id)}
                                  </span>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Folders and Sub-Items */}
                          {expandedSubItems.has(item.id) && (
                            <>
                              {/* Render folders */}
                              {(item.folders || []).map((folder) => (
                                <React.Fragment key={folder.id}>
                                  {/* Folder Header */}
                                  <div className="flex hover:bg-blue-50 bg-blue-25 border-b border-blue-200 group">
                                    <div className="w-12 px-2 py-2 border-r border-blue-200 flex items-center justify-center">
                                      <button
                                        onClick={() => handleDeleteFolder(item.id, folder.id)}
                                        className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                    
                                    <div 
                                      className="px-4 py-2 border-r border-blue-200 flex items-center"
                                      style={{ width: getColumnWidth('item') }}
                                    >
                                      <div className="flex items-center gap-2 text-sm w-full">
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
                                            onChange={(e) => handleUpdateFolder(item.id, folder.id, e.target.value)}
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
                                    
                                    {/* Folder column headers */}
                                    <div className="px-3 py-2 border-r border-blue-200">
                                      <span className="text-xs font-medium text-blue-600 uppercase">Sub Items</span>
                                    </div>
                                    
                                    {columns.slice(2).map((column) => (
                                      <div 
                                        key={column.id}
                                        className="px-3 py-2 border-r border-blue-200"
                                        style={{ width: getColumnWidth(column.id) }}
                                      >
                                        <span className="text-xs font-medium text-blue-600 uppercase">{column.name}</span>
                                      </div>
                                    ))}
                                    
                                    <div className="w-12 px-2 py-2 flex items-center justify-center">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openUpdatesModal('folder', folder.id, folder.name || 'Untitled Folder');
                                        }}
                                        className="relative p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                        title="Add update"
                                      >
                                        <MessageCircle className="w-3 h-3" />
                                        {getUpdateCount('folder', folder.id) > 0 && (
                                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center">
                                            {getUpdateCount('folder', folder.id)}
                                          </span>
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Sub-items */}
                                  {expandedFolders.has(folder.id) && (
                                    <>
                                      {folder.subItems.map((subItem) => (
                                        <div key={subItem.id} className="flex hover:bg-blue-25 border-b border-blue-100 group">
                                          <div className="w-12 px-2 py-2 border-r border-blue-200 flex items-center justify-center">
                                            <button
                                              onClick={() => handleDeleteSubItem(item.id, subItem.id)}
                                              className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
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
                                              
                                              {editingSubItem === subItem.id ? (
                                                <input
                                                  type="text"
                                                  value={subItem.name}
                                                  onChange={(e) => handleUpdateSubItem(item.id, subItem.id, 'name', e.target.value)}
                                                  onBlur={() => setEditingSubItem(null)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === 'Escape') {
                                                      setEditingSubItem(null);
                                                    }
                                                  }}
                                                  className="bg-white text-blue-900 text-sm px-2 py-1 border border-blue-300 rounded flex-1"
                                                  autoFocus
                                                  placeholder="Sub-item name"
                                                />
                                              ) : (
                                                <span 
                                                  className="text-blue-900 text-sm cursor-pointer hover:text-blue-700 flex-1"
                                                  onClick={() => setEditingSubItem(subItem.id)}
                                                >
                                                  {subItem.name || 'Untitled Sub-item'}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {/* Sub-item data columns */}
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
                                          
                                          {columns.slice(5).map((column) => (
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
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openUpdatesModal('subitem', subItem.id, subItem.name || 'Untitled Sub-item');
                                              }}
                                              className="relative p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                              title="Add update"
                                            >
                                              <MessageCircle className="w-3 h-3" />
                                              {getUpdateCount('subitem', subItem.id) > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center">
                                                  {getUpdateCount('subitem', subItem.id)}
                                                </span>
                                              )}
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
      </div>

      {/* Updates Modal */}
      <Dialog open={updatesModal.isOpen} onOpenChange={closeUpdatesModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Updates - {updatesModal.itemName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-3">
              {(itemUpdates[`${updatesModal.itemType}-${updatesModal.itemId}`] || []).map((update) => (
                <div key={update.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>{update.author}</span>
                    <span>{new Date(update.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-900">{update.text}</p>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Input
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                placeholder="Add an update..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addUpdate();
                  }
                }}
              />
              <Button onClick={addUpdate} disabled={!newUpdate.trim()}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MondayBoard;