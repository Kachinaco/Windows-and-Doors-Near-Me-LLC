import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { type Project } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  FolderOpen,
  ChevronRight,
  MoreHorizontal,
  Users,
  Calendar,
  Phone,
  MapPin
} from "lucide-react";
import { Link } from "wouter";

type ViewMode = 'folders' | 'project-dashboard';

export default function ProjectPortfolioPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('folders');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Group projects by status for folder view
  const projectFolders = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    
    const folders = [
      { name: 'New Leads', status: 'new_lead', color: 'bg-blue-500' },
      { name: 'In Progress', status: 'in_progress', color: 'bg-green-500' },
      { name: 'Scheduled', status: 'scheduled', color: 'bg-orange-500' },
      { name: 'Completed', status: 'completed', color: 'bg-gray-500' },
    ];

    return folders.map(folder => ({
      ...folder,
      projects: projects.filter(p => p.status === folder.status),
      count: projects.filter(p => p.status === folder.status).length
    }));
  }, [projects]);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      status: "new_lead",
      priority: "medium",
      serviceType: "windows",
      estimatedCost: 0,
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/projects", data);
      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setViewMode('project-dashboard');
  }, []);

  const handleBackToFolders = useCallback(() => {
    setViewMode('folders');
    setSelectedProject(null);
  }, []);

  const onSubmit = useCallback((data: any) => {
    createProjectMutation.mutate(data);
  }, [createProjectMutation]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "medium": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "low": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "new_lead": { label: "New Lead", variant: "secondary" as const },
      "need_attention": { label: "Need Attention", variant: "destructive" as const },
      "sent_estimate": { label: "Sent Estimate", variant: "outline" as const },
      "signed": { label: "Signed", variant: "default" as const },
      "need_ordered": { label: "Need Ordered", variant: "secondary" as const },
      "ordered": { label: "Ordered", variant: "outline" as const },
      "need_scheduled": { label: "Need Scheduled", variant: "secondary" as const },
      "scheduled": { label: "Scheduled", variant: "default" as const },
      "in_progress": { label: "In Progress", variant: "default" as const },
      "completed": { label: "Completed", variant: "secondary" as const },
      "follow_up": { label: "Follow Up", variant: "outline" as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (viewMode === 'project-dashboard' && selectedProject) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Project Dashboard Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToFolders}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Projects
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedProject.title}</h1>
                  <p className="text-sm text-gray-600">Project #{selectedProject.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(selectedProject.status)}
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Project Dashboard Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <Select defaultValue="main-table">
                  <SelectTrigger className="w-48 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main-table">📋 Main Table</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updates
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      People
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payout
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Coming Soon Section */}
                  <tr className="bg-blue-50">
                    <td colSpan={8} className="px-6 py-2 text-sm font-medium text-blue-600">
                      Coming soon
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Initial Consultation
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Users className="h-4 w-4 text-gray-400" />
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-medium">
                          OA
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        Not Accepted
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${selectedProject.estimatedCost?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </Button>
                    </td>
                  </tr>

                  {/* Scheduled Section */}
                  <tr className="bg-green-50">
                    <td colSpan={8} className="px-6 py-2 text-sm font-medium text-green-600">
                      Scheduled
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Window Installation
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Users className="h-4 w-4 text-gray-400" />
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-medium">
                          OA
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Accepted
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      9:00 AM
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      $450
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">🇺🇸 (619) 867-6220</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">📍 16815 North 62nd</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
                <p className="text-gray-600 mt-1">Organize and track your projects by status</p>
              </div>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Loading State */}
        {projectsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-48">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Project Folders */}
        {!projectsLoading && (
          <div className="space-y-8">
            {projectFolders.map((folder) => (
              <div key={folder.status}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-4 h-4 rounded ${folder.color}`}></div>
                  <h2 className="text-xl font-semibold text-gray-900">{folder.name}</h2>
                  <Badge variant="secondary" className="ml-2">{folder.count}</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {folder.projects
                    .filter(project => 
                      searchTerm === "" || 
                      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      project.id.toString().includes(searchTerm)
                    )
                    .map((project) => (
                    <Card 
                      key={project.id} 
                      className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200"
                      onClick={() => handleOpenProject(project)}
                    >
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 leading-tight">{project.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">Project #{project.id}</p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getPriorityIcon(project.priority)}
                              <span className="text-sm capitalize text-gray-600">{project.priority}</span>
                            </div>
                            {getStatusBadge(project.status)}
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-lg font-semibold text-gray-900">
                                ${project.estimatedCost?.toLocaleString() || '0'}
                              </span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {folder.projects.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No projects in {folder.name.toLowerCase()}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Project Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  {...form.register("title", { required: "Title is required" })}
                  placeholder="Enter project title"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Project description (optional)"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_lead">New Lead</SelectItem>
                      <SelectItem value="need_attention">Need Attention</SelectItem>
                      <SelectItem value="sent_estimate">Sent Estimate</SelectItem>
                      <SelectItem value="signed">Signed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={form.watch("priority")} onValueChange={(value) => form.setValue("priority", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select value={form.watch("serviceType")} onValueChange={(value) => form.setValue("serviceType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="windows">Windows</SelectItem>
                      <SelectItem value="doors">Doors</SelectItem>
                      <SelectItem value="both">Windows & Doors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="estimatedCost">Estimated Cost</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    {...form.register("estimatedCost", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProjectMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}