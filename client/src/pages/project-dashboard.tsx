import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft, 
  Calendar,
  ChevronDown,
  CheckSquare,
  FileText,
  MessageSquare,
  CreditCard,
  MoreVertical,
  ChevronRight,
  CheckCircle,
  Clock,
  DollarSign,
  Paperclip,
  Mail,
  Plus,
  User
} from "lucide-react";
import type { Project, ProjectUpdate } from "@shared/schema";

export default function ProjectDashboard() {
  const [, params] = useRoute("/projects/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const projectId = params?.id ? parseInt(params.id) : null;

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: projectUpdates, isLoading: updatesLoading } = useQuery<ProjectUpdate[]>({
    queryKey: ["/api/project-updates", projectId],
    enabled: !!projectId,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks", projectId],
    enabled: !!projectId,
  });

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
          <Button onClick={() => setLocation("/projects")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="relative bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-6"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="white" opacity="0.1"/><circle cx="80" cy="40" r="1" fill="white" opacity="0.1"/><circle cx="40" cy="80" r="1" fill="white" opacity="0.1"/><circle cx="90" cy="10" r="1" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>')}')`
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/projects")}
              className="text-white hover:text-gray-300 hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">
                {project.title || "Project"}
              </h1>
              <div className="flex items-center space-x-3 mt-1 text-sm text-gray-300">
                <span>Wed, May 21, 2025</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <span className="capitalize">{project.status}</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-gray-800 px-4">
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="bg-transparent border-none p-0 h-auto">
            <TabsTrigger 
              value="activity" 
              className="bg-transparent text-gray-300 border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white rounded-none px-6 py-3"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger 
              value="files" 
              className="bg-transparent text-gray-300 border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white rounded-none px-6 py-3"
            >
              Files
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="bg-transparent text-gray-300 border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white rounded-none px-6 py-3"
            >
              Notes
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="bg-transparent text-gray-300 border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white rounded-none px-6 py-3"
            >
              Details
            </TabsTrigger>
          </TabsList>

          {/* Content */}
          <div className="bg-white min-h-screen">
            <TabsContent value="activity" className="mt-0 p-4">
              {/* Team Visibility Notice */}
              <div className="bg-gray-50 p-3 rounded-lg mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MessageSquare className="w-4 h-4" />
                  <span>Only visible to you & team members</span>
                </div>
              </div>

              {/* Tasks Section */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="w-5 h-5 text-gray-700" />
                      <CardTitle className="text-lg">Tasks</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        {Array.isArray(tasks) ? tasks.filter((task: any) => task.status === 'completed').length : 0}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Activity Timeline */}
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-500 mb-4">
                  FRI, JUN 13, 2025
                </div>

                {/* Payment Activity */}
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">
                            Client paid $1730.27
                          </span>
                          <span className="text-gray-600">via credit card for</span>
                          <span className="font-medium text-gray-900">
                            {project.title} Proposal (2 Doors)
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          2 of 2 payments
                        </div>
                        <div className="text-sm text-gray-500">
                          3:45 PM
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>

                {/* Proposal Completion */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">
                            Client recompleted
                          </span>
                          <span className="font-medium text-gray-900">
                            {project.title} Proposal (2 Doors)
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {project.title} Proposal (2 Doors)
                            </div>
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              COMPLETED
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          3:44 PM
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>

                {/* Email Communication */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.username?.substring(0, 2).toUpperCase() || 'JM'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-1">
                          To James Marabella, {project.customerName}
                        </div>
                        <div className="font-medium text-gray-900 mb-2">
                          Milestone complete
                        </div>
                        <div className="text-gray-700 mb-3">
                          <p>Hi James,</p>
                          <p className="mt-2">
                            This message is to inform you that a milestone has been completed on {project.title} Proposal (2 Doors).
                          </p>
                          <p className="mt-2">
                            Click below to pay for this milestone. Project name: {project.customerName}
                          </p>
                          <p className="mt-2">
                            Due date: 06/13/2025
                          </p>
                        </div>
                        <div className="flex space-x-3">
                          <Button variant="outline" size="sm">
                            Send email
                          </Button>
                          <Button size="sm" className="bg-gray-900 hover:bg-gray-800">
                            Create file
                          </Button>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-800 mt-2">
                          View full message →
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-0 p-4">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload project files, contracts, and proposals here
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload file
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-0 p-4">
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
                <p className="text-gray-600 mb-4">
                  Add notes and comments about this project
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add note
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-0 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Project Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Customer</label>
                      <p className="text-gray-900">{project.customerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Project Title</label>
                      <p className="text-gray-900">{project.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <Badge 
                        variant={project.status === 'completed' ? 'default' : 
                                project.status === 'in_progress' ? 'secondary' : 'outline'}
                        className="capitalize ml-2"
                      >
                        {project.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p className="text-gray-900">{project.description || 'No description provided'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5" />
                      <span>Financial Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Estimated Cost</label>
                      <p className="text-gray-900">${project.estimatedCost?.toLocaleString() || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Start Date</label>
                      <p className="text-gray-900">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">End Date</label>
                      <p className="text-gray-900">
                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}