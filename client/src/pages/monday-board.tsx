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
import { Plus, Settings, Calendar, Users, Hash, Tag, User, Type, ChevronDown, ChevronRight, ArrowLeft, Undo2, Folder, Columns, Trash2, MessageCircle, UserPlus, Mail, Phone, Check, Clock, BarChart3, Calculator, Globe, MapPin, Link, UserCheck, ThumbsUp, Palette, FileUp, History, Timer, Zap, Flag, Save } from "lucide-react";

interface BoardColumn {
  id: string;
  name: string;
  type: 'status' | 'text' | 'date' | 'people' | 'number' | 'tags' | 'subitems' | 
        'checkbox' | 'auto_number' | 'item_id' | 'timeline' | 'progress' | 'formula' | 
        'week' | 'world_clock' | 'email' | 'phone' | 'location' | 'link' | 'custom_url' | 
        'team' | 'vote' | 'color_picker' | 'files' | 'creation_log' | 'last_updated' | 
        'time_tracking' | 'api_action' | 'country';
  order: number;
  settings?: {
    options?: string[]; // For status, team, country dropdowns
    colors?: Record<string, string>; // For status color mapping
    formula?: string; // For formula columns
    timezone?: string; // For world clock
    webhookUrl?: string; // For API action
    defaultValue?: any; // Default values for new items
  };
}

interface SubItem {
  id: number;
  projectId: number;
  name: string;
  status: string;
  assignedTo?: string;
  folderId?: number;
  order: number;
  notes?: string;
  dueDate?: string;
  priority?: number;
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
  
  // Default board columns - Main Item Columns + Sub Items with enhanced column types
  const [columns, setColumns] = useState<BoardColumn[]>([
    { id: 'item', name: 'Main Item', type: 'text', order: 1 },
    { id: 'subitems', name: 'Sub Items', type: 'subitems', order: 2 },
    { id: 'status', name: 'Status', type: 'status', order: 3, settings: { 
        options: ['new lead', 'in progress', 'on order', 'scheduled', 'complete'],
        colors: { 'new lead': '#3b82f6', 'in progress': '#f59e0b', 'on order': '#8b5cf6', 'scheduled': '#10b981', 'complete': '#22c55e' }
      }
    },
    { id: 'assignedTo', name: 'People', type: 'people', order: 4 },
    { id: 'dueDate', name: 'Due Date', type: 'date', order: 5 },
    { id: 'checkbox', name: 'Done', type: 'checkbox', order: 6 },
    { id: 'progress', name: 'Progress', type: 'progress', order: 7 },
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
  
  // Add Person modal state
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);
  const [newPersonForm, setNewPersonForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'member',
    notes: ''
  });

  // Helper function to get display name from member ID
  const getMemberDisplayName = (memberId: string | number): string => {
    if (!memberId || memberId === '' || memberId === 'unassigned') return 'Unassigned';
    const member = teamMembers.find((m: any) => m.id.toString() === memberId.toString());
    return member ? `${member.firstName} ${member.lastName}` : 'Unassigned';
  };

  // Initialize column widths from localStorage or use defaults
  const getInitialColumnWidths = () => {
    try {
      const saved = localStorage.getItem('mondayBoard_columnWidths');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load saved column widths:', error);
    }
    
    // Default widths - main item starts very small
    return {
      item: 120, // Much smaller default
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
    };
  };

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(getInitialColumnWidths);
  
  // Save column widths to localStorage
  const saveColumnWidths = (widths: Record<string, number>) => {
    try {
      localStorage.setItem('mondayBoard_columnWidths', JSON.stringify(widths));
    } catch (error) {
      console.warn('Failed to save column widths:', error);
    }
  };
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

