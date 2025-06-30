import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar, ArrowLeft, Users, User, Tag, Plus, ChevronDown, ChevronRight, Folder, Clock, AlertCircle, CheckCircle, Circle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';

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

const MemoizedBoardGroup = memo(({ group, columns, columnWidths, selectedItems, handleSelectItem, handleSelectGroup, toggleGroup, renderCell }: any) => (
  <div key={group.name}>
    {/* Group Header */}
    <div className={`flex border-b transition-all ${
      group.collapsed ? 'border-gray-300' : 'border-gray-200'
    } ${
      group.name === 'New Leads' ? 'bg-cyan-50 hover:bg-cyan-100' :
      group.name === 'Need Attention' ? 'bg-yellow-50 hover:bg-yellow-100' :
      group.name === 'Sent Estimate' ? 'bg-purple-50 hover:bg-purple-100' :
      group.name === 'Signed' ? 'bg-emerald-50 hover:bg-emerald-100' :
      group.name === 'In Progress' ? 'bg-blue-50 hover:bg-blue-100' :
      group.name === 'Complete' ? 'bg-green-50 hover:bg-green-100' :
      'bg-gray-50 hover:bg-gray-100'
    }`}>
      <div className="w-12 px-2 py-2 border-r border-gray-200 flex items-center justify-center sticky left-0 z-30 bg-inherit">
        <input
          type="checkbox"
          checked={group.items.every((item: BoardItem) => selectedItems.has(item.id)) && group.items.length > 0}
          onChange={() => handleSelectGroup(group)}
          className="w-4 h-4 rounded border-gray-400"
        />
      </div>
      <div 
        className="px-3 py-2 border-r border-gray-200 flex-shrink-0 sticky left-12 z-20 cursor-pointer bg-inherit"
        style={{ 
          width: columnWidths[columns[0]?.id] || 150,
          minWidth: '100px',
          maxWidth: 'none'
        }}
        onClick={() => toggleGroup(group.name)}
      >
        <div className="flex items-center space-x-2">
          {group.collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
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
      </div>
    </div>

    {/* Group Items */}
    {!group.collapsed && group.items.map((item: BoardItem) => (
      <div key={item.id}>
        <div className="flex hover:bg-gray-50 border-b border-gray-100 transition-all">
          <div className="w-12 px-2 py-2 border-r border-gray-200 flex items-center justify-center sticky left-0 bg-white z-30">
            <input
              type="checkbox"
              checked={selectedItems.has(item.id)}
              onChange={() => handleSelectItem(item.id)}
              className="w-4 h-4 rounded border-gray-400 bg-white text-blue-500 focus:ring-blue-500 focus:ring-1"
            />
          </div>
          {columns.map((column: BoardColumn, index: number) => (
            <div
              key={column.id}
              className={`px-2 py-2 border-r border-gray-200 flex-shrink-0 bg-white transition-all ${
                index === 0 ? 'sticky left-12 z-20' : 'z-10'
              }`}
              style={{ 
                width: columnWidths[column.id] || (index === 0 ? 120 : 100),
                minWidth: index === 0 ? '80px' : '70px',
                maxWidth: 'none'
              }}
            >
              {renderCell(item, column)}
            </div>
          ))}
        </div>

        {/* Sub-items */}
        {item.subItems && item.subItems.length > 0 && (
          <div className="ml-12">
            {item.subItemFolders?.map((folder) => (
              <div key={folder.id}>
                <div className="group flex hover:bg-gray-50 transition-all bg-white border-b-2 border-blue-200 shadow-sm">
                  <div className="w-12 px-2 py-2 border-r border-blue-200 flex items-center justify-center sticky left-0 bg-white z-30"></div>
                  <div className="px-4 py-3 border-r border-blue-200 flex-shrink-0 sticky left-12 bg-white z-20 flex items-center" style={{ width: columnWidths[columns[0]?.id] || 150 }}>
                    <ChevronDown className="w-3 h-3 mr-2 text-gray-600" />
                    <Folder className="w-3 h-3 mr-2 text-blue-500" />
                    <span className="font-medium text-sm text-gray-900">{folder.name}</span>
                    <span className="ml-2 text-xs text-gray-500">(2)</span>
                  </div>
                  {columns.slice(1).map((column) => (
                    <div key={column.id} className="px-4 py-3 border-r border-blue-200" style={{ width: columnWidths[column.id] || 100 }}>
                      <span className="text-xs font-medium text-gray-700">{column.name}</span>
                    </div>
                  ))}
                </div>

                {item.subItems
                  ?.filter(sub => sub.folderId === folder.id)
                  .map((subItem) => (
                    <div key={subItem.id} className="flex hover:bg-gray-50 border-b border-gray-100">
                      <div className="w-12 px-2 py-2 border-r border-gray-200 flex items-center justify-center sticky left-0 bg-white z-30">
                        <input type="checkbox" className="w-3 h-3 rounded border-gray-400" />
                      </div>
                      <div className="px-6 py-2 border-r border-gray-200 flex-shrink-0 sticky left-12 bg-white z-20" style={{ width: columnWidths[columns[0]?.id] || 150 }}>
                        <input 
                          type="text" 
                          value={subItem.name}
                          className="w-full text-sm border-none outline-none bg-transparent text-gray-800"
                        />
                      </div>
                      {columns.slice(1).map((column) => (
                        <div key={column.id} className="px-4 py-2 border-r border-gray-200" style={{ width: columnWidths[column.id] || 100 }}>
                          {column.type === 'status' && (
                            <Select value={subItem.status}>
                              <SelectTrigger className="w-full h-6 border-none bg-transparent text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not-started">Not Started</SelectItem>
                                <SelectItem value="working">Working</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {column.type === 'people' && (
                            <Select value={subItem.assignedTo}>
                              <SelectTrigger className="w-full h-6 border-none bg-transparent text-xs">
                                <SelectValue placeholder="Assign" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {column.type === 'date' && (
                            <input 
                              type="date" 
                              value={subItem.dueDate || ''}
                              className="w-full h-6 border-none outline-none bg-transparent text-gray-800 text-xs"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
));

export default function MondayBoard() {
  const { boardId } = useParams();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragColumn, setDragColumn] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'status' | 'text' | 'date' | 'people' | 'number' | 'tags'>('text');

  // Default columns
  const columns: BoardColumn[] = [
    { id: 'item', name: 'Item', type: 'text', order: 0 },
    { id: 'status', name: 'Status', type: 'status', order: 1 },
    { id: 'people', name: 'People', type: 'people', order: 2 },
    { id: 'date', name: 'Date', type: 'date', order: 3 },
  ];

  // Mock data for demonstration
  const boardGroups: BoardGroup[] = [
    {
      name: 'New Leads',
      collapsed: false,
      items: [
        {
          id: 1,
          groupName: 'New Leads',
          values: { item: 'Johnson Window Project', status: 'new-lead', people: 'unassigned', date: '2025-01-15' },
          subItems: [
            { id: 1, projectId: 1, name: 'Initial consultation', status: 'not-started', folderId: 1, order: 1, createdAt: new Date(), updatedAt: new Date() },
            { id: 2, projectId: 1, name: 'Measure windows', status: 'not-started', folderId: 1, order: 2, createdAt: new Date(), updatedAt: new Date() },
          ],
          subItemFolders: [
            { id: 1, projectId: 1, name: 'Initial Contact', order: 1, collapsed: false, createdAt: new Date() }
          ]
        }
      ]
    },
    {
      name: 'In Progress',
      collapsed: false,
      items: [
        {
          id: 2,
          groupName: 'In Progress',
          values: { item: 'Smith Kitchen Windows', status: 'working', people: 'john-doe', date: '2025-01-20' },
          subItems: [
            { id: 3, projectId: 2, name: 'Install frames', status: 'working', folderId: 2, order: 1, createdAt: new Date(), updatedAt: new Date() },
          ],
          subItemFolders: [
            { id: 2, projectId: 2, name: 'Installation Phase', order: 1, collapsed: false, createdAt: new Date() }
          ]
        }
      ]
    },
    {
      name: 'Complete',
      collapsed: false,
      items: [
        {
          id: 3,
          groupName: 'Complete',
          values: { item: 'Davis Home Renovation', status: 'done', people: 'jane-smith', date: '2025-01-10' },
          subItems: [
            { id: 4, projectId: 3, name: 'Final inspection', status: 'done', folderId: 3, order: 1, createdAt: new Date(), updatedAt: new Date() },
          ],
          subItemFolders: [
            { id: 3, projectId: 3, name: 'Project Wrap-up', order: 1, collapsed: false, createdAt: new Date() }
          ]
        }
      ]
    }
  ];

  const boardItems = useMemo(() => 
    boardGroups.flatMap(group => group.items), 
    [boardGroups]
  );

  // Event handlers
  const handleSelectItem = useCallback((itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelectGroup = useCallback((group: BoardGroup) => {
    const allSelected = group.items.every(item => selectedItems.has(item.id));
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        group.items.forEach(item => newSet.delete(item.id));
      } else {
        group.items.forEach(item => newSet.add(item.id));
      }
      return newSet;
    });
  }, [selectedItems]);

  const handleSelectAll = useCallback(() => {
    setSelectedItems(new Set(boardItems.map(item => item.id)));
  }, [boardItems]);

  const handleSelectNone = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const toggleGroup = useCallback((groupName: string) => {
    // Handle group collapse/expand logic
  }, []);

  const renderCell = useCallback((item: BoardItem, column: BoardColumn) => {
    const value = item.values[column.id];
    
    switch (column.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            className="w-full h-full border-none outline-none bg-transparent text-sm text-gray-900"
            placeholder="Enter text..."
          />
        );
      case 'status':
        return (
          <Select value={value}>
            <SelectTrigger className="w-full h-8 border-none bg-transparent">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new-lead">New Lead</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="working">Working</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'people':
        return (
          <Select value={value}>
            <SelectTrigger className="w-full h-8 border-none bg-transparent">
              <SelectValue placeholder="Assign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="john-doe">John Doe</SelectItem>
              <SelectItem value="jane-smith">Jane Smith</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            className="w-full h-8 border-none outline-none bg-transparent text-sm text-gray-900"
          />
        );
      default:
        return <span className="text-sm text-gray-900">{value}</span>;
    }
  }, []);

  const getColumnIcon = (type: string) => {
    switch (type) {
      case 'status': return <Circle className="w-4 h-4 text-gray-500" />;
      case 'people': return <User className="w-4 h-4 text-gray-500" />;
      case 'date': return <Calendar className="w-4 h-4 text-gray-500" />;
      case 'tags': return <Tag className="w-4 h-4 text-gray-500" />;
      default: return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Link href="/workspaces">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workspaces
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-white">Project Board</h1>
        </div>
      </header>

      {/* Board Content */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="min-w-max">
          {/* Column Headers */}
          <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
            <div className="flex">
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
                    width: columnWidths[column.id] || (index === 0 ? 120 : 120),
                    minWidth: index === 0 ? '80px' : '90px',
                    maxWidth: 'none'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    {getColumnIcon(column.type)}
                    <span className="font-medium text-sm text-gray-700">{column.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Board Groups */}
          <div className="bg-white">
            {boardGroups.map((group) => (
              <MemoizedBoardGroup
                key={group.name}
                group={group}
                columns={columns}
                columnWidths={columnWidths}
                selectedItems={selectedItems}
                handleSelectItem={handleSelectItem}
                handleSelectGroup={handleSelectGroup}
                toggleGroup={toggleGroup}
                renderCell={renderCell}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}