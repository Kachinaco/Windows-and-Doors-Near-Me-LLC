import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Clock,
  FileText,
  MessageSquare,
  Plus,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause
} from "lucide-react";
import { Link } from "wouter";

interface Project {
  id: number;
  title: string;
  serviceType: string;
  email: string;
  phone: string;
  address: string;
  estimatedCost: string;
  notes: string;
  priority: string;
  status: string;
  projectStatus?: string;
  leadId?: number;
  assignedEmployeeId?: number;
  createdAt: string;
  updatedAt: string;
  assignedEmployee?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  lead?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    source: string;
    status: string;
  };
}

const statusOptions = [
  { value: "new_lead", label: "New Lead", color: "bg-blue-100 text-blue-800", icon: Play },
  { value: "scheduled", label: "Scheduled", color: "bg-yellow-100 text-yellow-800", icon: Calendar },
  { value: "work_order", label: "Work Order", color: "bg-purple-100 text-purple-800", icon: FileText },
  { value: "in_progress", label: "In Progress", color: "bg-orange-100 text-orange-800", icon: Clock },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  { value: "on_hold", label: "On Hold", color: "bg-gray-100 text-gray-800", icon: Pause },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800", icon: AlertTriangle }
];

const priorityOptions = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-red-100 text-red-800" },
  { value: "urgent", label: "Urgent", color: "bg-purple-100 text-purple-800" }
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Project>>({});

  const { data: project, isLoading } = useQuery({
    queryKey: ["/api/projects", id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      return response.json();
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    enabled: user?.role === 'admin' || user?.role === 'contractor_paid',
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (updates: Partial<Project>) => {
      return apiRequest("PUT", `/api/projects/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Project updated successfully",
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

  useEffect(() => {
    if (project) {
      setEditForm(project);
    }
  }, [project]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProjectMutation.mutate(editForm);
  };

  const handleCancel = () => {
    setEditForm(project);
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: string) => {
    const updates = { projectStatus: newStatus };
    updateProjectMutation.mutate(updates);
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    if (!option) return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    
    const Icon = option.icon;
    return (
      <Badge className={option.color}>
        <Icon className="h-3 w-3 mr-1" />
        {option.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return (
      <Badge className={option?.color || "bg-gray-100 text-gray-800"}>
        {option?.label || priority}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Project Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The project you're looking for doesn't exist.</p>
          <Link href="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button variant="outline" size="sm">
              Attach
            </Button>
            <Button variant="outline" size="sm">
              AI ACTIONS
            </Button>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white">
              CREATE FILE
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Banner Section */}
      <div className="relative bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                  <span>Other</span>
                  <span>•</span>
                  <span>Tab</span>
                </div>
                <h1 className="text-4xl font-bold mb-2">{project.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <span>Visible to you • 1 participant</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button onClick={handleEdit} variant="outline" className="border-gray-300 text-gray-800 bg-white hover:bg-gray-50">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Project
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={handleSave} disabled={updateProjectMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={handleCancel} variant="outline" className="border-gray-300 text-gray-800 bg-white hover:bg-gray-50">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Participant Avatars */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'Y'}
                </div>
                <span className="text-sm">You</span>
              </div>
              
              {project.assignedEmployee && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {project.assignedEmployee.firstName?.charAt(0).toUpperCase() || 'E'}
                  </div>
                  <span className="text-sm">{project.assignedEmployee.firstName} {project.assignedEmployee.lastName}</span>
                </div>
              )}
              
              <Button variant="ghost" size="sm" className="text-white border border-gray-400 hover:bg-white/10">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-6">
          <Tabs defaultValue="activity" className="space-y-0">
            <TabsList className="bg-transparent border-0 p-0 h-auto">
              <TabsTrigger 
                value="activity" 
                className="border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 py-3"
              >
                Activity
              </TabsTrigger>
              <TabsTrigger 
                value="files"
                className="border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 py-3"
              >
                Files
              </TabsTrigger>
              <TabsTrigger 
                value="tasks"
                className="border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 py-3"
              >
                Tasks
                <Badge className="ml-2 bg-orange-100 text-orange-800 text-xs">New</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="payments"
                className="border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 py-3"
              >
                Payments
              </TabsTrigger>
              <TabsTrigger 
                value="notes"
                className="border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 py-3"
              >
                Notes
              </TabsTrigger>
              <TabsTrigger 
                value="details"
                className="border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4 py-3"
              >
                Details
              </TabsTrigger>
            </TabsList>

            <div className="max-w-7xl mx-auto py-6">
              <TabsContent value="activity" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Activity Feed */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Reply Input */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                            {user?.username?.charAt(0).toUpperCase() || 'Y'}
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3 text-gray-500 text-sm">
                              Reply to: "Milestone complete"
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Active Smart Files */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-700">ACTIVE SMART FILES</CardTitle>
                        <p className="text-xs text-gray-500">Track the actions and questions your client still needs to complete.</p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="w-16 h-12 bg-red-600 rounded flex items-center justify-center flex-shrink-0">
                            <div className="text-white text-xs font-bold">Logo</div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-sm mb-1">V300 Milgard Window and Door Estimate</h3>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">IN PROGRESS</span>
                              <span>Sent on Jun 15, 2025 at 5:51 PM</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              <div className="flex items-center gap-2">
                                <span>5 of 5 viewed</span>
                                <span>•</span>
                                <span>ACTION:</span>
                                <span>Invoice (paid 1 of 2)</span>
                                <span>•</span>
                                <span>Contract (signed 1 of 5)</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-gray-400">
                            <span className="text-lg">⋯</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-700">RECENT ACTIVITY</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                            BW
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm mb-1">
                              <span className="font-medium">From: Brent Wulbrecht</span>
                              <span className="text-gray-500">To: Cory Analia</span>
                              <Button variant="ghost" size="sm" className="ml-auto text-gray-400 p-1">
                                <span className="text-xs">↗</span>
                              </Button>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">Thu, Jun 19, 2025</div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <h4 className="font-medium text-sm mb-2">Re: Milestone complete</h4>
                              <p className="text-sm text-gray-700 mb-3">Cory,</p>
                              <p className="text-sm text-gray-700 mb-3">I wanted to follow up and confirm you received the check for the remaining balance.</p>
                              <p className="text-sm text-gray-700 mb-3">Thank you,</p>
                              <p className="text-sm text-gray-700">Brent</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Sidebar */}
                  <div className="space-y-4">
                    {/* Visibility Notice */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 bg-gray-300 rounded-full mt-1 flex-shrink-0"></div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Only visible to you</h4>
                            <p className="text-xs text-gray-500">Private notes for you and your internal team to manage this project.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Client Portal */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Client portal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">https://techniciancontractors.com</span>
                          <Button variant="ghost" size="sm" className="p-1">
                            <span className="text-xs">📋</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1">
                            <span className="text-xs">↗</span>
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Include client portal links in files and emails</span>
                        </div>
                        <div className="text-xs text-blue-600 underline cursor-pointer">
                          What is the client portal?
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stage */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Stage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Select defaultValue="retainer-paid">
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="retainer-paid">Retainer paid</SelectItem>
                            <SelectItem value="new-lead">New Lead</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>

                    {/* Lead Source */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Lead Source</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Select defaultValue="google">
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="google">Google</SelectItem>
                            <SelectItem value="yelp">Yelp</SelectItem>
                            <SelectItem value="thumbtack">Thumbtack</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="website">Website</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>

                    {/* Tags */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Tags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-500">Add tags</div>
                          <div className="text-xs text-blue-600 underline cursor-pointer">
                            Manage company tags
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="files" className="mt-0">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
                  <p className="text-gray-500 mb-4">Upload files and documents related to this project.</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Project Tasks</h3>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h4>
                        <p className="text-gray-500">Create tasks to track project progress.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Payment History</h3>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Payment
                    </Button>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No payments recorded</h4>
                        <p className="text-gray-500">Track payments and invoices for this project.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Project Notes</h3>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h4>
                        <p className="text-gray-500">Add internal notes and comments for this project.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="title">Project Title</Label>
                            <Input
                              id="title"
                              value={editForm.title || ""}
                              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="serviceType">Service Type</Label>
                            <Input
                              id="serviceType"
                              value={editForm.serviceType || ""}
                              onChange={(e) => setEditForm({...editForm, serviceType: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={editForm.email || ""}
                              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={editForm.phone || ""}
                              onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={editForm.address || ""}
                            onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="estimatedCost">Estimated Cost</Label>
                            <Input
                              id="estimatedCost"
                              value={editForm.estimatedCost || ""}
                              onChange={(e) => setEditForm({...editForm, estimatedCost: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="priority">Priority</Label>
                            <Select 
                              value={editForm.priority || ""} 
                              onValueChange={(value) => setEditForm({...editForm, priority: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {priorityOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            value={editForm.notes || ""}
                            onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                            rows={3}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Service:</span>
                            <span>{project.serviceType}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Estimated Cost:</span>
                            <span>{project.estimatedCost}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Email:</span>
                            <span>{project.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Phone:</span>
                            <span>{project.phone}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Address:</span>
                          <span>{project.address}</span>
                        </div>

                        {project.notes && (
                          <div>
                            <span className="font-medium">Notes:</span>
                            <p className="mt-1 text-gray-600 dark:text-gray-400">{project.notes}</p>
                          </div>
                        )}

                        <div className="border-t pt-4 mt-4">
                          <h3 className="font-medium mb-3">Project Timeline</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Created:</span>
                              <span>{formatDate(project.createdAt)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Updated:</span>
                              <span>{formatDate(project.updatedAt)}</span>
                            </div>
                            {project.assignedEmployee && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Assigned:</span>
                                <span>
                                  {project.assignedEmployee.firstName} {project.assignedEmployee.lastName}
                                </span>
                              </div>
                            )}
                            {project.lead && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Lead Source:</span>
                                <span>{project.lead.source}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}