import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw,
  Layout,
  Columns,
  Grid3X3
} from "lucide-react";

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  width?: string;
  sortable?: boolean;
}

interface PipelineStageConfig {
  id: string;
  label: string;
  visible: boolean;
  color: string;
  icon: string;
}

interface LayoutConfig {
  id: string;
  name: string;
  columns: ColumnConfig[];
  pipelineStages: PipelineStageConfig[];
  viewType: 'table' | 'cards' | 'kanban';
  gridColumns: number;
  isDefault: boolean;
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm">
        <div {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        {children}
      </div>
    </div>
  );
}

interface LayoutCustomizerProps {
  currentLayout: LayoutConfig;
  onLayoutChange: (layout: LayoutConfig) => void;
  onSaveLayout: (layout: LayoutConfig) => void;
}

export default function LayoutCustomizer({ 
  currentLayout, 
  onLayoutChange, 
  onSaveLayout 
}: LayoutCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutConfig>(currentLayout);
  const [activeTab, setActiveTab] = useState<'columns' | 'pipeline' | 'view'>('columns');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setLayout(currentLayout);
  }, [currentLayout]);

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layout.columns.findIndex((col) => col.id === active.id);
      const newIndex = layout.columns.findIndex((col) => col.id === over.id);

      const newColumns = arrayMove(layout.columns, oldIndex, newIndex);
      const updatedLayout = { ...layout, columns: newColumns };
      setLayout(updatedLayout);
    }
  };

  const handlePipelineDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layout.pipelineStages.findIndex((stage) => stage.id === active.id);
      const newIndex = layout.pipelineStages.findIndex((stage) => stage.id === over.id);

      const newStages = arrayMove(layout.pipelineStages, oldIndex, newIndex);
      const updatedLayout = { ...layout, pipelineStages: newStages };
      setLayout(updatedLayout);
    }
  };

  const toggleColumnVisibility = (columnId: string) => {
    const updatedColumns = layout.columns.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    );
    const updatedLayout = { ...layout, columns: updatedColumns };
    setLayout(updatedLayout);
  };

  const toggleStageVisibility = (stageId: string) => {
    const updatedStages = layout.pipelineStages.map(stage =>
      stage.id === stageId ? { ...stage, visible: !stage.visible } : stage
    );
    const updatedLayout = { ...layout, pipelineStages: updatedStages };
    setLayout(updatedLayout);
  };

  const handleSave = () => {
    onLayoutChange(layout);
    onSaveLayout(layout);
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultLayout = getDefaultLayout();
    setLayout(defaultLayout);
  };

  const getDefaultLayout = (): LayoutConfig => ({
    id: 'default',
    name: 'Default Layout',
    viewType: 'table',
    gridColumns: 3,
    isDefault: true,
    columns: [
      { id: 'project', label: 'Project', visible: true, sortable: true },
      { id: 'client', label: 'Client', visible: true, sortable: true },
      { id: 'status', label: 'Status', visible: true, sortable: true },
      { id: 'priority', label: 'Priority', visible: true, sortable: true },
      { id: 'cost', label: 'Estimated Cost', visible: true, sortable: true },
      { id: 'startDate', label: 'Start Date', visible: true, sortable: true },
      { id: 'contact', label: 'Contact', visible: false, sortable: false },
      { id: 'assignedTo', label: 'Assigned To', visible: false, sortable: true },
      { id: 'completedAt', label: 'Completed', visible: false, sortable: true },
    ],
    pipelineStages: [
      { id: 'new_leads', label: 'New Leads', visible: true, color: 'blue', icon: 'target' },
      { id: 'need_attention', label: 'Need Attention', visible: true, color: 'red', icon: 'alert-triangle' },
      { id: 'sent_estimate', label: 'Sent Estimate', visible: true, color: 'yellow', icon: 'file-text' },
      { id: 'signed', label: 'Signed', visible: true, color: 'emerald', icon: 'check-circle' },
      { id: 'need_ordered', label: 'Need Ordered', visible: true, color: 'indigo', icon: 'plus' },
      { id: 'ordered', label: 'Ordered', visible: true, color: 'cyan', icon: 'briefcase' },
      { id: 'need_scheduled', label: 'Need Scheduled', visible: true, color: 'pink', icon: 'calendar' },
      { id: 'scheduled', label: 'Scheduled', visible: true, color: 'purple', icon: 'clock' },
      { id: 'in_progress', label: 'In Progress', visible: true, color: 'orange', icon: 'activity' },
      { id: 'completed', label: 'Complete', visible: true, color: 'green', icon: 'check-circle' },
      { id: 'follow_up', label: 'Follow Up', visible: true, color: 'slate', icon: 'message-square' },
    ]
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Customize Layout
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Customize Project View Layout
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('columns')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'columns'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Columns className="h-4 w-4 mr-2 inline" />
              Table Columns
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'pipeline'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3X3 className="h-4 w-4 mr-2 inline" />
              Pipeline Stages
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'view'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="h-4 w-4 mr-2 inline" />
              View Options
            </button>
          </div>

          {/* Table Columns Configuration */}
          {activeTab === 'columns' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Table Columns</CardTitle>
                <p className="text-sm text-gray-600">
                  Drag to reorder columns and toggle visibility
                </p>
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleColumnDragEnd}
                >
                  <SortableContext
                    items={layout.columns.map(col => col.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {layout.columns.map((column) => (
                        <SortableItem key={column.id} id={column.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <Label className="font-medium">{column.label}</Label>
                              {column.sortable && (
                                <Badge variant="outline" className="text-xs">
                                  Sortable
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={column.visible}
                                onCheckedChange={() => toggleColumnVisibility(column.id)}
                              />
                              {column.visible ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          )}

          {/* Pipeline Stages Configuration */}
          {activeTab === 'pipeline' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pipeline Stages</CardTitle>
                <p className="text-sm text-gray-600">
                  Drag to reorder pipeline stages and toggle visibility
                </p>
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handlePipelineDragEnd}
                >
                  <SortableContext
                    items={layout.pipelineStages.map(stage => stage.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {layout.pipelineStages.map((stage) => (
                        <SortableItem key={stage.id} id={stage.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full bg-${stage.color}-500`} />
                              <Label className="font-medium">{stage.label}</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={stage.visible}
                                onCheckedChange={() => toggleStageVisibility(stage.id)}
                              />
                              {stage.visible ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          )}

          {/* View Options */}
          {activeTab === 'view' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">View Options</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure how projects are displayed
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>View Type</Label>
                  <Select
                    value={layout.viewType}
                    onValueChange={(value: 'table' | 'cards' | 'kanban') =>
                      setLayout({ ...layout, viewType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Table View</SelectItem>
                      <SelectItem value="cards">Card View</SelectItem>
                      <SelectItem value="kanban">Kanban Board</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {layout.viewType === 'cards' && (
                  <div className="space-y-2">
                    <Label>Grid Columns</Label>
                    <Select
                      value={layout.gridColumns.toString()}
                      onValueChange={(value) =>
                        setLayout({ ...layout, gridColumns: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Column</SelectItem>
                        <SelectItem value="2">2 Columns</SelectItem>
                        <SelectItem value="3">3 Columns</SelectItem>
                        <SelectItem value="4">4 Columns</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Layout
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}