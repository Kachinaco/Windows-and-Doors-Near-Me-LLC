import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { type Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SimpleProjectTable from "@/components/SimpleProjectTable";
import { 
  ArrowLeft,
  Plus,
  Search,
  Clock,
  FolderOpen,
  Calendar,
  BarChart3,
  GripVertical,
  Building2,
  UserIcon,
  LogOut
} from "lucide-react";
import { Link } from "wouter";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

// Draggable Project Card Component
function DraggableProjectCard({ project }: { project: Project }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ 
    id: `project-${project.id}`,
    data: { project }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new_lead': 'bg-blue-100 text-blue-800 border-blue-300',
      'need_attention': 'bg-red-100 text-red-800 border-red-300',
      'sent_estimate': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'signed': 'bg-green-100 text-green-800 border-green-300',
      'need_ordered': 'bg-orange-100 text-orange-800 border-orange-300',
      'ordered': 'bg-purple-100 text-purple-800 border-purple-300',
      'need_scheduled': 'bg-teal-100 text-teal-800 border-teal-300',
      'scheduled': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'in_progress': 'bg-amber-100 text-amber-800 border-amber-300',
      'completed': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'follow_up': 'bg-pink-100 text-pink-800 border-pink-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 rotate-3 scale-105' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{project.name}</h3>
          <p className="text-xs text-gray-500 mt-1">{project.projectAddress || 'No address'}</p>
        </div>
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={`text-xs px-2 py-1 ${getStatusColor(project.status)}`}>
          {project.status.replace('_', ' ').toUpperCase()}
        </Badge>
        <span className="text-xs text-gray-500">
          {project.estimatedCost || '$0'}
        </span>
      </div>
    </div>
  );
}

// Droppable Folder Component
function DroppableFolder({ name, projects, color, description, id }: {
  name: string;
  projects: Project[];
  color: string;
  description: string;
  id: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`border border-gray-200 rounded-lg bg-white transition-all ${
        isOver ? 'bg-blue-50 border-blue-300' : ''
      }`}
    >
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${color}`}></div>
            <div>
              <h3 className="font-semibold text-gray-900">{name}</h3>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {projects.length}
          </Badge>
        </div>
      </div>
      
      <div className="p-4 space-y-3 min-h-[200px]">
        {projects.map((project) => (
          <DraggableProjectCard key={project.id} project={project} />
        ))}
        {projects.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <FolderOpen className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No projects in this folder</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'folders' | 'table'>('folders');
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: number; status: string }) => {
      return apiRequest(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project status updated successfully",
      });
    },
    onError: (error) => {
      console.error('❌ Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive",
      });
    },
  });

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !active.data.current?.project) {
      return;
    }

    const project = active.data.current.project;
    const overId = over.id as string;
    
    // Map folder IDs to statuses
    const folderStatusMap: Record<string, string> = {
      'new-leads': 'new_lead',
      'active-projects': 'sent_estimate', 
      'scheduled-work': 'scheduled',
      'completed': 'completed'
    };

    const newStatus = folderStatusMap[overId];
    if (newStatus && project.status !== newStatus) {
      updateProjectMutation.mutate({ 
        projectId: project.id, 
        status: newStatus 
      });
    }
  }, [updateProjectMutation]);

  // Group projects by status for folder view
  const projectFolders = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    
    const folders = [
      { 
        name: 'New Leads', 
        statuses: ['new_lead', 'need_attention'], 
        color: 'bg-blue-500',
        description: 'Fresh inquiries and leads requiring attention',
        id: 'new-leads'
      },
      { 
        name: 'Active Projects', 
        statuses: ['sent_estimate', 'signed', 'need_ordered', 'ordered'], 
        color: 'bg-purple-500',
        description: 'Projects in progress with estimates or orders',
        id: 'active-projects'
      },
      { 
        name: 'Scheduled Work', 
        statuses: ['need_scheduled', 'scheduled', 'in_progress'], 
        color: 'bg-orange-500',
        description: 'Jobs ready for scheduling or currently in progress',
        id: 'scheduled-work'
      },
      { 
        name: 'Completed', 
        statuses: ['completed', 'follow_up'], 
        color: 'bg-green-500',
        description: 'Finished projects and follow-up tasks',
        id: 'completed'
      },
    ];

    return folders.map(folder => ({
      ...folder,
      projects: projects.filter(p => folder.statuses.includes(p.status)),
      count: projects.filter(p => folder.statuses.includes(p.status)).length
    }));
  }, [projects]);

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.projectAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  const totalProjects = projects.length;
  const activeProjectsCount = projects.filter(p => ['sent_estimate', 'signed', 'need_ordered', 'ordered'].includes(p.status)).length;
  const completedProjectsCount = projects.filter(p => ['completed', 'follow_up'].includes(p.status)).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
                  <p className="text-sm text-gray-600">
                    {viewMode === 'folders' 
                      ? 'Drag and drop projects between folders to update their status' 
                      : 'Manage projects with inline editing and collaboration tools'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {user?.firstName} {user?.lastName} ({user?.role})
                </span>
              </div>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">{totalProjects} Total</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">{activeProjectsCount} Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">{completedProjectsCount} Completed</span>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant={viewMode === 'folders' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('folders')}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Folders
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Table
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {viewMode === 'folders' ? (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {projectFolders.map((folder) => (
                <DroppableFolder
                  key={folder.id}
                  id={folder.id}
                  name={folder.name}
                  projects={searchTerm ? filteredProjects.filter(p => folder.statuses.includes(p.status)) : folder.projects}
                  color={folder.color}
                  description={folder.description}
                />
              ))}
            </div>
            
            <DragOverlay>
              {activeId ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg rotate-3">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">Moving project...</span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            <SimpleProjectTable height="700px" />
          </div>
        )}
      </div>
    </div>
  );
}