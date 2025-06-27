import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  MoreHorizontal, 
  ArrowLeft, 
  Undo,
  Users,
  Filter,
  Folder,
  Trash2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Types
interface BoardColumn {
  id: string;
  name: string;
  type: 'text' | 'status' | 'people' | 'date' | 'number' | 'tags' | 'subitems';
  order: number;
}

interface SubItem {
  id: number;
  name: string;
  status?: string;
  assignedTo?: string;
  priority?: number;
  dueDate?: string;
  folderId?: number;
}

interface SubItemFolder {
  id: number;
  name: string;
  order: number;
}

interface BoardItem {
  id: number;
  name: string;
  status: string;
  assignedTo?: string;
  location?: string;
  phone?: string;
  dueDate?: string;
  priority?: number;
  tags?: string[];
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
  
  // Default board columns
  const [columns, setColumns] = useState<BoardColumn[]>([
    { id: 'item', name: 'Main Item', type: 'text', order: 1 },
    { id: 'subitems', name: 'Sub Items', type: 'subitems', order: 2 },
    { id: 'status', name: 'Status', type: 'status', order: 3 },
    { id: 'assignedTo', name: 'People', type: 'people', order: 4 },
    { id: 'dueDate', name: 'Due Date', type: 'date', order: 5 },
    { id: 'priority', name: 'Priority', type: 'number', order: 6 },
    { id: 'tags', name: 'Tags', type: 'tags', order: 7 },
  ]);

  // Side panel drawer state
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [selectedMainItem, setSelectedMainItem] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);

  // Other state
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
  });

  // Fetch projects and transform to board items
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  const boardItems: BoardItem[] = useMemo(() => {
    return projects.map((project: any) => ({
      id: project.id,
      name: project.name || '',
      status: project.status || 'new lead',
      assignedTo: project.assignedTo,
      location: project.projectAddress,
      phone: project.clientPhone,
      dueDate: project.startDate,
      priority: 1,
      tags: [],
      subItems: project.subItems || [],
      subItemFolders: project.subItemFolders || []
    }));
  }, [projects]);

  // Group items by status
  const groups: BoardGroup[] = useMemo(() => {
    const statusGroups = {
      'new lead': { name: 'New Leads', items: [], collapsed: false, color: 'cyan' },
      'need attention': { name: 'Need Attention', items: [], collapsed: false, color: 'yellow' }, 
      'sent estimate': { name: 'Sent Estimate', items: [], collapsed: false, color: 'purple' },
      'signed': { name: 'Signed', items: [], collapsed: false, color: 'emerald' },
      'in progress': { name: 'In Progress', items: [], collapsed: false, color: 'blue' },
      'complete': { name: 'Complete', items: [], collapsed: false, color: 'green' }
    };

    boardItems.forEach(item => {
      const status = item.status.toLowerCase().replace(/\s+/g, ' ').trim();
      if (statusGroups[status as keyof typeof statusGroups]) {
        statusGroups[status as keyof typeof statusGroups].items.push(item);
      }
    });

    return Object.values(statusGroups);
  }, [boardItems]);

  // Mutation for adding new items
  const addItemMutation = useMutation({
    mutationFn: async (groupName: string) => {
      const statusMap: Record<string, string> = {
        'New Leads': 'new lead',
        'Need Attention': 'need attention', 
        'Sent Estimate': 'sent estimate',
        'Signed': 'signed',
        'In Progress': 'in progress',
        'Complete': 'complete'
      };

      const response = await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
          status: statusMap[groupName] || 'new lead',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });

  // Handle folder creation
  const handleCreateFolder = useCallback(async (mainItemId: number) => {
    try {
      const response = await apiRequest('/api/sub-item-folders', {
        method: 'POST',
        body: JSON.stringify({
          itemId: mainItemId,
          name: 'New Folder',
          order: 0
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: 'Folder created successfully' });
    } catch (error) {
      toast({ title: 'Failed to create folder', variant: 'destructive' });
    }
  }, [queryClient, toast]);

  // Handle sub-item creation
  const handleCreateSubItem = useCallback(async (mainItemId: number, folderId: number) => {
    try {
      const response = await apiRequest('/api/sub-items', {
        method: 'POST',
        body: JSON.stringify({
          itemId: mainItemId,
          folderId: folderId,
          name: 'New Sub-item',
          status: 'Not Started',
          order: 0
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create sub-item');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: 'Sub-item created successfully' });
    } catch (error) {
      toast({ title: 'Failed to create sub-item', variant: 'destructive' });
    }
  }, [queryClient, toast]);

  // Handle sub-item deletion
  const handleDeleteSubItem = useCallback(async (subItemId: number) => {
    try {
      const response = await apiRequest(`/api/sub-items/${subItemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete sub-item');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: 'Sub-item deleted successfully' });
    } catch (error) {
      toast({ title: 'Failed to delete sub-item', variant: 'destructive' });
    }
  }, [queryClient, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white relative">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 shadow-lg backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/dashboard'}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-white">Project Board</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Undo className="w-4 h-4 mr-2" />
                Undo
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Users className="w-4 h-4 mr-2" />
                <span className="text-emerald-400">2</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Column Headers */}
          <div className="flex bg-gray-900/50 border-b border-gray-800 sticky top-[73px] z-20">
            {columns.map((column) => (
              <div 
                key={column.id}
                className="px-3 py-2 border-r border-gray-800/20 font-medium text-sm text-gray-300 flex items-center justify-between"
                style={{ 
                  width: columnWidths[column.id] || 120,
                  minWidth: '100px'
                }}
              >
                <span>{column.name}</span>
                <button className="p-1 hover:bg-gray-700/50 rounded opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Board Groups */}
          {groups.map((group, groupIndex) => (
            <div key={group.name} className="border-b border-gray-800/30">
              {/* Group Header */}
              <div className="flex bg-gray-900/30 border-b border-gray-800/20">
                <div className="px-3 py-2 font-medium text-sm text-gray-300 flex items-center gap-2">
                  <ChevronDown className="w-3 h-3" />
                  <span>{group.name}</span>
                  <span className="text-xs text-gray-500">({group.items.length})</span>
                </div>
              </div>

              {/* Group Items */}
              {group.items.map((item) => (
                <div key={item.id} className="border-b border-gray-800/10">
                  {/* Main Item Row */}
                  <div className="group flex hover:bg-gray-800/20 transition-all">
                    {columns.map((column) => (
                      <div 
                        key={column.id}
                        className="px-3 py-2 border-r border-gray-800/10 text-sm flex items-center"
                        style={{ 
                          width: columnWidths[column.id] || 120,
                          minWidth: '100px'
                        }}
                      >
                        {column.id === 'item' && (
                          <span className="text-white">{item.name || `Item ${item.id}`}</span>
                        )}
                        {column.id === 'status' && (
                          <span className="px-2 py-1 bg-cyan-600/20 text-cyan-300 rounded-full text-xs">
                            {item.status}
                          </span>
                        )}
                        {column.id === 'subitems' && (
                          <span className="text-gray-400 text-xs">
                            {item.subItems?.length || 0} items
                          </span>
                        )}
                        {column.id === 'assignedTo' && (
                          <span className="text-gray-400">{item.assignedTo || '-'}</span>
                        )}
                        {column.id === 'dueDate' && (
                          <span className="text-gray-400">{item.dueDate || '-'}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Sub-Items Section */}
                  {item.subItemFolders && item.subItemFolders.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-950/10 to-indigo-950/5 border-b border-blue-800/20">
                      <div className="px-6 py-2 border-b border-blue-800/20 bg-gradient-to-r from-blue-900/20 to-indigo-900/10">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-blue-300">SUB-ITEMS</h3>
                          <button 
                            onClick={() => handleCreateFolder(item.id)}
                            className="text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 text-xs h-6 px-2 flex items-center gap-1.5 font-medium border border-amber-500/20 hover:border-amber-400/40 rounded-md transition-all"
                          >
                            <Plus className="w-3 h-3" />
                            Add Folder
                          </button>
                        </div>
                      </div>

                      {/* Folders */}
                      {item.subItemFolders.map((folder) => (
                        <div 
                          key={folder.id}
                          className="group flex hover:bg-amber-500/8 transition-all bg-gradient-to-r from-amber-950/15 to-orange-950/8 border-b-2 border-amber-500/25 shadow-sm"
                        >
                          <div className="w-8 px-1 py-2 border-r border-amber-500/20 flex items-center justify-center sticky left-0 bg-gradient-to-r from-amber-950/15 to-orange-950/8 z-20">
                            <input 
                              type="checkbox" 
                              className="w-3.5 h-3.5 rounded border-amber-500/50 bg-amber-900/30 text-amber-400 focus:ring-amber-400 focus:ring-1"
                            />
                          </div>
                          
                          <div 
                            className="px-3 py-2 border-r border-amber-500/20 flex-shrink-0 sticky left-8 bg-gradient-to-r from-amber-950/15 to-orange-950/8 z-10 flex items-center"
                            style={{ 
                              width: columnWidths['item'] || 200,
                              minWidth: '150px',
                              maxWidth: 'none'
                            }}
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-5 h-px bg-amber-400/50"></div>
                              
                              <button
                                onClick={() => {
                                  setSelectedMainItem(item);
                                  setSelectedFolder(folder);
                                  setSidePanelOpen(true);
                                }}
                                className="p-1 hover:bg-amber-500/20 rounded transition-colors"
                              >
                                <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
                              </button>
                              
                              <Folder className="w-4 h-4 text-amber-400 drop-shadow-sm" />
                              
                              <span className="text-amber-200 text-sm font-semibold px-2 py-1 rounded hover:bg-amber-500/10 transition-colors">
                                {folder.name}
                              </span>
                              
                              <span className="text-amber-400/70 text-xs ml-1 font-medium">
                                ({item.subItems?.filter(sub => sub.folderId === folder.id).length || 0} items)
                              </span>
                            </div>
                          </div>
                          
                          {/* Empty cells for other columns */}
                          {columns.slice(1).map((column) => (
                            <div 
                              key={column.id}
                              className="px-3 py-2 border-r border-amber-500/20"
                              style={{ 
                                width: columnWidths[column.id] || 120,
                                minWidth: '100px'
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Add Item Button */}
              <div className="flex bg-gray-900/20">
                <div 
                  className="px-3 py-1.5 border-r border-gray-800/10 flex-shrink-0"
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
            </div>
          ))}
        </div>
      </div>

      {/* Side Panel Drawer */}
      {sidePanelOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidePanelOpen(false)}
          />
          
          {/* Side Panel */}
          <div className="w-96 bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Folder className="w-5 h-5 text-amber-400" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {selectedFolder?.name || 'Folder Details'}
                    </h2>
                    <p className="text-sm text-gray-400">
                      Main Item: {selectedMainItem?.name || selectedMainItem?.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSidePanelOpen(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {selectedMainItem && selectedFolder && (
                <div className="space-y-6">
                  {/* Main Item Info */}
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Main Item</h3>
                    <div className="text-white font-medium">{selectedMainItem.name || `Item ${selectedMainItem.id}`}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Status: <span className="text-cyan-400">{selectedMainItem.status}</span>
                    </div>
                  </div>

                  {/* Folder Info */}
                  <div className="bg-amber-900/20 rounded-lg p-4 border border-amber-700/30">
                    <h3 className="text-sm font-medium text-amber-300 mb-2">Folder</h3>
                    <div className="text-amber-100 font-medium">{selectedFolder.name}</div>
                    <div className="text-sm text-amber-400 mt-1">
                      Sub-items: {selectedMainItem.subItems?.filter((item: any) => item.folderId === selectedFolder.id).length || 0}
                    </div>
                  </div>

                  {/* Sub-items */}
                  <div className="bg-gray-800/30 rounded-lg border border-gray-700">
                    <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-blue-300">Sub-Items</h3>
                        <button 
                          onClick={() => {
                            handleCreateSubItem(selectedMainItem.id, selectedFolder.id);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-md transition-colors"
                        >
                          Add Sub-Item
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {selectedMainItem.subItems?.filter((item: any) => item.folderId === selectedFolder.id).length > 0 ? (
                        <div className="space-y-2">
                          {selectedMainItem.subItems
                            .filter((item: any) => item.folderId === selectedFolder.id)
                            .map((subItem: any) => (
                              <div key={subItem.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <span className="text-blue-200 font-medium text-sm">
                                      {subItem.name || 'Untitled Sub-item'}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteSubItem(subItem.id)}
                                    className="p-1 hover:bg-red-600/20 rounded text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="mt-2 text-xs text-gray-400 space-y-1">
                                  <div>Status: {subItem.status || 'Not Set'}</div>
                                  <div>Owner: {subItem.assignedTo || 'Unassigned'}</div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No sub-items in this folder</p>
                          <p className="text-xs mt-1">Click "Add Sub-Item" to get started</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}