import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Folder, Trash2, User, Calendar, Hash, Star, MessageCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const SimpleProjectTable = ({ className = "", height = "500px" }) => {
  const [expandedItems, setExpandedItems] = useState(new Set([1, 2]));
  const [expandedFolders, setExpandedFolders] = useState(new Set([1001, 2001]));
  const [editingCell, setEditingCell] = useState(null);
  
  const teamMembers = [
    { id: 1, name: 'John Doe', avatar: 'JD' },
    { id: 2, name: 'Jane Smith', avatar: 'JS' },
    { id: 3, name: 'Bob Wilson', avatar: 'BW' },
    { id: 4, name: 'Alice Johnson', avatar: 'AJ' }
  ];

  const [projects, setProjects] = useState([
    {
      id: 1,
      group: 'New Leads',
      name: 'Website Redesign Project',
      status: 'new lead',
      assignedTo: 1,
      dueDate: '2025-07-15',
      progress: 0,
      priority: 'high',
      folders: [
        {
          id: 1001,
          name: 'Design Phase',
          subItems: [
            { id: 10001, name: 'Research user requirements', status: 'not_started', assignedTo: 2, priority: 'high' },
            { id: 10002, name: 'Create wireframes', status: 'in_progress', assignedTo: 1, priority: 'medium' }
          ]
        }
      ]
    },
    {
      id: 2,
      group: 'In Progress',
      name: 'E-commerce Platform',
      status: 'in progress',
      assignedTo: 3,
      dueDate: '2025-07-30',
      progress: 60,
      priority: 'high',
      folders: [
        {
          id: 2001,
          name: 'Backend Development',
          subItems: [
            { id: 20001, name: 'Database design', status: 'completed', assignedTo: 3, priority: 'high' },
            { id: 20002, name: 'API development', status: 'in_progress', assignedTo: 3, priority: 'high' }
          ]
        }
      ]
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'new lead': return 'bg-cyan-100 text-cyan-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMember = (id) => {
    return teamMembers.find(m => m.id === id) || { name: 'Unassigned', avatar: '?' };
  };

  const toggleItem = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const updateProject = (projectId, field, value) => {
    setProjects(prev => 
      prev.map(p => 
        p.id === projectId ? { ...p, [field]: value } : p
      )
    );
    setEditingCell(null);
  };

  const groupedProjects = projects.reduce((groups, project) => {
    if (!groups[project.group]) {
      groups[project.group] = [];
    }
    groups[project.group].push(project);
    return groups;
  }, {});

  const groups = ['New Leads', 'In Progress', 'Complete'];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Project Management Board</h3>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto" style={{ height }}>
        {/* Column Headers */}
        <div className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
          <div className="flex">
            <div className="w-12 px-2 py-3 border-r border-gray-200"></div>
            <div className="w-64 px-4 py-3 border-r border-gray-200">
              <div className="flex items-center space-x-2">
                <Hash className="w-3 h-3 text-gray-400" />
                <span className="font-medium text-sm text-gray-700">Project</span>
              </div>
            </div>
            <div className="w-32 px-3 py-3 border-r border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-sm text-gray-700">Status</span>
              </div>
            </div>
            <div className="w-40 px-3 py-3 border-r border-gray-200">
              <div className="flex items-center space-x-2">
                <User className="w-3 h-3 text-purple-400" />
                <span className="font-medium text-sm text-gray-700">Assigned</span>
              </div>
            </div>
            <div className="w-32 px-3 py-3 border-r border-gray-200">
              <div className="flex items-center space-x-2">
                <Calendar className="w-3 h-3 text-orange-400" />
                <span className="font-medium text-sm text-gray-700">Due Date</span>
              </div>
            </div>
            <div className="w-32 px-3 py-3 border-r border-gray-200">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-3 h-3 text-green-400" />
                <span className="font-medium text-sm text-gray-700">Progress</span>
              </div>
            </div>
            <div className="w-24 px-3 py-3 border-r border-gray-200">
              <div className="flex items-center space-x-2">
                <Star className="w-3 h-3 text-yellow-400" />
                <span className="font-medium text-sm text-gray-700">Priority</span>
              </div>
            </div>
            <div className="w-12 px-2 py-3">
              <MessageCircle className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Groups and Projects */}
        {groups.map(groupName => {
          const groupProjects = groupedProjects[groupName] || [];
          return (
            <div key={groupName}>
              {/* Group Header */}
              <div className={`flex border-b border-gray-200 ${
                groupName === 'New Leads' ? 'bg-cyan-50' :
                groupName === 'In Progress' ? 'bg-blue-50' :
                'bg-green-50'
              }`}>
                <div className="w-12 px-2 py-3 border-r border-gray-200"></div>
                <div className="w-64 px-4 py-3 border-r border-gray-200 flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    groupName === 'New Leads' ? 'bg-cyan-500' :
                    groupName === 'In Progress' ? 'bg-blue-500' :
                    'bg-green-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-700">{groupName}</span>
                  <span className="text-sm text-gray-500">({groupProjects.length})</span>
                </div>
                <div className="flex-1"></div>
              </div>

              {/* Projects in Group */}
              {groupProjects.map(project => (
                <React.Fragment key={project.id}>
                  {/* Main Project Row */}
                  <div className="flex hover:bg-gray-50 border-b border-gray-200">
                    <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-400 text-blue-500" />
                    </div>
                    
                    {/* Project Name */}
                    <div className="w-64 px-4 py-3 border-r border-gray-200 flex items-center">
                      <button
                        onClick={() => toggleItem(project.id)}
                        className="p-1 hover:bg-gray-100 rounded mr-2"
                      >
                        {expandedItems.has(project.id) ? (
                          <ChevronDown className="w-3 h-3 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-gray-500" />
                        )}
                      </button>
                      {editingCell === `${project.id}-name` ? (
                        <Input
                          value={project.name}
                          onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                          onClick={() => setEditingCell(`${project.id}-name`)}
                        >
                          {project.name}
                        </span>
                      )}
                    </div>
                    
                    {/* Status */}
                    <div className="w-32 px-3 py-3 border-r border-gray-200 flex items-center">
                      <Badge className={`${getStatusColor(project.status)} text-xs`}>
                        {project.status}
                      </Badge>
                    </div>
                    
                    {/* Assigned To */}
                    <div className="w-40 px-3 py-3 border-r border-gray-200 flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                        {getMember(project.assignedTo).avatar}
                      </div>
                      <span className="text-sm">{getMember(project.assignedTo).name}</span>
                    </div>
                    
                    {/* Due Date */}
                    <div className="w-32 px-3 py-3 border-r border-gray-200 flex items-center">
                      <span className="text-sm">{project.dueDate}</span>
                    </div>
                    
                    {/* Progress */}
                    <div className="w-32 px-3 py-3 border-r border-gray-200 flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{project.progress}%</span>
                    </div>
                    
                    {/* Priority */}
                    <div className="w-24 px-3 py-3 border-r border-gray-200 flex items-center">
                      <Badge className={`${getPriorityColor(project.priority)} text-xs`}>
                        {project.priority}
                      </Badge>
                    </div>
                    
                    {/* Updates */}
                    <div className="w-12 px-2 py-3 flex items-center justify-center">
                      <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Folders and Subitems */}
                  {expandedItems.has(project.id) && project.folders.map(folder => (
                    <React.Fragment key={folder.id}>
                      {/* Folder Header */}
                      <div className="flex hover:bg-blue-50 bg-blue-25 border-b border-blue-200">
                        <div className="w-12 px-2 py-2 border-r border-blue-200"></div>
                        <div className="w-64 px-4 py-2 border-r border-blue-200 flex items-center">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-4 h-px bg-blue-400"></div>
                            <button
                              onClick={() => toggleFolder(folder.id)}
                              className="p-0.5 hover:bg-blue-100 rounded"
                            >
                              <ChevronRight className={`w-3 h-3 text-blue-600 transition-transform ${
                                expandedFolders.has(folder.id) ? 'rotate-90' : ''
                              }`} />
                            </button>
                            <Folder className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-900 text-sm font-medium">{folder.name}</span>
                            <span className="text-blue-600 text-xs bg-blue-100 px-1.5 rounded">
                              ({folder.subItems.length})
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 border-r border-blue-200"></div>
                        <div className="w-12 px-2 py-2 flex items-center justify-center">
                          <button className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded">
                            <MessageCircle className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Subitems */}
                      {expandedFolders.has(folder.id) && folder.subItems.map(subItem => (
                        <div key={subItem.id} className="flex hover:bg-blue-25 border-b border-blue-100">
                          <div className="w-12 px-2 py-2 border-r border-blue-200"></div>
                          <div className="w-64 px-4 py-2 border-r border-blue-200 flex items-center">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-8 h-px bg-blue-300"></div>
                              <Hash className="w-3 h-3 text-blue-500" />
                              <span className="text-blue-900 text-sm">{subItem.name}</span>
                            </div>
                          </div>
                          <div className="w-32 px-3 py-2 border-r border-blue-200 flex items-center">
                            <Badge className={`${getStatusColor(subItem.status)} text-xs`}>
                              {subItem.status}
                            </Badge>
                          </div>
                          <div className="w-40 px-3 py-2 border-r border-blue-200 flex items-center space-x-2">
                            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                              {getMember(subItem.assignedTo).avatar}
                            </div>
                            <span className="text-xs text-blue-900">{getMember(subItem.assignedTo).name}</span>
                          </div>
                          <div className="w-32 px-3 py-2 border-r border-blue-200"></div>
                          <div className="w-32 px-3 py-2 border-r border-blue-200"></div>
                          <div className="w-24 px-3 py-2 border-r border-blue-200 flex items-center">
                            <Badge className={`${getPriorityColor(subItem.priority)} text-xs`}>
                              {subItem.priority}
                            </Badge>
                          </div>
                          <div className="w-12 px-2 py-2 flex items-center justify-center">
                            <button className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded">
                              <MessageCircle className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Subitem Button */}
                      {expandedFolders.has(folder.id) && (
                        <div className="flex border-b border-blue-100">
                          <div className="w-12 px-2 py-2 border-r border-blue-200"></div>
                          <div className="w-64 px-4 py-2 border-r border-blue-200">
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                              <Plus className="w-3 h-3" />
                              Add sub-item
                            </button>
                          </div>
                          <div className="flex-1"></div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}

              {/* Add Project Button */}
              <div className="flex border-b border-gray-200 hover:bg-gray-50">
                <div className="w-12 px-2 py-3 border-r border-gray-200"></div>
                <div className="w-64 px-4 py-3 border-r border-gray-200">
                  <button className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    Add project
                  </button>
                </div>
                <div className="flex-1"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimpleProjectTable;