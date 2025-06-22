import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type InsertProject, type Project } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Building2, 
  Users, 
  LogOut,
  Plus,
  Target,
  Activity,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  MessageSquare,
  Briefcase,
  Calendar,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";

export default function ProjectPortfolioPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const dashboardStats = useMemo(() => {
    const stats = {
      totalProjects: projects.length,
      newLeads: projects.filter(p => p.status === "new_lead").length,
      needAttention: projects.filter(p => p.status === "need_attention").length,
      sentEstimate: projects.filter(p => p.status === "sent_estimate").length,
      signed: projects.filter(p => p.status === "signed").length,
      needOrdered: projects.filter(p => p.status === "need_ordered").length,
      ordered: projects.filter(p => p.status === "ordered").length,
      needScheduled: projects.filter(p => p.status === "need_scheduled").length,
      scheduled: projects.filter(p => p.status === "scheduled").length,
      inProgress: projects.filter(p => p.status === "in_progress").length,
      completed: projects.filter(p => p.status === "completed").length,
      followUp: projects.filter(p => p.status === "follow_up").length,
      totalRevenue: projects.reduce((sum, p) => sum + (p.estimatedCost || 0), 0),
      activeProjects: projects.filter(p => ["in_progress", "scheduled", "signed"].includes(p.status)).length,
      urgentTasks: projects.filter(p => p.priority === "urgent").length,
    };
    return stats;
  }, [projects]);

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "new_lead",
      priority: "medium",
      assignedTo: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      estimatedCost: 0,
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
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

  const onSubmit = (data: InsertProject) => {
    createProjectMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white";
      case "in_progress":
        return "bg-blue-500 text-white";
      case "scheduled":
        return "bg-purple-500 text-white";
      case "new_lead":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Workspaces
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.username}
                </span>
              </div>
              
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Workspace Selection */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Windows and Doors
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Main workspace for project management
                </p>
              </div>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {/* Workspace Boards */}
        <div className="space-y-6">
          {/* Windows 2025 Board */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Windows Projects 2025
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Changed last week • {projects.length} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {dashboardStats.inProgress + dashboardStats.scheduled} Active
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Project Board Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Assignee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Budget
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {project.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Project #{project.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {project.assignedTo ? String(project.assignedTo).charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <span className="ml-2 text-sm text-gray-900 dark:text-white">
                            {project.assignedTo || 'Unassigned'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {project.customerName || 'No customer'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${project.estimatedCost?.toLocaleString() || '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Leads</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.newLeads}</p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Projects</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.inProgress + dashboardStats.scheduled}</p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Urgent Tasks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.urgentTasks}</p>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${dashboardStats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Workspace Boards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inventory Board */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Track window stock</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">V300 Series: 24 units</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">V400 Series: 18 units</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Hardware: 156 sets</div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar Board */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Schedule</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Installation calendar</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Today: 3 installations</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">This week: 12 jobs</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Next week: 8 jobs</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder="Enter project title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  {...form.register("customerName")}
                  placeholder="Enter customer name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  {...form.register("customerEmail")}
                  placeholder="customer@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  {...form.register("customerPhone")}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Enter project description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select onValueChange={(value) => form.setValue("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_lead">New Lead</SelectItem>
                    <SelectItem value="need_attention">Need Attention</SelectItem>
                    <SelectItem value="sent_estimate">Sent Estimate</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="need_ordered">Need Ordered</SelectItem>
                    <SelectItem value="ordered">Ordered</SelectItem>
                    <SelectItem value="need_scheduled">Need Scheduled</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select onValueChange={(value) => form.setValue("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Budget</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  {...form.register("estimatedCost", { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To</Label>
              <Select onValueChange={(value) => form.setValue("assignedTo", parseInt(value))}>
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
  );
}