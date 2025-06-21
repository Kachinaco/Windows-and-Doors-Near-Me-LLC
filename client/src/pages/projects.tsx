import { useState, useMemo, useEffect } from "react";
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
import { useLayoutConfig } from "@/hooks/useLayoutConfig";
import LayoutCustomizer from "@/components/LayoutCustomizer";
import CustomizableProjectTable from "@/components/CustomizableProjectTable";
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
import { Link, useLocation } from "wouter";

export default function ProjectsPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [location] = useLocation();
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Layout configuration
  const { layout, saveLayout } = useLayoutConfig();
  
  // Get stage filter from URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const stageFilter = urlParams.get('stage');

  // Auto-scroll to stage section when stage filter is provided
  useEffect(() => {
    if (stageFilter) {
      // Wait for the component to render, then scroll to the stage section
      setTimeout(() => {
        const stageElement = document.getElementById(`stage-${stageFilter}`);
        if (stageElement) {
          stageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [stageFilter]);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Filter projects based on stage parameter
  const filteredProjects = useMemo(() => {
    if (!stageFilter) return projects;
    
    switch (stageFilter) {
      case 'new_leads':
        return projects.filter(p => p.status === 'pending' || p.status === 'new_lead');
      case 'need_attention':
        return projects.filter(p => p.status === 'need_attention');
      case 'sent_estimate':
        return projects.filter(p => p.status === 'sent_estimate' || p.status === 'quoted');
      case 'signed':
        return projects.filter(p => p.status === 'signed' || p.status === 'contracted');
      case 'need_ordered':
        return projects.filter(p => p.status === 'need_ordered');
      case 'ordered':
        return projects.filter(p => p.status === 'ordered');
      case 'need_scheduled':
        return projects.filter(p => p.status === 'need_scheduled');
      case 'scheduled':
        return projects.filter(p => p.status === 'scheduled');
      case 'in_progress':
        return projects.filter(p => p.status === 'in_progress');
      case 'completed':
        return projects.filter(p => p.status === 'completed');
      case 'follow_up':
        return projects.filter(p => p.status === 'follow_up');
      default:
        return projects;
    }
  }, [projects, stageFilter]);

  // Get stage display name
  const getStageDisplayName = (stage: string) => {
    const stageNames: Record<string, string> = {
      'new_leads': 'New Leads',
      'need_attention': 'Need Attention',
      'sent_estimate': 'Sent Estimate',
      'signed': 'Signed',
      'need_ordered': 'Need Ordered',
      'ordered': 'Ordered',
      'need_scheduled': 'Need Scheduled',
      'scheduled': 'Scheduled',
      'in_progress': 'In Progress',
      'completed': 'Complete',
      'follow_up': 'Follow Up'
    };
    return stageNames[stage] || 'All Projects';
  };

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
    const newLeads = projects.filter(p => p.projectStatus === 'new_lead' || p.status === 'pending').length;
    const inProgress = projects.filter(p => p.projectStatus === 'in_progress' || p.projectStatus === 'scheduled').length;
    const completed = projects.filter(p => p.projectStatus === 'completed' || p.status === 'completed').length;
    
    const totalRevenue = projects
      .filter(p => p.projectStatus === 'completed')
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
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white";
      case "in_progress":
        return "bg-blue-500 text-white";
      case "scheduled":
        return "bg-purple-500 text-white";
      case "paid":
        return "bg-green-600 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
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

  const groupedProjects = {
    scheduled: projects.filter(p => p.status === 'scheduled'),
    work_orders: projects.filter(p => p.status === 'in_progress'),
    completed: projects.filter(p => p.status === 'completed'),
    paid: projects.filter(p => p.status === 'paid'),
  };

  const onSubmit = (data: InsertProject) => {
    createProjectMutation.mutate(data);
  };

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const sortedFilteredProjects = useMemo(() => {
    if (!sortColumn) return filteredProjects;
    
    return [...filteredProjects].sort((a, b) => {
      let aVal = a[sortColumn as keyof Project];
      let bVal = b[sortColumn as keyof Project];
      
      // Handle different data types
      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }, [filteredProjects, sortColumn, sortDirection]);

  const ProjectTable = ({ title, projects, icon: Icon, count }: { 
    title: string; 
    projects: Project[]; 
    icon: any; 
    count: number;
  }) => (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-blue-600" />
          {title}
          <Badge variant="secondary" className="ml-2">{count} items</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead className="font-semibold">Item</TableHead>
                <TableHead className="font-semibold">People</TableHead>
                <TableHead className="font-semibold">Job Status</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Start Date</TableHead>
                <TableHead className="font-semibold">Start Time</TableHead>
                <TableHead className="font-semibold">Payout</TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {project.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {project.serviceType}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm">
                        {project.assignedTo ? `Employee #${project.assignedTo}` : 'Unassigned'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPriorityColor(project.priority)}>
                      {project.priority.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {project.startDate ? new Date(project.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {project.estimatedCost || '$0'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{project.phone || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 max-w-[150px] truncate">
                        {project.address || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No {title.toLowerCase()} projects
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

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
                  Project Management
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
              
              <LayoutCustomizer
                currentLayout={layout}
                onLayoutChange={saveLayout}
                onSaveLayout={saveLayout}
              />
              
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
              Project Portfolio
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your window and door installation projects
            </p>
          </div>

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

                {/* Lead Assignment and Project Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leadId">Link to Existing Lead (Optional)</Label>
                    <Select 
                      value={form.watch("leadId")?.toString() || ""} 
                      onValueChange={(value) => form.setValue("leadId", value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select existing lead" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Lead - New Customer</SelectItem>
                        {Array.isArray(leads) && leads.map((lead: any) => (
                          <SelectItem key={lead.id} value={lead.id.toString()}>
                            {lead.firstName} {lead.lastName} - {lead.source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectStatus">Project Status</Label>
                    <Select 
                      value={form.watch("projectStatus") || "new_lead"} 
                      onValueChange={(value) => form.setValue("projectStatus", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new_lead">New Lead</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="work_order">Work Order</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register("phone")}
                      placeholder="(480) 555-0123"
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
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={form.watch("priority")} onValueChange={(value) => form.setValue("priority", value as any)}>
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
        </div>

        {/* Project Tables */}
        <div className="space-y-6">
          {stageFilter ? (
            // Stage-filtered view
            <Card id={`stage-${stageFilter}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link href="/project-portfolio">
                      <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Pipeline
                      </Button>
                    </Link>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-blue-600" />
                      {getStageDisplayName(stageFilter)}
                      <Badge variant="secondary" className="ml-2">{filteredProjects.length} projects</Badge>
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sortedFilteredProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects in {getStageDisplayName(stageFilter)}</h3>
                    <p className="text-gray-500 mb-4">There are currently 0 projects in this pipeline stage.</p>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create New Project
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                ) : (
                  <CustomizableProjectTable
                    projects={sortedFilteredProjects}
                    layout={layout}
                    onSort={handleSort}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            // Default grouped view
            <>
              <ProjectTable 
                title="Scheduled" 
                projects={groupedProjects.scheduled} 
                icon={Calendar}
                count={groupedProjects.scheduled.length}
              />
              
              <ProjectTable 
                title="Work Orders" 
                projects={groupedProjects.work_orders} 
                icon={Play}
                count={groupedProjects.work_orders.length}
              />
              
              <ProjectTable 
                title="Completed - To Be Paid" 
                projects={groupedProjects.completed} 
                icon={CheckCircle}
                count={groupedProjects.completed.length}
              />
              
              <ProjectTable 
                title="Paid" 
                projects={groupedProjects.paid} 
                icon={DollarSign}
                count={groupedProjects.paid.length}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}