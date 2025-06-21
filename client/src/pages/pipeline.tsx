import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  MoreHorizontal,
  Target,
  AlertTriangle,
  FileText,
  CheckCircle,
  Briefcase,
  Calendar,
  Clock,
  Activity,
  MessageSquare,
  Home,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";
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

export default function PipelinePage() {
  const [selectedStage, setSelectedStage] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

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

  // Filter projects based on selected stage
  const filteredProjects = selectedStage === "all" 
    ? projects 
    : projects.filter((p: Project) => {
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
        
        const statuses = statusMap[selectedStage] || [];
        return statuses.includes(p.status);
      });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/projects", data);
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

  const toggleProjectSelection = (projectId: number) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const selectAllProjects = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map((p: Project) => p.id));
    }
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

      {/* Pipeline Stages */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          <ChevronLeft className="h-5 w-5 text-gray-400 flex-shrink-0" />
          
          {PIPELINE_STAGES.map((stage) => (
            <Card 
              key={stage.key}
              className={`min-w-[140px] cursor-pointer transition-all ${
                selectedStage === stage.key 
                  ? stage.key === "proposal_signed" 
                    ? "bg-black text-white border-black" 
                    : "bg-blue-50 border-blue-200"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedStage(stage.key)}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold mb-1">
                  {pipelineStats[stage.key] || 0}
                </div>
                <div className="text-xs text-gray-600">
                  {stage.label}
                </div>
              </CardContent>
            </Card>
          ))}
          
          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
        </div>
      </div>

      {/* Project Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                    onCheckedChange={selectAllProjects}
                  />
                </TableHead>
                <TableHead className="font-semibold">PROJECT NAME</TableHead>
                <TableHead className="font-semibold">CONTACT</TableHead>
                <TableHead className="font-semibold">TYPE</TableHead>
                <TableHead className="font-semibold">DATE</TableHead>
                <TableHead className="font-semibold">LOCATION</TableHead>
                <TableHead className="font-semibold">DESCRIPTION</TableHead>
                <TableHead className="font-semibold">TAGS</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <div className="h-12 bg-gray-100 animate-pulse rounded"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="text-gray-500">
                      No projects found in {PIPELINE_STAGES.find(s => s.key === selectedStage)?.label || "this stage"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project: Project) => (
                  <TableRow key={project.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox 
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={() => toggleProjectSelection(project.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/projects/${project.id}`}>
                        <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                          {project.title}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {project.email && (
                          <div className="font-medium">{project.email}</div>
                        )}
                        {project.phone && (
                          <div className="text-gray-500">{project.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{project.serviceType}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'TBD'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {project.address || ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-[200px] truncate">
                        {project.description || ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.priority && (
                        <Badge variant="outline" className="text-xs">
                          {project.priority}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}