  // Email modal state
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    itemId: number | null;
    columnId: string | null;
    currentValue: string;
    isSubItem: boolean;
  }>({
    isOpen: false,
    itemId: null,
    columnId: null,
    currentValue: '',
    isSubItem: false
  });
  const [emailData, setEmailData] = useState<{
    address: string;
    displayText: string;
  }>({
    address: '',
    displayText: ''
  });
  const [emailError, setEmailError] = useState<string>('');

  // Helper function for consistent column width calculation
  const getColumnWidth = (columnId: string, index: number) => {
    return columnWidths[columnId] || (index === 0 ? 120 : 140);
  };

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Open email modal
  const openEmailModal = (itemId: number, columnId: string, currentValue: string, isSubItem: boolean = false) => {
    // Parse current value if it contains both email and display text
    let address = '';
    let displayText = '';
    
    if (currentValue) {
      // Check if value contains display text and email (format: "Display Text <email@domain.com>")
      const match = currentValue.match(/^(.+?)\s*<(.+)>$/);
      if (match) {
        displayText = match[1].trim();
        address = match[2].trim();
      } else {
        // Just email address
        address = currentValue;
      }
    }

    setEmailData({ address, displayText });
    setEmailModal({
      isOpen: true,
      itemId,
      columnId,
      currentValue,
      isSubItem
    });
    setEmailError('');
  };

  // Close email modal
  const closeEmailModal = () => {
    setEmailModal({
      isOpen: false,
      itemId: null,
      columnId: null,
      currentValue: '',
      isSubItem: false
    });
    setEmailData({ address: '', displayText: '' });
    setEmailError('');
  };

  // Save email data
  const saveEmailData = () => {
    const { address, displayText } = emailData;
    
    // Validate email address
    if (!address.trim()) {
      setEmailError('Email address is required');
      return;
    }
    
    if (!validateEmail(address)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Format the value
    let formattedValue = address;
    if (displayText.trim()) {
      formattedValue = `${displayText.trim()} <${address}>`;
    }

    // Update the cell
    if (emailModal.itemId && emailModal.columnId) {
      if (emailModal.isSubItem) {
        handleSubItemCellUpdate(emailModal.itemId, emailModal.columnId, formattedValue);
      } else {
        handleCellUpdate(emailModal.itemId, emailModal.columnId, formattedValue);
      }
    }

    closeEmailModal();
  };

  // Fetch projects and transform to board items
  const { data: projects = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/projects'],
    enabled: !!user, // Only fetch when user is available
    refetchInterval: 5000,
    staleTime: 0, // Force fresh data on every query
  });

  // Debug logging
  console.log('MondayBoard state:', { user: !!user, isLoading, projects: Array.isArray(projects) ? projects.length : 0, error });
  
  // Debug sub-items and folders
  if (Array.isArray(projects) && projects.length > 0) {
    projects.forEach((project: any) => {
      if (project.subItems?.length > 0 || project.subItemFolders?.length > 0) {
        console.log(`Project ${project.id} has:`, {
          subItems: project.subItems?.length || 0,
          subItemFolders: project.subItemFolders?.length || 0,
          subItemsData: project.subItems,
          foldersData: project.subItemFolders
        });
      }
    });
  }

  // Query for project team members (for "Assigned To" dropdowns)
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['/api/projects/77/team-members'],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch('/api/projects/77/team-members', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      return response.json();
    },
  });

  // Fetch project updates for selected project
  const { data: projectUpdates = [], isLoading: updatesLoading } = useQuery<any[]>({
    queryKey: ['/api/projects', selectedMainItem?.id, 'updates'],
    enabled: !!selectedMainItem?.id,
    refetchInterval: 3000, // Refresh more frequently for real-time updates
  });

  // Transform projects to board items safely and manage in state
  const initialBoardItems: BoardItem[] = Array.isArray(projects) ? projects.map((project: any) => {
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
        // Initialize all new column types with default values
        checkbox: false,
        progress: 0,
        auto_number: project.id,
        item_id: `ID-${project.id}`,
        timeline: project.startDate || '',
        formula: '',
        week: '',
        world_clock: new Date().toISOString(),
        email: project.clientEmail || '',
        link: '',
        custom_url: '',
        team: '',
        vote: 0,
        color_picker: '#3b82f6',
        files: [],
        creation_log: `Created by Admin on ${new Date().toLocaleDateString()}`,
        last_updated: new Date().toLocaleDateString(),
        time_tracking: '0:00',
        api_action: '',
        country: '',
      },
      subItems: project.subItems || [],
      subItemFolders: project.subItemFolders || []
    };
  }) : [];

  // State for managing board items locally for real-time updates
  const [boardItems, setBoardItems] = useState<BoardItem[]>(initialBoardItems);

  // Update local board items when projects data changes
  useEffect(() => {
    if (Array.isArray(projects) && projects.length > 0) {
      const transformedItems = projects.map((project: any) => {
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
            // Initialize all new column types with default values
            checkbox: false,
            progress: 0,
            auto_number: project.id,
            item_id: `ID-${project.id}`,
            timeline: project.startDate || '',
            formula: '',
            week: '',
            world_clock: new Date().toISOString(),
            email: project.clientEmail || '',
            link: '',
            custom_url: '',
            team: '',
            vote: 0,
            color_picker: '#3b82f6',
            files: [],
            creation_log: `Created by Admin on ${new Date().toLocaleDateString()}`,
            last_updated: new Date().toLocaleDateString(),
            time_tracking: '0:00',
            api_action: '',
            country: '',
          },
          subItems: project.subItems || [],
          subItemFolders: project.subItemFolders || []
        };
      });
      
      // Only update if the data has actually changed
      setBoardItems(prevItems => {
        if (JSON.stringify(prevItems.map(item => item.id)) !== JSON.stringify(transformedItems.map(item => item.id))) {
          return transformedItems;
        }
        return prevItems;
      });
    }
  }, [projects]);

  // Define fixed group order to match project pipeline exactly
  // Initialize group order state with localStorage support
  const [groupOrder, setGroupOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('customGroups');
    return saved ? JSON.parse(saved) : ['New Leads', 'Need Attention', 'Sent Estimate', 'Signed', 'In Progress', 'Complete'];
  });

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
  
  // Create groups in fixed order, including empty groups
  const boardGroups: BoardGroup[] = groupOrder
    .map(groupName => ({
      name: groupName,
      items: groupedItems[groupName] || [],
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

    // Update local board items immediately for responsive UI
    setBoardItems((prev: BoardItem[]) => 
      prev.map((item: BoardItem) => 
        item.id === projectId 
          ? { ...item, values: { ...item.values, [field]: value } }
          : item
      )
    );

    // Map board fields to project fields for database persistence
    const fieldMapping: Record<string, string> = {
      item: 'name',
      assignedTo: 'assignedTo',
      status: 'status',
      location: 'projectAddress',
      phone: 'clientPhone',
      email: 'clientEmail',
      dueDate: 'endDate',
      timeline: 'startDate',
    };

    // Only persist fields that map to actual database columns
    const actualField = fieldMapping[field];
    if (actualField) {
      console.log('Field mapping:', { field, actualField, value });
      updateCellMutation.mutate({ projectId, field: actualField, value });
    } else {
      // For custom columns that don't map to database fields, 
      // store in local state only (in real app would use separate storage)
      console.log('Custom field updated locally:', { field, value });
      toast({ 
        title: "Updated", 
        description: `${field} updated to: ${value}`,
        duration: 1000 
      });
    }
  }, [updateCellMutation, projects]);

  // Bulk operations helpers
  const handleSelectAll = useCallback(() => {
    const allIds = new Set(boardItems.map((item: BoardItem) => item.id));
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

  // Handle updating sub-item properties
  const handleUpdateSubItem = useCallback(async (subItemId: number, updates: Record<string, any>) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/api/sub-items/${subItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        toast({ title: "Success", description: "Sub-item updated successfully" });
      } else {
        throw new Error('Failed to update sub-item');
      }
    } catch (error) {
      console.error('Error updating sub-item:', error);
      toast({ title: "Error", description: "Failed to update sub-item", variant: "destructive" });
    }
  }, [queryClient, toast]);

  // Add person to project mutation
  const addPersonMutation = useMutation({
    mutationFn: async (personData: typeof newPersonForm) => {
      // Use project ID 77 as the default project for Monday board
      const projectId = 77;
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(personData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to add person to project');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Person added to project successfully" });
      setIsAddPersonModalOpen(false);
      setNewPersonForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'member',
        notes: ''
      });
      // Invalidate both projects and team members queries to refresh dropdowns
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/77/team-members'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add person to project", variant: "destructive" });
    }
  });

  const handleAddPerson = () => {
    // Validation
    if (!newPersonForm.firstName.trim()) {
      toast({ title: "Validation Error", description: "First name is required", variant: "destructive" });
      return;
    }
    if (!newPersonForm.lastName.trim()) {
      toast({ title: "Validation Error", description: "Last name is required", variant: "destructive" });
      return;
    }
    if (!newPersonForm.email.trim()) {
      toast({ title: "Validation Error", description: "Email is required", variant: "destructive" });
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newPersonForm.email)) {
      toast({ title: "Validation Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    
    // Phone format validation (if provided)
    if (newPersonForm.phone && newPersonForm.phone.length > 0 && newPersonForm.phone.length < 10) {
      toast({ title: "Validation Error", description: "Please enter a valid phone number", variant: "destructive" });
      return;
    }
    
    addPersonMutation.mutate(newPersonForm);
  };

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
      // Save current column widths to localStorage
      setColumnWidths(prev => {
        const newWidths = { ...prev };
        saveColumnWidths(newWidths);
        return newWidths;
      });
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
    setGroupOrder(newGroupOrder);
    
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
      // Existing types
      case 'status': return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
      case 'people': return <User className="w-2.5 h-2.5 text-purple-400" />;
      case 'date': return <Calendar className="w-2.5 h-2.5 text-orange-400" />;
      case 'number': return <Hash className="w-2.5 h-2.5 text-yellow-400" />;
      case 'tags': return <Tag className="w-2.5 h-2.5 text-red-400" />;
      case 'subitems': return <Folder className="w-2.5 h-2.5 text-blue-400" />;
      
      // General Tracking Columns
      case 'checkbox': return <Check className="w-2.5 h-2.5 text-green-400" />;
      case 'auto_number': return <Hash className="w-2.5 h-2.5 text-blue-400" />;
      case 'item_id': return <Tag className="w-2.5 h-2.5 text-gray-400" />;
      case 'timeline': return <BarChart3 className="w-2.5 h-2.5 text-indigo-400" />;
      case 'progress': return <BarChart3 className="w-2.5 h-2.5 text-green-400" />;
      case 'formula': return <Calculator className="w-2.5 h-2.5 text-purple-400" />;
      case 'week': return <Calendar className="w-2.5 h-2.5 text-blue-400" />;
      case 'world_clock': return <Globe className="w-2.5 h-2.5 text-cyan-400" />;
      
      // Communication + Team
      case 'email': return <Mail className="w-2.5 h-2.5 text-blue-400" />;
      case 'phone': return <Phone className="w-2.5 h-2.5 text-green-400" />;
      case 'location': return <MapPin className="w-2.5 h-2.5 text-red-400" />;
      case 'link': return <Link className="w-2.5 h-2.5 text-blue-400" />;
      case 'custom_url': return <Link className="w-2.5 h-2.5 text-purple-400" />;
      case 'team': return <Users className="w-2.5 h-2.5 text-orange-400" />;
      case 'vote': return <ThumbsUp className="w-2.5 h-2.5 text-green-400" />;
      case 'color_picker': return <Palette className="w-2.5 h-2.5 text-pink-400" />;
      
      // Workflow + System
      case 'files': return <FileUp className="w-2.5 h-2.5 text-gray-400" />;
      case 'creation_log': return <History className="w-2.5 h-2.5 text-gray-400" />;
      case 'last_updated': return <Clock className="w-2.5 h-2.5 text-gray-400" />;
      case 'time_tracking': return <Timer className="w-2.5 h-2.5 text-blue-400" />;
      case 'api_action': return <Zap className="w-2.5 h-2.5 text-yellow-400" />;
      case 'country': return <Flag className="w-2.5 h-2.5 text-red-400" />;
      
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
            onValueChange={(newValue) => {
              if (newValue === "__add_person__") {
                setIsAddPersonModalOpen(true);
              } else {
                handleCellUpdate(item.id, column.id, newValue);
              }
            }}
          >
            <SelectTrigger className="h-4 text-xs border-none bg-transparent text-gray-300 p-0 min-h-0">
              <SelectValue placeholder="Assign">
                {value && value !== 'unassigned' ? getMemberDisplayName(value) : 'Assign'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="unassigned" className="text-white hover:text-gray-200">Unassigned</SelectItem>
              {teamMembers.map((member: any) => (
                <SelectItem key={member.id} value={member.id.toString()} className="text-white hover:text-gray-200">
                  {member.firstName} {member.lastName}
                </SelectItem>
              ))}
              <div className="border-t border-gray-700 my-1"></div>
              <SelectItem value="__add_person__" className="text-blue-400 hover:text-blue-300">
                <UserPlus className="w-3 h-3 mr-2 inline" />
                Add Person...
              </SelectItem>
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

      // General Tracking Columns
      case 'checkbox':
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={value === 'true' || (value as any) === true}
              onChange={(e) => handleCellUpdate(item.id, column.id, e.target.checked)}
              className="w-3 h-3 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-1"
            />
          </div>
        );

      case 'auto_number':
        // Auto-generated sequential number based on item position
        const autoNumber = (columns.findIndex(col => col.id === column.id)) * 1000 + item.id;
        return (
          <div className="text-xs text-gray-400 font-mono">
            #{autoNumber.toString().padStart(4, '0')}
          </div>
        );

      case 'item_id':
        return (
          <Input
            value={value || `ID-${item.id}`}
            onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
            className="h-4 text-xs border-none bg-transparent text-gray-300 font-mono"
            placeholder={`ID-${item.id}`}
          />
        );

      case 'progress':
        const progressValue = parseInt(value) || 0;
        return (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-8">{progressValue}%</span>
          </div>
        );

      case 'timeline':
        return (
          <Input
            type="date"
            value={value?.split ? value.split('T')[0] : value || ''}
            onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
            className="h-4 text-xs border-none bg-transparent text-gray-300"
            placeholder="Select date"
          />
        );

      case 'formula':
        // Simple formula evaluation (in real app, would be more sophisticated)
        const formulaResult = column.settings?.formula ? 'Calc' : value;
        return (
          <div className="text-xs text-purple-400 font-mono">
            {formulaResult || '=SUM()'}
          </div>
        );

      case 'week':
        return (
          <Input
            type="week"
            value={value}
            onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
            className="h-4 text-xs border-none bg-transparent text-gray-300"
          />
        );

      case 'world_clock':
        const currentTime = new Date().toLocaleTimeString('en-US', { 
          timeZone: column.settings?.timezone || 'UTC',
          hour12: false 
        });
        return (
          <div className="text-xs text-cyan-400">
            {currentTime}
          </div>
        );

      // Communication + Team Columns
      case 'email':
        // Parse display value for showing in cell
        const emailDisplayValue = (() => {
          if (!value) return '';
          
          // Check if value contains display text and email
          const match = value.match(/^(.+?)\s*<(.+)>$/);
          if (match) {
            return match[1].trim(); // Show display text
          }
          return value; // Show email address
        })();

        // Extract email address for mailto link
        const emailAddress = (() => {
          if (!value) return '';
          
          const match = value.match(/^(.+?)\s*<(.+)>$/);
          if (match) {
            return match[2].trim(); // Extract email from format
          }
          return value; // Use as email address
        })();

        return (
          <div 
            className="flex items-center gap-1 cursor-pointer hover:bg-gray-700/50 px-1 py-0.5 rounded group"
            onClick={() => openEmailModal(item.id, column.id, value || '', false)}
          >
            <Mail className="w-3 h-3 text-blue-400" />
            {emailAddress && validateEmail(emailAddress) ? (
              <a
                href={`mailto:${emailAddress}`}
                className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex-1 truncate"
                onClick={(e) => e.stopPropagation()} // Prevent modal from opening when clicking link
              >
                {emailDisplayValue || emailAddress}
              </a>
            ) : (
              <span className="text-xs text-gray-500 flex-1">
                {emailDisplayValue || 'Click to add email'}
              </span>
            )}
          </div>
        );

      case 'phone':
        return (
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-green-400" />
            <Input
              type="tel"
              value={value}
              onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
              className="h-4 text-xs border-none bg-transparent text-gray-300 flex-1"
              placeholder="(555) 123-4567"
            />
          </div>
        );

      case 'location':
        return (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-400" />
            <Input
              value={value}
              onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
              className="h-4 text-xs border-none bg-transparent text-gray-300 flex-1"
              placeholder="Address or coordinates"
            />
          </div>
        );

      case 'link':
        return (
          <div className="flex items-center gap-1">
            <Link className="w-3 h-3 text-blue-400" />
            {value ? (
              <a
                href={value.startsWith('http') ? value : `https://${value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline truncate flex-1"
              >
                {value}
              </a>
            ) : (
              <Input
                value={value}
                onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
                className="h-4 text-xs border-none bg-transparent text-gray-300 flex-1"
                placeholder="https://example.com"
              />
            )}
          </div>
        );

      case 'custom_url':
        const customUrl = value ? value.replace('{{item.id}}', item.id.toString()) : '';
        return (
          <div className="flex items-center gap-1">
            <Link className="w-3 h-3 text-purple-400" />
            {customUrl ? (
              <a
                href={customUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 underline truncate flex-1"
              >
                View Item
              </a>
            ) : (
              <Input
                value={value}
                onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
                className="h-4 text-xs border-none bg-transparent text-gray-300 flex-1"
                placeholder="https://domain.com/{{item.id}}"
              />
            )}
          </div>
        );

      case 'team':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleCellUpdate(item.id, column.id, newValue)}
          >
            <SelectTrigger className="h-4 text-xs border-none bg-transparent text-gray-300 p-0 min-h-0">
              <SelectValue placeholder="Select team">
                {value || 'Select team'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="frontend" className="text-white hover:text-gray-200">Frontend Team</SelectItem>
              <SelectItem value="backend" className="text-white hover:text-gray-200">Backend Team</SelectItem>
              <SelectItem value="design" className="text-white hover:text-gray-200">Design Team</SelectItem>
              <SelectItem value="qa" className="text-white hover:text-gray-200">QA Team</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'vote':
        const voteCount = parseInt(value) || 0;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCellUpdate(item.id, column.id, voteCount + 1)}
              className="flex items-center gap-1 hover:bg-gray-700 px-1 py-0.5 rounded text-xs"
            >
              <ThumbsUp className="w-3 h-3 text-green-400" />
              <span className="text-gray-300">{voteCount}</span>
            </button>
          </div>
        );

      case 'color_picker':
        return (
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={value || '#3b82f6'}
              onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-xs text-gray-400">{value || '#3b82f6'}</span>
          </div>
        );

      // Workflow + System Columns
      case 'files':
        return (
          <div className="flex items-center gap-1">
            <FileUp className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              {value ? `${Array.isArray(value) ? value.length : 1} file(s)` : 'No files'}
            </span>
          </div>
        );

      case 'creation_log':
        return (
          <div className="text-xs text-gray-400">
            Created by Admin
          </div>
        );

      case 'last_updated':
        return (
          <div className="text-xs text-gray-400">
            {new Date().toLocaleDateString()}
          </div>
        );

      case 'time_tracking':
        const timeValue = value || '0:00';
        return (
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-gray-300">{timeValue}</span>
            <button className="text-xs text-green-400 hover:text-green-300 ml-1">▶</button>
          </div>
        );

      case 'api_action':
        return (
          <button
            onClick={() => {
              if (column.settings?.webhookUrl) {
                // In real app, would trigger webhook
                toast({ title: "API Action", description: "Webhook triggered!" });
              }
            }}
            className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 px-1 py-0.5 rounded hover:bg-gray-700"
          >
            <Zap className="w-3 h-3" />
            Trigger
          </button>
        );

      case 'country':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleCellUpdate(item.id, column.id, newValue)}
          >
            <SelectTrigger className="h-4 text-xs border-none bg-transparent text-gray-300 p-0 min-h-0">
              <SelectValue placeholder="Select country">
                {value || 'Select'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 max-h-48 overflow-y-auto">
              <SelectItem value="US" className="text-white hover:text-gray-200">🇺🇸 United States</SelectItem>
              <SelectItem value="CA" className="text-white hover:text-gray-200">🇨🇦 Canada</SelectItem>
              <SelectItem value="GB" className="text-white hover:text-gray-200">🇬🇧 United Kingdom</SelectItem>
              <SelectItem value="DE" className="text-white hover:text-gray-200">🇩🇪 Germany</SelectItem>
              <SelectItem value="FR" className="text-white hover:text-gray-200">🇫🇷 France</SelectItem>
              <SelectItem value="JP" className="text-white hover:text-gray-200">🇯🇵 Japan</SelectItem>
            </SelectContent>
          </Select>
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
            className={`h-4 text-xs cursor-text hover:bg-gray-50 flex items-center px-1 rounded transition-colors ${
              column.id === 'item' 
                ? 'text-gray-900 font-medium flex items-center gap-1.5' 
                : 'text-gray-700'
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
            {value || <span className="text-gray-400">{column.id === 'item' ? 'Untitled Project' : 'Click to add...'}</span>}
          </div>
        );
    }
  };

  // Legacy sub-item cell update handler (kept for compatibility)
  const handleSubItemCellUpdate = useCallback(async (subItemId: number, field: string, value: any) => {
    return handleUpdateSubItem(subItemId, { [field]: value });
  }, [handleUpdateSubItem]);

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
    // First expand the sub-items view for this project
    setExpandedSubItems(prev => {
      const newSet = new Set(prev);
      newSet.add(projectId);
      return newSet;
    });

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
    // First expand the sub-items view for this project
    setExpandedSubItems(prev => {
      const newSet = new Set(prev);
      newSet.add(projectId);
      return newSet;
    });

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
    // First expand the sub-items view and the specific folder
    setExpandedSubItems(prev => {
      const newSet = new Set(prev);
      newSet.add(projectId);
      return newSet;
    });
    
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.add(folderId);
      return newSet;
    });

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
    // Map sub-item data to column values based on column type
    let value = '';
    
    // For sub-item specific columns, map to sub-item properties
    if (column.id.startsWith('subitem_')) {
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
          value = subItem.priority?.toString() || '3';
          break;
        case 'subitem_dueDate':
          value = subItem.dueDate || '';
          break;
        default:
          value = '';
      }
    } else {
      // For regular columns added to sub-items, use default values or sub-item properties
      switch (column.type) {
        case 'checkbox':
          value = 'false';
          break;
        case 'progress':
          value = '0';
          break;
        case 'email':
        case 'phone':
        case 'location':
        case 'link':
        case 'custom_url':
          value = '';
          break;
        default:
          value = '';
      }
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
          <Select
            value={value}
            onValueChange={(newValue) => {
              if (newValue === "__add_person__") {
                setIsAddPersonModalOpen(true);
              } else {
                handleSubItemCellUpdate(subItem.id, column.id, newValue);
              }
            }}
          >
            <SelectTrigger className="h-4 text-xs border-none bg-transparent text-blue-300 p-0 min-h-0">
              <SelectValue placeholder="Assign">
                {value && value !== 'unassigned' ? getMemberDisplayName(value) : 'Assign'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="unassigned" className="text-white hover:text-gray-200">Unassigned</SelectItem>
              {teamMembers.map((member: any) => (
                <SelectItem key={member.id} value={member.id.toString()} className="text-white hover:text-gray-200">
                  {member.firstName} {member.lastName}
                </SelectItem>
              ))}
              <div className="border-t border-gray-700 my-1"></div>
              <SelectItem value="__add_person__" className="text-blue-400 hover:text-blue-300">
                <UserPlus className="w-3 h-3 mr-2 inline" />
                Add Person...
              </SelectItem>
            </SelectContent>
          </Select>
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

      // All new column types for sub-items (same as main items)
      case 'checkbox':
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={value === 'true' || (value as any) === true}
              onChange={(e) => handleSubItemCellUpdate(subItem.id, column.id, e.target.checked.toString())}
              className="w-3 h-3 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-1"
            />
          </div>
        );

      case 'auto_number':
        const autoNumber = 5000 + subItem.id;
        return (
          <div className="text-xs text-gray-400 font-mono">
            #{autoNumber.toString().padStart(4, '0')}
          </div>
        );

      case 'progress':
        const progressValue = parseInt(value) || 0;
        return (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-6">{progressValue}%</span>
          </div>
        );

      case 'email':
        // Parse display value for showing in cell
        const subEmailDisplayValue = (() => {
          if (!value) return '';
          
          // Check if value contains display text and email
          const match = value.match(/^(.+?)\s*<(.+)>$/);
          if (match) {
            return match[1].trim(); // Show display text
          }
          return value; // Show email address
        })();

        // Extract email address for mailto link
        const subEmailAddress = (() => {
          if (!value) return '';
          
          const match = value.match(/^(.+?)\s*<(.+)>$/);
          if (match) {
            return match[2].trim(); // Extract email from format
          }
          return value; // Use as email address
        })();

        return (
          <div 
            className="flex items-center gap-1 cursor-pointer hover:bg-gray-700/50 px-1 py-0.5 rounded group"
            onClick={() => openEmailModal(subItem.id, column.id, value || '', true)}
          >
            <Mail className="w-2.5 h-2.5 text-blue-400" />
            {subEmailAddress && validateEmail(subEmailAddress) ? (
              <a
                href={`mailto:${subEmailAddress}`}
                className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex-1 truncate"
                onClick={(e) => e.stopPropagation()} // Prevent modal from opening when clicking link
              >
                {subEmailDisplayValue || subEmailAddress}
              </a>
            ) : (
              <span className="text-xs text-gray-500 flex-1">
                {subEmailDisplayValue || 'Click to add email'}
              </span>
            )}
          </div>
        );

      case 'phone':
        return (
          <div className="flex items-center gap-1">
            <Phone className="w-2.5 h-2.5 text-green-400" />
            <Input
              type="tel"
              value={value}
              onChange={(e) => handleSubItemCellUpdate(subItem.id, column.id, e.target.value)}
              className="h-4 text-xs border-none bg-transparent text-gray-300 flex-1"
              placeholder="(555) 123-4567"
            />
          </div>
        );

      case 'vote':
        const voteCount = parseInt(value) || 0;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSubItemCellUpdate(subItem.id, column.id, voteCount + 1)}
              className="flex items-center gap-1 hover:bg-gray-700 px-1 py-0.5 rounded text-xs"
            >
              <ThumbsUp className="w-2.5 h-2.5 text-green-400" />
              <span className="text-gray-300">{voteCount}</span>
            </button>
          </div>
        );

      case 'time_tracking':
        const timeValue = value || '0:00';
        return (
          <div className="flex items-center gap-1">
            <Timer className="w-2.5 h-2.5 text-blue-400" />
            <span className="text-xs text-gray-300">{timeValue}</span>
          </div>
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
      <div className="h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Authentication Required</div>
          <div className="text-sm text-gray-600 mb-4">Please log in to access the project board</div>
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

  if (isLoading && (!projects || (Array.isArray(projects) && projects.length === 0))) {
    return (
      <div className="h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading Monday.com-style board...</div>
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4 text-red-600">Error loading board</div>
          <div className="text-sm text-gray-600">Check console for details</div>
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
    <div className="h-screen bg-white text-gray-900 flex overflow-hidden">
      {/* Main Board Container */}
      <div className={`flex flex-col transition-all duration-300 ${selectedProjectForUpdates ? 'flex-1' : 'w-full'}`}>
        {/* Enhanced Header */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-sm px-3 py-2 h-8 rounded-md"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm" />
            </div>
            <h1 className="text-lg font-medium">Project Board</h1>
            <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm font-medium border border-blue-200">
              Project Board
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
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xs px-1.5 py-1 h-6 rounded-md"
              >
                <Undo2 className="w-3 h-3" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xs px-1.5 py-1 h-6 rounded-md"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-gray-200 text-gray-900 shadow-lg">
                <DropdownMenuItem 
                  onClick={() => addItemMutation.mutate('New Leads')}
                  className="text-xs hover:bg-gray-50 focus:bg-gray-50"
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Add Item
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsAddGroupOpen(true)}
                  className="text-xs hover:bg-gray-50 focus:bg-gray-50"
                >
                  <Folder className="w-3 h-3 mr-2" />
                  Add Group
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsAddColumnOpen(true)}
                  className="text-xs hover:bg-gray-50 focus:bg-gray-50"
                >
                  <Columns className="w-3 h-3 mr-2" />
                  Add Column
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsAddPersonModalOpen(true)}
                  className="text-xs hover:bg-gray-50 focus:bg-gray-50"
                >
                  <UserPlus className="w-3 h-3 mr-2" />
                  Add Person to Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Column Dialog */}
            <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
              <DialogContent className="bg-white text-gray-900 border-gray-200">
                <DialogHeader>
                  <DialogTitle>Add Column</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-700">Name</Label>
                    <Input
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      className="bg-white border-gray-300 text-gray-900 h-8 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Column name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-700">Type</Label>
                    <Select value={newColumnType} onValueChange={(value) => setNewColumnType(value as BoardColumn['type'])}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-8 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 shadow-lg max-h-96 overflow-y-auto">
                        {/* Basic Types */}
                        <SelectItem value="text">📝 Text</SelectItem>
                        <SelectItem value="status">🚦 Status</SelectItem>
                        <SelectItem value="people">👤 People</SelectItem>
                        <SelectItem value="date">📅 Date</SelectItem>
                        <SelectItem value="number">🔢 Number</SelectItem>
                        <SelectItem value="tags">🏷️ Tags</SelectItem>
                        
                        {/* General Tracking */}
                        <SelectItem value="checkbox">✅ Checkbox</SelectItem>
                        <SelectItem value="auto_number">🔢 Auto Number</SelectItem>
                        <SelectItem value="item_id">🆔 Item ID</SelectItem>
                        <SelectItem value="timeline">🕒 Timeline</SelectItem>
                        <SelectItem value="progress">📊 Progress Tracking</SelectItem>
                        <SelectItem value="formula">🧮 Formula</SelectItem>
                        <SelectItem value="week">📅 Week</SelectItem>
                        <SelectItem value="world_clock">🌍 World Clock</SelectItem>
                        
                        {/* Communication + Team */}
                        <SelectItem value="email">📧 Email</SelectItem>
                        <SelectItem value="phone">📞 Phone</SelectItem>
                        <SelectItem value="location">📍 Location</SelectItem>
                        <SelectItem value="link">🔗 Link</SelectItem>
                        <SelectItem value="custom_url">🌐 Custom URL</SelectItem>
                        <SelectItem value="team">👥 Team</SelectItem>
                        <SelectItem value="vote">🗳️ Vote</SelectItem>
                        <SelectItem value="color_picker">🎨 Color Picker</SelectItem>
                        
                        {/* Workflow + System */}
                        <SelectItem value="files">🗂️ Files</SelectItem>
                        <SelectItem value="creation_log">📝 Creation Log</SelectItem>
                        <SelectItem value="last_updated">🔄 Last Updated</SelectItem>
                        <SelectItem value="time_tracking">⏱️ Time Tracking</SelectItem>
                        <SelectItem value="api_action">🔌 API Action</SelectItem>
                        <SelectItem value="country">🌐 Country</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={addColumn} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-8 rounded-md">
                      Add
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddColumnOpen(false)}
                      size="sm"
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 h-8 rounded-md"
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
      <div className="flex-1 overflow-auto bg-white">
        <div className="min-w-max">
          {/* Enhanced Column Headers */}
          <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
            <div className="flex">
              {/* Selection checkbox header */}
              <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center sticky left-0 bg-white z-30">
                <input
                  type="checkbox"
                  checked={selectedItems.size > 0 && selectedItems.size === boardItems.length}
                  onChange={selectedItems.size === boardItems.length ? handleSelectNone : handleSelectAll}
                  className="w-4 h-4 rounded border-gray-400 bg-white text-blue-500 focus:ring-blue-500 focus:ring-1"
                />
              </div>
              {columns.map((column, index) => (
                <div 
                  key={column.id} 
                  className={`px-3 py-3 border-r border-gray-200 relative group flex-shrink-0 bg-white ${
                    index === 0 ? 'sticky left-12 z-20' : 'z-10'
                  }`}
                  style={{ 
                    width: getColumnWidth(column.id, index),
                    minWidth: index === 0 ? '80px' : '90px',
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
            <div key={group.name} className="border-b border-gray-200 last:border-b-0">
              {/* Enhanced Group Header with proper column structure */}
              <div className={`flex border-b border-gray-200 hover:bg-gray-50 transition-all ${
                group.name === 'New Leads' ? 'bg-cyan-50' :
                group.name === 'Need Attention' ? 'bg-yellow-50' :
                group.name === 'Sent Estimate' ? 'bg-purple-50' :
                group.name === 'Signed' ? 'bg-emerald-50' :
                group.name === 'In Progress' ? 'bg-blue-50' :
                group.name === 'Complete' ? 'bg-green-50' :
                'bg-gray-50'
              }`}>
                {/* Group Selection Checkbox */}
                <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center sticky left-0 bg-white z-30">
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
                    className="w-4 h-4 rounded border-gray-400 bg-white text-blue-500 focus:ring-blue-500 focus:ring-1"
                  />
                </div>
                
                {/* Group Info in Main Item Column */}
                <div 
                  className="px-4 py-3 border-r border-gray-200 flex-shrink-0 flex items-center space-x-2 cursor-pointer sticky left-12 bg-white z-20"
                  style={{ 
                    width: columnWidths['item'] || 120,
                    minWidth: '80px',
                    maxWidth: 'none'
                  }}
                  onClick={() => toggleGroup(group.name)}
                >
                  {group.collapsed ? (
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  )}
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    group.name === 'New Leads' ? 'bg-cyan-500' :
                    group.name === 'Need Attention' ? 'bg-yellow-500' :
                    group.name === 'Sent Estimate' ? 'bg-purple-500' :
                    group.name === 'Signed' ? 'bg-emerald-500' :
                    group.name === 'In Progress' ? 'bg-blue-500' :
                    group.name === 'Complete' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    group.name === 'New Leads' ? 'text-cyan-700' :
                    group.name === 'Need Attention' ? 'text-yellow-700' :
                    group.name === 'Sent Estimate' ? 'text-purple-700' :
                    group.name === 'Signed' ? 'text-emerald-700' :
                    group.name === 'In Progress' ? 'text-blue-700' :
                    group.name === 'Complete' ? 'text-green-700' :
                    'text-gray-700'
                  }`}>{group.name}</span>
                  <span className="text-sm text-gray-500 font-medium">({group.items.length})</span>
                </div>
                
                {/* Main column headers on group header row */}
                {columns.slice(1).map((column) => (
                  <div 
                    key={`group-${group.name}-${column.id}`}
                    className={`px-2 py-1.5 border-r flex-shrink-0 bg-white z-5 ${
                      group.name === 'New Leads' ? 'border-cyan-200' :
                      group.name === 'Need Attention' ? 'border-yellow-200' :
                      group.name === 'Sent Estimate' ? 'border-purple-200' :
                      group.name === 'Signed' ? 'border-emerald-200' :
                      group.name === 'In Progress' ? 'border-blue-200' :
                      group.name === 'Complete' ? 'border-green-200' :
                      'border-gray-200'
                    }`}
                    style={{ 
                      width: getColumnWidth(column.id, columns.indexOf(column)),
                      minWidth: '90px',
                      maxWidth: 'none'
                    }}
                  >
                    {/* Main column header */}
                    <div className="flex items-center justify-center w-full">
                      <span className={`text-sm font-medium uppercase tracking-wide text-center ${
                        group.name === 'New Leads' ? 'text-cyan-600' :
                        group.name === 'Need Attention' ? 'text-yellow-600' :
                        group.name === 'Sent Estimate' ? 'text-purple-600' :
                        group.name === 'Signed' ? 'text-emerald-600' :
                        group.name === 'In Progress' ? 'text-blue-600' :
                        group.name === 'Complete' ? 'text-green-600' :
                        'text-gray-600'
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
                          group.name === 'New Leads' ? 'text-cyan-500/80' :
                          group.name === 'Need Attention' ? 'text-yellow-500/80' :
                          group.name === 'Sent Estimate' ? 'text-purple-500/80' :
                          group.name === 'Signed' ? 'text-emerald-500/80' :
                          group.name === 'In Progress' ? 'text-blue-500/80' :
                          group.name === 'Complete' ? 'text-green-500/80' :
                          'text-gray-500/80'
                        }`} />}
                        {column.type === 'date' && <Calendar className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-500/80' :
                          group.name === 'Need Attention' ? 'text-yellow-500/80' :
                          group.name === 'Sent Estimate' ? 'text-purple-500/80' :
                          group.name === 'Signed' ? 'text-emerald-500/80' :
                          group.name === 'In Progress' ? 'text-blue-500/80' :
                          group.name === 'Complete' ? 'text-green-500/80' :
                          'text-gray-500/80'
                        }`} />}
                        {column.type === 'people' && <Users className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-500/80' :
                          group.name === 'Need Attention' ? 'text-yellow-500/80' :
                          group.name === 'Sent Estimate' ? 'text-purple-500/80' :
                          group.name === 'Signed' ? 'text-emerald-500/80' :
                          group.name === 'In Progress' ? 'text-blue-500/80' :
                          group.name === 'Complete' ? 'text-green-500/80' :
                          'text-gray-500/80'
                        }`} />}
                        {column.type === 'number' && <Hash className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-500/80' :
                          group.name === 'Need Attention' ? 'text-yellow-500/80' :
                          group.name === 'Sent Estimate' ? 'text-purple-500/80' :
                          group.name === 'Signed' ? 'text-emerald-500/80' :
                          group.name === 'In Progress' ? 'text-blue-500/80' :
                          group.name === 'Complete' ? 'text-green-500/80' :
                          'text-gray-500/80'
                        }`} />}
                        {column.type === 'tags' && <Tag className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-500/80' :
                          group.name === 'Need Attention' ? 'text-yellow-500/80' :
                          group.name === 'Sent Estimate' ? 'text-purple-500/80' :
                          group.name === 'Signed' ? 'text-emerald-500/80' :
                          group.name === 'In Progress' ? 'text-blue-500/80' :
                          group.name === 'Complete' ? 'text-green-500/80' :
                          'text-gray-500/80'
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
                    <div key={item.id}>
                      {/* Main Item Row - Clickable for Updates */}
                      <div 
                        className="flex hover:bg-gray-50 transition-all border-b border-gray-200 last:border-b-0 bg-white cursor-pointer"
                        onClick={(e) => {
                          // Only trigger if not clicking on a form element or checkbox
                          const target = e.target as HTMLElement;
                          if (!target.closest('input, select, button')) {
                            handleToggleUpdates(item.id);
                          }
                        }}
                      >
                        {/* Selection checkbox - standardized width */}
                        <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center sticky left-0 bg-white z-20">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(item.id);
                            }}
                            className="w-4 h-4 rounded border-gray-400 bg-white text-blue-500 focus:ring-blue-500 focus:ring-1"
                          />
                        </div>
                        {columns.map((column, index) => (
                          <div 
                            key={`${item.id}-${column.id}`} 
                            className={`px-4 py-3 border-r border-gray-200 flex-shrink-0 flex items-center bg-white ${
                              index === 0 ? 'sticky left-12 z-20 justify-start' : 'z-5 justify-center'
                            }`}
                            style={{ 
                              width: getColumnWidth(column.id, index),
                              minWidth: index === 0 ? '80px' : '90px',
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
                                    <div key={folder.id}>
                                      {/* Folder Header with Column Headers */}
                                      <div className="group flex hover:bg-gray-50 transition-all bg-white border-b-2 border-blue-200 shadow-sm">
                                        {/* Empty space where checkbox used to be */}
                                        <div className="w-12 px-2 py-2 border-r border-blue-200 flex items-center justify-center sticky left-0 bg-white z-30">
                                        </div>
                                        
                                        {/* Folder name with expand/collapse */}
                                        <div 
                                          className="px-4 py-3 border-r border-blue-200 flex-shrink-0 sticky left-12 bg-white z-20 flex items-center"
                                          style={{ 
                                            width: columnWidths['item'] || 120,
                                            minWidth: '80px',
                                            maxWidth: 'none'
                                          }}
                                        >
                                          <div className="flex items-center gap-2 text-sm w-full">
                                            {/* Delete folder button - moved to left */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSubItemFolder(folder.id);
                                              }}
                                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700 transition-all flex-shrink-0"
                                              title="Delete folder"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            
                                            <div className="w-4 h-px bg-blue-300"></div>
                                            
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedFolders(prev => 
                                                  prev.has(folder.id) 
                                                    ? new Set(Array.from(prev).filter(id => id !== folder.id))
                                                    : new Set([...Array.from(prev), folder.id])
                                                );
                                              }}
                                              className="p-0.5 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                                            >
                                              <ChevronRight className={`w-3.5 h-3.5 text-blue-600 transition-transform ${
                                                expandedFolders.has(folder.id) ? 'rotate-90' : ''
                                              }`} />
                                            </button>
                                            
                                            {/* Count number - moved to left of folder icon */}
                                            <span className="text-blue-600 text-xs font-medium whitespace-nowrap flex-shrink-0 bg-blue-50 px-1.5 rounded">
                                              ({folderSubItems.length})
                                            </span>
                                            
                                            <Folder className="w-4 h-4 text-blue-600 drop-shadow-sm flex-shrink-0" />
                                            
                                            <div className="flex items-center gap-0.5 min-w-0 flex-1">
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
                                                  className="bg-blue-50 text-blue-900 text-sm font-semibold px-2 py-1 border border-blue-300 rounded focus:outline-none focus:border-blue-400 focus:bg-blue-100 flex-1 min-w-0"
                                                  autoFocus
                                                />
                                              ) : (
                                                <span 
                                                  className="text-blue-900 text-sm font-semibold cursor-pointer hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100 transition-colors truncate"
                                                  onClick={() => setEditingFolder(folder.id)}
                                                  title={currentFolderName}
                                                >
                                                  {currentFolderName}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Column headers using exact same columns as main board for perfect alignment */}
                                        {columns.slice(1).map((column, index) => {
                                          // Use main board columns for perfect alignment
                                          const columnWidth = getColumnWidth(column.id, index + 1); // +1 because we slice(1)
                                          
                                          return (
                                          <div 
                                            key={`folder-header-${folder.id}-${column.id}`}
                                            className="px-3 py-3 border-r border-gray-200 flex-shrink-0 flex items-center gap-2 relative group bg-white z-5"
                                            style={{ 
                                              width: columnWidth,
                                              minWidth: index === 0 ? '80px' : '90px',
                                              maxWidth: 'none'
                                            }}
                                          >
                                            <div className="text-gray-400">{getColumnIcon(column.type)}</div>
                                            <span className="font-medium text-xs text-gray-500">{column.name}</span>
                                            
                                            {/* Column Resizer - matches main board */}
                                            {index < columns.slice(1).length - 1 && (
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
                                          );
                                        })}
                                        
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
                                          {/* Folder content container - no indentation for perfect alignment */}
                                          <div className="relative">
                                            
                                            {folderSubItems.map((subItem, index) => (
                                              <div key={`sub-${subItem.id}`} className="group flex hover:bg-blue-50/50 transition-all bg-blue-50/20 border-b border-blue-200/60 relative">
                                                {/* Sub-item checkbox - visually distinct */}
                                                <div className="w-12 px-2 py-3 border-r border-blue-200 flex items-center justify-center sticky left-0 bg-blue-50/30 z-30">
                                                  <input 
                                                    type="checkbox" 
                                                    className="w-3.5 h-3.5 rounded border-blue-400 bg-white text-blue-600 focus:ring-blue-500 focus:ring-1"
                                                    />
                                                </div>
                                                
                                                {/* Sub-item name - visually distinct as nested item */}
                                                <div 
                                                  className="px-4 py-3 border-r border-blue-200 flex-shrink-0 sticky left-12 bg-blue-50/30 z-20 flex items-center"
                                                  style={{ 
                                                    width: (columnWidths['item'] || 120),
                                                    minWidth: '80px',
                                                    maxWidth: 'none'
                                                  }}
                                                >
                                                  <div className="flex items-center gap-3 text-sm w-full">
                                                    {/* Enhanced hierarchy indicator */}
                                                    <div className="flex items-center gap-1.5">
                                                      <div className="w-4 h-px bg-blue-400/60"></div>
                                                      <div className="w-2 h-2 rounded-full bg-blue-600 border border-blue-400 flex-shrink-0"></div>
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
                                                        className="bg-white text-gray-900 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-400 flex-1"
                                                        autoFocus
                                                      />
                                                    ) : (
                                                      <span 
                                                        className="cursor-pointer hover:text-blue-700 text-blue-800 text-sm font-medium flex-1"
                                                        onClick={() => {
                                                          setEditingSubItem(subItem.id);
                                                          setSubItemNames(prev => ({...prev, [subItem.id]: subItem.name}));
                                                        }}
                                                      >
                                                        {subItem.name}
                                                      </span>
                                                    )}
                                                    
                                                    {/* Delete sub-item button */}
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteSubItem(subItem.id);
                                                      }}
                                                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700 transition-all"
                                                      title="Delete sub-item"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                </div>
                                                
                                                {/* Sub-item cells using exact same columns as main board */}
                                                {columns.slice(1).map((column, index) => {
                                                  // Use main board columns for perfect alignment
                                                  const columnWidth = getColumnWidth(column.id, index + 1); // +1 because we slice(1)
                                                  
                                                  return (
                                                  <div 
                                                    key={`sub-${subItem.id}-${column.id}`}
                                                    className={`px-4 py-3 border-r border-blue-200 flex-shrink-0 flex items-center justify-center bg-blue-50/30 z-5`}
                                                    style={{ 
                                                      width: columnWidth,
                                                      minWidth: index === 0 ? '80px' : '90px',
                                                      maxWidth: 'none'
                                                    }}
                                                  >
                                                    {/* Render editable sub-item data based on column types */}
                                                    <div className="text-xs text-blue-800 text-center w-full font-medium">
                                                      {column.type === 'status' && (
                                                        <select
                                                          value={subItem.status || 'not_started'}
                                                          onChange={(e) => handleUpdateSubItem(subItem.id, { status: e.target.value })}
                                                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 bg-transparent cursor-pointer hover:bg-blue-500/20 transition-colors ${
                                                            subItem.status === 'not_started' ? 'bg-gray-600/30 text-gray-300' :
                                                            subItem.status === 'in_progress' ? 'bg-blue-600/30 text-blue-300' :
                                                            subItem.status === 'completed' ? 'bg-green-600/30 text-green-300' :
                                                            'bg-gray-600/30 text-gray-300'
                                                          }`}
                                                        >
                                                          <option value="not_started">Not Started</option>
                                                          <option value="in_progress">In Progress</option>
                                                          <option value="completed">Completed</option>
                                                        </select>
                                                      )}
                                                      {column.type === 'people' && (
                                                        <Select
                                                          value={subItem.assignedTo || 'unassigned'}
                                                          onValueChange={(newValue) => {
                                                            if (newValue === "__add_person__") {
                                                              setIsAddPersonModalOpen(true);
                                                            } else {
                                                              handleUpdateSubItem(subItem.id, { assignedTo: newValue === 'unassigned' ? '' : newValue });
                                                            }
                                                          }}
                                                        >
                                                          <SelectTrigger className="h-6 text-xs border-none bg-transparent text-blue-300 hover:bg-blue-500/10 transition-colors p-0 min-h-0">
                                                            <SelectValue placeholder="Assign" />
                                                          </SelectTrigger>
                                                          <SelectContent className="bg-gray-800 border-gray-700">
                                                            <SelectItem value="unassigned" className="text-white hover:text-gray-200">Unassigned</SelectItem>
                                                            {teamMembers.map((member: any) => (
                                                              <SelectItem key={member.id} value={member.id.toString()} className="text-white hover:text-gray-200">
                                                                {member.firstName} {member.lastName}
                                                              </SelectItem>
                                                            ))}
                                                            <div className="border-t border-gray-700 my-1"></div>
                                                            <SelectItem value="__add_person__" className="text-blue-400 hover:text-blue-300">
                                                              <UserPlus className="w-3 h-3 mr-2 inline" />
                                                              Add Person...
                                                            </SelectItem>
                                                          </SelectContent>
                                                        </Select>
                                                      )}
                                                      {column.type === 'text' && (
                                                        <input
                                                          type="text"
                                                          value={(subItem as any).notes || ''}
                                                          onChange={(e) => handleUpdateSubItem(subItem.id, { notes: e.target.value })}
                                                          placeholder="Add notes..."
                                                          className="w-full bg-transparent text-gray-300 text-center border-0 outline-none hover:bg-blue-500/10 focus:bg-blue-500/20 transition-colors px-1 py-1 rounded"
                                                        />
                                                      )}
                                                      {column.type === 'date' && (
                                                        <input
                                                          type="date"
                                                          value={(subItem as any).dueDate || ''}
                                                          onChange={(e) => handleUpdateSubItem(subItem.id, { dueDate: e.target.value })}
                                                          className="w-full bg-transparent text-gray-400 text-center border-0 outline-none hover:bg-blue-500/10 focus:bg-blue-500/20 transition-colors px-1 py-1 rounded text-xs"
                                                        />
                                                      )}
                                                      {column.type === 'number' && (
                                                        <input
                                                          type="number"
                                                          value={(subItem as any).priority || ''}
                                                          onChange={(e) => handleUpdateSubItem(subItem.id, { priority: parseInt(e.target.value) || 0 })}
                                                          placeholder="Priority"
                                                          className="w-full bg-transparent text-blue-700 text-center border-0 outline-none hover:bg-blue-500/10 focus:bg-blue-500/20 transition-colors px-1 py-1 rounded font-medium"
                                                        />
                                                      )}
                                                      {column.type === 'tags' && (
                                                        <input
                                                          type="text"
                                                          value={(() => {
                                                            try {
                                                              const tags = (subItem as any).tags;
                                                              if (Array.isArray(tags)) return tags.join(', ');
                                                              if (typeof tags === 'string') return JSON.parse(tags).join(', ');
                                                              return '';
                                                            } catch {
                                                              return '';
                                                            }
                                                          })()}
                                                          onChange={(e) => {
                                                            const tagArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                                                            handleUpdateSubItem(subItem.id, { tags: tagArray });
                                                          }}
                                                          placeholder="Add tags..."
                                                          className="w-full bg-transparent text-blue-700 text-center border-0 outline-none hover:bg-blue-500/10 focus:bg-blue-500/20 transition-colors px-1 py-1 rounded font-medium text-xs"
                                                        />
                                                      )}
                                                      {column.type === 'subitems' && (
                                                        <div className="text-center text-blue-600 font-medium text-xs">
                                                          Sub Item
                                                        </div>
                                                      )}
                                                      {/* Add support for all new column types for grid alignment */}
                                                      {!['status', 'people', 'text', 'date', 'number', 'tags', 'subitems'].includes(column.type) && (
                                                        <div className="text-center text-blue-600/70 font-medium text-xs">
                                                          -
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                  );
                                                })}
                                              </div>
                                            ))}
                                            

                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}

                              {/* Consolidated Action Buttons Section */}
                              <div className="flex hover:bg-blue-500/5 transition-all border-b border-blue-500/10 bg-blue-50/20">
                                {/* Empty checkbox space */}
                                <div className="w-12 px-2 py-2 border-r border-blue-500/20 sticky left-0 bg-blue-50/20 z-20"></div>
                                <div 
                                  className="px-4 py-2 flex-shrink-0 sticky left-12 bg-blue-50/20 z-10 flex items-center gap-2"
                                  style={{ 
                                    width: columnWidths['item'] || 120,
                                    minWidth: '160px',
                                    maxWidth: 'none'
                                  }}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddSubItem(item.id)}
                                    className="text-blue-700 hover:text-blue-800 hover:bg-blue-100 text-sm h-8 px-3 flex items-center gap-2 border border-blue-400 hover:border-blue-500 rounded-md transition-all font-medium"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add Sub Item
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddSubItemFolder(item.id)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm h-8 px-3 flex items-center gap-2 font-medium border border-blue-300 hover:border-blue-400 rounded-md transition-all"
                                  >
                                    <Folder className="w-4 h-4" />
                                    Add Folder
                                  </Button>
                                </div>
                                
                                {/* Column spaces using exact same columns as main board */}
                                {columns.slice(1).map((column, index) => (
                                  <div 
                                    key={`actions-${item.id}-${column.id}`}
                                    className="px-4 py-3 border-r border-gray-200 flex-shrink-0 bg-blue-50/20"
                                    style={{ 
                                      width: getColumnWidth(column.id, index + 1), // +1 because we slice(1)
                                      minWidth: index === 0 ? '80px' : '90px',
                                      maxWidth: 'none'
                                    }}
                                  />
                                ))}
                              </div>
                          </>
                        ) : (
                            <>
                            {/* Fallback: render sub-items without folders if no folders exist */}
                            {item.subItems?.map((subItem) => (
                              <div key={`sub-${subItem.id}`} className="flex hover:bg-gray-50 transition-all bg-white border-b border-gray-200">
                                {/* Empty checkbox space for sub-items */}
                                <div className="w-8 px-1 py-0.5 border-r border-gray-200 flex items-center justify-center sticky left-0 bg-white z-20">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                </div>
                                
                                {/* Sub-item name (first column) */}
                                <div 
                                  className="px-2 py-0.5 border-r border-gray-200 flex-shrink-0 sticky left-8 bg-white z-10 flex items-center"
                                  style={{ 
                                    width: columnWidths['item'] || 200,
                                    minWidth: '150px',
                                    maxWidth: 'none'
                                  }}
                                >
                                  <div className="flex items-center gap-1 text-xs text-gray-700">
                                    <div className="w-3 h-px bg-gray-400 mr-1"></div>
                                    <span>{subItem.name}</span>
                                  </div>
                                </div>
                                
                                {/* Sub-item dedicated columns */}
                                {subItemColumns.map((column) => (
                                  <div 
                                    key={`sub-${subItem.id}-${column.id}`}
                                    className="px-2 py-0.5 border-r border-gray-200 flex-shrink-0"
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
                            ))}
                            
                            {/* Action Buttons for non-folder Sub Items */}
                            <div className="flex hover:bg-blue-500/5 transition-all border-b border-blue-500/10 bg-blue-50/20">
                              {/* Empty checkbox space */}
                              <div className="w-8 px-1 py-0.5 border-r border-blue-500/20 sticky left-0 bg-blue-50/20 z-20"></div>
                              <div 
                                className="px-2 py-0.5 flex-shrink-0 sticky left-8 bg-blue-50/20 z-10 flex items-center gap-2"
                                style={{ 
                                  width: columnWidths['item'] || 200,
                                  minWidth: '160px',
                                  maxWidth: 'none'
                                }}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddSubItem(item.id)}
                                  className="text-blue-700 hover:text-blue-800 hover:bg-blue-100 text-sm h-8 px-3 flex items-center gap-2 border border-blue-400 hover:border-blue-500 rounded-md transition-all font-medium"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Sub Item
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddSubItemFolder(item.id)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm h-8 px-3 flex items-center gap-2 font-medium border border-blue-300 hover:border-blue-400 rounded-md transition-all"
                                >
                                  <Folder className="w-4 h-4" />
                                  Add Folder
                                </Button>
                              </div>
                              
                              {/* Column spaces using exact same columns as main board */}
                              {subItemColumns.map((column, index) => (
                                <div 
                                  key={`actions-nf-${item.id}-${column.id}`}
                                  className="px-2 py-0.5 border-r border-gray-200 flex-shrink-0 bg-blue-50/20"
                                  style={{ 
                                    width: columnWidths[column.id] || 120,
                                    minWidth: '80px',
                                    maxWidth: 'none'
                                  }}
                                />
                              ))}
                            </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  
                  {/* Add Item Button at bottom of group */}
                  <div className="flex hover:bg-gray-50 transition-all">
                    {/* Empty checkbox space */}
                    <div className="w-8 px-1 py-0.5 border-r border-gray-200 sticky left-0 bg-white z-20"></div>
                    <div 
                      className="px-2 py-0.5 flex-shrink-0 sticky left-8 bg-white z-10"
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
                        className="text-gray-600 hover:text-blue-600 text-sm h-7 w-full justify-start px-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add item
                      </Button>
                    </div>
                    {columns.slice(1).map((column) => (
                      <div 
                        key={column.id} 
                        className="px-2 py-1.5 border-r border-gray-200 flex-shrink-0"
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
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-1.5 flex items-center justify-between text-xs text-gray-600 flex-shrink-0">
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
                  className="text-xs h-7 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => bulkTrashMutation.mutate(Array.from(selectedItems))}
                  disabled={bulkTrashMutation.isPending}
                  className="text-xs h-7 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Side Panel Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Project Updates</h3>
              <p className="text-xs text-gray-600">{selectedMainItem.values.item || `Project #${selectedMainItem.id}`}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSidePanelOpen(false);
                setSelectedMainItem(null);
              }}
              className="text-gray-600 hover:text-gray-900 p-1"
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
                      <div className="text-xs text-gray-600 mb-1">
                        <span className="text-gray-900 font-medium">{user?.username || 'User'}</span> · {new Date(update.createdAt).toLocaleDateString()}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-800">{update.content}</p>
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
                <div className="text-center py-8 text-gray-600 text-sm">
                  No updates yet. Be the first to add an update for this project.
                </div>
              )}
            </div>

            {/* Add Update Form */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={updateContent}
                    onChange={(e) => setUpdateContent(e.target.value)}
                    placeholder="Add an update or comment..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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

      {/* Add Person to Project Modal */}
      <Dialog open={isAddPersonModalOpen} onOpenChange={setIsAddPersonModalOpen}>
        <DialogContent className="bg-white text-gray-900 border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add Person to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-gray-700 font-medium">First Name *</Label>
                <Input
                  value={newPersonForm.firstName}
                  onChange={(e) => setNewPersonForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="bg-white border-gray-300 text-gray-900 h-9 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="First name"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700 font-medium">Last Name *</Label>
                <Input
                  value={newPersonForm.lastName}
                  onChange={(e) => setNewPersonForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="bg-white border-gray-300 text-gray-900 h-9 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-gray-700 font-medium">Email *</Label>
              <Input
                type="email"
                value={newPersonForm.email}
                onChange={(e) => setNewPersonForm(prev => ({ ...prev, email: e.target.value }))}
                className="bg-white border-gray-300 text-gray-900 h-9 focus:border-blue-500 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>
            
            <div>
              <Label className="text-sm text-gray-700 font-medium">Phone</Label>
              <Input
                type="tel"
                value={newPersonForm.phone}
                onChange={(e) => setNewPersonForm(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-white border-gray-300 text-gray-900 h-9 focus:border-blue-500 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div>
              <Label className="text-sm text-gray-700 font-medium">Role</Label>
              <Select value={newPersonForm.role} onValueChange={(value) => setNewPersonForm(prev => ({ ...prev, role: value }))}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-9 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  <SelectItem value="member">Team Member</SelectItem>
                  <SelectItem value="lead">Project Lead</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="observer">Observer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm text-gray-700 font-medium">Notes</Label>
              <Input
                value={newPersonForm.notes}
                onChange={(e) => setNewPersonForm(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-white border-gray-300 text-gray-900 h-9 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Additional notes (optional)"
              />
            </div>
            
            <div className="flex space-x-3 pt-2">
              <Button 
                onClick={handleAddPerson} 
                disabled={addPersonMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9 rounded-md"
              >
                {addPersonMutation.isPending ? 'Adding...' : 'Add Person'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddPersonModalOpen(false)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 h-9 rounded-md"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Input Modal */}
      <Dialog open={emailModal.isOpen} onOpenChange={closeEmailModal}>
        <DialogContent className="bg-white border border-gray-200 shadow-xl rounded-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              Email Input
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm text-gray-700 font-medium">Email Address*</Label>
              <Input
                type="email"
                value={emailData.address}
                onChange={(e) => setEmailData(prev => ({ ...prev, address: e.target.value }))}
                className="bg-white border-gray-300 text-gray-900 h-10 focus:border-blue-500 focus:ring-blue-500"
                placeholder="example@domain.com"
                autoFocus
              />
              {emailError && (
                <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <span>⚠️</span>
                  {emailError}
                </div>
              )}
            </div>
            
            <div>
              <Label className="text-sm text-gray-700 font-medium">Text to display (optional)</Label>
              <Input
                value={emailData.displayText}
                onChange={(e) => setEmailData(prev => ({ ...prev, displayText: e.target.value }))}
                className="bg-white border-gray-300 text-gray-900 h-10 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Custom display name (e.g., 'Email Ron')"
              />
              <div className="text-xs text-gray-500 mt-1">
                Leave blank to show email address in cell
              </div>
            </div>
            
            <div className="flex space-x-3 pt-2">
              <Button 
                onClick={saveEmailData}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-md flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
              <Button 
                variant="outline" 
                onClick={closeEmailModal}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 h-10 rounded-md"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}