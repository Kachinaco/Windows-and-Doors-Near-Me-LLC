import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Menu,
  Plus,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  MapPin,
  Phone,
  User,
  Building,
  Search,
  MoreHorizontal
} from "lucide-react";

// Types
interface Project {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  assigned_to?: string | null;
  project_address?: string | null;
  client_phone?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectForm {
  name: string;
  description: string;
  status: string;
  assigned_to: string;
  project_address: string;
  client_phone: string;
}

function NewProjectForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState<ProjectForm>({
    name: '',
    description: '',
    status: 'new lead',
    assigned_to: '',
    project_address: '',
    client_phone: ''
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectForm) => apiRequest('POST', '/api/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Project created successfully!" });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create project", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Project name is required", variant: "destructive" });
      return;
    }
    createProjectMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Project Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter project name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter project description"
            className="mt-1"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new lead">New Lead</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="on order">On Order</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="assigned_to">Assigned To</Label>
          <Input
            id="assigned_to"
            value={formData.assigned_to}
            onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
            placeholder="Enter assignee name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="project_address">Project Address</Label>
          <Input
            id="project_address"
            value={formData.project_address}
            onChange={(e) => setFormData(prev => ({ ...prev, project_address: e.target.value }))}
            placeholder="Enter project address"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="client_phone">Client Phone</Label>
          <Input
            id="client_phone"
            value={formData.client_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
            placeholder="Enter client phone number"
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createProjectMutation.isPending}>
          {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}

function UnifiedDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newProjectDialog, setNewProjectDialog] = useState(false);

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Utility functions
  const getProjectColor = (status: string) => {
    const colors = {
      'new lead': '#f59e0b',
      'in progress': '#3b82f6',
      'on order': '#8b5cf6',
      'scheduled': '#10b981',
      'complete': '#22c55e',
      'under_review': '#f97316',
      'not_started': '#6b7280'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      'new lead': 'bg-amber-100 text-amber-800 border-amber-200',
      'in progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'on order': 'bg-purple-100 text-purple-800 border-purple-200',
      'scheduled': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'complete': 'bg-green-100 text-green-800 border-green-200',
      'under_review': 'bg-orange-100 text-orange-800 border-orange-200',
      'not_started': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    total: projects.length,
    newLeads: projects.filter(p => p.status === 'new lead').length,
    inProgress: projects.filter(p => p.status === 'in progress').length,
    completed: projects.filter(p => p.status === 'complete').length
  };

  // Mutations for unified dashboard sub-items and folders
  const addSubItemMutation = useMutation({
    mutationFn: ({ projectId, name }: { projectId: number; name: string }) =>
      apiRequest('POST', `/api/unified-dashboard/projects/${projectId}/sub-items`, { name, status: 'not_started' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Unified sub-item added successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to add unified sub-item", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const addFolderMutation = useMutation({
    mutationFn: ({ projectId, name }: { projectId: number; name: string }) =>
      apiRequest('POST', `/api/unified-dashboard/projects/${projectId}/folders`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Unified folder added successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to add unified folder", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const toggleProject = (projectId: number) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleAddSubItem = (projectId: number) => {
    const name = prompt("Enter sub-item name:");
    if (name && name.trim()) {
      addSubItemMutation.mutate({ projectId, name: name.trim() });
    }
  };

  const handleAddFolder = (projectId: number) => {
    const name = prompt("Enter folder name:");
    if (name && name.trim()) {
      addFolderMutation.mutate({ projectId, name: name.trim() });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="h-full bg-white">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Project Board</h2>
                    <p className="text-xs text-gray-500">Unified Dashboard</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Projects</h3>
                  <Button
                    size="sm"
                    onClick={() => setNewProjectDialog(true)}
                    className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New
                  </Button>
                </div>
                
                <div className="space-y-1">
                  {filteredProjects.slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50 hover:shadow-sm cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200"
                      onClick={() => {
                        toggleProject(project.id);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <div className="w-6 h-6 rounded-md mr-3 flex items-center justify-center" style={{ backgroundColor: `${getProjectColor(project.status)}20` }}>
                        <Folder className="h-3 w-3" style={{ color: getProjectColor(project.status) }} />
                      </div>
                      <span className="truncate flex-1 font-medium">{project.name}</span>
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-0">
                        0
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <h1 className="text-lg font-semibold text-gray-900">Project Board</h1>
        
        <Button
          size="sm"
          onClick={() => setNewProjectDialog(true)}
          className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-3 w-3 mr-1" />
          New
        </Button>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 bg-white border-r border-gray-200 h-screen sticky top-0">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Project Board</h2>
                <p className="text-xs text-gray-500">Unified Dashboard</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">Projects</h3>
              <Button
                size="sm"
                onClick={() => setNewProjectDialog(true)}
                className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
            </div>
            
            <div className="space-y-1">
              {filteredProjects.slice(0, 10).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50 hover:shadow-sm cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200"
                  onClick={() => toggleProject(project.id)}
                >
                  <div className="w-6 h-6 rounded-md mr-3 flex items-center justify-center" style={{ backgroundColor: `${getProjectColor(project.status)}20` }}>
                    {expandedProjects.has(project.id) ? (
                      <FolderOpen className="h-3 w-3" style={{ color: getProjectColor(project.status) }} />
                    ) : (
                      <Folder className="h-3 w-3" style={{ color: getProjectColor(project.status) }} />
                    )}
                  </div>
                  <span className="truncate flex-1 font-medium">{project.name}</span>
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-0">
                    0
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Total: {stats.total}</span>
                    <span>•</span>
                    <span>New: {stats.newLeads}</span>
                    <span>•</span>
                    <span>Active: {stats.inProgress}</span>
                    <span>•</span>
                    <span>Complete: {stats.completed}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
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
            </div>
          </div>

          {/* Projects List */}
          <div className="p-6">
            {projectsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria."
                    : "Create your first project to get started."
                  }
                </p>
                <Button onClick={() => setNewProjectDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="transition-all duration-200 hover:shadow-md border border-gray-200">
                    <CardContent className="p-0">
                      {/* Project Header */}
                      <div 
                        className="flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                        onClick={() => toggleProject(project.id)}
                      >
                        <div className="flex items-center flex-1">
                          <div className="mr-3">
                            {expandedProjects.has(project.id) ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center" style={{ backgroundColor: `${getProjectColor(project.status)}20` }}>
                            {expandedProjects.has(project.id) ? (
                              <FolderOpen className="h-4 w-4" style={{ color: getProjectColor(project.status) }} />
                            ) : (
                              <Folder className="h-4 w-4" style={{ color: getProjectColor(project.status) }} />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-gray-900">{project.name}</h3>
                              <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                                {project.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            {project.description && (
                              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                            )}

                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              {project.project_address && (
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span>{project.project_address}</span>
                                </div>
                              )}
                              {project.client_phone && (
                                <div className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  <span>{project.client_phone}</span>
                                </div>
                              )}
                              {project.assigned_to && (
                                <div className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  <span>{project.assigned_to}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              0 items
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedProjects.has(project.id) && (
                        <div className="border-t border-gray-100 bg-gray-50">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-gray-900">Project Details</h4>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddSubItem(project.id);
                                  }}
                                  className="text-xs h-7"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Sub Item
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddFolder(project.id);
                                  }}
                                  className="text-xs h-7"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Folder
                                </Button>
                              </div>
                            </div>

                            {/* Project Table */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                      <th className="px-4 py-3 text-left font-medium text-gray-700">Item</th>
                                      <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                                      <th className="px-4 py-3 text-left font-medium text-gray-700">Assignee</th>
                                      <th className="px-4 py-3 text-left font-medium text-gray-700">Created</th>
                                      <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    <tr>
                                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                          <Folder className="h-8 w-8 text-gray-300 mb-2" />
                                          <p>No sub-items yet</p>
                                          <p className="text-xs">Click "Add Sub Item" to get started</p>
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Project Dialog */}
      <Dialog open={newProjectDialog} onOpenChange={setNewProjectDialog}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <div id="dialog-description" className="sr-only">
              Create a new project with details like name, description, status, and assignments.
            </div>
          </DialogHeader>
          <NewProjectForm onClose={() => setNewProjectDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UnifiedDashboard;