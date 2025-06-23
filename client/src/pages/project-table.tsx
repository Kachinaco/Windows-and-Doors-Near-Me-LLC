import { useState, useMemo } from "react";
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
} from "@/components/ui/dropdown-menu";
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
  ChevronDown
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

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/employees'],
    enabled: !!user,
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
            
            {/* Results summary */}
            <div className="flex items-center gap-4 text-sm text-gray-500 ml-auto">
              {selectedProjects.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {selectedProjects.length} selected
                  </Badge>
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
              <th className="p-4 text-left font-semibold tracking-wide border-r border-gray-700 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Item
                </div>
              </th>
              <th className="p-4 text-left font-semibold tracking-wide border-r border-gray-700 min-w-[150px]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  People
                </div>
              </th>
              <th className="p-4 text-left font-semibold tracking-wide border-r border-gray-700 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
              </th>
              <th className="p-4 text-left font-semibold tracking-wide border-r border-gray-700 min-w-[140px]">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </div>
              </th>
              <th className="p-4 text-left font-semibold tracking-wide border-r border-gray-700 min-w-[120px]">
                Status
              </th>
              <th className="p-4 text-left font-semibold tracking-wide border-r border-gray-700 min-w-[120px]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Measure Date
                </div>
              </th>
              <th className="p-4 text-left font-semibold tracking-wide border-r border-gray-700 min-w-[120px]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Delivery Date
                </div>
              </th>
              <th className="p-4 text-left font-semibold tracking-wide border-r border-gray-700 min-w-[120px]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Install Date
                </div>
              </th>
              <th className="p-4 text-left font-semibold tracking-wide min-w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProjects.map((project, index: number) => {
              const assignedEmployee = getAssignedEmployee(project.assignedTo || 0);
              const isSelected = selectedProjects.includes(project.id);
              
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
                  
                  {/* Item */}
                  <td className="p-4 border-r border-gray-100">
                    <Link href={`/projects/${project.id}`}>
                      <div className="group cursor-pointer">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 text-sm">
                          {project.name}
                        </div>
                        {project.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-xs">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  </td>
                  
                  {/* People */}
                  <td className="p-4 border-r border-gray-100">
                    <div className="flex items-center gap-3">
                      {assignedEmployee ? (
                        <>
                          <Avatar className="w-9 h-9 ring-2 ring-white shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs font-semibold">
                              {assignedEmployee.firstName?.[0]}{assignedEmployee.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignedEmployee.firstName} {assignedEmployee.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {assignedEmployee.role || 'Team Member'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-sm">
                            <Users className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Unassigned</div>
                            <div className="text-xs text-gray-400">No team member</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Location */}
                  <td className="p-4 border-r border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-900 font-medium">
                          {project.projectAddress || 'Location TBD'}
                        </div>
                        <div className="text-xs text-gray-500">Project site</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Phone */}
                  <td className="p-4 border-r border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-900 font-medium">
                          {project.clientPhone || 'No phone'}
                        </div>
                        <div className="text-xs text-gray-500">Contact</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Status */}
                  <td className="p-4 border-r border-gray-100">
                    <Badge className={`${getStatusColor(project.status)} px-3 py-2 rounded-lg text-xs font-semibold shadow-sm`}>
                      {project.status}
                    </Badge>
                  </td>
                  
                  {/* Measure Date */}
                  <td className="p-4 border-r border-gray-100">
                    <div className="text-sm text-gray-900 font-medium">
                      {formatDate(project.startDate) || '—'}
                    </div>
                    <div className="text-xs text-gray-500">Start date</div>
                  </td>
                  
                  {/* Delivery Date */}
                  <td className="p-4 border-r border-gray-100">
                    <div className="text-sm text-gray-900 font-medium">
                      {formatDate(project.endDate) || '—'}
                    </div>
                    <div className="text-xs text-gray-500">Target end</div>
                  </td>
                  
                  {/* Install Date */}
                  <td className="p-4 border-r border-gray-100">
                    <div className="text-sm text-gray-900 font-medium">
                      {formatDate(project.createdAt) || '—'}
                    </div>
                    <div className="text-xs text-gray-500">Created</div>
                  </td>
                  
                  {/* Actions */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${project.id}`}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors"
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