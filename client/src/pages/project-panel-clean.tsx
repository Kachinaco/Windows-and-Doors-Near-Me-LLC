import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, X, Save, Calendar, Hash, Type, Users, Circle, 
  ChevronDown, ChevronRight, Trash2, Star, CheckSquare, 
  BarChart3, Tag, Clock, MapPin
} from 'lucide-react';

// Import the formula engine
import { FormulaEngine } from '../utils/formulaEngine';

interface SubItem {
  id: number;
  name: string;
  assignedTo: string;
  status: string;
  priority: string;
  progress: number;
  cost: number;
  hours: number;
  description?: string;
}

interface ProjectItem {
  id: number;
  name: string;
  avatar: string;
  status: string;
  priority: string;
  progress: number;
  measureDate: string;
  installDate: string;
  materials: number;
  firstBid: number;
  materialsFormula: string;
  firstBidFormula: string;
  subitems: SubItem[];
  expanded: boolean;
  tags: string[];
  assignedUsers: string[];
  dependencies: number[];
  files: any[];
}

interface Column {
  id: string;
  name: string;
  type: 'text' | 'status' | 'dropdown' | 'number' | 'date' | 'timeline' | 'people' | 'tags' | 'rating' | 'checkbox' | 'progress' | 'location';
  width: number;
  visible: boolean;
  editable: boolean;
  order: number;
  settings: {
    formula?: string;
    options?: Array<{ label: string; color: string; value: string }>;
    color?: string;
  };
}

