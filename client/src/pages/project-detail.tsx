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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Projects
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {project.title}
                </h1>
                <p className="text-sm text-gray-500">Project #{project.id}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {getStatusBadge(project.projectStatus || project.status)}
              {getPriorityBadge(project.priority)}
              
              {!isEditing ? (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} size="sm" disabled={updateProjectMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Project Details</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="files">Files & Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Info */}
              <div className="lg:col-span-2">
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
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Status & Actions */}
              <div className="space-y-6">
                {/* Status Management */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Current Status</Label>
                      <div className="mt-1">
                        {getStatusBadge(project.projectStatus || project.status)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Update Status</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {statusOptions.map(option => {
                          const Icon = option.icon;
                          return (
                            <Button
                              key={option.value}
                              variant={project.projectStatus === option.value ? "default" : "outline"}
                              size="sm"
                              className="justify-start"
                              onClick={() => handleStatusChange(option.value)}
                              disabled={updateProjectMutation.isPending}
                            >
                              <Icon className="h-3 w-3 mr-2" />
                              {option.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Project Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm">{formatDate(project.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Updated:</span>
                      <span className="text-sm">{formatDate(project.updatedAt)}</span>
                    </div>
                    {project.assignedEmployee && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Assigned:</span>
                        <span className="text-sm">
                          {project.assignedEmployee.firstName} {project.assignedEmployee.lastName}
                        </span>
                      </div>
                    )}
                    {project.lead && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Lead Source:</span>
                        <span className="text-sm">{project.lead.source}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Extended Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Customer Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Email:</span> {project.email}</div>
                        <div><span className="font-medium">Phone:</span> {project.phone}</div>
                        <div><span className="font-medium">Address:</span> {project.address}</div>
                      </div>
                    </div>

                    {project.lead && (
                      <div>
                        <h3 className="font-medium mb-2">Lead Information</h3>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Name:</span> {project.lead.firstName} {project.lead.lastName}</div>
                          <div><span className="font-medium">Source:</span> {project.lead.source}</div>
                          <div><span className="font-medium">Status:</span> {project.lead.status}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {project.notes && (
                    <div>
                      <h3 className="font-medium mb-2">Project Notes</h3>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm whitespace-pre-wrap">{project.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">Project Created</div>
                      <div className="text-sm text-gray-600">{formatDate(project.createdAt)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">Last Updated</div>
                      <div className="text-sm text-gray-600">{formatDate(project.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>Files & Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No files uploaded yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Upload project documents, contracts, and images here.
                  </p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}