import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type InsertProject, type Project, type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle, 
  Building2, 
  Users, 
  LogOut,
  User as UserIcon,
  Settings,
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Play,
  TrendingUp,
  Activity,
  Briefcase,
  Target,
  ArrowRight,
  Plus,
  MessageSquare,
  FileText
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

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
    enabled: user?.role === 'admin' || user?.role === 'contractor_paid',
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads"],
    enabled: user?.role === 'admin' || user?.role === 'employee' || user?.role === 'contractor_paid',
  });

  // Calculate dashboard statistics
  const dashboardStats = useMemo(() => {
    const totalProjects = projects.length;
    const newLeads = projects.filter(p => p.status === 'pending' || p.status === 'new_lead').length;
    const inProgress = projects.filter(p => p.status === 'in_progress' || p.status === 'scheduled').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    
    const totalRevenue = projects
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => {
        const cost = parseFloat(p.estimatedCost?.replace(/[^0-9.]/g, '') || '0');
        return sum + cost;
      }, 0);

    const recentProjects = projects
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    const urgentTasks = projects.filter(p => p.priority === 'high' || p.priority === 'urgent').length;

    return {
      totalProjects,
      newLeads,
      inProgress,
      completed,
      totalRevenue,
      recentProjects,
      urgentTasks
    };
  }, [projects]);

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      title: "",
      serviceType: "",
      email: "",
      phone: "",
      address: "",
      assignedTo: null,
      priority: "medium",
      status: "scheduled",
      clientId: null,
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
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Good morning, {user?.username}
                </h1>
                <p className="text-sm text-gray-500">Windows & Doors Near Me LLC</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.username}
                </span>
                <Badge variant="outline" className="text-xs">
                  {user?.role}
                </Badge>
              </div>
              
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New leads</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardStats.newLeads}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread messages</p>
                  <p className="text-3xl font-bold text-gray-900">6</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasks</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardStats.urgentTasks}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">2025 Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${dashboardStats.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Create Actions */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Create</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                    <Plus className="h-4 w-4 mr-3 text-blue-600" />
                    <span>New project</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
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
                          placeholder="Window Installation Project"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serviceType">Service Type</Label>
                        <Select 
                          value={form.watch("serviceType")} 
                          onValueChange={(value) => form.setValue("serviceType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Window Installation">Window Installation</SelectItem>
                            <SelectItem value="Door Installation">Door Installation</SelectItem>
                            <SelectItem value="Window Replacement">Window Replacement</SelectItem>
                            <SelectItem value="Door Replacement">Door Replacement</SelectItem>
                            <SelectItem value="Home Improvement">Home Improvement</SelectItem>
                            <SelectItem value="Repair Service">Repair Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...form.register("email")}
                          placeholder="customer@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          {...form.register("phone")}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        {...form.register("address")}
                        placeholder="123 Main St, Gilbert, AZ 85234"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        <Select 
                          value={form.watch("priority")} 
                          onValueChange={(value) => form.setValue("priority", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        {...form.register("notes")}
                        placeholder="Additional project details..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
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
                      >
                        {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Link href="/leads">
                <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                  <Plus className="h-4 w-4 mr-3 text-green-600" />
                  <span>New contact</span>
                </Button>
              </Link>

              <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                <Plus className="h-4 w-4 mr-3 text-purple-600" />
                <span>New invoice</span>
              </Button>

              <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                <Plus className="h-4 w-4 mr-3 text-orange-600" />
                <span>New contract</span>
              </Button>

              <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                <Plus className="h-4 w-4 mr-3 text-red-600" />
                <span>New meeting</span>
              </Button>

              <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                <Plus className="h-4 w-4 mr-3 text-indigo-600" />
                <span>New lead form</span>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Leads ({dashboardStats.newLeads})</CardTitle>
              <Button variant="ghost" size="sm">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardStats.recentProjects.slice(0, 4).map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{project.title}</p>
                    <p className="text-xs text-gray-500">{project.serviceType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              <Link href="/leads">
                <Button variant="ghost" size="sm" className="w-full mt-4">
                  Go to Inquiries <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Calendar/Schedule */}
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Calendar</CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
                Meeting
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-500">JUN</div>
                    <div className="text-lg font-bold">21</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Project kickoff</p>
                    <p className="text-xs text-gray-500">10:00 AM</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-500">JUL</div>
                    <div className="text-lg font-bold">20</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Site visit</p>
                    <p className="text-xs text-gray-500">2:00 PM</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-500">AUG</div>
                    <div className="text-lg font-bold">10</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Installation</p>
                    <p className="text-xs text-gray-500">9:00 AM</p>
                  </div>
                </div>
              </div>

              <Link href="/scheduling">
                <Button variant="ghost" size="sm" className="w-full mt-4">
                  Go to calendar <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h2>
            <Link href="/projects-list">
              <Button>
                View All Projects <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                      <TableHead className="font-semibold">Project</TableHead>
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Priority</TableHead>
                      <TableHead className="font-semibold">Cost</TableHead>
                      <TableHead className="font-semibold">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardStats.recentProjects.map((project) => (
                      <TableRow key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell className="font-medium">
                          <Link href={`/projects/${project.id}`}>
                            <div className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                              {project.title}
                            </div>
                          </Link>
                          <div className="text-sm text-gray-500">{project.serviceType}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="text-sm font-medium">{project.email}</div>
                              <div className="text-sm text-gray-500">{project.phone}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {project.estimatedCost}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}