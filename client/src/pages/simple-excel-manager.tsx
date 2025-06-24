import { useState, useMemo, useRef } from "react";
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
  Trash2
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
  
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/employees'],
    enabled: !!user,
  });

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

  // Cell editing
  const handleCellClick = (rowId: number, columnKey: string, currentValue: any) => {
    setEditingCell({ row: rowId, column: columnKey });
    setEditValue(currentValue?.toString() || '');
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
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
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

  // Render cell
  const renderCell = (project: Project, column: any) => {
    const isEditing = editingCell?.row === project.id && editingCell?.column === column.key;
    const cellValue = getCellValue(project, column.key);

    if (isEditing) {
      return (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleCellSave}
          className="h-8 text-sm border-blue-500 focus:border-blue-600"
          autoFocus
        />
      );
    }

    return (
      <div
        className="h-8 px-2 text-sm cursor-cell hover:bg-blue-50 flex items-center truncate border-r border-gray-200"
        onClick={() => handleCellClick(project.id, column.key, cellValue)}
        title={`Click to edit: ${cellValue}`}
      >
        {column.key === 'status' ? (
          <Badge className={`${getStatusColor(cellValue.toString())} text-xs px-2 py-0 border`}>
            {cellValue}
          </Badge>
        ) : (
          <span className="truncate">{cellValue}</span>
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
            <h1 className="text-lg font-semibold text-gray-900">
              Excel-Style Project Manager
            </h1>
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
          </div>
          <div className="flex items-center space-x-4">
            <span>Zoom: 100%</span>
            <span>Excel-Style Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
}