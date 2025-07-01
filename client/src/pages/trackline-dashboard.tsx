import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { type Project } from "@shared/schema";

// Local task interface for trackline dashboard
interface TracklineTask {
  id: number;
  projectId: number;
  title: string;
  status: string;
  assignedTo?: string;
  dueDate?: string;
  progress: number;
}
import { 
  Home,
  Users,
  Calendar,
  Clock,
  CheckSquare,
  Settings,
  BarChart3,
  MapPin,
  Timer,
  Activity,
  ChevronRight,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Menu,
  X,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

interface ProjectSummary {
  id: number;
  name: string;
  icon: string;
  tasksCount: number;
  color: string;
}

function TracklineDashboardContent() {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get unified project data
  const {
    processedTasks,
    taskStats,
    isLoading: unifiedLoading,
    updateTask,
    createTask,
    updateFilters,
    filters
  } = useUnifiedProject();

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch projects from your existing API
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const isLoading = unifiedLoading || projectsLoading;

  // Helper function for status colors
  const getStatusColor = (status: string) => {
    const colors = {
      'complete': '#22c55e',
      'in_progress': '#3b82f6',
      'under_review': '#f59e0b',
      'new_lead': '#8b5cf6',
      'on_order': '#ec4899',
      'scheduled': '#10b981',
      'not_started': '#6b7280'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  // Convert unified tasks to timeline format
  const timelineTasks = processedTasks
    .filter(task => task.timeline?.start && task.timeline?.end)
    .map(task => ({
      id: task.id,
      title: task.title,
      startTime: new Date(task.timeline!.start).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      }),
      endTime: new Date(task.timeline!.end).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      }),
      assignees: task.assignedUser ? [`${task.assignedUser.firstName} ${task.assignedUser.lastName}`] : [],
      status: task.status === 'complete' ? 'completed' as const : 
             task.status === 'in_progress' ? 'ongoing' as const : 'under_review' as const,
      color: getStatusColor(task.status),
      projectId: task.projectId,
      task: task // Include full task data
    }));

  // Project summaries from real data
  const projectSummaries: ProjectSummary[] = projects.slice(0, 5).map((project, index) => {
    const projectTasks = processedTasks.filter(task => task.projectId === project.id);
    return {
      id: project.id,
      name: project.name,
      icon: "🏠",
      tasksCount: projectTasks.length,
      color: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"][index % 5],
    };
  });

  // Generate time slots for timeline
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Calculate task position and width for timeline
  const getTaskStyle = (task: any) => {
    const startHour = parseInt(task.startTime.split(':')[0]);
    const startMinute = parseInt(task.startTime.split(':')[1]);
    const endHour = parseInt(task.endTime.split(':')[0]);
    const endMinute = parseInt(task.endTime.split(':')[1]);
    
    const startPosition = ((startHour - 8) * 60 + startMinute) / (10 * 60); // 10 hours total (8-18)
    const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) / (10 * 60);
    
    return {
      left: `${startPosition * 100}%`,
      width: `${duration * 100}%`,
      backgroundColor: task.color,
    };
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-gray-600">Loading Trackline Dashboard...</div>
        </div>
      </div>
    );
  }

  // Mobile sidebar component
  const MobileSidebar = () => (
    <div className="w-full bg-gray-100 flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Trackline</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start text-left font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 h-12"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Home className="w-4 h-4 mr-3" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-left text-gray-700 hover:bg-gray-200 h-12"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Users className="w-4 h-4 mr-3" />
            Teams
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-left text-gray-700 hover:bg-gray-200 h-12"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Calendar className="w-4 h-4 mr-3" />
            Calendar
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-left text-gray-700 hover:bg-gray-200 h-12"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Clock className="w-4 h-4 mr-3" />
            Time Tracker
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-left text-gray-700 hover:bg-gray-200 h-12"
            onClick={() => setMobileMenuOpen(false)}
          >
            <CheckSquare className="w-4 h-4 mr-3" />
            My Tasks
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-left text-gray-700 hover:bg-gray-200 h-12"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Button>
        </div>

        {/* Projects Section */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Projects</span>
            <Button size="sm" variant="ghost" className="p-1 h-8 w-8">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {projectSummaries.map((project) => (
              <Button
                key={project.id}
                variant="ghost"
                className={`w-full justify-start text-left p-3 h-auto ${
                  selectedProject === project.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => {
                  setSelectedProject(project.id);
                  setMobileMenuOpen(false);
                }}
              >
                <div className="flex items-center space-x-3 w-full">
                  <span className="text-lg">{project.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{project.name}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <div 
                        className="w-3 h-1 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-xs text-gray-500">{project.tasksCount} tasks</span>
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen">
        {/* Desktop Sidebar */}
        <div className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
          <MobileSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop Top Header */}
          <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Project Timeline</h1>
                <p className="text-gray-600 mt-1 text-sm lg:text-base">Track your team's progress in real-time</p>
              </div>
              <div className="flex items-center space-x-2 lg:space-x-3">
                <Button variant="outline" size="sm" className="h-10">
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
                <Button variant="outline" size="sm" className="h-10">
                  <Search className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
                <Button size="sm" className="h-10">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Add Task</span>
                </Button>
              </div>
            </div>

            {/* Task Summary */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CheckSquare className="w-6 h-6 text-gray-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Ongoing</p>
                      <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Under Review</p>
                      <p className="text-2xl font-bold text-yellow-600">{taskStats.underReview}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                      <Timer className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <CheckSquare className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progress Distribution</span>
                <span className="text-sm text-gray-500">{Math.round((taskStats.completed / taskStats.total) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 flex overflow-hidden">
                <div 
                  className="bg-green-500 h-full" 
                  style={{ width: `${(taskStats.completed / taskStats.total) * 100}%` }}
                />
                <div 
                  className="bg-blue-500 h-full" 
                  style={{ width: `${(taskStats.inProgress / taskStats.total) * 100}%` }}
                />
                <div 
                  className="bg-yellow-500 h-full" 
                  style={{ width: `${(taskStats.underReview / taskStats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Timeline View */}
          <div className="flex-1 bg-white p-6 overflow-auto">
            <div className="min-w-[800px]">
              {/* Timeline Header */}
              <div className="flex items-center mb-6">
                <div className="w-48 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Tasks</h3>
                </div>
                <div className="flex-1 grid grid-cols-10 gap-0 border-l border-gray-200">
                  {timeSlots.map((time) => (
                    <div key={time} className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200 text-center">
                      {time}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Rows */}
              <div className="space-y-4">
                {timelineTasks.map((task) => (
                  <div key={task.id} className="flex items-center">
                    {/* Task Info */}
                    <div className="w-48 flex-shrink-0 pr-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{task.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex -space-x-1 mt-2">
                          {task.assignees.map((assignee, index) => (
                            <Avatar key={index} className="w-6 h-6 border-2 border-white">
                              <AvatarFallback className="text-xs bg-gray-300">
                                {assignee.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="flex-1 relative border-l border-gray-200 h-16">
                      <div 
                        className="absolute top-4 h-8 rounded-md flex items-center justify-center text-white text-xs font-medium shadow-sm"
                        style={getTaskStyle(task)}
                      >
                        <span className="px-2 truncate">{task.startTime} - {task.endTime}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="w-10 flex justify-center">
                      <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* View Details Button */}
              <div className="mt-8 text-center">
                <Link href="/projects">
                  <Button variant="outline" className="px-8">
                    View Details Task
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 w-10 p-0">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <MobileSidebar />
                </SheetContent>
              </Sheet>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">Trackline</span>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="h-10">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="p-4">
          {/* Mobile Task Summary */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Project Timeline</h1>
            <p className="text-gray-600 text-sm mb-4">Track your team's progress</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Card>
                <CardContent className="p-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-lg font-bold text-gray-900">{taskStats.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Ongoing</p>
                    <p className="text-lg font-bold text-blue-600">{taskStats.inProgress}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Review</p>
                    <p className="text-lg font-bold text-yellow-600">{taskStats.underReview}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Done</p>
                    <p className="text-lg font-bold text-green-600">{taskStats.completed}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm text-gray-500">{Math.round((taskStats.completed / taskStats.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 flex overflow-hidden">
                <div 
                  className="bg-green-500 h-full" 
                  style={{ width: `${(taskStats.completed / taskStats.total) * 100}%` }}
                />
                <div 
                  className="bg-blue-500 h-full" 
                  style={{ width: `${(taskStats.inProgress / taskStats.total) * 100}%` }}
                />
                <div 
                  className="bg-yellow-500 h-full" 
                  style={{ width: `${(taskStats.underReview / taskStats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex space-x-2 mb-6">
            <Button variant="outline" size="sm" className="flex-1 h-12">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="flex-1 h-12">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button size="sm" className="flex-1 h-12">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Mobile Timeline - Card View */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-3">Today's Tasks</h3>
            {timelineTasks.map((task) => (
              <Card key={task.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                      <div className="text-sm text-gray-600 mb-2">
                        {task.startTime} - {task.endTime}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Mobile Timeline Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2 relative">
                      <div 
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: task.color,
                          width: '60%',
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Assignees */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1">
                      {task.assignees.map((assignee, index) => (
                        <Avatar key={index} className="w-6 h-6 border-2 border-white">
                          <AvatarFallback className="text-xs bg-gray-300">
                            {assignee.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {task.assignees.length} assigned
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mobile View Details Button */}
          <div className="mt-8 text-center">
            <Link href="/projects">
              <Button variant="outline" className="w-full h-12">
                View Details Task
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export with provider wrapper
export default function TracklineDashboard() {
  return (
    <UnifiedProjectProvider>
      <TracklineDashboardContent />
    </UnifiedProjectProvider>
  );
}