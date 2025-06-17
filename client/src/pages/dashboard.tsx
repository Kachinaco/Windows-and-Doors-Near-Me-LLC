import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarDays, 
  Clock, 
  Users, 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  PlusCircle,
  LogOut,
  User,
  Settings
} from "lucide-react";
import { Project, Task, ContactSubmission } from "@shared/schema";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("projects");

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: contactSubmissions = [], isLoading: contactLoading } = useQuery({
    queryKey: ["/api/contact-submissions"],
    enabled: user?.role === 'admin' || user?.role === 'employee',
  });

  const handleLogout = () => {
    logout();
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Windows & Doors Near Me
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.firstName} {user?.lastName} ({user?.role})
                </span>
              </div>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Project Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {user?.firstName}! Here's an overview of your projects.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {projects.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {projects.filter((p: Project) => p.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {projects.filter((p: Project) => p.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {projects.filter((p: Project) => p.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            {(user?.role === 'admin' || user?.role === 'employee') && (
              <TabsTrigger value="leads">Lead Management</TabsTrigger>
            )}
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h2>
              {(user?.role === 'admin' || user?.role === 'employee') && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              )}
            </div>

            <div className="grid gap-6">
              {projectsLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-gray-500">Loading projects...</p>
                  </CardContent>
                </Card>
              ) : projects.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-gray-500">No projects found</p>
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
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h2>
              {(user?.role === 'admin' || user?.role === 'employee') && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              )}
            </div>

            <Card>
              <CardContent className="p-6">
                <p className="text-center text-gray-500">Task management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lead Management Tab */}
          {(user?.role === 'admin' || user?.role === 'employee') && (
            <TabsContent value="leads" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Management</h2>
              </div>

              <div className="grid gap-6">
                {contactLoading ? (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-center text-gray-500">Loading contact submissions...</p>
                    </CardContent>
                  </Card>
                ) : contactSubmissions.length === 0 ? (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-center text-gray-500">No contact submissions found</p>
                    </CardContent>
                  </Card>
                ) : (
                  contactSubmissions.map((submission: ContactSubmission) => (
                    <Card key={submission.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {submission.firstName} {submission.lastName}
                            </CardTitle>
                            <CardDescription>
                              {submission.email} • {submission.phone}
                            </CardDescription>
                          </div>
                          <Badge className={`${getStatusColor(submission.status)} text-white`}>
                            {submission.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">Service Needed</p>
                            <p className="text-gray-600 dark:text-gray-400">{submission.serviceNeeded}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">Project Details</p>
                            <p className="text-gray-600 dark:text-gray-400">{submission.projectDetails}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">Submitted</p>
                            <p className="text-gray-600 dark:text-gray-400">
                              {new Date(submission.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            Contact
                          </Button>
                          <Button variant="outline" size="sm">
                            Convert to Project
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}