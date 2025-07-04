import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Phone,
  FileText,
  Calendar,
  MapPin,
  Users,
  Edit,
  Eye,
  Filter,
  RefreshCw,
  ArrowUpDown,
  ChevronDown,
  Trash2,
  Archive,
  RotateCcw,
  MoreHorizontal,
  Settings,
  Copy,
  Download,
  Upload,
  Save,
  X,
  Check,
  Columns,
  SortAsc,
  SortDesc,
  Grid3X3,
  Calculator,
  PaintBucket,
  Lock,
  Unlock
} from "lucide-react";
import { Link } from "wouter";

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'complete':
    case 'completed':
      return 'bg-green-500 text-white';
    case 'on order':
    case 'ordered':
      return 'bg-yellow-500 text-black';
    case 'in progress':
      return 'bg-blue-500 text-white';
    case 'new lead':
      return 'bg-purple-500 text-white';
    case 'scheduled':
      return 'bg-orange-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

// Format date helper
const formatDate = (date: Date | string | null) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function ProjectTable() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editingCell, setEditingCell] = useState<{row: number, column: string} | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [visibleColumns, setVisibleColumns] = useState([
    'name', 'people', 'location', 'phone', 'status', 'measureDate', 'deliveryDate', 'installDate'
  ]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 200,
    people: 150,
    location: 180,
    phone: 130,
    status: 120,
    measureDate: 130,
    deliveryDate: 130,
    installDate: 130
  });
  const [resizing, setResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [selectedRange, setSelectedRange] = useState<{start: number, end: number} | null>(null);
  const [frozenColumns, setFrozenColumns] = useState<string[]>(['name']);
  const [showFormulas, setShowFormulas] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [groupBy, setGroupBy] = useState<string>('');
  const tableRef = useRef<HTMLDivElement>(null);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/employees'],
    enabled: !!user,
  });

  // Excel-like column definitions
  const columns = [
    { key: 'name', label: 'Project Name', type: 'text', width: columnWidths.name, frozen: frozenColumns.includes('name') },
    { key: 'people', label: 'Assigned People', type: 'people', width: columnWidths.people },
    { key: 'location', label: 'Location', type: 'text', width: columnWidths.location },
    { key: 'phone', label: 'Phone', type: 'phone', width: columnWidths.phone },
    { key: 'status', label: 'Status', type: 'select', width: columnWidths.status, options: ['New Lead', 'In Progress', 'On Order', 'Scheduled', 'Complete'] },
    { key: 'measureDate', label: 'Measure Date', type: 'date', width: columnWidths.measureDate },
    { key: 'deliveryDate', label: 'Delivery Date', type: 'date', width: columnWidths.deliveryDate },
    { key: 'installDate', label: 'Install Date', type: 'date', width: columnWidths.installDate },
  ].filter(col => visibleColumns.includes(col.key));

  // Column resizing functionality
  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    setResizing(columnKey);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnKey]);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        const diff = e.clientX - startX;
        const newWidth = Math.max(80, startWidth + diff);
        setColumnWidths(prev => ({ ...prev, [resizing]: newWidth }));
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, startX, startWidth]);

  const archiveProject = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/projects/${id}/archive`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to archive project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project archived",
        description: "The project has been moved to archive.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive project.",
        variant: "destructive",
      });
    },
  });

  const trashProject = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/projects/${id}/trash`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to move project to trash');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project moved to trash",
        description: "The project will be permanently deleted in 30 days.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to move project to trash.",
        variant: "destructive",
      });
    },
  });

  const restoreProject = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/projects/${id}/restore`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to restore project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project restored",
        description: "The project has been restored to active status.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore project.",
        variant: "destructive",
      });
    },
  });

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((project) => 
        project.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = "";
      let bValue: any = "";
      
      switch (sortBy) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "startDate":
          aValue = a.startDate ? new Date(a.startDate) : new Date(0);
          bValue = b.startDate ? new Date(b.startDate) : new Date(0);
          break;
        case "endDate":
          aValue = a.endDate ? new Date(a.endDate) : new Date(0);
          bValue = b.endDate ? new Date(b.endDate) : new Date(0);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (typeof aValue === "string") {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === "asc" 
        ? aValue - bValue
        : bValue - aValue;
    });
    
    return sorted;
  }, [projects, searchTerm, statusFilter, sortBy, sortOrder]);

  // Handle row selection
  const handleRowSelect = (projectId: number, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, projectId]);
    } else {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(filteredProjects.map((p: Project) => p.id));
    } else {
      setSelectedProjects([]);
    }
  };

  // Inline editing functions
  const handleCellClick = (projectId: number, column: string, currentValue: string) => {
    setEditingCell({ row: projectId, column });
    setEditValue(currentValue || '');
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
          description: "Project updated successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive"
      });
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Column visibility toggle
  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  // Delete project function
  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        toast({
          title: "Deleted",
          description: "Project deleted successfully"
        });
        // Remove from selected projects if it was selected
        setSelectedProjects(prev => prev.filter(id => id !== projectId));
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  // Get assigned employee
  const getAssignedEmployee = (projectId: number) => {
    return employees.find((emp: any) => emp.id === projectId) || null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading projects...</p>
        </div>
      </div>
    );
  }

  const uniqueStatuses = Array.from(new Set(projects.map(p => p.status)));

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
              <p className="text-gray-600 mt-1">Manage and track all your projects in one place</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="text-gray-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Link href="/projects-list">
                <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Enhanced Search and filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, description, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Status
                  {statusFilter && (
                    <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                      {statusFilter}
                    </Badge>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setStatusFilter("")}>
                  All Statuses
                </DropdownMenuItem>
                {uniqueStatuses.map((status) => (
                  <DropdownMenuItem 
                    key={status} 
                    onClick={() => setStatusFilter(status)}
                  >
                    <Badge className={`${getStatusColor(status)} mr-2`}>
                      {status}
                    </Badge>
                    {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Sort Controls */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Sort
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => { setSortBy("name"); setSortOrder("asc"); }}>
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("name"); setSortOrder("desc"); }}>
                  Name (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("status"); setSortOrder("asc"); }}>
                  Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("startDate"); setSortOrder("desc"); }}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("startDate"); setSortOrder("asc"); }}>
                  Oldest First
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Column Customization */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Users className="w-4 h-4" />
                  Columns
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {[
                  { key: 'name', label: 'Item' },
                  { key: 'people', label: 'People' },
                  { key: 'location', label: 'Location' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'status', label: 'Status' },
                  { key: 'measureDate', label: 'Measure Date' },
                  { key: 'deliveryDate', label: 'Delivery Date' },
                  { key: 'installDate', label: 'Install Date' }
                ].map((column) => (
                  <DropdownMenuItem 
                    key={column.key}
                    onClick={() => toggleColumn(column.key)}
                    className="flex items-center justify-between"
                  >
                    {column.label}
                    <Checkbox 
                      checked={visibleColumns.includes(column.key)}
                      className="ml-2"
                    />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Results summary and bulk actions */}
            <div className="flex items-center gap-4 text-sm text-gray-500 ml-auto">
              {selectedProjects.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {selectedProjects.length} selected
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        Bulk Actions
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>
                        Update Status
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Assign Team Member
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Set Dates
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="flex items-center gap-2"
                        onClick={() => {
                          selectedProjects.forEach(id => archiveProject.mutate(id));
                          setSelectedProjects([]);
                        }}
                      >
                        <Archive className="h-4 w-4" />
                        Archive Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 flex items-center gap-2"
                        onClick={() => {
                          selectedProjects.forEach(id => trashProject.mutate(id));
                          setSelectedProjects([]);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Move to Trash
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedProjects([])}>
                    Clear
                  </Button>
                </div>
              )}
              <span className="font-medium text-gray-700">
                {filteredProjects.length} of {projects.length} projects
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="flex-1 overflow-auto bg-white shadow-inner">
        <table className="w-full border-collapse">
          <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white sticky top-0 z-10">
            <tr>
              <th className="w-12 p-4 text-left border-r border-gray-700">
                <Checkbox
                  checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="border-gray-300 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                />
              </th>
              {visibleColumns.map((column) => {
                const columnConfig = {
                  name: { label: 'Item', icon: FileText, width: 'min-w-[200px]' },
                  people: { label: 'People', icon: Users, width: 'min-w-[150px]' },
                  location: { label: 'Location', icon: MapPin, width: 'min-w-[200px]' },
                  phone: { label: 'Phone', icon: Phone, width: 'min-w-[140px]' },
                  status: { label: 'Status', icon: null, width: 'min-w-[120px]' },
                  measureDate: { label: 'Measure Date', icon: Calendar, width: 'min-w-[120px]' },
                  deliveryDate: { label: 'Delivery Date', icon: Calendar, width: 'min-w-[120px]' },
                  installDate: { label: 'Install Date', icon: Calendar, width: 'min-w-[120px]' }
                }[column];
                
                const IconComponent = columnConfig?.icon;
                
                return (
                  <th key={column} className={`p-4 text-left font-semibold tracking-wide border-r border-gray-700 ${columnConfig?.width} group relative`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        {columnConfig?.label}
                      </div>
                      
                      {/* Three-dot menu */}
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 hover:bg-white/90 rounded-full"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <MoreHorizontal className="h-3 w-3 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem>
                              <Filter className="mr-2 h-4 w-4" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Filter className="mr-2 h-4 w-4" />
                              Filter
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ArrowUpDown className="mr-2 h-4 w-4" />
                              Sort
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Collapse
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="mr-2 h-4 w-4" />
                              Group by
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Plus className="mr-2 h-4 w-4" />
                              Duplicate column
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Add AI column
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Plus className="mr-2 h-4 w-4" />
                              Add column to the right
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Change column type
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Plus className="mr-2 h-4 w-4" />
                              Column extensions
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </th>
                );
              })}
              <th className="p-4 text-left font-semibold tracking-wide min-w-[80px] group relative">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    Actions
                  </div>
                  
                  {/* Three-dot menu */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 hover:bg-white/90 rounded-full"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <MoreHorizontal className="h-3 w-3 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem>
                          <Filter className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Filter className="mr-2 h-4 w-4" />
                          Filter
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ArrowUpDown className="mr-2 h-4 w-4" />
                          Sort
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Collapse
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          Group by
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Plus className="mr-2 h-4 w-4" />
                          Duplicate column
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Add AI column
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Plus className="mr-2 h-4 w-4" />
                          Add column to the right
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Change column type
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Plus className="mr-2 h-4 w-4" />
                          Column extensions
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </th>
              <th className="p-4 text-center font-semibold tracking-wide w-[60px]">
                <Trash2 className="w-4 h-4 mx-auto text-red-400" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProjects.map((project, index: number) => {
              const assignedEmployee = getAssignedEmployee(project.assignedTo || 0);
              const isSelected = selectedProjects.includes(project.id);
              
              const EditableCell = ({ field, value, displayValue, className = "" }: {
                field: string;
                value: any;
                displayValue?: React.ReactNode;
                className?: string;
              }) => {
                const isEditing = editingCell?.row === project.id && editingCell?.column === field;
                
                if (isEditing) {
                  return (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCellSave();
                          if (e.key === 'Escape') handleCellCancel();
                        }}
                        onBlur={handleCellSave}
                        autoFocus
                        className="h-8 text-sm border-blue-500 focus:border-blue-600"
                      />
                    </div>
                  );
                }
                
                return (
                  <div 
                    className={`cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors ${className}`}
                    onClick={() => handleCellClick(project.id, field, value?.toString() || '')}
                    title="Click to edit"
                  >
                    {displayValue || value || '—'}
                  </div>
                );
              };
              
              return (
                <tr 
                  key={project.id}
                  className={`group transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : index % 2 === 0 
                        ? 'bg-white hover:bg-gray-50' 
                        : 'bg-gray-50/50 hover:bg-gray-100'
                  } hover:shadow-sm`}
                >
                  {/* Checkbox */}
                  <td className="p-4 border-r border-gray-100">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleRowSelect(project.id, checked as boolean)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </td>
                  
                  {visibleColumns.map((column) => (
                    <td key={column} className="p-2 border-r border-gray-100">
                      {(() => {
                        switch (column) {
                          case 'name':
                            return (
                              <div className="space-y-1">
                                <EditableCell 
                                  field="name" 
                                  value={project.name}
                                  className="font-semibold text-gray-900 text-sm"
                                />
                                {project.description && (
                                  <EditableCell 
                                    field="description" 
                                    value={project.description}
                                    className="text-xs text-gray-500"
                                  />
                                )}
                              </div>
                            );
                          case 'people':
                            return (
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs">
                                    {assignedEmployee ? `${assignedEmployee.firstName?.[0]}${assignedEmployee.lastName?.[0]}` : 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <EditableCell 
                                  field="assignedTo" 
                                  value={project.assignedTo}
                                  displayValue={assignedEmployee ? `${assignedEmployee.firstName} ${assignedEmployee.lastName}` : 'Unassigned'}
                                  className="text-sm font-medium text-gray-900"
                                />
                              </div>
                            );
                          case 'location':
                            return (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <EditableCell 
                                  field="projectAddress" 
                                  value={project.projectAddress}
                                  displayValue={project.projectAddress || 'Click to add location'}
                                  className="text-sm text-gray-900"
                                />
                              </div>
                            );
                          case 'phone':
                            return (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <EditableCell 
                                  field="clientPhone" 
                                  value={project.clientPhone}
                                  displayValue={project.clientPhone || 'Click to add phone'}
                                  className="text-sm text-gray-900"
                                />
                              </div>
                            );
                          case 'status':
                            return (
                              <div className="cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
                                   onClick={() => handleCellClick(project.id, 'status', project.status)}
                                   title="Click to edit">
                                <Badge className={`${getStatusColor(project.status)} px-2 py-1 text-xs font-semibold`}>
                                  {project.status}
                                </Badge>
                              </div>
                            );
                          case 'measureDate':
                            return (
                              <EditableCell 
                                field="startDate" 
                                value={project.startDate}
                                displayValue={formatDate(project.startDate) || 'Click to set date'}
                                className="text-sm text-gray-900"
                              />
                            );
                          case 'deliveryDate':
                            return (
                              <EditableCell 
                                field="endDate" 
                                value={project.endDate}
                                displayValue={formatDate(project.endDate) || 'Click to set date'}
                                className="text-sm text-gray-900"
                              />
                            );
                          case 'installDate':
                            return (
                              <EditableCell 
                                field="createdAt" 
                                value={project.createdAt}
                                displayValue={formatDate(project.createdAt) || 'Click to set date'}
                                className="text-sm text-gray-900"
                              />
                            );
                          default:
                            return <span>—</span>;
                        }
                      })()}
                    </td>
                  ))}
                  
                  {/* Actions */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${project.id}`}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          title="View Project"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/projects/${project.id}/detail`}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit Project"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                  
                  {/* Archive/Trash Actions - Separate Column */}
                  <td className="p-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-gray-100 opacity-60 hover:opacity-100 transition-all"
                          title="More Actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => archiveProject.mutate(project.id)}
                        >
                          <Archive className="h-4 w-4" />
                          Archive Project
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-orange-600 flex items-center gap-2"
                          onClick={() => trashProject.mutate(project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Move to Trash
                        </DropdownMenuItem>
                        {(project.projectStatus === 'archived' || project.projectStatus === 'trashed') && (
                          <DropdownMenuItem 
                            className="text-green-600 flex items-center gap-2"
                            onClick={() => restoreProject.mutate(project.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restore Project
                          </DropdownMenuItem>
                        )}
                        <div className="border-t my-1"></div>
                        <DropdownMenuItem 
                          className="text-red-600 flex items-center gap-2"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
            
            {/* Add new row */}
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
              <td colSpan={10} className="p-6">
                <Link href="/projects-list">
                  <Button 
                    variant="ghost" 
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 w-full justify-center py-3 border-2 border-dashed border-blue-200 hover:border-blue-300 rounded-lg transition-all duration-200"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Project
                  </Button>
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-20 bg-gray-50">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter 
                  ? "Try adjusting your search or filter criteria" 
                  : "Get started by creating your first project"}
              </p>
              <div className="flex gap-3 justify-center">
                {(searchTerm || statusFilter) && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("");
                    }}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Clear filters
                  </Button>
                )}
                <Link href="/projects-list">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced Footer with summary */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Team avatars */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-300">Active Team:</span>
                <div className="flex items-center -space-x-2">
                  {employees.slice(0, 4).map((emp: any, idx: number) => (
                    <Avatar key={emp.id} className="w-8 h-8 ring-2 ring-gray-700 shadow-md">
                      <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs">
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {employees.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-gray-600 ring-2 ring-gray-700 flex items-center justify-center">
                      <span className="text-xs text-gray-300">+{employees.length - 4}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Status summary */}
              <div className="flex items-center gap-4">
                {uniqueStatuses.slice(0, 3).map((status) => {
                  const count = projects.filter(p => p.status === status).length;
                  return (
                    <div key={status} className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(status)} px-2 py-1 text-xs`}>
                        {status}
                      </Badge>
                      <span className="text-sm text-gray-300">{count}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Date info */}
              <div className="text-sm text-gray-300">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
            
            {/* Summary stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{projects.length}</div>
                <div className="text-xs text-gray-400">Total Projects</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">
                  {projects.filter(p => p.status.toLowerCase().includes('complete')).length}
                </div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">
                  {projects.filter(p => p.status.toLowerCase().includes('progress')).length}
                </div>
                <div className="text-xs text-gray-400">In Progress</div>
              </div>
              {selectedProjects.length > 0 && (
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-400">{selectedProjects.length}</div>
                  <div className="text-xs text-gray-400">Selected</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}