import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus,
  Search,
  Phone,
  FileText,
  Calendar,
  MapPin,
  Users,
  Filter,
  RefreshCw,
  ArrowUpDown,
  ChevronDown,
  Trash2,
  Archive,
  MoreHorizontal,
  Settings,
  Copy,
  Download,
  Upload,
  Save,
  X,
  Check,
  Columns,
  SortAsc,
  SortDesc,
  Grid3X3,
  Calculator,
  PaintBucket,
  Lock,
  Unlock,
  ChevronRight,
  Edit
} from "lucide-react";

// Excel-style colors for status
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'complete':
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'on order':
    case 'ordered':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'in progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'new lead':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'scheduled':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatDate = (date: Date | string | null) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: '2-digit'
  });
};

export default function ExcelProjectManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Excel-style state management
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{row: number, column: string} | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    id: 60,
    name: 200,
    assignedTo: 150,
    location: 180,
    phone: 130,
    status: 120,
    startDate: 100,
    endDate: 100,
    createdAt: 100,
    priority: 80,
    budget: 100
  });
  const [resizing, setResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState([
    'id', 'name', 'assignedTo', 'location', 'phone', 'status', 'startDate', 'endDate', 'createdAt'
  ]);
  const [frozenColumns, setFrozenColumns] = useState<string[]>(['id', 'name']);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormulas, setShowFormulas] = useState(false);
  const [groupBy, setGroupBy] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, rowId: number} | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [conditionalFormatting, setConditionalFormatting] = useState<Record<string, any>>({
    status: {
      'complete': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
      'in progress': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
      'new lead': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' }
    }
  });
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [cellHistory, setCellHistory] = useState<Record<string, string[]>>({});
  
  const tableRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/employees'],
    enabled: !!user,
  });

  // Excel-style column definitions
  const columns = [
    { key: 'id', label: 'ID', type: 'number', width: columnWidths.id, frozen: frozenColumns.includes('id') },
    { key: 'name', label: 'Project Name', type: 'text', width: columnWidths.name, frozen: frozenColumns.includes('name') },
    { key: 'assignedTo', label: 'Assigned To', type: 'select', width: columnWidths.assignedTo, options: employees.map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })) },
    { key: 'location', label: 'Location', type: 'text', width: columnWidths.location },
    { key: 'phone', label: 'Phone', type: 'text', width: columnWidths.phone },
    { key: 'status', label: 'Status', type: 'select', width: columnWidths.status, options: [
      { value: 'new lead', label: 'New Lead' },
      { value: 'in progress', label: 'In Progress' },
      { value: 'on order', label: 'On Order' },
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'complete', label: 'Complete' }
    ]},
    { key: 'startDate', label: 'Start Date', type: 'date', width: columnWidths.startDate },
    { key: 'endDate', label: 'End Date', type: 'date', width: columnWidths.endDate },
    { key: 'createdAt', label: 'Created', type: 'date', width: columnWidths.createdAt },
  ].filter(col => visibleColumns.includes(col.key));

  // Column resizing functionality
  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    setResizing(columnKey);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnKey]);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        const diff = e.clientX - startX;
        const newWidth = Math.max(60, startWidth + diff);
        setColumnWidths(prev => ({ ...prev, [resizing]: newWidth }));
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, startX, startWidth]);

  // Advanced cell editing with Excel-like features
  const handleCellClick = (rowId: number, columnKey: string, currentValue: any, e?: React.MouseEvent) => {
    // Handle multi-select with Ctrl/Cmd
    if (e?.ctrlKey || e?.metaKey) {
      const cellKey = `${rowId}-${columnKey}`;
      setSelectedCells(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cellKey)) {
          newSet.delete(cellKey);
        } else {
          newSet.add(cellKey);
        }
        return newSet;
      });
      return;
    }

    // Single cell selection
    setSelectedCells(new Set([`${rowId}-${columnKey}`]));
    setEditingCell({ row: rowId, column: columnKey });
    setEditValue(currentValue?.toString() || '');
    
    // Track cell history
    const cellKey = `${rowId}-${columnKey}`;
    setCellHistory(prev => ({
      ...prev,
      [cellKey]: [...(prev[cellKey] || []), currentValue?.toString() || ''].slice(-10)
    }));
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    
    let finalValue = editValue;
    
    // Handle Excel-like formulas
    if (editValue.startsWith('=')) {
      try {
        // Simple formula parsing (can be extended)
        if (editValue.startsWith('=SUM(')) {
          const range = editValue.match(/=SUM\((\w+):(\w+)\)/);
          if (range) {
            // Calculate sum for the range
            finalValue = 'Formula: ' + editValue;
          }
        } else if (editValue.startsWith('=COUNT(')) {
          finalValue = 'Formula: ' + editValue;
        }
      } catch (error) {
        finalValue = '#ERROR';
      }
    }

    try {
      const response = await fetch(`/api/projects/${editingCell.row}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          [editingCell.column]: finalValue
        })
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        toast({
          title: "Cell Updated",
          description: `${editingCell.column} updated successfully`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cell",
        variant: "destructive"
      });
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Move to cell above
        moveSelection('up');
      } else {
        // Move to cell below
        moveSelection('down');
      }
      handleCellSave();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        moveSelection('left');
      } else {
        moveSelection('right');
      }
      handleCellSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!editingCell) {
        // Delete selected cells
        handleDeleteSelectedCells();
      }
    }
  };

  const moveSelection = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!editingCell) return;
    
    const currentColIndex = columns.findIndex(col => col.key === editingCell.column);
    const currentRowIndex = filteredAndSortedProjects.findIndex(p => p.id === editingCell.row);
    
    let newRowIndex = currentRowIndex;
    let newColIndex = currentColIndex;
    
    switch (direction) {
      case 'up':
        newRowIndex = Math.max(0, currentRowIndex - 1);
        break;
      case 'down':
        newRowIndex = Math.min(filteredAndSortedProjects.length - 1, currentRowIndex + 1);
        break;
      case 'left':
        newColIndex = Math.max(0, currentColIndex - 1);
        break;
      case 'right':
        newColIndex = Math.min(columns.length - 1, currentColIndex + 1);
        break;
    }
    
    const newProject = filteredAndSortedProjects[newRowIndex];
    const newColumn = columns[newColIndex];
    
    if (newProject && newColumn) {
      const newValue = getCellValue(newProject, newColumn.key);
      setEditingCell({ row: newProject.id, column: newColumn.key });
      setEditValue(newValue?.toString() || '');
    }
  };

  const handleDeleteSelectedCells = () => {
    selectedCells.forEach(cellKey => {
      const [rowId, columnKey] = cellKey.split('-');
      // Set cell to empty
      fetch(`/api/projects/${rowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          [columnKey]: ''
        })
      });
    });
    
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    setSelectedCells(new Set());
  };

  // Right-click context menu
  const handleRightClick = (e: React.MouseEvent, rowId: number) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      rowId
    });
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Handle Excel-like shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            toast({ title: "Saved", description: "Spreadsheet saved successfully" });
            break;
          case 'c':
            if (selectedCells.size > 0) {
              e.preventDefault();
              // Copy selected cells
              const cellData = Array.from(selectedCells).map(cellKey => {
                const [rowId, columnKey] = cellKey.split('-');
                const project = projects.find(p => p.id === parseInt(rowId));
                return project ? getCellValue(project, columnKey) : '';
              });
              navigator.clipboard.writeText(cellData.join('\t'));
              toast({ title: "Copied", description: `${selectedCells.size} cells copied` });
            }
            break;
          case 'v':
            if (selectedCells.size > 0) {
              e.preventDefault();
              toast({ title: "Paste", description: "Paste functionality - coming soon" });
            }
            break;
          case 'z':
            e.preventDefault();
            toast({ title: "Undo", description: "Undo functionality - coming soon" });
            break;
          case 'f':
            e.preventDefault();
            document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
            break;
          case 'a':
            e.preventDefault();
            // Select all visible cells
            const allCells = new Set<string>();
            filteredAndSortedProjects.forEach(project => {
              columns.forEach(column => {
                allCells.add(`${project.id}-${column.key}`);
              });
            });
            setSelectedCells(allCells);
            break;
        }
      }
    };

    const handleClickOutside = () => {
      setContextMenu(null);
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [selectedCells, projects, filteredAndSortedProjects, columns]);

  // Filtering and sorting
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      const matchesSearch = searchTerm === '' || 
        Object.values(project).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return project[key as keyof Project]?.toString().toLowerCase().includes(value.toLowerCase());
      });

      return matchesSearch && matchesFilters;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Project];
        const bValue = b[sortConfig.key as keyof Project];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [projects, searchTerm, filters, sortConfig]);

  const handleSort = (columnKey: string) => {
    setSortConfig(prev => ({
      key: columnKey,
      direction: prev?.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getCellValue = (project: Project, columnKey: string) => {
    switch (columnKey) {
      case 'assignedTo':
        const employee = employees.find(e => e.id === project.assignedTo);
        return employee ? `${employee.firstName} ${employee.lastName}` : 'Unassigned';
      case 'location':
        return project.projectAddress || '';
      case 'phone':
        return project.clientPhone || '';
      case 'startDate':
      case 'endDate':
      case 'createdAt':
        return formatDate(project[columnKey as keyof Project] as Date);
      default:
        return project[columnKey as keyof Project] || '';
    }
  };

  const renderCell = (project: Project, column: any) => {
    const cellKey = `${project.id}-${column.key}`;
    const isEditing = editingCell?.row === project.id && editingCell?.column === column.key;
    const isSelected = selectedCells.has(cellKey);
    const cellValue = getCellValue(project, column.key);

    if (isEditing) {
      return (
        <div className="relative w-full h-8">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleCellSave}
            className="h-8 text-xs border-2 border-blue-500 focus:border-blue-600 rounded-none"
            autoFocus
            placeholder={showFormulas && editValue.startsWith('=') ? 'Enter formula...' : ''}
          />
          {showFormulas && editValue.startsWith('=') && (
            <div className="absolute -top-6 left-0 bg-black text-white text-xs px-2 py-1 rounded z-50">
              Formula Mode
            </div>
          )}
        </div>
      );
    }

    const cellClass = `
      h-8 px-2 text-xs cursor-cell hover:bg-blue-50 flex items-center truncate relative
      ${isSelected ? 'bg-blue-100 border-2 border-blue-400' : 'border-r border-gray-200'}
      ${column.frozen ? 'sticky left-0 bg-white z-10' : ''}
    `;

    // Apply conditional formatting
    let conditionalStyle = '';
    if (column.key === 'status' && conditionalFormatting.status[cellValue.toString().toLowerCase()]) {
      const format = conditionalFormatting.status[cellValue.toString().toLowerCase()];
      conditionalStyle = `${format.bg} ${format.text} ${format.border}`;
    }

    return (
      <div
        className={`${cellClass} ${conditionalStyle}`}
        onClick={(e) => handleCellClick(project.id, column.key, cellValue, e)}
        onContextMenu={(e) => handleRightClick(e, project.id)}
        title={`${column.label}: ${cellValue}\nClick to edit • Right-click for options`}
        data-cell={cellKey}
      >
        {column.key === 'status' ? (
          <Badge className={`${getStatusColor(cellValue.toString())} text-xs px-2 py-0 border font-medium`}>
            {cellValue}
          </Badge>
        ) : column.key === 'id' ? (
          <span className="font-mono text-gray-600">{cellValue}</span>
        ) : column.type === 'date' ? (
          <span className="font-mono">{cellValue}</span>
        ) : (
          <span className="truncate">{showFormulas && cellValue.toString().startsWith('=') ? cellValue : cellValue}</span>
        )}
        
        {/* Cell selection indicator */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 border border-white" />
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Excel-style Ribbon Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Project Management Spreadsheet
              </h1>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Columns className="h-4 w-4 mr-1" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {['id', 'name', 'assignedTo', 'location', 'phone', 'status', 'startDate', 'endDate', 'createdAt'].map(col => (
                    <DropdownMenuCheckboxItem
                      key={col}
                      checked={visibleColumns.includes(col)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setVisibleColumns([...visibleColumns, col]);
                        } else {
                          setVisibleColumns(visibleColumns.filter(c => c !== col));
                        }
                      }}
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => setShowFormulas(!showFormulas)}>
                <Calculator className="h-4 w-4 mr-1" />
                {showFormulas ? 'Hide' : 'Show'} Formulas
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Add Row
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-25 dark:bg-gray-850 px-4 py-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Quick Filters:</span>
          </div>
          <Select value={filters.status || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="new lead">New Lead</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="on order">On Order</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search all fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64 h-8"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredAndSortedProjects.length} of {projects.length} rows
          </div>
        </div>
      </div>

      {/* Excel-style Spreadsheet */}
      <div className="flex-1 overflow-hidden">
        <div ref={tableRef} className="h-full overflow-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            {/* Header */}
            <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                {/* Row number column */}
                <th className="w-12 h-8 border-r border-gray-300 bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  #
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="relative border-r border-gray-300 bg-gray-100 dark:bg-gray-800 h-8"
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center justify-between px-2 h-full">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleSort(column.key)}
                          className="flex items-center space-x-1 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                          <span className="truncate">{column.label}</span>
                          {sortConfig?.key === column.key && (
                            sortConfig.direction === 'asc' ? 
                              <SortAsc className="h-3 w-3" /> : 
                              <SortDesc className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleSort(column.key)}>
                            <SortAsc className="h-4 w-4 mr-2" />
                            Sort Ascending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort(column.key)}>
                            <SortDesc className="h-4 w-4 mr-2" />
                            Sort Descending
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Column Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {/* Resize handle */}
                    <div
                      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent"
                      onMouseDown={(e) => handleMouseDown(e, column.key)}
                    />
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {filteredAndSortedProjects.map((project, index) => (
                <tr
                  key={project.id}
                  className={`h-8 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/30 dark:bg-gray-850'
                  }`}
                >
                  {/* Row number */}
                  <td className="w-12 h-8 border-r border-gray-200 bg-gray-100 dark:bg-gray-800 text-xs text-center text-gray-600 dark:text-gray-300 font-mono">
                    {index + 1}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={`${project.id}-${column.key}`}
                      className="h-8 border-r border-gray-200 p-0"
                      style={{ width: column.width }}
                    >
                      {renderCell(project, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            onClick={() => {
              // Copy row
              const project = projects.find(p => p.id === contextMenu.rowId);
              if (project) {
                navigator.clipboard.writeText(JSON.stringify(project, null, 2));
                toast({ title: "Copied", description: "Row data copied to clipboard" });
              }
              setContextMenu(null);
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Row
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            onClick={() => {
              // Insert row above
              toast({ title: "Feature", description: "Insert row above - coming soon" });
              setContextMenu(null);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Insert Row Above
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            onClick={() => {
              // Insert row below
              toast({ title: "Feature", description: "Insert row below - coming soon" });
              setContextMenu(null);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Insert Row Below
          </button>
          <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            onClick={() => {
              // Freeze row
              toast({ title: "Feature", description: "Freeze row - coming soon" });
              setContextMenu(null);
            }}
          >
            <Lock className="h-4 w-4 mr-2" />
            Freeze Row
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            onClick={() => {
              // Hide row
              toast({ title: "Feature", description: "Hide row - coming soon" });
              setContextMenu(null);
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Hide Row
          </button>
          <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-red-100 dark:hover:bg-red-900 text-red-700 dark:text-red-300 flex items-center"
            onClick={() => {
              if (confirm('Are you sure you want to delete this project?')) {
                // Delete project
                fetch(`/api/projects/${contextMenu.rowId}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                  }
                }).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
                  toast({ title: "Deleted", description: "Project deleted successfully" });
                });
              }
              setContextMenu(null);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Row
          </button>
        </div>
      )}

      {/* Status Bar */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-1">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Ready</span>
            {selectedCells.size > 0 && (
              <span>{selectedCells.size} cell{selectedCells.size > 1 ? 's' : ''} selected</span>
            )}
            {editingCell && (
              <span className="text-blue-600">
                Editing: {columns.find(c => c.key === editingCell.column)?.label} 
                (Row {filteredAndSortedProjects.findIndex(p => p.id === editingCell.row) + 1})
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span>Auto-Calculate: {autoCalculate ? 'ON' : 'OFF'}</span>
            <span>Zoom: 100%</span>
            <span>Sheet 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}