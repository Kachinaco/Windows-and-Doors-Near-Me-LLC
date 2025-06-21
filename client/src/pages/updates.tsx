import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  Activity,
  Clock,
  User,
  Building2,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Search,
  Filter
} from "lucide-react";
import { Link } from "wouter";
import { type ProjectUpdate, type Project } from "@shared/schema";

export default function UpdatesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterProject, setFilterProject] = useState("all");

  const { data: updates = [], isLoading: updatesLoading } = useQuery<any[]>({
    queryKey: ["/api/project-updates"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const filteredUpdates = updates.filter((update: any) => {
    const matchesSearch = update.message?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesType = filterType === "all" || update.updateType === filterType;
    const matchesProject = filterProject === "all" || update.projectId?.toString() === filterProject;
    
    return matchesSearch && matchesType && matchesProject;
  });

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case "status_change":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case "task_completion":
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      case "priority_change":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "assignment":
        return <User className="h-4 w-4 text-indigo-600" />;
      case "document":
        return <FileText className="h-4 w-4 text-gray-600" />;
      case "schedule":
        return <Calendar className="h-4 w-4 text-teal-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getUpdateTypeLabel = (type: string) => {
    switch (type) {
      case "status_change":
        return "Status Update";
      case "comment":
        return "Comment";
      case "task_completion":
        return "Task Completed";
      case "priority_change":
        return "Priority Changed";
      case "assignment":
        return "Assignment";
      case "document":
        return "Document";
      case "schedule":
        return "Schedule";
      default:
        return "Activity";
    }
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const updateDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return updateDate.toLocaleDateString();
  };

  if (updatesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="h-9 min-w-[140px]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Activity Feed
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {user?.firstName} {user?.lastName} ({user?.role})
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search updates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="status_change">Status Updates</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                  <SelectItem value="task_completion">Task Completions</SelectItem>
                  <SelectItem value="priority_change">Priority Changes</SelectItem>
                  <SelectItem value="assignment">Assignments</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="schedule">Schedule Changes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger>
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Updates Feed */}
        <div className="space-y-4">
          {filteredUpdates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No updates found
                </h3>
                <p className="text-gray-500">
                  {searchTerm || filterType !== "all" || filterProject !== "all"
                    ? "Try adjusting your filters to see more updates."
                    : "No project updates available at the moment."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUpdates.map((update: ProjectUpdate) => (
              <Card key={update.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getUpdateIcon(update.updateType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {getUpdateTypeLabel(update.updateType)}
                          </Badge>
                          {update.projectId && (
                            <Link href={`/projects/${update.projectId}`}>
                              <Badge variant="outline" className="text-xs hover:bg-blue-50 cursor-pointer">
                                <Building2 className="h-3 w-3 mr-1" />
                                Project #{update.projectId}
                              </Badge>
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatRelativeTime(update.createdAt.toString())}
                        </div>
                      </div>
                      
                      <p className="text-gray-900 dark:text-white mb-2">
                        {update.message}
                      </p>
                      
                      {update.performedBy && (
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-1" />
                          <span>by User #{update.performedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredUpdates.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline">
              Load More Updates
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}