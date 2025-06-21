import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Calendar, 
  Phone, 
  DollarSign, 
  User as UserIcon,
  ArrowUpDown
} from "lucide-react";
import { Link } from "wouter";
import { type Project } from "@shared/schema";

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  width?: string;
  sortable?: boolean;
}

interface LayoutConfig {
  columns: ColumnConfig[];
  viewType: 'table' | 'cards' | 'kanban';
  gridColumns: number;
}

interface CustomizableProjectTableProps {
  projects: Project[];
  layout: LayoutConfig;
  title?: string;
  icon?: any;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export default function CustomizableProjectTable({
  projects,
  layout,
  title,
  icon: Icon,
  onSort,
  sortColumn,
  sortDirection
}: CustomizableProjectTableProps) {
  const visibleColumns = useMemo(() => 
    layout.columns.filter(col => col.visible),
    [layout.columns]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "new_lead":
        return "bg-blue-500 text-white";
      case "need_attention":
        return "bg-red-500 text-white";
      case "sent_estimate":
      case "quoted":
        return "bg-yellow-500 text-white";
      case "signed":
      case "contracted":
        return "bg-emerald-500 text-white";
      case "need_ordered":
        return "bg-indigo-500 text-white";
      case "ordered":
        return "bg-cyan-500 text-white";
      case "need_scheduled":
        return "bg-pink-500 text-white";
      case "scheduled":
        return "bg-purple-500 text-white";
      case "in_progress":
        return "bg-orange-500 text-white";
      case "completed":
        return "bg-green-500 text-white";
      case "follow_up":
        return "bg-slate-500 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const renderCellContent = (project: Project, columnId: string) => {
    switch (columnId) {
      case 'project':
        return (
          <div>
            <Link href={`/projects/${project.id}`}>
              <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                {project.title}
              </div>
            </Link>
            <div className="text-sm text-gray-500">{project.serviceType}</div>
          </div>
        );
      
      case 'client':
        return (
          <div className="text-sm">
            {project.address && (
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="h-3 w-3" />
                {project.address}
              </div>
            )}
          </div>
        );
      
      case 'status':
        return (
          <Badge 
            variant="outline" 
            className={getStatusColor(project.status)}
          >
            {project.status.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      
      case 'priority':
        return (
          <Badge variant="outline" className={getPriorityColor(project.priority)}>
            {project.priority.toUpperCase()}
          </Badge>
        );
      
      case 'cost':
        return (
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="font-medium">
              {project.estimatedCost || 'TBD'}
            </span>
          </div>
        );
      
      case 'startDate':
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}
            </span>
          </div>
        );
      
      case 'contact':
        return (
          <div className="text-sm">
            {project.phone && (
              <div className="flex items-center gap-1 text-gray-600">
                <Phone className="h-3 w-3" />
                {project.phone}
              </div>
            )}
            {project.email && (
              <div className="text-gray-600 text-xs">
                {project.email}
              </div>
            )}
          </div>
        );
      
      case 'assignedTo':
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <UserIcon className="h-3 w-3 text-blue-600" />
            </div>
            <span className="text-sm">
              {project.assignedTo ? `Employee #${project.assignedTo}` : 'Unassigned'}
            </span>
          </div>
        );
      
      case 'completedAt':
        return (
          <div className="text-sm">
            {project.completedAt ? new Date(project.completedAt).toLocaleDateString() : '-'}
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleSort = (columnId: string) => {
    if (!onSort) return;
    
    const newDirection = sortColumn === columnId && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnId, newDirection);
  };

  if (layout.viewType === 'cards') {
    return (
      <Card>
        {title && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {Icon && <Icon className="h-5 w-5 text-blue-600" />}
              {title}
              <Badge variant="secondary" className="ml-2">{projects.length} items</Badge>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className={`grid gap-4 grid-cols-1 md:grid-cols-${layout.gridColumns}`}>
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Link href={`/projects/${project.id}`}>
                        <h3 className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                          {project.title}
                        </h3>
                      </Link>
                      <Badge className={getStatusColor(project.status)} style={{ fontSize: '10px' }}>
                        {project.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {project.serviceType}
                    </div>
                    
                    {visibleColumns.find(col => col.id === 'client') && project.address && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {project.address}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      {visibleColumns.find(col => col.id === 'priority') && (
                        <Badge variant="outline" className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      )}
                      
                      {visibleColumns.find(col => col.id === 'cost') && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <span>{project.estimatedCost || 'TBD'}</span>
                        </div>
                      )}
                    </div>
                    
                    {visibleColumns.find(col => col.id === 'startDate') && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Table view (default)
  return (
    <Card>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {Icon && <Icon className="h-5 w-5 text-blue-600" />}
            {title}
            <Badge variant="secondary" className="ml-2">{projects.length} items</Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                {visibleColumns.map((column) => (
                  <TableHead 
                    key={column.id} 
                    className={`font-semibold ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={() => column.sortable && handleSort(column.id)}
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {column.sortable && onSort && (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                      {sortColumn === column.id && (
                        <span className="text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id}>
                      {renderCellContent(project, column.id)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}