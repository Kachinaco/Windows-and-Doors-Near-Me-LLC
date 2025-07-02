import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus,
  Search,
  Filter,
  ChevronDown,
  Copy,
  Download,
  Upload,
  Save,
  Columns,
  SortAsc,
  SortDesc,
  Calculator,
  Edit,
  Trash2,
  Users,
  Eye,
  Wifi
} from "lucide-react";

const formatDate = (dateValue: any) => {
  if (!dateValue) return '';
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit'
  });
};

// Real-time collaboration types
interface CollaborationUser {
  id: number;
  username: string;
  sessionId: string;
}

interface ActiveEditor {
  cellKey: string;
  user: CollaborationUser;
}

interface WSMessage {
  type: string;
  payload: any;
}

export default function SimpleExcelManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [editingCell, setEditingCell] = useState<{row: number, column: string} | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    id: 80,
    name: 200,
    assignedTo: 150,
    projectAddress: 180,
    clientPhone: 130,
    status: 120,
    startDate: 120,
    endDate: 120,
    createdAt: 120
  });
  const [visibleColumns, setVisibleColumns] = useState([
    'id', 'name', 'assignedTo', 'projectAddress', 'clientPhone', 'status', 'startDate', 'endDate'
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [resizing, setResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  
  // Real-time collaboration state
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<CollaborationUser[]>([]);
  const [activeEditors, setActiveEditors] = useState<Map<string, CollaborationUser>>(new Map());
  const [sessionId, setSessionId] = useState<string>("");
  
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Data fetching
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/employees'],
    enabled: !!user,
  });

  // WebSocket connection for real-time collaboration
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      setIsConnected(true);
      setWs(websocket);
      wsRef.current = websocket;
      
      // Join collaboration session
      websocket.send(JSON.stringify({
        type: 'user-join',
        token: localStorage.getItem('authToken')
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    websocket.onclose = () => {
      setIsConnected(false);
      setWs(null);
      wsRef.current = null;
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      websocket.close();
    };
  }, [user]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'collaboration-state':
        setSessionId(message.payload.sessionId);
        setOnlineUsers(message.payload.onlineUsers);
        const editorsMap = new Map();
        message.payload.activeEditors.forEach((editor: ActiveEditor) => {
          editorsMap.set(editor.cellKey, editor.user);
        });
        setActiveEditors(editorsMap);
        break;

      case 'user-join':
        setOnlineUsers(prev => [...prev, message.payload.user]);
        toast({
          title: "User Joined",
          description: `${message.payload.user.username} joined the collaboration`
        });
        break;

      case 'user-leave':
        setOnlineUsers(prev => prev.filter(u => u.sessionId !== message.payload.user.sessionId));
        setActiveEditors(prev => {
          const newMap = new Map(prev);
          Array.from(newMap.entries()).forEach(([cellKey, user]) => {
            if (user.sessionId === message.payload.user.sessionId) {
              newMap.delete(cellKey);
            }
          });
          return newMap;
        });
        break;

      case 'cell-start-edit':
        setActiveEditors(prev => new Map(prev).set(message.payload.cellKey, message.payload.user));
        break;

      case 'cell-end-edit':
        setActiveEditors(prev => {
          const newMap = new Map(prev);
          newMap.delete(message.payload.cellKey);
          return newMap;
        });
        break;

      case 'cell-update':
        // Real-time cell updates from other users
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        break;
    }
  }, [toast, queryClient]);

  // Send WebSocket message
  const sendWSMessage = useCallback((message: WSMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Filter and search
  const filteredProjects = useMemo(() => {
    let filtered = projects;
    
    if (statusFilter) {
      filtered = filtered.filter(p => p.status?.toLowerCase().includes(statusFilter.toLowerCase()));
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        Object.values(p).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    return filtered;
  }, [projects, statusFilter, searchTerm]);

  // Column configuration
  const columns = [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'name', label: 'Project Name', type: 'text' },
    { key: 'assignedTo', label: 'Assigned To', type: 'text' },
    { key: 'projectAddress', label: 'Address', type: 'text' },
    { key: 'clientPhone', label: 'Phone', type: 'text' },
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
  ].filter(col => visibleColumns.includes(col.key));

  // Cell editing with collaboration
  const handleCellClick = (rowId: number, columnKey: string, currentValue: any) => {
    const cellKey = `${rowId}-${columnKey}`;
    
    // Check if someone else is editing this cell
    if (activeEditors.has(cellKey)) {
      const editor = activeEditors.get(cellKey);
      toast({
        title: "Cell Being Edited",
        description: `${editor?.username} is currently editing this cell`,
        variant: "destructive"
      });
      return;
    }

    setEditingCell({ row: rowId, column: columnKey });
    setEditValue(currentValue?.toString() || '');
    
    // Notify others that we're editing this cell
    sendWSMessage({
      type: 'cell-start-edit',
      payload: {
        projectId: rowId,
        column: columnKey
      }
    });
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    
    try {
      const response = await fetch(`/api/projects/${editingCell.row}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          [editingCell.column]: editingCell.column.includes('Date') && editValue ? 
            new Date(editValue).toISOString() : editValue
        })
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        
        // Notify others of the cell update
        sendWSMessage({
          type: 'cell-update',
          payload: {
            projectId: editingCell.row,
            column: editingCell.column,
            value: editValue
          }
        });
        
        toast({
          title: "Updated",
          description: "Cell updated successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cell",
        variant: "destructive"
      });
    }
    
    // End editing session
    sendWSMessage({
      type: 'cell-end-edit',
      payload: {
        projectId: editingCell.row,
        column: editingCell.column
      }
    });
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      // End editing session on escape
      if (editingCell) {
        sendWSMessage({
          type: 'cell-end-edit',
          payload: {
            projectId: editingCell.row,
            column: editingCell.column
          }
        });
      }
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new lead':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on order':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'scheduled':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get cell value
  const getCellValue = (project: Project, columnKey: string) => {
    switch (columnKey) {
      case 'startDate':
      case 'endDate':
        return project[columnKey as keyof Project] ? formatDate(project[columnKey as keyof Project]) : '';
      default:
        return project[columnKey as keyof Project] || '';
    }
  };

  // Render cell with collaboration indicators
  const renderCell = (project: Project, column: any) => {
    const isEditing = editingCell?.row === project.id && editingCell?.column === column.key;
    const cellValue = getCellValue(project, column.key);
    const cellKey = `${project.id}-${column.key}`;
    const editor = activeEditors.get(cellKey);
    const isBeingEdited = !!editor && editor.sessionId !== sessionId;

    if (isEditing) {
      return (
        <div className="relative">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleCellSave}
            className="h-8 text-sm border-2 border-blue-500 focus:border-blue-600"
            autoFocus
          />
          <div className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
            You are editing
          </div>
        </div>
      );
    }

    return (
      <div
        className={`h-8 px-2 text-sm cursor-cell hover:bg-blue-50 flex items-center truncate border-r border-slate-100 relative ${
          isBeingEdited ? 'bg-red-50 border-red-200' : ''
        }`}
        onClick={() => handleCellClick(project.id, column.key, cellValue)}
        title={isBeingEdited ? 
          `${editor?.username} is editing this cell` : 
          `Click to edit: ${cellValue}`
        }
      >
        {column.key === 'status' ? (
          <Badge className={`${getStatusColor(cellValue.toString())} text-xs px-2 py-0 border`}>
            {String(cellValue)}
          </Badge>
        ) : (
          <span className="truncate">{String(cellValue || '')}</span>
        )}
        
        {/* Live editing indicator */}
        {isBeingEdited && (
          <>
            <div className="absolute -top-6 left-0 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
              {editor?.username} is editing
            </div>
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </>
        )}
      </div>
    );
  };

  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    setResizing(columnKey);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnKey]);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Modern Sleek Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="px-3 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section - Title & Collaboration */}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                  <Calculator className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-slate-800 truncate">
                  <span className="hidden sm:inline">Project Manager</span>
                  <span className="sm:hidden">Projects</span>
                </h1>
              </div>
              
              {/* Real-time Status Badge */}
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${
                  isConnected 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                  <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
                </div>
                
                {onlineUsers.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                        <Users className="h-3 w-3 mr-1" />
                        {onlineUsers.length}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 p-3">
                      <div className="text-xs font-semibold text-slate-500 mb-3">Active Collaborators</div>
                      <div className="space-y-2">
                        {onlineUsers.map(user => (
                          <div key={user.sessionId} className="flex items-center space-x-2 py-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-slate-700 truncate">{user.username}</span>
                            {user.sessionId === sessionId && (
                              <span className="text-xs text-blue-600 font-medium">(You)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            
            {/* Right Section - Actions */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium">
                <Save className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium">
                <Download className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium">
                    <Columns className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">View</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-slate-500 mb-2">Show Columns</div>
                    {['id', 'name', 'assignedTo', 'projectAddress', 'clientPhone', 'status', 'startDate', 'endDate'].map(col => (
                      <DropdownMenuCheckboxItem
                        key={col}
                        checked={visibleColumns.includes(col)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setVisibleColumns([...visibleColumns, col]);
                          } else {
                            setVisibleColumns(visibleColumns.filter(c => c !== col));
                          }
                        }}
                        className="text-sm"
                      >
                        {col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" className="h-8 px-3 text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-sm">
                <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">New</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Data Container */}
      <div className="flex-1 mx-3 sm:mx-6 my-4 overflow-hidden">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
          
          {/* Search & Filter Bar */}
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 text-sm border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                  />
                </div>
                <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-32 h-9 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new lead">New Lead</SelectItem>
                    <SelectItem value="in progress">In Progress</SelectItem>
                    <SelectItem value="on order">On Order</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-slate-500 hidden sm:block">
                {filteredProjects.length} projects
              </div>
            </div>
          </div>

          {/* Mobile Cards Layout */}
          <div className="block sm:hidden flex-1 overflow-auto">
            <div className="p-4 space-y-3">
              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all duration-200">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-slate-900 text-sm truncate flex-1">
                        {project.name}
                      </h3>
                      <Badge className={`${getStatusColor(project.status)} text-xs ml-2 shadow-sm`}>
                        {project.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500">ID:</span>
                        <span className="font-medium text-slate-700">#{project.id}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500">Assigned:</span>
                        <span className="truncate text-slate-700">{project.assignedTo || 'Unassigned'}</span>
                      </div>
                      <div className="col-span-2 flex items-start space-x-1">
                        <span className="text-slate-500 mt-0.5">Address:</span>
                        <span className="text-slate-700 text-xs leading-relaxed">{project.projectAddress}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        {activeEditors.has(`${project.id}-name`) && (
                          <div className="flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">{activeEditors.get(`${project.id}-name`)?.username}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-3 text-xs hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => handleCellClick(project.id, 'name', project.name)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Modern Table */}
          <div className="hidden sm:block flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white z-10">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="relative border-r border-slate-600 last:border-r-0 group"
                      style={{ width: columnWidths[column.key], minWidth: '120px' }}
                    >
                      <div className="flex items-center justify-between px-4 py-3 text-sm font-medium">
                        <span className="truncate">{column.label}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-slate-300 hover:text-white hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem>
                              <Filter className="h-4 w-4 mr-2" />
                              Filter Column
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <SortAsc className="h-4 w-4 mr-2" />
                              Sort A→Z
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <SortDesc className="h-4 w-4 mr-2" />
                              Sort Z→A
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Resize Handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors duration-200"
                        onMouseDown={(e) => handleResizeStart(e, column.key)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, index) => (
                  <tr
                    key={project.id}
                    className={`group hover:bg-slate-50 border-b border-slate-100 transition-colors duration-150 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                  >
                    {columns.map((column) => (
                      <td
                        key={`${project.id}-${column.key}`}
                        className="border-r border-slate-100 last:border-r-0 relative"
                        style={{ width: columnWidths[column.key] }}
                      >
                        {renderCell(project, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modern Status Bar */}
      <div className="border-t border-slate-200 bg-slate-50/50 px-3 sm:px-6 py-2">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-3 min-w-0">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Ready</span>
            </span>
            {editingCell && (
              <span className="text-blue-600 truncate font-medium">
                <span className="hidden sm:inline">Editing: </span>
                {columns.find(c => c.key === editingCell.column)?.label}
              </span>
            )}
            {activeEditors.size > 0 && (
              <span className="text-amber-600 truncate">
                {activeEditors.size} active editor{activeEditors.size > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className="hidden lg:inline">
              {isConnected ? 'Live Collaboration' : 'Offline Mode'}
            </span>
            <span className="hidden md:inline">
              {filteredProjects.length} projects
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}