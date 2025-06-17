import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, InsertProject, Project, type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { 
  PlusCircle, 
  Building2, 
  Users, 
  LogOut,
  User as UserIcon,
  Settings,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

export default function ProjectsPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
    enabled: user?.role === 'admin' || user?.role === 'employee',
  });

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      serviceType: "",
      estimatedCost: "",
      priority: "medium",
      status: "pending",
      customerId: null,
      assignedTo: null,
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const onSubmit = (data: InsertProject) => {
    createProjectMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Projects
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.firstName} {user?.lastName} ({user?.role})
                </span>
              </div>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Project Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your window and door installation projects
            </p>
          </div>

          {(user?.role === 'admin' || user?.role === 'employee') && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Add a new window or door installation project
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Project Title</Label>
                      <Input
                        id="title"
                        {...form.register("title")}
                        placeholder="e.g., Milgard Windows Installation"
                      />
                      {form.formState.errors.title && (
                        <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceType">Service Type</Label>
                      <Input
                        id="serviceType"
                        {...form.register("serviceType")}
                        placeholder="e.g., Window Installation"
                      />
                      {form.formState.errors.serviceType && (
                        <p className="text-sm text-red-600">{form.formState.errors.serviceType.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                      placeholder="Detailed project description..."
                      rows={3}
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimatedCost">Estimated Cost</Label>
                      <Input
                        id="estimatedCost"
                        {...form.register("estimatedCost")}
                        placeholder="$5,000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={form.watch("priority")} onValueChange={(value) => form.setValue("priority", value)}>
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
                      <Label htmlFor="status">Status</Label>
                      <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerId">Customer ID</Label>
                      <Input
                        id="customerId"
                        type="number"
                        {...form.register("customerId", { valueAsNumber: true })}
                        placeholder="Customer ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assignedTo">Assigned Employee</Label>
                      <Select value={form.watch("assignedTo")?.toString()} onValueChange={(value) => form.setValue("assignedTo", parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((employee: User) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.firstName} {employee.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
          )}
        </div>

        {/* Projects List */}
        <div className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-gray-500">Loading projects...</p>
              </CardContent>
            </Card>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Projects Yet</h3>
                  <p className="text-gray-500 mb-4">Get started by creating your first project</p>
                  {(user?.role === 'admin' || user?.role === 'employee') && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            projects.map((project: Project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{project.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {project.description}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={`${getStatusColor(project.status)} text-white`}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`${getPriorityColor(project.priority)} text-white`}>
                        {project.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Service Type</p>
                      <p className="text-gray-600 dark:text-gray-400">{project.serviceType}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Estimated Cost</p>
                      <p className="text-gray-600 dark:text-gray-400">{project.estimatedCost || 'TBD'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Start Date</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Due Date</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}