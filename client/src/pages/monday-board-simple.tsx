import React, { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { type Project } from "@shared/schema";
import { Plus, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function SimpleMondayBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Simple collapsed state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Fetch projects
  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  // Group projects by status
  const groupedProjects = (projects as Project[]).reduce((groups: Record<string, Project[]>, project: Project) => {
    const groupName = 
      project.status === 'new lead' ? 'New Leads' :
      project.status === 'need attention' ? 'Need Attention' :
      project.status === 'sent estimate' ? 'Sent Estimate' :
      project.status === 'signed' ? 'Signed' :
      project.status === 'in progress' ? 'In Progress' :
      project.status === 'complete' ? 'Complete' : 'New Leads';
    
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(project);
    return groups;
  }, {});

  // Toggle group collapse
  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, field, value }: { projectId: number, field: string, value: any }) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update project');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Updated successfully" });
    },
    onError: () => {
      toast({ title: "Update failed", variant: "destructive" });
    },
  });

  // Add project mutation
  const addProjectMutation = useMutation({
    mutationFn: async (status: string) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'New Project',
          status: status,
          description: '',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add project');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Project added successfully" });
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-950 text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4 text-red-400">Error loading projects</div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const statusOptions = [
    { value: 'new lead', label: 'New Lead', color: 'bg-cyan-500' },
    { value: 'need attention', label: 'Need Attention', color: 'bg-orange-500' },
    { value: 'sent estimate', label: 'Sent Estimate', color: 'bg-purple-500' },
    { value: 'signed', label: 'Signed', color: 'bg-green-500' },
    { value: 'in progress', label: 'In Progress', color: 'bg-blue-500' },
    { value: 'complete', label: 'Complete', color: 'bg-emerald-500' },
  ];

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-semibold">Project Board</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Mobile View */}
        <div className="block md:hidden">
          {Object.entries(groupedProjects).map(([groupName, groupProjects]) => (
            <div key={groupName} className="mb-6">
              {/* Group Header */}
              <div className="flex items-center justify-between mb-3 px-3 py-2 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className="p-1 hover:bg-gray-800 rounded"
                  >
                    {collapsedGroups[groupName] ? (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <h3 className="font-medium text-sm text-gray-200">{groupName}</h3>
                  <span className="text-xs text-gray-500">({groupProjects.length})</span>
                </div>
                <Button
                  onClick={() => {
                    const status = 
                      groupName === 'New Leads' ? 'new lead' :
                      groupName === 'Need Attention' ? 'need attention' :
                      groupName === 'Sent Estimate' ? 'sent estimate' :
                      groupName === 'Signed' ? 'signed' :
                      groupName === 'In Progress' ? 'in progress' :
                      groupName === 'Complete' ? 'complete' : 'new lead';
                    addProjectMutation.mutate(status);
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {/* Mobile Cards */}
              {!collapsedGroups[groupName] && (
                <div className="space-y-2">
                  {groupProjects.map((project) => (
                    <div key={project.id} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <Input
                          value={project.name || ''}
                          onChange={(e) => updateProjectMutation.mutate({
                            projectId: project.id,
                            field: 'name',
                            value: e.target.value
                          })}
                          className="font-medium text-sm text-white bg-transparent border-none p-0 h-auto"
                          placeholder="Project name"
                        />
                        <Select
                          value={project.status || 'new lead'}
                          onValueChange={(value) => updateProjectMutation.mutate({
                            projectId: project.id,
                            field: 'status',
                            value: value
                          })}
                        >
                          <SelectTrigger className="w-auto h-6 text-xs border-none bg-blue-500/20 text-blue-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                        <div>
                          <span className="text-gray-500">Address:</span>
                          <Input
                            value={project.projectAddress || ''}
                            onChange={(e) => updateProjectMutation.mutate({
                              projectId: project.id,
                              field: 'projectAddress',
                              value: e.target.value
                            })}
                            className="bg-transparent text-gray-300 border-none p-0 h-auto text-xs"
                            placeholder="No address"
                          />
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <Input
                            value={project.clientPhone || ''}
                            onChange={(e) => updateProjectMutation.mutate({
                              projectId: project.id,
                              field: 'clientPhone',
                              value: e.target.value
                            })}
                            className="bg-transparent text-gray-300 border-none p-0 h-auto text-xs"
                            placeholder="No phone"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          {Object.entries(groupedProjects).map(([groupName, groupProjects]) => (
            <div key={groupName} className="mb-4">
              {/* Group Header */}
              <div className="bg-gray-900 border-b border-gray-700 h-10 flex items-center px-3">
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="p-1 hover:bg-gray-800 rounded mr-2"
                >
                  {collapsedGroups[groupName] ? (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <span className="text-sm font-medium text-white mr-2">{groupName}</span>
                <span className="text-xs text-gray-500">({groupProjects.length})</span>
                <Button
                  onClick={() => {
                    const status = 
                      groupName === 'New Leads' ? 'new lead' :
                      groupName === 'Need Attention' ? 'need attention' :
                      groupName === 'Sent Estimate' ? 'sent estimate' :
                      groupName === 'Signed' ? 'signed' :
                      groupName === 'In Progress' ? 'in progress' :
                      groupName === 'Complete' ? 'complete' : 'new lead';
                    addProjectMutation.mutate(status);
                  }}
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-6 w-6 p-0 text-gray-400 hover:text-blue-400"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {/* Desktop Table */}
              {!collapsedGroups[groupName] && (
                <div>
                  {/* Column Headers */}
                  <div className="bg-gray-800 border-b border-gray-700 h-8 flex items-center text-xs text-gray-400 font-medium">
                    <div className="w-64 px-3">Project Name</div>
                    <div className="w-32 px-3">Status</div>
                    <div className="w-48 px-3">Address</div>
                    <div className="w-32 px-3">Phone</div>
                  </div>
                  
                  {/* Rows */}
                  {groupProjects.map((project) => (
                    <div key={project.id} className="bg-gray-950 hover:bg-gray-900/50 border-b border-gray-800 h-12 flex items-center transition-colors">
                      <div className="w-64 px-3">
                        <Input
                          value={project.name || ''}
                          onChange={(e) => updateProjectMutation.mutate({
                            projectId: project.id,
                            field: 'name',
                            value: e.target.value
                          })}
                          className="bg-transparent border-none text-white text-sm p-0 h-auto"
                          placeholder="Project name"
                        />
                      </div>
                      <div className="w-32 px-3">
                        <Select
                          value={project.status || 'new lead'}
                          onValueChange={(value) => updateProjectMutation.mutate({
                            projectId: project.id,
                            field: 'status',
                            value: value
                          })}
                        >
                          <SelectTrigger className="h-7 text-xs border-none bg-blue-500/20 text-blue-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-48 px-3">
                        <Input
                          value={project.projectAddress || ''}
                          onChange={(e) => updateProjectMutation.mutate({
                            projectId: project.id,
                            field: 'projectAddress',
                            value: e.target.value
                          })}
                          className="bg-transparent border-none text-white text-sm p-0 h-auto"
                          placeholder="Address"
                        />
                      </div>
                      <div className="w-32 px-3">
                        <Input
                          value={project.clientPhone || ''}
                          onChange={(e) => updateProjectMutation.mutate({
                            projectId: project.id,
                            field: 'clientPhone',
                            value: e.target.value
                          })}
                          className="bg-transparent border-none text-white text-sm p-0 h-auto"
                          placeholder="Phone"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}