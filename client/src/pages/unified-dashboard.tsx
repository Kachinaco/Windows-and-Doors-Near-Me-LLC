import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Project } from "@shared/schema";
import { 
  Home,
  Users,
  Calendar,
  Clock,
  CheckSquare,
  Settings,
  BarChart3,
  MapPin,
  Timer,
  Activity,
  ChevronRight,
  ChevronDown,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Menu,
  X,
  ArrowLeft,
  FolderOpen,
  Folder,
  Eye,
  EyeOff
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface ProjectFolder {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  itemCount: number;
  subItems: any[];
  folders: any[];
  teamMembers: any[];
  isExpanded: boolean;
  color: string;
}

function UnifiedDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [showTimeline, setShowTimeline] = useState(true);
  const [newProjectDialog, setNewProjectDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states for sub-items and folders
  const [showSubItemDialog, setShowSubItemDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [newSubItemName, setNewSubItemName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  // Mutation for creating sub-items
  const createSubItemMutation = useMutation({
    mutationFn: async ({ projectId, name }: { projectId: number; name: string }) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/sub-items`, {
        name: name,
        folderId: null
      });
      return response.json();
    },
    onSuccess: () => {
      // Force a complete refresh of all project data
      queryClient.invalidateQueries({ queryKey: ["/api/projects-with-subitems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.refetchQueries({ queryKey: ["/api/projects-with-subitems"] });
      toast({ title: "Sub-item created", description: "New sub-item has been added successfully" });
      setShowSubItemDialog(false);
      setNewSubItemName("");
      setSelectedProjectId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create sub-item", variant: "destructive" });
    }
  });

  // Mutation for creating folders
  const createFolderMutation = useMutation({
    mutationFn: async ({ projectId, name }: { projectId: number; name: string }) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/sub-item-folders`, {
        name: name
      });
      return response.json();
    },
    onSuccess: () => {
      // Force a complete refresh of all project data
      queryClient.invalidateQueries({ queryKey: ["/api/projects-with-subitems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.refetchQueries({ queryKey: ["/api/projects-with-subitems"] });
      toast({ title: "Folder created", description: "New folder has been added successfully" });
      setShowFolderDialog(false);
      setNewFolderName("");
      setSelectedProjectId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create folder", variant: "destructive" });
    }
  });

  // Handler functions
  const handleAddSubItem = (projectId: number) => {
    setSelectedProjectId(projectId);
    setShowSubItemDialog(true);
  };

  const handleAddFolder = (projectId: number) => {
    setSelectedProjectId(projectId);
    setShowFolderDialog(true);
  };

  const handleCreateSubItem = () => {
    if (selectedProjectId && newSubItemName.trim()) {
      console.log("Creating sub-item:", { projectId: selectedProjectId, name: newSubItemName.trim() });
      createSubItemMutation.mutate({ 
        projectId: selectedProjectId, 
        name: newSubItemName.trim() 
      });
    }
  };

  const handleCreateFolder = () => {
    if (selectedProjectId && newFolderName.trim()) {
      console.log("Creating folder:", { projectId: selectedProjectId, name: newFolderName.trim() });
      createFolderMutation.mutate({ 
        projectId: selectedProjectId, 
        name: newFolderName.trim() 
      });
    }
  };

  // Fetch projects data
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch sub-items and folders for each project
  const { data: projectsData, isLoading: dataLoading } = useQuery({
    queryKey: ["/api/projects-with-subitems", projects.length || 0],
    queryFn: async () => {
      if (!projects || projects.length === 0) return [];
      
      const projectsWithData = await Promise.all(
        projects.map(async (project) => {
          try {
            // Ensure project has required properties
            if (!project || !project.id) {
              throw new Error('Invalid project data');
            }

            const [subItemsRes, foldersRes, teamRes] = await Promise.all([
              apiRequest("GET", `/api/projects/${project.id}/sub-items`),
              apiRequest("GET", `/api/projects/${project.id}/sub-item-folders`),
              apiRequest("GET", `/api/projects/${project.id}/team-members`)
            ]);
            
            // Check if responses are valid
            if (!subItemsRes.ok || !foldersRes.ok || !teamRes.ok) {
              throw new Error('API request failed');
            }
            
            const subItems = await subItemsRes.json();
            const folders = await foldersRes.json();
            const teamMembers = await teamRes.json();
            
            // Ensure arrays are properly initialized and log data
            const safeSubItems = Array.isArray(subItems) ? subItems : [];
            const safeFolders = Array.isArray(folders) ? folders : [];
            const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : [];
            
            // Debug logging
            console.log(`Project ${project.id} data:`, {
              subItems: safeSubItems.length,
              folders: safeFolders.length,
              teamMembers: safeTeamMembers.length,
              subItemsData: safeSubItems
            });
            
            return {
              ...project,
              description: project.description || null,
              subItems: safeSubItems,
              folders: safeFolders,
              teamMembers: safeTeamMembers,
              itemCount: safeSubItems.length,
              isExpanded: expandedProjects.has(project.id),
              color: getProjectColor(project.status)
            } as ProjectFolder;
          } catch (error) {
            console.error(`Error fetching data for project ${project.id}:`, error);
            return {
              ...project,
              subItems: [],
              folders: [],
              teamMembers: [],
              itemCount: 0,
              isExpanded: false,
              color: '#6b7280'
            };
          }
        })
      );
      return projectsWithData;
    },
    enabled: !projectsLoading && projects && projects.length > 0,
  });

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

  console.log("MondayBoard state:", {
    user: !!user,
    isLoading: dataLoading,
    projects: projects.length,
    projectsData: projectsData?.length || 0,
    error: null
  });

  const filteredProjects = projectsData?.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sidebarItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard", active: location === "/unified" },
    { icon: Users, label: "Teams", href: "/teams" },
    { icon: Calendar, label: "Calendar", href: "/calendar" },
    { icon: Clock, label: "Time Tracker", href: "/time-tracker" },
    { icon: CheckSquare, label: "My Tasks", href: "/my-tasks" },
    { icon: Settings, label: "Settings", href: "/settings" }
  ];

  // Calculate summary stats
  const totalTasks = filteredProjects.reduce((sum, p) => sum + p.itemCount, 0);
  const completedTasks = filteredProjects.reduce((sum, p) => 
    sum + p.subItems.filter((item: any) => item.status === 'complete').length, 0
  );
  const inProgressTasks = filteredProjects.reduce((sum, p) => 
    sum + p.subItems.filter((item: any) => item.status === 'in_progress').length, 0
  );
  const underReviewTasks = filteredProjects.reduce((sum, p) => 
    sum + p.subItems.filter((item: any) => item.status === 'under_review').length, 0
  );

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">Unified</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-gray-600 hover:bg-gray-100 rounded-lg"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={`${
                item.active 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm hover:border hover:border-gray-200'
              } group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 border border-transparent cursor-pointer`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className={`${
                item.active 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-600'
              } p-2 rounded-lg mr-3 transition-colors duration-200`}>
                <item.icon className="h-4 w-4" />
              </div>
              {item.label}
            </div>
          </Link>
        ))}
        
        <div className="pt-6 mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Projects</span>
            <Dialog open={newProjectDialog} onOpenChange={setNewProjectDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project Board</DialogTitle>
                </DialogHeader>
                <NewProjectForm onClose={() => setNewProjectDialog(false)} />
              </DialogContent>
            </Dialog>
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
                <div className="w-6 h-6 rounded-md mr-3 flex items-center justify-center" style={{ backgroundColor: `${project.color}20` }}>
                  <Folder className="h-3 w-3" style={{ color: project.color }} />
                </div>
                <span className="truncate flex-1 font-medium">{project.name}</span>
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-0">
                  {project.itemCount}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-['Inter',sans-serif]">
      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar - Light Mode Nickbakeddesign Style */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-100 pt-5 pb-4 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center flex-shrink-0 px-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">Unified</span>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="mt-8 flex-1 px-4 space-y-2">
            {sidebarItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={`${
                    item.active 
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-700 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm hover:border hover:border-gray-200'
                  } group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 border border-transparent cursor-pointer`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className={`${
                    item.active 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-600'
                  } p-2 rounded-lg mr-3 transition-colors duration-200`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  {item.label}
                </div>
              </Link>
            ))}
          </nav>
          
          {/* Projects Section */}
          <div className="px-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Projects
              </h3>
              <Dialog open={newProjectDialog} onOpenChange={setNewProjectDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project Board</DialogTitle>
                  </DialogHeader>
                  <NewProjectForm onClose={() => setNewProjectDialog(false)} />
                </DialogContent>
              </Dialog>
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
                  <div className="w-6 h-6 rounded-md mr-3 flex items-center justify-center" style={{ backgroundColor: `${project.color}20` }}>
                    <Folder className="h-3 w-3" style={{ color: project.color }} />
                  </div>
                  <span className="truncate flex-1 font-medium">{project.name}</span>
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-0">
                    {project.itemCount}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Project Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTimeline(!showTimeline)}
                className="hidden sm:flex"
              >
                {showTimeline ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="ml-1">Timeline</span>
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Timeline Summary Bar */}
        {showTimeline && (
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-3">
                <div className="text-sm text-gray-600">Total Tasks</div>
                <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
              </Card>
              <Card className="p-3">
                <div className="text-sm text-gray-600">In Progress</div>
                <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
              </Card>
              <Card className="p-3">
                <div className="text-sm text-gray-600">Under Review</div>
                <div className="text-2xl font-bold text-orange-600">{underReviewTasks}</div>
              </Card>
              <Card className="p-3">
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
              </Card>
            </div>
          </div>
        )}

        {/* Project Boards Section */}
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Project Boards</h2>
              <Dialog open={newProjectDialog} onOpenChange={setNewProjectDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Board
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project Board</DialogTitle>
                  </DialogHeader>
                  <NewProjectForm onClose={() => setNewProjectDialog(false)} />
                </DialogContent>
              </Dialog>
            </div>

            {dataLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <ProjectFolderCard
                    key={project.id}
                    project={project}
                    isExpanded={expandedProjects.has(project.id)}
                    onToggle={() => toggleProject(project.id)}
                    onAddSubItem={handleAddSubItem}
                    onAddFolder={handleAddFolder}
                  />
                ))}
                
                {filteredProjects.length === 0 && (
                  <Card className="p-8 text-center">
                    <div className="text-gray-500">
                      {searchTerm ? `No projects found matching "${searchTerm}"` : "No projects found"}
                    </div>
                    <Button 
                      className="mt-4" 
                      onClick={() => setNewProjectDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Project
                    </Button>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Dialog for Adding Sub Items */}
        <Dialog open={showSubItemDialog} onOpenChange={setShowSubItemDialog}>
          <DialogContent aria-describedby="sub-item-description">
            <DialogHeader>
              <DialogTitle>Add New Sub Item</DialogTitle>
              <p id="sub-item-description" className="text-sm text-gray-600">
                Create a new task or item for this project
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subItemName">Sub Item Name</Label>
                <Input
                  id="subItemName"
                  value={newSubItemName}
                  onChange={(e) => setNewSubItemName(e.target.value)}
                  placeholder="Enter sub item name..."
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateSubItem()}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSubItemDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSubItem}
                  disabled={!newSubItemName.trim() || createSubItemMutation.isPending}
                >
                  {createSubItemMutation.isPending ? "Creating..." : "Create Sub Item"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for Adding Folders */}
        <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
          <DialogContent aria-describedby="folder-description">
            <DialogHeader>
              <DialogTitle>Add New Folder</DialogTitle>
              <p id="folder-description" className="text-sm text-gray-600">
                Create a new folder to organize sub-items in this project
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folderName">Folder Name</Label>
                <Input
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowFolderDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || createFolderMutation.isPending}
                >
                  {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Project Folder Card Component
function ProjectFolderCard({ 
  project, 
  isExpanded, 
  onToggle,
  onAddSubItem,
  onAddFolder
}: { 
  project: ProjectFolder; 
  isExpanded: boolean; 
  onToggle: () => void;
  onAddSubItem: (projectId: number) => void;
  onAddFolder: (projectId: number) => void;
}) {
  return (
    <Card className="border border-gray-200 rounded-xl shadow-sm transition-all duration-200 hover:shadow-lg hover:border-gray-300 bg-white">
      {/* Folder Header */}
      <div 
        className="p-4 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-5 w-5" style={{ color: project.color }} />
              ) : (
                <Folder className="h-5 w-5" style={{ color: project.color }} />
              )}
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">{project.name}</h3>
              <p className="text-sm text-gray-600">{project.description || "No description"}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="text-xs">
              {project.itemCount} tasks
            </Badge>
            <Badge 
              className={`${getStatusColor(project.status)} rounded-full px-3 py-1 text-xs font-medium border-0`}
            >
              {project.status.replace('_', ' ')}
            </Badge>
            <div className="flex -space-x-1">
              {project.teamMembers.slice(0, 3).map((member, idx) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-white">
                  <AvatarFallback className="text-xs">
                    {member.firstName?.[0]}{member.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.teamMembers.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{project.teamMembers.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Board View */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <ProjectBoardTable 
            project={project} 
            onAddSubItem={onAddSubItem}
            onAddFolder={onAddFolder}
          />
        </div>
      )}
    </Card>
  );
}

// Project Board Table Component
function ProjectBoardTable({ 
  project, 
  onAddSubItem, 
  onAddFolder 
}: { 
  project: ProjectFolder; 
  onAddSubItem: (projectId: number) => void;
  onAddFolder: (projectId: number) => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Board Items</h4>
        <div className="flex items-center space-x-3">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAddSubItem(project.id)}
            className="rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 px-4 py-2 font-medium shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Sub Item
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAddFolder(project.id)}
            className="rounded-lg border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 px-4 py-2 font-medium shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Folder
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Assignee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Progress
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {project.subItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No items yet. Click "Add Item" to get started.
                  </td>
                </tr>
              ) : (
                project.subItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {item.name || `Item ${index + 1}`}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge 
                        variant="outline"
                        className={getStatusColor(item.status)}
                      >
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {item.assignedTo && (
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {item.assignedTo.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{item.assignedTo}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${item.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {item.progress || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// New Project Form Component
function NewProjectForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "new lead"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        onClose();
        window.location.reload(); // Refresh to show new project
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter project name..."
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Project description..."
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="status">Initial Status</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
        >
          <SelectTrigger>
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
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Create Project Board
        </Button>
      </div>
    </form>
  );
}

function getStatusColor(status: string) {
  const colors = {
    'new_lead': 'text-yellow-700 bg-yellow-50 border-yellow-200',
    'in_progress': 'text-blue-700 bg-blue-50 border-blue-200',
    'on_order': 'text-purple-700 bg-purple-50 border-purple-200',
    'scheduled': 'text-green-700 bg-green-50 border-green-200',
    'complete': 'text-emerald-700 bg-emerald-50 border-emerald-200',
    'under_review': 'text-orange-700 bg-orange-50 border-orange-200',
    'not_started': 'text-gray-700 bg-gray-50 border-gray-200'
  };
  return colors[status as keyof typeof colors] || colors.not_started;
}

export default UnifiedDashboard;