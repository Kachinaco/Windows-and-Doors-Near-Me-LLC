import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
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

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'complete':
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'on order':
    case 'ordered':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'in progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'new lead':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'scheduled':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatDate = (date: Date | string | null) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
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
          for (const [cellKey, user] of newMap.entries()) {
            if (user.sessionId === message.payload.user.sessionId) {
              newMap.delete(cellKey);
            }
          }
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

  // Column definitions
  const columns = [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'name', label: 'Project Name', type: 'text' },
    { key: 'assignedTo', label: 'Assigned To', type: 'text' },
    { key: 'projectAddress', label: 'Location', type: 'text' },
    { key: 'clientPhone', label: 'Phone', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
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
          [editingCell.column]: editValue
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

  // Column resizing
  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    setResizing(columnKey);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnKey]);
    e.preventDefault();
  };

  // Filtering
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = searchTerm === '' || 
        Object.values(project).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesStatus = statusFilter === '' || 
        project.status?.toLowerCase().includes(statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  // Get cell value
  const getCellValue = (project: Project, columnKey: string) => {
    switch (columnKey) {
      case 'assignedTo':
        const employee = employees.find(e => e.id === project.assignedTo);
        return employee ? `${employee.firstName || ''} ${employee.lastName || ''}` : 'Unassigned';
      case 'startDate':
      case 'endDate':
      case 'createdAt':
        return formatDate(project[columnKey as keyof Project] as Date);
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
        className={`h-8 px-2 text-sm cursor-cell hover:bg-blue-50 flex items-center truncate border-r border-gray-200 relative ${
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
            {cellValue}
          </Badge>
        ) : (
          <span className="truncate">{cellValue}</span>
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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading Excel-style Project Manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                Excel-Style Project Manager
              </h1>
              
              {/* Real-time collaboration indicator */}
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                  isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <Wifi className={`h-3 w-3 ${isConnected ? 'text-green-600' : 'text-red-600'}`} />
                  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                
                {onlineUsers.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7">
                        <Users className="h-3 w-3 mr-1" />
                        {onlineUsers.length} online
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Online Users</div>
                        {onlineUsers.map(user => (
                          <div key={user.sessionId} className="flex items-center space-x-2 py-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">{user.username}</span>
                            {user.sessionId === sessionId && (
                              <span className="text-xs text-gray-500">(You)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Columns className="h-4 w-4 mr-1" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
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
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Add Row
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-gray-200 bg-gray-25 px-4 py-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filters:</span>
          </div>
          <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
            <SelectTrigger className="w-40 h-8">
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
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search all fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64 h-8"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredProjects.length} of {projects.length} rows
          </div>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse bg-white">
          {/* Header */}
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="w-12 h-10 border-r border-gray-300 bg-gray-200 text-xs font-semibold text-gray-600">
                #
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="relative border-r border-gray-300 bg-gray-100 h-10 group"
                  style={{ width: columnWidths[column.key] }}
                >
                  <div className="flex items-center justify-between px-2 h-full">
                    <span className="text-xs font-semibold text-gray-700 truncate">
                      {column.label}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <SortAsc className="h-4 w-4 mr-2" />
                          Sort Ascending
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <SortDesc className="h-4 w-4 mr-2" />
                          Sort Descending
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {/* Resize handle */}
                  <div
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent"
                    onMouseDown={(e) => handleMouseDown(e, column.key)}
                  />
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {filteredProjects.map((project, index) => (
              <tr
                key={project.id}
                className={`h-10 hover:bg-gray-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                }`}
              >
                {/* Row number */}
                <td className="w-12 h-10 border-r border-gray-200 bg-gray-100 text-xs text-center text-gray-600 font-mono">
                  {index + 1}
                </td>
                {columns.map((column) => (
                  <td
                    key={`${project.id}-${column.key}`}
                    className="h-10 border-r border-gray-200 p-0"
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

      {/* Status Bar */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-1">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Ready</span>
            {editingCell && (
              <span className="text-blue-600">
                Editing: {columns.find(c => c.key === editingCell.column)?.label}
              </span>
            )}
            {activeEditors.size > 0 && (
              <span className="text-orange-600">
                {activeEditors.size} cell{activeEditors.size > 1 ? 's' : ''} being edited
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span>Real-time Collaboration: {isConnected ? 'ON' : 'OFF'}</span>
            <span>Zoom: 100%</span>
            <span>Excel-Style Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
}