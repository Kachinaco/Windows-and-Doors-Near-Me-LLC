import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  MoreHorizontal, 
  Calendar,
  User,
  Flag,
  BarChart3,
  Clock,
  DollarSign,
  Calculator,
  Edit3,
  Save,
  X,
  Trash2,
  Copy,
  Settings,
  Filter,
  SortAsc,
  Eye,
  EyeOff
} from 'lucide-react';
import FormulaEngine, { FormulaContext } from '../utils/formulaEngine';

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
  type: 'text' | 'status' | 'priority' | 'people' | 'date' | 'numbers' | 'progress' | 'formula' | 'tags' | 'files';
  width: number;
  visible: boolean;
  editable: boolean;
  formula?: string;
  options?: string[];
  color?: string;
}

const ProjectPanel: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [columns, setColumns] = useState<Column[]>([
    { id: 'name', name: 'Item', type: 'text', width: 250, visible: true, editable: true },
    { id: 'avatar', name: 'Owner', type: 'people', width: 100, visible: true, editable: true },
    { id: 'status', name: 'Status', type: 'status', width: 130, visible: true, editable: true, 
      options: ['New Lead', 'In Progress', 'Measured', 'Quoted', 'Sold', 'Installed', 'Done'] },
    { id: 'priority', name: 'Priority', type: 'priority', width: 120, visible: true, editable: true,
      options: ['Low', 'Medium', 'High', 'Critical'] },
    { id: 'progress', name: 'Progress', type: 'progress', width: 120, visible: true, editable: false },
    { id: 'measureDate', name: 'Measure Date', type: 'date', width: 140, visible: true, editable: true },
    { id: 'installDate', name: 'Install Date', type: 'date', width: 140, visible: true, editable: true },
    { id: 'materials', name: 'Materials', type: 'formula', width: 120, visible: true, editable: false,
      formula: 'SUM({subitems.cost})' },
    { id: 'firstBid', name: 'First Bid', type: 'formula', width: 120, visible: true, editable: false,
      formula: 'ROUND({materials} * 1.3 + 500, 2)' }
  ]);

  const [editingFormula, setEditingFormula] = useState<{ columnId: string; formula: string } | null>(null);
  const [formulaEngine] = useState(() => FormulaEngine.getInstance());
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'kanban' | 'timeline'>('card');

  // Initialize sample data
  useEffect(() => {
    const sampleProjects: ProjectItem[] = [
      {
        id: 1,
        name: 'Kitchen Window Replacement',
        avatar: 'JD',
        status: 'In Progress',
        priority: 'High',
        progress: 0,
        measureDate: '2024-01-15',
        installDate: '2024-02-01',
        materials: 0,
        firstBid: 0,
        materialsFormula: 'SUM({subitems.cost})',
        firstBidFormula: 'ROUND({materials} * 1.3 + 500, 2)',
        expanded: false,
        tags: ['residential', 'urgent'],
        assignedUsers: ['JD', 'SM'],
        dependencies: [],
        files: [],
        subitems: [
          {
            id: 101,
            name: 'Site Measurement',
            assignedTo: 'John Doe',
            status: 'Complete',
            priority: 'High',
            progress: 100,
            cost: 150,
            hours: 3,
            description: 'Initial measurement and assessment'
          },
          {
            id: 102,
            name: 'Material Ordering',
            assignedTo: 'Jane Smith',
            status: 'In Progress',
            priority: 'Medium',
            progress: 60,
            cost: 2400,
            hours: 2,
            description: 'Order windows and supplies'
          },
          {
            id: 103,
            name: 'Installation',
            assignedTo: 'Mike Johnson',
            status: 'Not Started',
            priority: 'High',
            progress: 0,
            cost: 800,
            hours: 8,
            description: 'Install new windows'
          }
        ]
      },
      {
        id: 2,
        name: 'Bathroom Door Installation',
        avatar: 'SM',
        status: 'New Lead',
        priority: 'Medium',
        progress: 0,
        measureDate: '2024-01-20',
        installDate: '2024-02-15',
        materials: 0,
        firstBid: 0,
        materialsFormula: 'SUM({subitems.cost})',
        firstBidFormula: 'ROUND({materials} * 1.3 + 500, 2)',
        expanded: false,
        tags: ['commercial'],
        assignedUsers: ['SM'],
        dependencies: [],
        files: [],
        subitems: [
          {
            id: 201,
            name: 'Consultation',
            assignedTo: 'Sarah Miller',
            status: 'Not Started',
            priority: 'Medium',
            progress: 0,
            cost: 100,
            hours: 1,
            description: 'Initial consultation'
          },
          {
            id: 202,
            name: 'Door Selection',
            assignedTo: 'Sarah Miller',
            status: 'Not Started',
            priority: 'Low',
            progress: 0,
            cost: 650,
            hours: 1,
            description: 'Choose door style and materials'
          }
        ]
      }
    ];
    setProjects(sampleProjects);
  }, []);

  // Calculate formula values for all projects
  const calculateFormulas = useCallback(() => {
    setProjects(prevProjects => 
      prevProjects.map(project => {
        const context: FormulaContext = {
          item: project,
          subitems: project.subitems,
          columns: {},
          boardData: prevProjects
        };

        // Calculate Materials formula
        const materialsValue = formulaEngine.evaluateFormula(project.materialsFormula, context);
        
        // Calculate First Bid formula (depends on materials)
        const updatedContext = { ...context, item: { ...project, materials: materialsValue } };
        const firstBidValue = formulaEngine.evaluateFormula(project.firstBidFormula, updatedContext);

        // Calculate progress based on subitems
        const totalSubitems = project.subitems.length;
        const completedSubitems = project.subitems.filter(sub => sub.status === 'Complete').length;
        const progress = totalSubitems > 0 ? Math.round((completedSubitems / totalSubitems) * 100) : 0;

        return {
          ...project,
          materials: typeof materialsValue === 'number' ? materialsValue : 0,
          firstBid: typeof firstBidValue === 'number' ? firstBidValue : 0,
          progress
        };
      })
    );
  }, [formulaEngine]);

  // Recalculate formulas when subitems change
  useEffect(() => {
    calculateFormulas();
  }, [calculateFormulas]);

  const updateProject = (projectId: number, field: string, value: any) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, [field]: value }
        : project
    ));
  };

  const updateSubitem = (projectId: number, subitemId: number, field: string, value: any) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? {
            ...project,
            subitems: project.subitems.map(subitem =>
              subitem.id === subitemId 
                ? { ...subitem, [field]: value }
                : subitem
            )
          }
        : project
    ));
    // Trigger recalculation after subitem update
    setTimeout(calculateFormulas, 0);
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

  const deleteSubitem = (projectId: number, subitemId: number) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, subitems: project.subitems.filter(sub => sub.id !== subitemId) }
        : project
    ));
    setTimeout(calculateFormulas, 0);
  };

  const saveFormula = (columnId: string, formula: string) => {
    const validation = formulaEngine.validateFormula(formula);
    if (!validation.isValid) {
      alert(`Formula error: ${validation.error}`);
      return;
    }

    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, formula } : col
    ));

    setProjects(prev => prev.map(project => ({
      ...project,
      [columnId + 'Formula']: formula
    })));

    setEditingFormula(null);
    setTimeout(calculateFormulas, 0);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'New Lead': 'bg-blue-500',
      'In Progress': 'bg-yellow-500', 
      'Measured': 'bg-purple-500',
      'Quoted': 'bg-orange-500',
      'Sold': 'bg-green-500',
      'Installed': 'bg-emerald-500',
      'Done': 'bg-gray-500',
      'Complete': 'bg-green-500',
      'Not Started': 'bg-gray-400'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'Low': 'bg-green-500',
      'Medium': 'bg-yellow-500',
      'High': 'bg-orange-500',
      'Critical': 'bg-red-500'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-400';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderProjectCard = (project: ProjectItem) => (
    <div key={project.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {project.avatar}
          </div>
          <div>
            <input
              type="text"
              value={project.name}
              onChange={(e) => updateProject(project.id, 'name', e.target.value)}
              className="bg-transparent text-white font-semibold text-lg border-none outline-none focus:bg-gray-700 rounded px-2 py-1"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-700 rounded">
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded text-red-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status and Priority */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Status</span>
          <select
            value={project.status}
            onChange={(e) => updateProject(project.id, 'status', e.target.value)}
            className={`${getStatusColor(project.status)} text-white px-3 py-1 rounded-full text-sm border-none outline-none`}
          >
            {columns.find(c => c.id === 'status')?.options?.map(option => (
              <option key={option} value={option} className="bg-gray-800 text-white">
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Priority</span>
          <select
            value={project.priority}
            onChange={(e) => updateProject(project.id, 'priority', e.target.value)}
            className={`${getPriorityColor(project.priority)} text-white px-3 py-1 rounded-full text-sm border-none outline-none`}
          >
            {columns.find(c => c.id === 'priority')?.options?.map(option => (
              <option key={option} value={option} className="bg-gray-800 text-white">
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Progress</span>
          <span className="text-white text-sm">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-gray-400 text-sm mb-1">Measure Date</label>
          <input
            type="date"
            value={project.measureDate}
            onChange={(e) => updateProject(project.id, 'measureDate', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Install Date</label>
          <input
            type="date"
            value={project.installDate}
            onChange={(e) => updateProject(project.id, 'installDate', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Formula Fields */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-gray-400 text-sm">Materials</label>
            <button
              onClick={() => setEditingFormula({ columnId: 'materials', formula: project.materialsFormula })}
              className="text-blue-400 hover:text-blue-300 p-1"
              title="Edit formula"
            >
              <Calculator className="w-3 h-3" />
            </button>
          </div>
          <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-green-400 font-semibold">
            {formatCurrency(project.materials)}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-gray-400 text-sm">First Bid</label>
            <button
              onClick={() => setEditingFormula({ columnId: 'firstBid', formula: project.firstBidFormula })}
              className="text-blue-400 hover:text-blue-300 p-1"
              title="Edit formula"
            >
              <Calculator className="w-3 h-3" />
            </button>
          </div>
          <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-blue-400 font-semibold">
            {formatCurrency(project.firstBid)}
          </div>
        </div>
      </div>

      {/* Subitems Section */}
      <div className="border-t border-gray-600 pt-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => toggleProjectExpanded(project.id)}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            {project.expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="font-medium">Subitems ({project.subitems.length})</span>
          </button>
          <button
            onClick={() => addSubitem(project.id)}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {project.expanded && (
          <div className="space-y-2">
            {project.subitems.map(subitem => (
              <div key={subitem.id} className="bg-gray-700 rounded p-3 border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <input
                    type="text"
                    value={subitem.name}
                    onChange={(e) => updateSubitem(project.id, subitem.id, 'name', e.target.value)}
                    className="bg-transparent text-blue-400 font-medium text-sm border-none outline-none focus:bg-gray-600 rounded px-1 py-1 flex-1"
                  />
                  <button
                    onClick={() => deleteSubitem(project.id, subitem.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">
                      {subitem.assignedTo ? subitem.assignedTo.charAt(0) : 'U'}
                    </div>
                    <input
                      type="text"
                      value={subitem.assignedTo}
                      onChange={(e) => updateSubitem(project.id, subitem.id, 'assignedTo', e.target.value)}
                      placeholder="Assign to..."
                      className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-xs focus:border-blue-500 focus:outline-none w-20"
                    />
                  </div>
                  <select
                    value={subitem.status}
                    onChange={(e) => updateSubitem(project.id, subitem.id, 'status', e.target.value)}
                    className={`${getStatusColor(subitem.status)} text-white px-2 py-1 rounded text-xs border-none outline-none`}
                  >
                    <option value="Not Started" className="bg-gray-800">Not Started</option>
                    <option value="In Progress" className="bg-gray-800">In Progress</option>
                    <option value="Complete" className="bg-gray-800">Complete</option>
                  </select>
                  <input
                    type="number"
                    value={subitem.cost}
                    onChange={(e) => updateSubitem(project.id, subitem.id, 'cost', parseFloat(e.target.value) || 0)}
                    placeholder="Cost"
                    className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-xs focus:border-blue-500 focus:outline-none w-16"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Project Panel</h1>
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1 rounded text-sm ${viewMode === 'card' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                Card
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded text-sm ${viewMode === 'table' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded text-sm ${viewMode === 'kanban' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 rounded text-sm ${viewMode === 'timeline' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                Timeline
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map(renderProjectCard)}
          </div>
        )}

        {/* Add Item Input */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Enter item name..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white">
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Formula Editor Modal */}
      {editingFormula && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 border border-gray-600">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Edit Formula - {editingFormula.columnId}</h2>
              <button
                onClick={() => setEditingFormula(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Formula
              </label>
              <textarea
                value={editingFormula.formula}
                onChange={(e) => setEditingFormula(prev => prev ? { ...prev, formula: e.target.value } : null)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none h-24 font-mono"
                placeholder="Enter formula (e.g., SUM({subitems.cost}))"
              />
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Available Functions:</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div>SUM(), AVERAGE(), MIN(), MAX()</div>
                <div>COUNT(), ROUND(), IF(), AND(), OR()</div>
                <div>CONCATENATE(), TODAY(), WORKDAYS()</div>
                <div>PROGRESS(), STATUS_COUNT()</div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Use {'{subitems.fieldName}'} to reference subitem fields
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingFormula(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => saveFormula(editingFormula.columnId, editingFormula.formula)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Formula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPanel;