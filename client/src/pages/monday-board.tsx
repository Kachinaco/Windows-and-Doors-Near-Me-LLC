import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft,
  ChevronDown, 
  ChevronRight,
  Plus,
  X,
  MoreHorizontal,
  Calendar,
  Clock,
  User,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

// Interface definitions
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
  notes?: string;
  dueDate?: string;
  priority?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BoardItem {
  id: number;
  groupName: string;
  values: Record<string, any>;
  subItems?: SubItem[];
}

interface BoardGroup {
  name: string;
  items: BoardItem[];
  collapsed: boolean;
}

export default function MondayBoard() {
  // State management
  const [boardGroups, setBoardGroups] = useState<BoardGroup[]>([]);
  const [columns] = useState<BoardColumn[]>([
    { id: 'item', name: 'Item', type: 'text', order: 0 },
    { id: 'people', name: 'People', type: 'people', order: 1 },
    { id: 'status', name: 'Status', type: 'status', order: 2 },
    { id: 'timeline', name: 'Timeline', type: 'date', order: 3 },
    { id: 'notes', name: 'Notes', type: 'text', order: 4 },
  ]);
  
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    item: 240,
    people: 140,
    status: 140,
    timeline: 140,
    notes: 180,
  });
  
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch projects data
  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/projects'],
    staleTime: 1000 * 60 * 5,
  });

  // Transform projects into board format
  const transformedGroups = useMemo(() => {
    const statusGroups: Record<string, BoardItem[]> = {
      'New Leads': [],
      'Active Projects': [],
      'Scheduled Work': [],
      'Completed': []
    };

    if (!projects || !Array.isArray(projects)) {
      // Return empty groups structure
      return Object.entries(statusGroups).map(([groupName, items]) => ({
        name: groupName,
        items,
        collapsed: false
      }));
    }

    projects.forEach((project: any) => {
      const boardItem: BoardItem = {
        id: project.id,
        groupName: project.status || 'new lead',
        values: {
          item: project.name,
          people: project.assigned_to || 'Unassigned',
          status: project.status || 'new lead',
          timeline: project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set',
          notes: project.description || ''
        },
        subItems: [
          { 
            id: 1, 
            projectId: project.id, 
            name: 'Site Survey', 
            status: 'pending', 
            assignedTo: 'John',
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: 2, 
            projectId: project.id, 
            name: 'Material Order', 
            status: 'completed', 
            assignedTo: 'Sarah',
            order: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: 3, 
            projectId: project.id, 
            name: 'Installation', 
            status: 'in-progress', 
            assignedTo: 'Mike',
            order: 3,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      // Group by status
      if (project.status === 'new lead') {
        statusGroups['New Leads'].push(boardItem);
      } else if (project.status === 'in progress') {
        statusGroups['Active Projects'].push(boardItem);
      } else if (project.status === 'scheduled') {
        statusGroups['Scheduled Work'].push(boardItem);
      } else if (project.status === 'complete') {
        statusGroups['Completed'].push(boardItem);
      } else {
        statusGroups['New Leads'].push(boardItem);
      }
    });

    return Object.entries(statusGroups).map(([groupName, items]) => ({
      name: groupName,
      items,
      collapsed: false
    }));
  }, [projects]);

  // Update board groups when transformed groups change
  useEffect(() => {
    setBoardGroups(transformedGroups);
  }, [transformedGroups]);

  // Toggle group collapsed state
  const toggleGroup = useCallback((groupName: string) => {
    setBoardGroups(prev => prev.map(group => 
      group.name === groupName 
        ? { ...group, collapsed: !group.collapsed }
        : group
    ));
  }, []);

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (groupName: string) => {
      return apiRequest('POST', '/api/projects', {
        name: 'New Project',
        status: groupName === 'New Leads' ? 'new lead' : 
               groupName === 'Active Projects' ? 'in progress' :
               groupName === 'Scheduled Work' ? 'scheduled' : 'complete',
        assigned_to: 'Unassigned'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });

  const handleAddItem = useCallback((groupName: string) => {
    addItemMutation.mutate(groupName);
  }, [addItemMutation]);

  // Render cell content
  const renderCell = (item: BoardItem, column: BoardColumn) => {
    const value = item.values[column.id];
    
    switch (column.type) {
      case 'status':
        return (
          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
            value === 'new lead' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            value === 'in progress' ? 'bg-orange-50 text-orange-700 border-orange-200' :
            value === 'scheduled' ? 'bg-purple-50 text-purple-700 border-purple-200' :
            value === 'complete' ? 'bg-green-50 text-green-700 border-green-200' :
            'bg-gray-50 text-gray-600 border-gray-200'
          }`}>
            {value || 'Unknown'}
          </div>
        );
      case 'people':
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {value?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-sm text-gray-900">{value || 'Unassigned'}</span>
          </div>
        );
      default:
        return (
          <span className="text-sm text-gray-900">{value || '-'}</span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600 font-medium">Loading projects...</div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-white text-gray-900">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-900">
              Project Board
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="space-y-6">
          {boardGroups.map((group) => (
            <div key={group.name} className="space-y-3">
              {/* Group Header */}
              <div 
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
                onClick={() => toggleGroup(group.name)}
              >
                <div className="flex items-center gap-3">
                  {group.collapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  )}
                  <h2 className="text-lg font-semibold text-gray-900">
                    {group.name}
                  </h2>
                  <div className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700">
                    {group.items.length}
                  </div>
                </div>
              </div>

              {!group.collapsed && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  {/* Column Headers */}
                  <div className="flex bg-gray-50 border-b border-gray-200">
                    {columns.map((column, index) => (
                      <div
                        key={column.id}
                        className="px-4 py-3 border-r border-gray-200 last:border-r-0 text-sm font-semibold text-gray-700"
                        style={{ 
                          width: columnWidths[column.id] || (index === 0 ? 240 : 140),
                          minWidth: index === 0 ? '180px' : '100px'
                        }}
                      >
                        {column.name}
                      </div>
                    ))}
                  </div>

                  {/* Items */}
                  {group.items.map((item) => (
                    <div key={item.id}>
                      {/* Main Item Row */}
                      <div 
                        className={`flex border-b border-gray-200 hover:bg-blue-50/50 transition-all cursor-pointer ${
                          hoveredItem === item.id ? 'bg-blue-50 shadow-sm' : ''
                        }`}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {columns.map((column, index) => (
                          <div
                            key={column.id}
                            className={`px-4 py-3 border-r border-gray-200 last:border-r-0 text-sm ${
                              hoveredItem === item.id ? 'border-blue-200' : ''
                            }`}
                            style={{ 
                              width: columnWidths[column.id] || (index === 0 ? 240 : 140),
                              minWidth: index === 0 ? '180px' : '100px'
                            }}
                          >
                            {renderCell(item, column)}
                          </div>
                        ))}
                      </div>

                      {/* Sub-Items Section (when hovered) - Clean, simple layout */}
                      {hoveredItem === item.id && item.subItems && item.subItems.length > 0 && (
                        <div className="bg-gray-50 border-t border-gray-200">
                          <div className="px-16 py-3 space-y-2">
                            {item.subItems.map((subItem) => (
                              <div 
                                key={subItem.id}
                                className="flex items-center gap-4 p-2 rounded-md bg-white hover:bg-blue-50 transition-all border border-gray-200 hover:border-blue-300"
                              >
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-900 font-medium text-sm">{subItem.name}</span>
                                <span className="text-gray-600 text-xs">{subItem.status}</span>
                                {subItem.assignedTo && (
                                  <span className="text-blue-600 text-xs">@{subItem.assignedTo}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Item Button */}
              {!group.collapsed && (
                <div className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors">
                  <Plus className="w-4 h-4" />
                  <button 
                    onClick={() => handleAddItem(group.name)}
                    className="text-sm font-medium hover:underline"
                  >
                    Add Item
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}