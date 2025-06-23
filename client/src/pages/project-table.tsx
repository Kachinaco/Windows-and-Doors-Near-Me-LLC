import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { type Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus,
  Search,
  Phone,
  FileText,
  Calendar,
  MapPin,
  Users
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

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/employees'],
    enabled: !!user,
  });

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    
    return projects.filter((project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>
        
        {/* Search and filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-gray-500">
            {selectedProjects.length > 0 && `${selectedProjects.length} selected`}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full">
          <thead className="bg-gray-800 text-white sticky top-0">
            <tr>
              <th className="w-12 p-3 text-left">
                <Checkbox
                  checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="p-3 text-left font-medium">Item</th>
              <th className="p-3 text-left font-medium">People</th>
              <th className="p-3 text-left font-medium">Location</th>
              <th className="p-3 text-left font-medium">Phone</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">Measure Date</th>
              <th className="p-3 text-left font-medium">Delivery Date</th>
              <th className="p-3 text-left font-medium">Install Date</th>
              <th className="p-3 text-left font-medium">Files</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProjects.map((project: Project, index: number) => {
              const assignedEmployee = getAssignedEmployee(project.assignedTo || 0);
              const isSelected = selectedProjects.includes(project.id);
              
              return (
                <tr 
                  key={project.id}
                  className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''} ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="p-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleRowSelect(project.id, checked as boolean)}
                    />
                  </td>
                  
                  {/* Item */}
                  <td className="p-3">
                    <Link href={`/projects/${project.id}`}>
                      <div className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                        {project.name}
                      </div>
                      {project.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {project.description}
                        </div>
                      )}
                    </Link>
                  </td>
                  
                  {/* People */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {assignedEmployee ? (
                        <>
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-pink-500 text-white text-xs">
                              {assignedEmployee.firstName?.[0]}{assignedEmployee.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-700">
                            {assignedEmployee.firstName} {assignedEmployee.lastName}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                          </div>
                          <span className="text-sm">Unassigned</span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Location */}
                  <td className="p-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {project.projectAddress || 'Not specified'}
                    </div>
                  </td>
                  
                  {/* Phone */}
                  <td className="p-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {project.clientPhone || 'Not provided'}
                    </div>
                  </td>
                  
                  {/* Status */}
                  <td className="p-3">
                    <Badge className={`${getStatusColor(project.status)} px-3 py-1 rounded-full text-xs font-medium`}>
                      {project.status}
                    </Badge>
                  </td>
                  
                  {/* Measure Date */}
                  <td className="p-3 text-sm text-gray-600">
                    {formatDate(project.startDate)}
                  </td>
                  
                  {/* Delivery Date */}
                  <td className="p-3 text-sm text-gray-600">
                    {formatDate(project.endDate)}
                  </td>
                  
                  {/* Install Date */}
                  <td className="p-3 text-sm text-gray-600">
                    {formatDate(project.createdAt)}
                  </td>
                  
                  {/* Files */}
                  <td className="p-3">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
            
            {/* Add new row */}
            <tr className="hover:bg-gray-50">
              <td colSpan={10} className="p-3">
                <Button variant="ghost" className="text-blue-600 hover:text-blue-700 w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No projects found</div>
            {searchTerm && (
              <Button 
                variant="link" 
                onClick={() => setSearchTerm("")}
                className="text-blue-600"
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Footer with summary */}
      <div className="bg-gray-800 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-pink-500 text-white text-xs">A</AvatarFallback>
              </Avatar>
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-gray-600 text-white text-xs">B</AvatarFallback>
              </Avatar>
            </div>
            <Badge className="bg-green-500 text-white px-2 py-1">Complete</Badge>
            <span>Mar 25</span>
            <span>0 actions</span>
          </div>
          <div className="text-sm text-gray-300">
            {filteredProjects.length} projects total
          </div>
        </div>
      </div>
    </div>
  );
}