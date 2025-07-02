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
  EyeOff,
  Type,
  FileText,
  Circle,
  Hash,
  Users,
  Tags,
  Paperclip,
  Link,
  Mail,
  Phone,
  CheckSquare,
  Star,
  MapPin,
  BarChart2,
  RefreshCw,
  ArrowRight,
  Heart
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
  type: 'text' | 'long_text' | 'status' | 'dropdown' | 'number' | 'date' | 'timeline' | 'people' | 'tags' | 'files' | 'link' | 'email' | 'phone' | 'checkbox' | 'rating' | 'location' | 'formula' | 'progress' | 'auto_number' | 'mirror' | 'dependency' | 'vote' | 'creation_log' | 'last_updated';
  width: number;
  visible: boolean;
  editable: boolean;
  order: number;
  settings: {
    formula?: string;
    options?: Array<{ label: string; color: string; value: string }>;
    color?: string;
    dateFormat?: string;
    numberFormat?: 'number' | 'currency' | 'percentage';
    multiSelect?: boolean;
    required?: boolean;
    defaultValue?: any;
    mirrorBoardId?: string;
    mirrorColumnId?: string;
    dependencies?: string[];
    ratingScale?: number;
    phoneFormat?: 'international' | 'national';
    emailValidation?: boolean;
    linkText?: string;
    progressType?: 'percentage' | 'numbers';
    autoNumberPrefix?: string;
    autoNumberStart?: number;
  };
}

const ProjectPanel: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [columns, setColumns] = useState<Column[]>([
    { 
      id: 'name', 
      name: 'Item', 
      type: 'text', 
      width: 250, 
      visible: true, 
      editable: true, 
      order: 0,
      settings: { required: true }
    },
    { 
      id: 'avatar', 
      name: 'Owner', 
      type: 'people', 
      width: 100, 
      visible: true, 
      editable: true, 
      order: 1,
      settings: { multiSelect: false }
    },
    { 
      id: 'status', 
      name: 'Status', 
      type: 'status', 
      width: 130, 
      visible: true, 
      editable: true, 
      order: 2,
      settings: {
        options: [
          { label: 'New Lead', color: '#ff6b35', value: 'new_lead' },
          { label: 'In Progress', color: '#fdca40', value: 'in_progress' },
          { label: 'Measured', color: '#4ecdc4', value: 'measured' },
          { label: 'Quoted', color: '#a8e6cf', value: 'quoted' },
          { label: 'Sold', color: '#ff8b94', value: 'sold' },
          { label: 'Installed', color: '#b4f7d1', value: 'installed' },
          { label: 'Done', color: '#81c784', value: 'done' }
        ]
      }
    },
    { 
      id: 'priority', 
      name: 'Priority', 
      type: 'status', 
      width: 120, 
      visible: true, 
      editable: true, 
      order: 3,
      settings: {
        options: [
          { label: 'Low', color: '#90caf9', value: 'low' },
          { label: 'Medium', color: '#ffb74d', value: 'medium' },
          { label: 'High', color: '#f06292', value: 'high' },
          { label: 'Critical', color: '#e57373', value: 'critical' }
        ]
      }
    },
    { 
      id: 'progress', 
      name: 'Progress', 
      type: 'progress', 
      width: 120, 
      visible: true, 
      editable: false, 
      order: 4,
      settings: { progressType: 'percentage' }
    },
    { 
      id: 'measureDate', 
      name: 'Measure Date', 
      type: 'date', 
      width: 140, 
      visible: true, 
      editable: true, 
      order: 5,
      settings: { dateFormat: 'MM/DD/YYYY' }
    },
    { 
      id: 'installDate', 
      name: 'Install Date', 
      type: 'date', 
      width: 140, 
      visible: true, 
      editable: true, 
      order: 6,
      settings: { dateFormat: 'MM/DD/YYYY' }
    },
    { 
      id: 'materials', 
      name: 'Materials', 
      type: 'formula', 
      width: 120, 
      visible: true, 
      editable: false, 
      order: 7,
      settings: { 
        formula: 'SUM({subitems.cost})',
        numberFormat: 'currency'
      }
    },
    { 
      id: 'firstBid', 
      name: 'First Bid', 
      type: 'formula', 
      width: 120, 
      visible: true, 
      editable: false, 
      order: 8,
      settings: { 
        formula: 'ROUND({materials} * 1.3 + 500, 2)',
        numberFormat: 'currency'
      }
    }
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
    const maxOrder = Math.max(...columns.map(col => col.order), 0);
    const newColumn: Column = {
      id: `column_${Date.now()}`,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      width: 120,
      visible: true,
      editable: true,
      order: maxOrder + 1,
      settings: getDefaultSettings(type)
    };
    
    // Add column with animation feedback
    setColumns(prev => [...prev, newColumn]);
    
    // Close modal with delay for visual feedback
    setTimeout(() => {
      setIsCustomizationMode(false);
    }, 300);
    
    // Success feedback
    console.log(`✓ Added new ${type} column: ${newColumn.name}`);
  };

  const getDefaultSettings = (type: Column['type']) => {
    switch (type) {
      case 'status':
      case 'dropdown':
        return {
          options: [
            { label: 'Option 1', color: '#ff6b35', value: 'option1' },
            { label: 'Option 2', color: '#fdca40', value: 'option2' },
            { label: 'Option 3', color: '#4ecdc4', value: 'option3' }
          ]
        };
      case 'formula':
        return { formula: '0', numberFormat: 'number' as const };
      case 'people':
        return { multiSelect: true };
      case 'number':
        return { numberFormat: 'number' as const };
      case 'date':
        return { dateFormat: 'MM/DD/YYYY' };
      case 'rating':
        return { ratingScale: 5 };
      case 'progress':
        return { progressType: 'percentage' as const };
      case 'auto_number':
        return { autoNumberPrefix: '#', autoNumberStart: 1 };
      case 'phone':
        return { phoneFormat: 'national' as const };
      case 'email':
        return { emailValidation: true };
      case 'link':
        return { linkText: 'Click here' };
      case 'checkbox':
        return { defaultValue: false };
      case 'tags':
        return { multiSelect: true, options: [] };
      default:
        return {};
    }
  };

  // Render cell value based on column type
  const renderCellValue = (column: Column, project: ProjectItem, value: any) => {
    const columnKey = column.id as keyof ProjectItem;
    
    switch (column.type) {
      case 'text':
      case 'long_text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateProject(project.id, columnKey, e.target.value)}
            className="bg-transparent text-white border-none outline-none w-full"
            placeholder="Enter text..."
          />
        );
        
      case 'status':
      case 'dropdown':
        const options = column.settings.options || [];
        const selectedOption = options.find(opt => opt.value === value);
        return (
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: selectedOption?.color || '#gray' }}
            />
            <select
              value={value || ''}
              onChange={(e) => updateProject(project.id, columnKey, e.target.value)}
              className="bg-gray-700 text-white border-none outline-none text-sm rounded px-2 py-1"
            >
              <option value="">Select...</option>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
        
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => updateProject(project.id, columnKey, parseFloat(e.target.value) || 0)}
            className="bg-transparent text-white border-none outline-none w-full text-right"
            placeholder="0"
          />
        );
        
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => updateProject(project.id, columnKey, e.target.value)}
            className="bg-gray-700 text-white border-none outline-none text-sm rounded px-2 py-1"
          />
        );
        
      case 'people':
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">
              {typeof value === 'string' && value ? value.charAt(0) : 'U'}
            </div>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => updateProject(project.id, columnKey, e.target.value)}
              className="bg-transparent text-white border-none outline-none flex-1 text-sm"
              placeholder="Assign person..."
            />
          </div>
        );
        
      case 'progress':
        const progressValue = typeof value === 'number' ? value : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${progressValue}%` }}
              />
            </div>
            <span className="text-xs text-gray-300">{progressValue}%</span>
          </div>
        );
        
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => updateProject(project.id, columnKey, e.target.checked)}
            className="w-4 h-4 accent-blue-500"
          />
        );
        
      case 'rating':
        const ratingValue = typeof value === 'number' ? value : 0;
        const maxRating = column.settings.ratingScale || 5;
        return (
          <div className="flex items-center gap-1">
            {Array.from({ length: maxRating }, (_, i) => (
              <button
                key={i}
                onClick={() => updateProject(project.id, columnKey, i + 1)}
                className={`text-lg ${i < ratingValue ? 'text-yellow-400' : 'text-gray-600'}`}
              >
                ⭐
              </button>
            ))}
          </div>
        );
        
      case 'email':
        return (
          <input
            type="email"
            value={value || ''}
            onChange={(e) => updateProject(project.id, columnKey, e.target.value)}
            className="bg-transparent text-white border-none outline-none w-full text-sm"
            placeholder="email@example.com"
          />
        );
        
      case 'phone':
        return (
          <input
            type="tel"
            value={value || ''}
            onChange={(e) => updateProject(project.id, columnKey, e.target.value)}
            className="bg-transparent text-white border-none outline-none w-full text-sm"
            placeholder="(555) 123-4567"
          />
        );
        
      case 'link':
        return (
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={value || ''}
              onChange={(e) => updateProject(project.id, columnKey, e.target.value)}
              className="bg-transparent text-white border-none outline-none flex-1 text-sm"
              placeholder="https://..."
            />
            {value && (
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                <Link className="w-4 h-4" />
              </a>
            )}
          </div>
        );
        
      case 'tags':
        const tags = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, index) => (
              <span key={index} className="bg-purple-600 text-white px-2 py-1 rounded text-xs">
                {tag}
              </span>
            ))}
            <input
              type="text"
              placeholder="Add tag..."
              className="bg-transparent text-white border-none outline-none text-sm min-w-20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const newTags = [...tags, e.currentTarget.value.trim()];
                  updateProject(project.id, columnKey, newTags);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        );
        
      case 'formula':
        const formulaResult = formulaEngine.calculate(column.settings.formula || '0', {
          item: project,
          subitems: project.subitems || [],
          columns: {},
          boardData: projects
        });
        const format = column.settings.numberFormat;
        let displayValue = formulaResult;
        
        if (format === 'currency') {
          displayValue = new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD' 
          }).format(formulaResult);
        } else if (format === 'percentage') {
          displayValue = `${(formulaResult * 100).toFixed(1)}%`;
        }
        
        return (
          <div className="flex items-center gap-2">
            <span className="text-blue-400">{displayValue}</span>
            <button
              onClick={() => setEditingFormula({ 
                columnId: column.id, 
                formula: column.settings.formula || '0' 
              })}
              className="text-gray-400 hover:text-white"
            >
              <Calculator className="w-4 h-4" />
            </button>
          </div>
        );
        
      case 'auto_number':
        const prefix = column.settings.autoNumberPrefix || '#';
        const startNum = column.settings.autoNumberStart || 1;
        return (
          <span className="text-gray-400 text-sm">
            {prefix}{startNum + project.id}
          </span>
        );
        
      case 'creation_log':
        return (
          <span className="text-gray-400 text-sm">
            {new Date().toLocaleDateString()}
          </span>
        );
        
      case 'last_updated':
        return (
          <span className="text-gray-400 text-sm">
            {new Date().toLocaleDateString()}
          </span>
        );
        
      default:
        return (
          <span className="text-gray-400 text-sm">
            {value || '-'}
          </span>
        );
    }
  };

  const deleteColumn = (columnId: string) => {
    // Prevent deletion of essential columns
    const essentialColumns = ['name', 'status', 'priority'];
    if (essentialColumns.includes(columnId)) {
      console.warn(`Cannot delete essential column: ${columnId}`);
      return;
    }
    
    setColumns(prev => prev.filter(col => col.id !== columnId));
    console.log(`Deleted column: ${columnId}`);
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

  const renderProjectCard = (project: ProjectItem) => {
    const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order);
    
    return (
      <div key={project.id} className="bg-gray-800 rounded-lg border border-gray-700 p-3 hover:border-gray-600 transition-colors duration-150">
        {/* Header with title and actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {project.avatar}
            </div>
            <input
              type="text"
              value={project.name}
              onChange={(e) => updateProject(project.id, 'name', e.target.value)}
              className="bg-transparent text-white font-medium text-base border-none outline-none focus:bg-gray-700 rounded px-2 py-1"
            />
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => addSubitem(project.id)}
              className="p-1.5 hover:bg-gray-700 rounded text-blue-400 hover:text-blue-300"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-gray-700 rounded text-red-400 hover:text-red-300">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Responsive Grid Layout - 2 cols on mobile, 3 on tablet, 4 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
          {visibleColumns.filter(col => col.id !== 'name').map(column => (
            <div key={column.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 text-xs font-medium truncate">{column.name}</label>
                {isCustomizationMode && (
                  <button
                    onClick={() => deleteColumn(column.id)}
                    className="delete-btn"
                    title={`Delete ${column.name} column`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="bg-gray-700 rounded-lg p-2 border border-gray-600 text-sm">
                {renderCellValue(column, project, (project as any)[column.id])}
              </div>
            </div>
          ))}
        </div>

      {/* Status and Priority Row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-400 text-sm font-medium">Status</label>
            {isCustomizationMode && (
              <button
                onClick={() => deleteColumn('status')}
                className="delete-btn"
                title="Delete Status column"
              >
                <X className="w-4 h-4" />
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
                className="delete-btn"
                title="Delete Priority column"
              >
                <X className="w-4 h-4" />
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
                className="delete-btn"
                title="Delete Materials column"
              >
                <X className="w-4 h-4" />
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
                className="delete-btn"
                title="Delete First Bid column"
              >
                <X className="w-4 h-4" />
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
                    className="delete-btn"
                    title={`Delete ${subitem.name} subitem`}
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
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Modern Monday.com Column Addition Modal */}
      {isCustomizationMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 backdrop-blur-lg rounded-3xl p-6 border border-gray-700/50 shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-semibold">Add Column</h3>
              <button 
                onClick={() => setIsCustomizationMode(false)}
                className="p-2 hover:bg-gray-700/50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-3 mb-6">
              {/* Text & Content */}
              <button onClick={() => addColumn('text')} className="column-btn-modern bg-blue-600 hover:bg-blue-500">
                <Type className="w-5 h-5" />
                <span className="text-xs font-medium">Text</span>
              </button>
              <button onClick={() => addColumn('dropdown')} className="column-btn-modern bg-orange-600 hover:bg-orange-500">
                <ChevronDown className="w-5 h-5" />
                <span className="text-xs font-medium">Dropdown</span>
              </button>
              <button onClick={() => addColumn('status')} className="column-btn-modern bg-green-600 hover:bg-green-500">
                <Circle className="w-5 h-5" />
                <span className="text-xs font-medium">Status</span>
              </button>
              <button onClick={() => addColumn('people')} className="column-btn-modern bg-purple-600 hover:bg-purple-500">
                <Users className="w-5 h-5" />
                <span className="text-xs font-medium">People</span>
              </button>
              
              {/* Numbers & Data */}
              <button onClick={() => addColumn('number')} className="column-btn-modern bg-indigo-600 hover:bg-indigo-500">
                <Hash className="w-5 h-5" />
                <span className="text-xs font-medium">Number</span>
              </button>
              <button onClick={() => addColumn('date')} className="column-btn-modern bg-teal-600 hover:bg-teal-500">
                <Calendar className="w-5 h-5" />
                <span className="text-xs font-medium">Date</span>
              </button>
              <button onClick={() => addColumn('timeline')} className="column-btn-modern bg-cyan-600 hover:bg-cyan-500">
                <Clock className="w-5 h-5" />
                <span className="text-xs font-medium">Timeline</span>
              </button>
              <button onClick={() => addColumn('location')} className="column-btn-modern bg-red-600 hover:bg-red-500">
                <MapPin className="w-5 h-5" />
                <span className="text-xs font-medium">Location</span>
              </button>
              
              {/* Interactive */}
              <button onClick={() => addColumn('rating')} className="column-btn-modern bg-yellow-600 hover:bg-yellow-500">
                <Star className="w-5 h-5" />
                <span className="text-xs font-medium">Rating</span>
              </button>
              <button onClick={() => addColumn('checkbox')} className="column-btn-modern bg-gray-600 hover:bg-gray-500">
                <CheckSquare className="w-5 h-5" />
                <span className="text-xs font-medium">Checkbox</span>
              </button>
              <button onClick={() => addColumn('progress')} className="column-btn-modern bg-green-600 hover:bg-green-500">
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs font-medium">Progress</span>
              </button>
              <button onClick={() => addColumn('tags')} className="column-btn-modern bg-pink-600 hover:bg-pink-500">
                <Tags className="w-5 h-5" />
                <span className="text-xs font-medium">Tags</span>
              </button>
            </div>
            
            <button 
              onClick={() => setIsCustomizationMode(false)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-2xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
      
      {/* Enhanced Column Addition Modal */}
      {isCustomizationMode && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white text-xl font-semibold mb-1">Add New Column</h3>
                <p className="text-gray-400 text-sm">Choose a column type to enhance your board</p>
              </div>
              <button 
                onClick={() => setIsCustomizationMode(false)}
                className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button onClick={() => addColumn('text')} className="column-btn-minimal bg-gradient-to-r from-blue-600 to-blue-700">
                <Type className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Text</span>
                <span className="text-xs opacity-75">Single line text</span>
              </button>
              <button onClick={() => addColumn('dropdown')} className="column-btn-minimal bg-gradient-to-r from-orange-600 to-orange-700">
                <ChevronDown className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Dropdown</span>
                <span className="text-xs opacity-75">Select from options</span>
              </button>
              <button onClick={() => addColumn('status')} className="column-btn-minimal bg-gradient-to-r from-green-600 to-green-700">
                <Circle className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Status</span>
                <span className="text-xs opacity-75">Project status</span>
              </button>
              <button onClick={() => addColumn('people')} className="column-btn-minimal bg-gradient-to-r from-purple-600 to-purple-700">
                <Users className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">People</span>
                <span className="text-xs opacity-75">Team members</span>
              </button>
              <button onClick={() => addColumn('number')} className="column-btn-minimal bg-gradient-to-r from-indigo-600 to-indigo-700">
                <Hash className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Number</span>
                <span className="text-xs opacity-75">Numeric values</span>
              </button>
              <button onClick={() => addColumn('date')} className="column-btn-minimal bg-gradient-to-r from-teal-600 to-teal-700">
                <Calendar className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Date</span>
                <span className="text-xs opacity-75">Calendar dates</span>
              </button>
              <button onClick={() => addColumn('progress')} className="column-btn-minimal bg-gradient-to-r from-cyan-600 to-cyan-700">
                <BarChart3 className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Progress</span>
                <span className="text-xs opacity-75">Percentage bars</span>
              </button>
              <button onClick={() => addColumn('tags')} className="column-btn-minimal bg-gradient-to-r from-pink-600 to-pink-700">
                <Tags className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Tags</span>
                <span className="text-xs opacity-75">Color labels</span>
              </button>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsCustomizationMode(false)}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 hover:scale-105"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsCustomizationMode(false)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 hover:scale-105"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Floating Add Column Button */}
      {!isCustomizationMode && (
        <button
          onClick={() => setIsCustomizationMode(true)}
          className="floating-add-btn"
          title="Add new column"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Project Cards */}
          {projects.map(renderProjectCard)}
          
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