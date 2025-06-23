import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { type Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Plus,
  Search,
  Clock,
  FolderOpen,
  Calendar,
  BarChart3,
  GripVertical
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

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card 
        className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
          isDragging ? 'shadow-lg ring-2 ring-blue-500 opacity-50' : ''
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div {...listeners} className="cursor-grab p-1">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                <p className="text-sm text-gray-500 mb-2">Project #{project.id}</p>
                {project.description && (
                  <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Medium
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {project.status === 'new_lead' ? 'New Lead' : project.status.replace('_', ' ')}
                  </Badge>
                  {project.estimatedCost && (
                    <span className="font-medium text-green-600">
                      ${project.estimatedCost}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link href={`/project-detail/${project.id}`}>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800" onClick={(e) => e.stopPropagation()}>
                  View Details →
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Droppable Folder Component
function DroppableFolder({ 
  folder,
  onPipelineClick 
}: { 
  folder: any;
  onPipelineClick?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.name.toLowerCase().replace(/\s+/g, '_')}`,
    data: { folder }
  });

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded ${folder.color}`}></div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{folder.name}</h2>
            <p className="text-sm text-gray-600">{folder.description}</p>
          </div>
          <Badge variant="secondary" className="ml-2">{folder.count}</Badge>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          {folder.name === 'New Leads' && (
            <Link href="/leads">
              <Button variant="outline" size="sm">
                View All Leads
              </Button>
            </Link>
          )}
          {folder.name === 'Scheduled Work' && (
            <Link href="/scheduling">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                Schedule
              </Button>
            </Link>
          )}
          {folder.name === 'Active Projects' && onPipelineClick && (
            <Button variant="outline" size="sm" onClick={onPipelineClick}>
              <BarChart3 className="h-4 w-4 mr-1" />
              Pipeline
            </Button>
          )}
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className={`min-h-[200px] p-4 rounded-lg border-2 transition-all duration-200 ${
          isOver 
            ? 'bg-blue-50 border-blue-300 border-dashed shadow-lg' 
            : 'bg-white border-gray-200'
        }`}
      >
        {folder.projects.length > 0 ? (
          <div className="space-y-4">
            {folder.projects.map((project: Project) => (
              <DraggableProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">No projects in {folder.name.toLowerCase()}</p>
            {folder.name === 'New Leads' && (
              <Link href="/leads">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Drop zone indicator */}
        {isOver && (
          <div className="mt-4 p-6 border-2 border-dashed border-blue-400 rounded-lg bg-blue-100 text-center text-blue-700 font-medium">
            <div className="text-lg">📁 Drop project here to move to {folder.name}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectPortfolioPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Mutation to update project status
  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: number; status: string }) => {
      const { apiRequest } = await import("@/lib/queryClient");
      return apiRequest(`/api/projects/${projectId}`, {
        method: "PUT",
        body: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project moved successfully!",
      });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to move project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    console.log('🚀 Drag started:', event.active.id);
    setActiveId(event.active.id);
    
    // Extract project ID from the dragged item
    const projectId = String(event.active.id).replace('project-', '');
    const project = projects.find(p => p.id === Number(projectId));
    setActiveProject(project || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('🎯 Drag ended:', { activeId: active.id, overId: over?.id });
    
    setActiveId(null);
    setActiveProject(null);

    if (!over) {
      console.log('❌ No drop target');
      return;
    }

    // Extract IDs
    const projectId = Number(String(active.id).replace('project-', ''));
    const folderId = String(over.id).replace('folder-', '');
    
    console.log('📊 Processing:', { projectId, folderId });

    // Map folder IDs to actual status values
    const folderToStatusMap: Record<string, string> = {
      'new_leads': "new_lead",
      'active_projects': "sent_estimate", 
      'scheduled_work': "scheduled",
      'completed': "completed"
    };

    const newStatus = folderToStatusMap[folderId];
    if (!newStatus) {
      console.log('❌ Invalid folder ID:', folderId);
      return;
    }

    // Find the project
    const project = projects.find((p: Project) => p.id === projectId);
    if (!project) {
      console.log('❌ Project not found:', projectId);
      return;
    }

    if (project.status === newStatus) {
      console.log('⚠️ Project already has this status');
      return;
    }

    console.log('✅ Updating project status from', project.status, 'to', newStatus);
    updateProjectMutation.mutate({ projectId, status: newStatus });
  };

  // Group projects by status for folder view
  const projectFolders = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    
    const folders = [
      { 
        name: 'New Leads', 
        statuses: ['new_lead', 'need_attention'], 
        color: 'bg-blue-500',
        description: 'Fresh inquiries and leads requiring attention'
      },
      { 
        name: 'Active Projects', 
        statuses: ['sent_estimate', 'signed', 'need_ordered', 'ordered'], 
        color: 'bg-purple-500',
        description: 'Projects in progress with estimates or orders'
      },
      { 
        name: 'Scheduled Work', 
        statuses: ['need_scheduled', 'scheduled', 'in_progress'], 
        color: 'bg-orange-500',
        description: 'Jobs ready for scheduling or currently in progress'
      },
      { 
        name: 'Completed', 
        statuses: ['completed', 'follow_up'], 
        color: 'bg-green-500',
        description: 'Finished projects and follow-up tasks'
      },
    ];

    return folders.map(folder => ({
      ...folder,
      projects: projects.filter(p => folder.statuses.includes(p.status)),
      count: projects.filter(p => folder.statuses.includes(p.status)).length
    }));
  }, [projects]);

  const totalProjects = projects.length;
  const activeProjectsCount = projects.filter(p => ['sent_estimate', 'signed', 'need_ordered', 'ordered'].includes(p.status)).length;
  const completedProjectsCount = projects.filter(p => ['completed', 'follow_up'].includes(p.status)).length;

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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
                <p className="text-sm text-gray-600">Drag and drop projects between folders to update their status</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
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
              <Link href="/projects">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Project Folders with Drag and Drop */}
        {!projectsLoading && (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-8">
              {projectFolders.map((folder) => (
                <DroppableFolder 
                  key={folder.name} 
                  folder={folder}
                  onPipelineClick={() => window.location.href = '/pipeline'}
                />
              ))}
            </div>
            
            <DragOverlay>
              {activeProject ? (
                <div className="transform rotate-3 shadow-2xl">
                  <DraggableProjectCard project={activeProject} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Instructions */}
        {!projectsLoading && projects.length > 0 && (
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-blue-800">
                <GripVertical className="h-5 w-5" />
                <div>
                  <p className="font-medium mb-1">How to use drag and drop:</p>
                  <p className="text-sm text-blue-700">
                    Click and hold the grip handle (⋮⋮) on any project card, then drag it to a different folder to automatically update its status.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}