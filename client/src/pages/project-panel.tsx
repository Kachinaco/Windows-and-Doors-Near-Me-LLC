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
  
  // Apple-style column customization states
  const [isCustomizationMode, setIsCustomizationMode] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [editingColumnName, setEditingColumnName] = useState<string | null>(null);

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

  // Apple-style column customization functions
  const startLongPress = (columnId: string, event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault();
    const timer = setTimeout(() => {
      setIsCustomizationMode(true);
      // Add shake animation class to the element
      const element = (event.target as HTMLElement).closest('.column-field');
      if (element) {
        element.classList.add('animate-pulse', 'animate-bounce');
      }
    }, 800); // 800ms long press
    setLongPressTimer(timer);
  };

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const exitCustomizationMode = () => {
    setIsCustomizationMode(false);
    setEditingColumnName(null);
    // Remove animation classes
    document.querySelectorAll('.column-field').forEach(element => {
      element.classList.remove('animate-pulse', 'animate-bounce');
    });
  };

  const addColumn = (type: Column['type']) => {
    const newColumn: Column = {
      id: `column_${Date.now()}`,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      width: 120,
      visible: true,
      editable: true,
      ...(type === 'status' && { options: ['Not Started', 'In Progress', 'Complete'] }),
      ...(type === 'priority' && { options: ['Low', 'Medium', 'High', 'Critical'] }),
      ...(type === 'tags' && { options: [] }),
      ...(type === 'formula' && { formula: '0' })
    };
    setColumns(prev => [...prev, newColumn]);
  };

  const deleteColumn = (columnId: string) => {
    setColumns(prev => prev.filter(col => col.id !== columnId));
  };

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const renameColumn = (columnId: string, newName: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, name: newName } : col
    ));
    setEditingColumnName(null);
  };

  const renderProjectCard = (project: ProjectItem) => (
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
          <button className="p-2 hover:bg-gray-700/50 rounded-lg text-blue-400 hover:text-blue-300">
            <Plus className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-700/50 rounded-lg text-red-400 hover:text-red-300">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Status and Priority Row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-400 text-sm font-medium">Status</label>
            {isCustomizationMode && (
              <button
                onClick={() => deleteColumn('status')}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            value={project.status}
            onChange={(e) => updateProject(project.id, 'status', e.target.value)}
            onTouchStart={(e) => startLongPress('status', e)}
            onTouchEnd={cancelLongPress}
            onMouseDown={(e) => startLongPress('status', e)}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            className={`column-field w-full bg-orange-500 text-white px-4 py-3 rounded-xl text-sm font-medium border-none outline-none focus:ring-2 focus:ring-orange-400 ${isCustomizationMode ? 'ring-2 ring-blue-400' : ''}`}
          >
            <option value="New Lead" className="bg-gray-800">New Lead</option>
            <option value="In Progress" className="bg-gray-800">In Progress</option>
            <option value="Measured" className="bg-gray-800">Measured</option>
            <option value="Quoted" className="bg-gray-800">Quoted</option>
            <option value="Sold" className="bg-gray-800">Sold</option>
            <option value="Installed" className="bg-gray-800">Installed</option>
            <option value="Done" className="bg-gray-800">Done</option>
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-400 text-sm font-medium">Priority</label>
            {isCustomizationMode && (
              <button
                onClick={() => deleteColumn('priority')}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            value={project.priority}
            onChange={(e) => updateProject(project.id, 'priority', e.target.value)}
            onTouchStart={(e) => startLongPress('priority', e)}
            onTouchEnd={cancelLongPress}
            onMouseDown={(e) => startLongPress('priority', e)}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            className={`column-field w-full bg-orange-500 text-white px-4 py-3 rounded-xl text-sm font-medium border-none outline-none focus:ring-2 focus:ring-orange-400 ${isCustomizationMode ? 'ring-2 ring-blue-400' : ''}`}
          >
            <option value="Low" className="bg-gray-800">Low</option>
            <option value="Medium" className="bg-gray-800">Medium</option>
            <option value="High" className="bg-gray-800">High</option>
            <option value="Critical" className="bg-gray-800">Critical</option>
          </select>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-gray-400 text-sm font-medium">Progress</label>
          <span className="text-gray-300 text-sm font-medium">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Date Fields */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block text-gray-400 text-sm mb-2 font-medium">Measure Date</label>
          <div className="bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-gray-300 text-sm cursor-pointer hover:bg-gray-600/50 transition-colors">
            {project.measureDate ? new Date(project.measureDate).toLocaleDateString() : 'Click to edit'}
          </div>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-2 font-medium">Install Date</label>
          <div className="bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-gray-300 text-sm cursor-pointer hover:bg-gray-600/50 transition-colors">
            {project.installDate ? new Date(project.installDate).toLocaleDateString() : 'Click to edit'}
          </div>
        </div>
      </div>

      {/* Formula Fields */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-400 text-sm font-medium">Materials</label>
            {isCustomizationMode && (
              <button
                onClick={() => deleteColumn('materials')}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="relative">
            <div 
              onTouchStart={(e) => startLongPress('materials', e)}
              onTouchEnd={cancelLongPress}
              onMouseDown={(e) => startLongPress('materials', e)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              className={`column-field bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-green-400 text-sm cursor-pointer hover:bg-gray-600/50 transition-colors ${isCustomizationMode ? 'ring-2 ring-blue-400' : ''}`}
            >
              Click to edit
            </div>
            <button
              onClick={() => setEditingFormula({ columnId: 'materials', formula: project.materialsFormula })}
              className="absolute top-2 right-2 text-blue-400 hover:text-blue-300 p-1"
              title="Edit formula"
            >
              <Calculator className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-400 text-sm font-medium">First Bid</label>
            {isCustomizationMode && (
              <button
                onClick={() => deleteColumn('firstBid')}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="relative">
            <div 
              onTouchStart={(e) => startLongPress('firstBid', e)}
              onTouchEnd={cancelLongPress}
              onMouseDown={(e) => startLongPress('firstBid', e)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              className={`column-field bg-blue-600/30 border border-blue-500/50 rounded-xl px-4 py-3 text-white text-sm font-medium ${isCustomizationMode ? 'ring-2 ring-blue-400' : ''}`}
            >
              {project.firstBid || '0'}
            </div>
            <button
              onClick={() => setEditingFormula({ columnId: 'firstBid', formula: project.firstBidFormula })}
              className="absolute top-2 right-2 text-blue-400 hover:text-blue-300 p-1"
              title="Edit formula"
            >
              <Calculator className="w-3 h-3" />
            </button>
          </div>
        </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {subitem.assignedTo ? subitem.assignedTo.charAt(0) : 'J'}
                    </div>
                    <span className="text-gray-300 text-sm">{subitem.assignedTo || 'John Doe'}</span>
                  </div>
                  <select
                    value={subitem.status}
                    onChange={(e) => updateSubitem(project.id, subitem.id, 'status', e.target.value)}
                    className="bg-gray-600 text-white px-3 py-1 rounded-lg text-xs border-none outline-none"
                  >
                    <option value="Not Started" className="bg-gray-800">Not Started</option>
                    <option value="In Progress" className="bg-gray-800">In Progress</option>
                    <option value="Complete" className="bg-gray-800">Complete</option>
                  </select>
                </div>
              </div>
            ))}
            
            {/* Hide subitems toggle */}
            <button
              onClick={() => toggleProjectExpanded(project.id)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-300 text-sm mt-3"
            >
              <ChevronRight className="w-4 h-4 rotate-90" />
              <span>Hide subitems ({project.subitems.length})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Apple-style Customization Toolbar */}
      {isCustomizationMode && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-sm rounded-2xl px-6 py-3 border border-gray-700">
          <div className="flex items-center gap-4">
            <span className="text-white text-sm font-medium">Customize Columns</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => addColumn('text')}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-white"
              >
                Text
              </button>
              <button
                onClick={() => addColumn('status')}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs text-white"
              >
                Status
              </button>
              <button
                onClick={() => addColumn('date')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs text-white"
              >
                Date
              </button>
              <button
                onClick={() => addColumn('formula')}
                className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg text-xs text-white"
              >
                Formula
              </button>
            </div>
            <button
              onClick={exitCustomizationMode}
              className="px-4 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs text-white font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Content - Mobile-first single column layout */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {projects.map(renderProjectCard)}
        
        {/* Add Item Input */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <input
              type="text"
              placeholder="Enter item name..."
              className="flex-1 bg-transparent text-gray-300 placeholder-gray-500 border-none outline-none text-lg"
            />
            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-medium">
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Column Management */}
      {!isCustomizationMode && (
        <button
          onClick={() => setIsCustomizationMode(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-40"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

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