const ProjectPanel: React.FC = () => {
  const [isCustomizationMode, setIsCustomizationMode] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([
    {
      id: 1,
      name: "Kitchen Window Installation",
      avatar: "JD",
      status: "In Progress",
      priority: "High",
      progress: 75,
      measureDate: "2024-01-15",
      installDate: "2024-01-25",
      materials: 2500,
      firstBid: 4800,
      materialsFormula: "",
      firstBidFormula: "",
      subitems: [
        {
          id: 101,
          name: "Site Preparation",
          assignedTo: "John Doe",
          status: "Complete",
          priority: "High",
          progress: 100,
          cost: 500,
          hours: 8
        },
        {
          id: 102,
          name: "Window Installation",
          assignedTo: "Jane Smith",
          status: "In Progress",
          priority: "High",
          progress: 50,
          cost: 2000,
          hours: 16
        }
      ],
      expanded: false,
      tags: ["urgent", "kitchen"],
      assignedUsers: ["John Doe", "Jane Smith"],
      dependencies: [],
      files: []
    },
    {
      id: 2,
      name: "Bathroom Door Installation",
      avatar: "SM",
      status: "New Lead",
      priority: "Medium",
      progress: 0,
      measureDate: "",
      installDate: "",
      materials: 0,
      firstBid: 0,
      materialsFormula: "",
      firstBidFormula: "",
      subitems: [],
      expanded: false,
      tags: [],
      assignedUsers: [],
      dependencies: [],
      files: []
    }
  ]);

  const [columns, setColumns] = useState<Column[]>([
    { id: 'name', name: 'Item', type: 'text', width: 200, visible: true, editable: true, order: 0, settings: {} },
    { id: 'status', name: 'Status', type: 'status', width: 120, visible: true, editable: true, order: 1, settings: {} },
    { id: 'priority', name: 'Priority', type: 'status', width: 120, visible: true, editable: true, order: 2, settings: {} },
    { id: 'progress', name: 'Progress', type: 'progress', width: 120, visible: true, editable: true, order: 3, settings: {} },
    { id: 'measureDate', name: 'Measure Date', type: 'date', width: 140, visible: true, editable: true, order: 4, settings: {} },
    { id: 'installDate', name: 'Install Date', type: 'date', width: 140, visible: true, editable: true, order: 5, settings: {} }
  ]);

  const [editingFormula, setEditingFormula] = useState<{ columnId: string; formula: string } | null>(null);

  // Initialize formula engine
  const formulaEngine = FormulaEngine.getInstance();

  const updateProject = (projectId: number, field: string, value: any) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId ? { ...project, [field]: value } : project
    ));
  };

  const addColumn = (type: Column['type']) => {
    const newColumn: Column = {
      id: Date.now().toString(),
      name: `New ${type}`,
      type,
      width: 120,
      visible: true,
      editable: true,
      order: columns.length,
      settings: {}
    };
    setColumns(prev => [...prev, newColumn]);
    setIsCustomizationMode(false);
  };

  const deleteColumn = (columnId: string) => {
    setColumns(prev => prev.filter(col => col.id !== columnId));
  };

  const toggleProjectExpanded = (projectId: number) => {
    updateProject(projectId, 'expanded', !projects.find(p => p.id === projectId)?.expanded);
  };

  const addSubitem = (projectId: number) => {
    const newSubitem: SubItem = {
      id: Date.now(),
      name: 'New Task',
      assignedTo: '',
      status: 'Not Started',
      priority: 'Medium',
      progress: 0,
      cost: 0,
      hours: 0,
      description: ''
    };

    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, subitems: [...project.subitems, newSubitem] }
        : project
    ));
  };

  const updateSubitem = (projectId: number, subitemId: number, field: string, value: any) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { 
            ...project, 
            subitems: project.subitems.map(sub => 
              sub.id === subitemId ? { ...sub, [field]: value } : sub
            ) 
          }
        : project
    ));
  };

  const deleteSubitem = (projectId: number, subitemId: number) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, subitems: project.subitems.filter(sub => sub.id !== subitemId) }
        : project
    ));
  };

  const renderCellValue = (column: Column, project: ProjectItem, value: any) => {
    switch (column.type) {
      case 'status':
        return (
          <select
            value={value || ''}
            onChange={(e) => updateProject(project.id, column.id, e.target.value)}
            className="w-full bg-orange-500 text-white px-3 py-2 rounded-xl text-sm font-medium border-none outline-none"
          >
            <option value="New Lead">New Lead</option>
            <option value="In Progress">In Progress</option>
            <option value="Complete">Complete</option>
          </select>
        );
      case 'progress':
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{value || 0}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${value || 0}%` }}
              />
            </div>
          </div>
        );
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => updateProject(project.id, column.id, e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => updateProject(project.id, column.id, parseFloat(e.target.value) || 0)}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateProject(project.id, column.id, e.target.value)}
            className="w-full bg-transparent text-white text-sm border-none outline-none"
          />
        );
    }
  };

  const renderProjectCard = (project: ProjectItem) => {
    const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order);
    
    return (
      <div key={project.id} className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 shadow-lg">
        {/* Header with title and actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {project.avatar}
            </div>
            <input
              type="text"
              value={project.name}
              onChange={(e) => updateProject(project.id, 'name', e.target.value)}
              className="bg-transparent text-white font-semibold text-xl border-none outline-none focus:bg-gray-700/30 rounded px-2 py-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => addSubitem(project.id)}
              className="p-2 hover:bg-gray-700/50 rounded-lg text-blue-400 hover:text-blue-300"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-700/50 rounded-lg text-red-400 hover:text-red-300">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Column Fields */}
        <div className="space-y-4 mb-6">
          {visibleColumns.filter(col => col.id !== 'name').map(column => (
            <div key={column.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 text-sm font-medium">{column.name}</label>
                {isCustomizationMode && (
                  <button
                    onClick={() => deleteColumn(column.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="bg-gray-700/30 rounded-lg p-3">
                {renderCellValue(column, project, (project as any)[column.id])}
              </div>
            </div>
          ))}
        </div>

        {/* Subitems Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleProjectExpanded(project.id)}
              className="flex items-center gap-2 text-white font-medium text-base hover:text-gray-300 transition-colors"
            >
              <span>Subitems</span>
              {project.expanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => addSubitem(project.id)}
              className="p-2 hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {project.expanded && (
            <div className="space-y-3">
              {project.subitems.map(subitem => (
                <div key={subitem.id} className="bg-gray-700/40 rounded-xl p-4 border border-gray-600/30">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={subitem.name}
                      onChange={(e) => updateSubitem(project.id, subitem.id, 'name', e.target.value)}
                      className="bg-transparent text-blue-400 font-medium text-sm border-none outline-none focus:bg-gray-600/30 rounded px-2 py-1 flex-1"
                    />
                    <button
                      onClick={() => deleteSubitem(project.id, subitem.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Minimal Column Addition Modal */}
      {isCustomizationMode && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-4 shadow-xl max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-base font-medium">Add Column</h3>
              <button 
                onClick={() => setIsCustomizationMode(false)}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button onClick={() => addColumn('text')} className="column-btn-minimal bg-blue-600">
                <Type className="w-4 h-4" />
                <span className="text-xs">Text</span>
              </button>
              <button onClick={() => addColumn('dropdown')} className="column-btn-minimal bg-orange-600">
                <ChevronDown className="w-4 h-4" />
                <span className="text-xs">Dropdown</span>
              </button>
              <button onClick={() => addColumn('status')} className="column-btn-minimal bg-green-600">
                <Circle className="w-4 h-4" />
                <span className="text-xs">Status</span>
              </button>
              <button onClick={() => addColumn('people')} className="column-btn-minimal bg-purple-600">
                <Users className="w-4 h-4" />
                <span className="text-xs">People</span>
              </button>
              <button onClick={() => addColumn('number')} className="column-btn-minimal bg-indigo-600">
                <Hash className="w-4 h-4" />
                <span className="text-xs">Number</span>
              </button>
              <button onClick={() => addColumn('date')} className="column-btn-minimal bg-teal-600">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Date</span>
              </button>
              <button onClick={() => addColumn('progress')} className="column-btn-minimal bg-blue-500">
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs">Progress</span>
              </button>
              <button onClick={() => addColumn('tags')} className="column-btn-minimal bg-pink-600">
                <Tag className="w-4 h-4" />
                <span className="text-xs">Tags</span>
              </button>
            </div>
            
            <button 
              onClick={() => setIsCustomizationMode(false)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 px-3 rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
      
      {/* Floating Add Column Button */}
      {!isCustomizationMode && (
        <button
          onClick={() => setIsCustomizationMode(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      
      {/* Main Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Project Board</h1>
            <p className="text-gray-400">Manage your projects with Monday.com-style interface</p>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="space-y-6">
          {projects.map(project => renderProjectCard(project))}
          
          {/* Add New Project Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border-2 border-dashed border-gray-600 hover:border-blue-500 transition-colors cursor-pointer">
            <div className="text-center">
              <Plus className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Add New Project</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPanel;