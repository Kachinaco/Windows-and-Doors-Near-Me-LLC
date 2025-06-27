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
import { Plus, Settings, Calendar, Users, Hash, Tag, User, Type } from "lucide-react";

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

  // Fetch projects and transform to board items
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['/api/projects'],
    refetchInterval: 5000,
  });

  // Transform projects to board items safely
  const boardItems: BoardItem[] = Array.isArray(projects) ? projects.map((project: any) => ({
    id: project.id || 0,
    groupName: 'Active Projects',
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
  })) : [];

  // Debug logging
  console.log('Projects data:', projects);
  console.log('Board items:', boardItems);
  console.log('Loading:', isLoading);
  console.log('Error:', error);

  // Update cell mutation
  const updateCellMutation = useMutation({
    mutationFn: async ({ projectId, field, value }: { projectId: number; field: string; value: any }) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
      toast({ title: "Cell updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update cell", variant: "destructive" });
    },
  });

  // Add new item mutation
  const addItemMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: 'New Project',
          status: 'new lead',
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "New item added" });
    },
  });

  const handleCellUpdate = useCallback((projectId: number, field: string, value: any) => {
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
  }, [updateCellMutation]);

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
    toast({ title: "Column added successfully" });
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
            <SelectTrigger className={`h-8 border-none bg-transparent text-white text-xs font-medium rounded-full px-3 ${
              value === 'complete' ? 'bg-blue-600' :
              value === 'in progress' ? 'bg-emerald-600' :
              value === 'scheduled' ? 'bg-purple-600' :
              value === 'on order' ? 'bg-yellow-600' :
              'bg-gray-600'
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
            <SelectTrigger className="h-8 border-none bg-transparent text-white">
              <SelectValue placeholder="Select person" />
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
            className="h-8 border-none bg-transparent text-white"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleCellUpdate(item.id, column.id, parseInt(e.target.value) || 0)}
            className="h-8 border-none bg-transparent text-white"
            placeholder="0"
          />
        );
      
      case 'tags':
        return (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(value) && value.map((tag: string, idx: number) => (
              <span key={idx} className="px-2 py-1 bg-purple-600 text-white rounded-full text-xs">
                {tag}
              </span>
            ))}
            <Input
              placeholder="Add tags..."
              className="h-6 border-none bg-transparent text-white text-xs flex-1 min-w-20"
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
            className="h-8 border-none bg-transparent text-white"
            placeholder="Enter text..."
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
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

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm" />
            </div>
            <h1 className="text-xl font-semibold">Project Management Board</h1>
            <div className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-medium">
              Monday.com Style
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => addItemMutation.mutate()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={addItemMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </header>

      {/* Board Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          {/* Column Headers */}
          <thead className="sticky top-0 bg-gray-800 z-10">
            <tr>
              {columns.map((column) => (
                <th key={column.id} className="text-left p-4 border-r border-gray-700 min-w-[150px]">
                  <div className="flex items-center space-x-2">
                    {getColumnIcon(column.type)}
                    <span className="font-medium text-sm">{column.name}</span>
                    <span className="text-xs text-gray-400 uppercase">{column.type}</span>
                  </div>
                </th>
              ))}
              
              {/* Add Column Button */}
              <th className="p-4 min-w-[150px]">
                <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-10 border-2 border-dashed border-gray-600 bg-transparent text-gray-400 hover:border-blue-600 hover:text-blue-400"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Column
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 text-white border-gray-700">
                    <DialogHeader>
                      <DialogTitle>Add New Column</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="column-name">Column Name</Label>
                        <Input
                          id="column-name"
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="Enter column name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="column-type">Column Type</Label>
                        <Select value={newColumnType} onValueChange={(value) => setNewColumnType(value as BoardColumn['type'])}>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="text">📝 Text</SelectItem>
                            <SelectItem value="status">🟢 Status</SelectItem>
                            <SelectItem value="people">👤 People</SelectItem>
                            <SelectItem value="date">📅 Date</SelectItem>
                            <SelectItem value="number">🔢 Number</SelectItem>
                            <SelectItem value="tags">🏷️ Tags</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex space-x-3">
                        <Button onClick={addColumn} className="flex-1 bg-blue-600 hover:bg-blue-700">
                          Add Column
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddColumnOpen(false)}
                          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </th>
            </tr>
          </thead>

          {/* Board Rows */}
          <tbody>
            {boardItems.map((item) => (
              <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/20">
                {columns.map((column) => (
                  <td key={`${item.id}-${column.id}`} className="p-2 border-r border-gray-700 align-top">
                    {renderCell(item, column)}
                  </td>
                ))}
                
                {/* Actions Column */}
                <td className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-400"
                    onClick={() => {
                      // Implement delete functionality
                      console.log('Delete item:', item.id);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-2 flex items-center justify-between text-sm text-gray-400 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span>🐍 Python-Powered Board</span>
          <span>•</span>
          <span>{boardItems.length} items</span>
          <span>•</span>
          <span>{columns.length} columns</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span>Live Collaboration Active</span>
        </div>
      </div>
    </div>
  );
}