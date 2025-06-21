import { useState, useEffect } from "react";

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

const DEFAULT_LAYOUT: LayoutConfig = {
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
};

const STORAGE_KEY = 'project_layout_config';

export function useLayoutConfig() {
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [savedLayouts, setSavedLayouts] = useState<LayoutConfig[]>([]);

  useEffect(() => {
    // Load saved layout from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentLayout) {
          setLayout(parsed.currentLayout);
        }
        if (parsed.savedLayouts) {
          setSavedLayouts(parsed.savedLayouts);
        }
      } catch (error) {
        console.error('Failed to parse saved layout config:', error);
      }
    }
  }, []);

  const saveLayout = (newLayout: LayoutConfig) => {
    setLayout(newLayout);
    
    // Save to localStorage
    const config = {
      currentLayout: newLayout,
      savedLayouts: savedLayouts
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  };

  const saveAsNewLayout = (newLayout: LayoutConfig, name: string) => {
    const layoutWithName = { ...newLayout, name, id: Date.now().toString() };
    const updatedSavedLayouts = [...savedLayouts, layoutWithName];
    setSavedLayouts(updatedSavedLayouts);
    
    const config = {
      currentLayout: layout,
      savedLayouts: updatedSavedLayouts
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  };

  const loadLayout = (layoutId: string) => {
    const foundLayout = savedLayouts.find(l => l.id === layoutId) || 
                       (layoutId === 'default' ? DEFAULT_LAYOUT : null);
    
    if (foundLayout) {
      saveLayout(foundLayout);
    }
  };

  const deleteLayout = (layoutId: string) => {
    const updatedSavedLayouts = savedLayouts.filter(l => l.id !== layoutId);
    setSavedLayouts(updatedSavedLayouts);
    
    const config = {
      currentLayout: layout,
      savedLayouts: updatedSavedLayouts
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  };

  const resetToDefault = () => {
    saveLayout(DEFAULT_LAYOUT);
  };

  return {
    layout,
    savedLayouts,
    saveLayout,
    saveAsNewLayout,
    loadLayout,
    deleteLayout,
    resetToDefault
  };
}