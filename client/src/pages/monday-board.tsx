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
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  
  const queryClient = useQueryClient();

  // Fetch projects data
  const { data: projects = [], isLoading } = useQuery({
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

    if (!Array.isArray(projects)) return [];

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
          <div className={`px-2 py-1 rounded text-xs font-mono border ${
            value === 'new lead' ? 'bg-tron-blue/20 text-tron-blue border-tron-blue/40' :
            value === 'in progress' ? 'bg-tron-orange/20 text-tron-orange border-tron-orange/40' :
            value === 'scheduled' ? 'bg-tron-purple/20 text-tron-purple border-tron-purple/40' :
            value === 'complete' ? 'bg-tron-green/20 text-tron-green border-tron-green/40' :
            'bg-gray-500/20 text-gray-400 border-gray-500/40'
          }`}>
            {value?.toUpperCase() || 'UNKNOWN'}
          </div>
        );
      case 'people':
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-tron-cyan rounded-full flex items-center justify-center">
              <span className="text-xs font-mono text-gray-900">
                {value?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-sm font-mono text-tron-light">{value || 'Unassigned'}</span>
          </div>
        );
      default:
        return (
          <span className="text-sm font-mono text-tron-light">{value || '-'}</span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-tron-cyan font-mono">Loading TRON PROJECT MATRIX...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-tron-light font-orbitron"
         style={{
           backgroundImage: `
             radial-gradient(rgba(6, 182, 212, 0.15) 1px, transparent 1px),
             linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px),
             linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px)
           `,
           backgroundSize: '20px 20px, 100px 100px, 100px 100px'
         }}>
      
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-md border-b border-tron-cyan/30 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard"
              className="flex items-center gap-2 text-tron-cyan hover:text-tron-light transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-mono text-sm">BACK TO SYSTEMS</span>
            </Link>
            <div className="h-6 w-px bg-tron-cyan/30"></div>
            <h1 className="text-xl font-mono text-tron-light">
              TRON PROJECT MATRIX
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-tron-green">
              <div className="w-2 h-2 bg-tron-green rounded-full animate-pulse"></div>
              <span className="text-sm font-mono">SYSTEM ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="p-6">
        <div className="space-y-6">
          {boardGroups.map((group) => (
            <div key={group.name} className="space-y-3">
              {/* Group Header */}
              <div 
                className="flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm border border-tron-cyan/20 rounded-lg cursor-pointer hover:border-tron-cyan/40 transition-all"
                onClick={() => toggleGroup(group.name)}
              >
                <div className="flex items-center gap-3">
                  {group.collapsed ? (
                    <ChevronRight className="w-4 h-4 text-tron-cyan" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-tron-cyan" />
                  )}
                  <h2 className="text-lg font-mono font-bold text-tron-light uppercase tracking-wide">
                    {group.name}
                  </h2>
                  <div className="px-2 py-1 bg-tron-cyan/20 border border-tron-cyan/40 rounded text-xs font-mono text-tron-cyan">
                    {group.items.length}
                  </div>
                </div>
              </div>

              {!group.collapsed && (
                <div className="space-y-0 border border-tron-cyan/20 rounded-lg overflow-hidden bg-gray-900/30 backdrop-blur-sm">
                  {/* Column Headers */}
                  <div className="flex bg-gray-800/50 border-b border-tron-cyan/20">
                    {columns.map((column, index) => (
                      <div
                        key={column.id}
                        className="px-4 py-3 border-r border-tron-cyan/20 last:border-r-0 font-mono text-sm font-bold text-tron-cyan uppercase tracking-wide"
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
                        className={`flex border-b border-gray-800/50 hover:bg-tron-cyan/5 transition-all cursor-pointer ${
                          hoveredItem === item.id ? 'bg-tron-cyan/10 shadow-lg shadow-tron-cyan/20' : ''
                        }`}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {columns.map((column, index) => (
                          <div
                            key={column.id}
                            className={`px-4 py-3 border-r border-gray-800/50 last:border-r-0 text-sm ${
                              hoveredItem === item.id ? 'border-tron-cyan/20' : ''
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
                        <div className="bg-gray-900/30 border-t border-tron-cyan/20">
                          <div className="px-16 py-3 space-y-2">
                            {item.subItems.map((subItem) => (
                              <div 
                                key={subItem.id}
                                className="flex items-center gap-4 p-2 rounded-lg bg-gray-800/50 hover:bg-tron-cyan/10 transition-all border border-transparent hover:border-tron-cyan/40"
                              >
                                <div className="w-2 h-2 bg-tron-cyan rounded-full"></div>
                                <span className="text-tron-light font-mono text-sm">{subItem.name}</span>
                                <span className="text-tron-cyan/70 text-xs">{subItem.status}</span>
                                {subItem.assignedTo && (
                                  <span className="text-tron-green/70 text-xs">@{subItem.assignedTo}</span>
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
                <div className="flex items-center gap-2 px-4 py-2 text-tron-cyan hover:text-tron-light transition-colors">
                  <Plus className="w-4 h-4" />
                  <button 
                    onClick={() => handleAddItem(group.name)}
                    className="text-sm font-mono hover:underline"
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