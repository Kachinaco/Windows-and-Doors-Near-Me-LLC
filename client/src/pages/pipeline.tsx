import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Filter, 
  Download, 
  Settings,
  Target,
  AlertTriangle,
  FileText,
  CheckCircle,
  Briefcase,
  Calendar,
  MessageSquare,
  Home,
  ChevronLeft,
  ChevronRight,
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
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import type { Project } from "@shared/schema";

const PIPELINE_STAGES = [
  { key: "all", label: "All", icon: Target, color: "bg-gray-100 text-gray-800" },
  { key: "inquiry", label: "Inquiry", icon: Target, color: "bg-blue-100 text-blue-800" },
  { key: "follow_up", label: "Follow Up", icon: MessageSquare, color: "bg-yellow-100 text-yellow-800" },
  { key: "proposal_sent", label: "Proposal Sent", icon: FileText, color: "bg-orange-100 text-orange-800" },
  { key: "proposal_signed", label: "Proposal Signed", icon: CheckCircle, color: "bg-black text-white" },
  { key: "retainer_paid", label: "Retainer Paid", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { key: "need_to_be_ordered", label: "Need to be ordered", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
  { key: "ordered", label: "Ordered", icon: Briefcase, color: "bg-purple-100 text-purple-800" },
  { key: "need_to_schedule", label: "need to schedule", icon: Calendar, color: "bg-pink-100 text-pink-800" }
];

// Droppable Stage Component
function DroppableStage({ 
  stage, 
  projects, 
  count 
}: { 
  stage: any; 
  projects: Project[]; 
  count: number; 
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.key,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`min-h-[500px] p-4 rounded-lg border-2 border-dashed transition-colors ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
      }`}
    >
      {/* Stage Header */}
      <div className="mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${stage.color}`}>
          <stage.icon className="h-4 w-4" />
          {stage.label}
        </div>
        <div className="text-2xl font-bold text-gray-900 mt-2">{count}</div>
      </div>

      {/* Projects in this stage */}
      <SortableContext 
        items={projects.map(p => p.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {projects.map((project) => (
            <DraggableProjectCard key={project.id} project={project} />
          ))}
        </div>
      </SortableContext>

      {/* Drop zone indicator */}
      {isOver && (
        <div className="mt-4 p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-100 text-center text-blue-600">
          Drop project here to move to {stage.label}
        </div>
      )}
    </div>
  );
}

// Draggable Project Card Component
function DraggableProjectCard({ project }: { project: Project }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusBadgeColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-blue-100 text-blue-800",
      new_lead: "bg-blue-100 text-blue-800",
      follow_up: "bg-yellow-100 text-yellow-800",
      proposal_sent: "bg-orange-100 text-orange-800",
      sent_estimate: "bg-orange-100 text-orange-800",
      signed: "bg-black text-white",
      proposal_signed: "bg-black text-white",
      retainer_paid: "bg-green-100 text-green-800",
      need_ordered: "bg-red-100 text-red-800",
      ordered: "bg-purple-100 text-purple-800",
      need_scheduled: "bg-pink-100 text-pink-800"
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white rounded-lg border p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div {...listeners} className="cursor-grab">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
        </div>
        <Badge className={getStatusBadgeColor(project.status)}>
          {project.status.replace('_', ' ')}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        {project.description && (
          <p className="line-clamp-2">{project.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span>{project.serviceType || 'General'}</span>
          {project.estimatedCost && (
            <span className="font-medium text-green-600">
              ${project.estimatedCost}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs">
          {project.email && (
            <span className="flex items-center gap-1">
              📧 {project.email}
            </span>
          )}
          {project.phone && (
            <span className="flex items-center gap-1">
              📞 {project.phone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [selectedStage, setSelectedStage] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  // Mutation to update project status
  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: number; status: string }) => {
      return await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status }),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive",
      });
    },
  });

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const projectId = Number(active.id);
    const newStageKey = String(over.id);

    // Map stage keys to actual status values
    const stageToStatusMap: Record<string, string> = {
      inquiry: "new_lead",
      follow_up: "follow_up", 
      proposal_sent: "proposal_sent",
      proposal_signed: "signed",
      retainer_paid: "retainer_paid",
      need_to_be_ordered: "need_ordered",
      ordered: "ordered",
      need_to_schedule: "need_scheduled"
    };

    const newStatus = stageToStatusMap[newStageKey];
    if (!newStatus) return;

    // Find the project and check if status actually changed
    const project = projects.find((p: Project) => p.id === projectId);
    if (!project || project.status === newStatus) return;

    // Update the project status
    updateProjectMutation.mutate({ projectId, status: newStatus });
  };

  // Calculate pipeline stats
  const pipelineStats = PIPELINE_STAGES.reduce((stats, stage) => {
    if (stage.key === "all") {
      stats[stage.key] = projects.length;
    } else {
      // Map stage keys to project statuses
      const statusMap: Record<string, string[]> = {
        inquiry: ["pending", "new_lead"],
        follow_up: ["follow_up"],
        proposal_sent: ["proposal_sent", "sent_estimate"],
        proposal_signed: ["signed", "proposal_signed"],
        retainer_paid: ["retainer_paid"],
        need_to_be_ordered: ["need_ordered"],
        ordered: ["ordered"],
        need_to_schedule: ["need_scheduled"]
      };
      
      const statuses = statusMap[stage.key] || [];
      stats[stage.key] = projects.filter((p: Project) => 
        statuses.includes(p.status)
      ).length;
    }
    return stats;
  }, {} as Record<string, number>);

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/projects", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
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

  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const projectData = {
      title: formData.get("title") as string,
      serviceType: formData.get("serviceType") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as string,
      estimatedCost: formData.get("estimatedCost") as string,
      status: "pending",
      assignedTo: formData.get("assignedTo") ? parseInt(formData.get("assignedTo") as string) : undefined,
    };

    createProjectMutation.mutate(projectData);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/project-portfolio">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Import data
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-800">
                CREATE NEW
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Project Name</Label>
                    <Input id="title" name="title" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Service Type</Label>
                    <Select name="serviceType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Window And Door">Window And Door</SelectItem>
                        <SelectItem value="Window Installation">Window Installation</SelectItem>
                        <SelectItem value="Door Installation">Door Installation</SelectItem>
                        <SelectItem value="Home Improvement">Home Improvement</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Phone</Label>
                    <Input id="phone" name="phone" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedCost">Estimated Cost</Label>
                    <Input id="estimatedCost" name="estimatedCost" placeholder="$5,000" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assign To</Label>
                    <Select name="assignedTo">
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProjectMutation.isPending}>
                    {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="default" size="sm" className="bg-black text-white">
            <Home className="h-4 w-4 mr-2" />
            Main view
          </Button>
          <Button variant="ghost" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Customize pipeline
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Drag and Drop Pipeline */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-6">
          {PIPELINE_STAGES.filter(stage => stage.key !== "all").map((stage) => (
            <DroppableStage
              key={stage.key}
              stage={stage}
              projects={projects.filter((p: Project) => {
                const statusMap: Record<string, string[]> = {
                  inquiry: ["pending", "new_lead"],
                  follow_up: ["follow_up"],
                  proposal_sent: ["proposal_sent", "sent_estimate"],
                  proposal_signed: ["signed", "proposal_signed"],
                  retainer_paid: ["retainer_paid"],
                  need_to_be_ordered: ["need_ordered"],
                  ordered: ["ordered"],
                  need_to_schedule: ["need_scheduled"]
                };
                const statuses = statusMap[stage.key] || [];
                return statuses.includes(p.status);
              })}
              count={pipelineStats[stage.key] || 0}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeId ? (
            <DraggableProjectCard 
              project={projects.find((p: Project) => p.id === activeId)!} 
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Instructions for drag and drop */}
      {!isLoading && projects.length > 0 && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <GripVertical className="h-4 w-4" />
              <span className="text-sm font-medium">
                Drag and drop projects between pipeline stages to update their status
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}