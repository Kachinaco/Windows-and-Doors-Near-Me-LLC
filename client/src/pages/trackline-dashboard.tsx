import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Project } from "@shared/schema";
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
  MoreHorizontal
} from "lucide-react";
import { Link } from "wouter";

// Mock data for timeline tasks (replace with real data from your API)
interface TimelineTask {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  assignees: string[];
  status: 'ongoing' | 'under_review' | 'completed';
  color: string;
  projectId: number;
}

interface ProjectSummary {
  id: number;
  name: string;
  icon: string;
  tasksCount: number;
  color: string;
}

export default function TracklineDashboard() {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch projects from your existing API
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Mock timeline tasks (replace with real API call)
  const timelineTasks: TimelineTask[] = [
    {
      id: 1,
      title: "Site Preparation",
      startTime: "08:00",
      endTime: "10:30",
      assignees: ["John D.", "Mike S."],
      status: "completed",
      color: "#22c55e",
      projectId: 1,
    },
    {
      id: 2,
      title: "Window Installation",
      startTime: "10:30",
      endTime: "14:00",
      assignees: ["Sarah M.", "Tom R."],
      status: "ongoing",
      color: "#3b82f6",
      projectId: 1,
    },
    {
      id: 3,
      title: "Quality Check",
      startTime: "14:00",
      endTime: "15:30",
      assignees: ["Lisa K."],
      status: "under_review",
      color: "#f59e0b",
      projectId: 1,
    },
  ];

  // Calculate task statistics
  const taskStats = {
    total: timelineTasks.length,
    ongoing: timelineTasks.filter(t => t.status === 'ongoing').length,
    underReview: timelineTasks.filter(t => t.status === 'under_review').length,
    completed: timelineTasks.filter(t => t.status === 'completed').length,
  };

  // Mock project summaries (generate from your projects data)
  const projectSummaries: ProjectSummary[] = projects.slice(0, 5).map((project, index) => ({
    id: project.id,
    name: project.name,
    icon: "🏠",
    tasksCount: Math.floor(Math.random() * 12) + 3,
    color: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"][index % 5],
  }));

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
  const getTaskStyle = (task: TimelineTask) => {
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

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Trackline</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-left font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              <Home className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left text-gray-700 hover:bg-gray-200">
              <Users className="w-4 h-4 mr-3" />
              Teams
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left text-gray-700 hover:bg-gray-200">
              <Calendar className="w-4 h-4 mr-3" />
              Calendar
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left text-gray-700 hover:bg-gray-200">
              <Clock className="w-4 h-4 mr-3" />
              Time Tracker
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left text-gray-700 hover:bg-gray-200">
              <CheckSquare className="w-4 h-4 mr-3" />
              My Tasks
            </Button>
            <Button variant="ghost" className="w-full justify-start text-left text-gray-700 hover:bg-gray-200">
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Button>
          </div>

          {/* Projects Section */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Projects</span>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {projectSummaries.map((project) => (
                <Button
                  key={project.id}
                  variant="ghost"
                  className={`w-full justify-start text-left p-2 h-auto ${
                    selectedProject === project.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedProject(project.id)}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Project Timeline</h1>
              <p className="text-gray-600 mt-1">Track your team's progress in real-time</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
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
                    <p className="text-2xl font-bold text-blue-600">{taskStats.ongoing}</p>
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
                style={{ width: `${(taskStats.ongoing / taskStats.total) * 100}%` }}
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
  );
}