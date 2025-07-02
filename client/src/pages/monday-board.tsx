import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  MessageCircle,
  User,
  Plus,
  MoreHorizontal,
  Info,
  Zap,
  Filter,
  Eye,
  Calendar,
  BarChart3,
  Table,
  Kanban,
  Settings,
  Bell,
  Share2,
  Download,
  Search,
  ArrowRight,
  Clock,
  Target,
  Users,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Edit3,
  Trash2,
  Save,
  X,
  GripVertical,
} from "lucide-react";

const ProjectBoard = () => {
  const [items, setItems] = useState([]);
  
  // Apple-style customization states
  const [isCustomizationMode, setIsCustomizationMode] = useState(false);
  const [selectedSubitem, setSelectedSubitem] = useState(null);
  const [showSubitemModal, setShowSubitemModal] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [editingColumnName, setEditingColumnName] = useState(null);

  const [columnWidths, setColumnWidths] = useState({
    item: 300,
    owner: 150,
    status: 120,
    priority: 100,
    progress: 120,
    measureDate: 140,
    installDate: 140,
    materials: 100,
    firstBid: 100,
    notes: 200,
    actions: 80,
  });
  
  // Column configuration with editable names
  const [columnConfig, setColumnConfig] = useState({
    item: { name: "Item", visible: true, order: 0 },
    owner: { name: "People", visible: true, order: 1 },
    status: { name: "Status", visible: true, order: 2 },
    priority: { name: "Priority", visible: true, order: 3 },
    progress: { name: "Progress", visible: true, order: 4 },
    measureDate: { name: "Measure Date", visible: true, order: 5 },
    installDate: { name: "Install Date", visible: true, order: 6 },
    materials: { name: "Materials", visible: true, order: 7 },
    firstBid: { name: "First Bid", visible: true, order: 8 },
    notes: { name: "Notes", visible: true, order: 9 },
    actions: { name: "Actions", visible: true, order: 10 },
  });

  const [currentView, setCurrentView] = useState("dashboard");
  const [showAutomations, setShowAutomations] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [automations, setAutomations] = useState([]);

  const [newItemName, setNewItemName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignee: "",
  });

  const statusColors = {
    "New Lead": "#9D99B9",
    "In Progress": "#FDAB3D",
    Measured: "#00C875",
    Quoted: "#FFCB00",
    Sold: "#00D2FF",
    Installed: "#00C875",
    Done: "#00C875",
  };

  const priorityColors = {
    Low: "#C4C4C4",
    Medium: "#FDAB3D",
    High: "#E2445C",
    Critical: "#9D99B9",
  };

  const views = [
    { id: "table", name: "Table", icon: Table },
    { id: "kanban", name: "Kanban", icon: Kanban },
    { id: "gantt", name: "Gantt", icon: BarChart3 },
    { id: "calendar", name: "Calendar", icon: Calendar },
    { id: "dashboard", name: "Dashboard", icon: Eye },
  ];

  const teamMembers = [];

  // Real-time updates would be handled here when connected to actual data

  // Column resizing logic
  const handleMouseDown = (e, columnKey) => {
    e.preventDefault();
    setResizingColumn({
      column: columnKey,
      startX: e.clientX,
      startWidth: columnWidths[columnKey],
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (resizingColumn) {
        const deltaX = e.clientX - resizingColumn.startX;
        const newWidth = Math.max(80, resizingColumn.startWidth + deltaX);
        setColumnWidths((prev) => ({
          ...prev,
          [resizingColumn.column]: newWidth,
        }));
      }
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    if (resizingColumn) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingColumn]);

  // Apple-style customization functions
  const handleLongPress = (columnKey) => {
    setIsCustomizationMode(true);
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleTouchStart = (e, columnKey) => {
    const timer = setTimeout(() => {
      handleLongPress(columnKey);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const toggleColumnVisibility = (columnKey) => {
    setColumnConfig(prev => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey],
        visible: !prev[columnKey].visible
      }
    }));
  };

  const updateColumnName = (columnKey, newName) => {
    setColumnConfig(prev => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey],
        name: newName
      }
    }));
    setEditingColumnName(null);
  };

  const reorderColumns = (dragIndex, hoverIndex) => {
    // Column reordering logic would go here
    console.log(`Reordering column from ${dragIndex} to ${hoverIndex}`);
  };

  const addNewColumn = (afterColumn = null) => {
    const newColumnKey = `custom_${Date.now()}`;
    const maxOrder = Math.max(...Object.values(columnConfig).map(c => c.order));
    
    setColumnConfig(prev => ({
      ...prev,
      [newColumnKey]: {
        name: "New Column",
        visible: true,
        order: maxOrder + 1,
        type: "text"
      }
    }));
    
    setColumnWidths(prev => ({
      ...prev,
      [newColumnKey]: 120
    }));
  };

  const removeColumn = (columnKey) => {
    const { [columnKey]: removed, ...rest } = columnConfig;
    setColumnConfig(rest);
    
    const { [columnKey]: removedWidth, ...restWidths } = columnWidths;
    setColumnWidths(restWidths);
  };

  // Sub-item modal functions
  const openSubitemModal = (subitem, parentId) => {
    setSelectedSubitem({ ...subitem, parentId });
    setShowSubitemModal(true);
  };

  const closeSubitemModal = () => {
    setSelectedSubitem(null);
    setShowSubitemModal(false);
  };

  const updateSubitemData = (field, value) => {
    if (!selectedSubitem) return;
    
    const updatedSubitem = { ...selectedSubitem, [field]: value };
    setSelectedSubitem(updatedSubitem);
    
    // Update in main items array
    updateSubitem(selectedSubitem.parentId, selectedSubitem.id, field, value);
  };

  // Sub-item modal component
  const SubitemModal = () => {
    if (!showSubitemModal || !selectedSubitem) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 border border-gray-600">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Edit Sub-item</h2>
            <button
              onClick={closeSubitemModal}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={selectedSubitem.name || ''}
                onChange={(e) => updateSubitemData('name', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Assigned To
              </label>
              <input
                type="text"
                value={selectedSubitem.assignedTo || ''}
                onChange={(e) => updateSubitemData('assignedTo', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={selectedSubitem.status || 'Not Started'}
                onChange={(e) => updateSubitemData('status', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={selectedSubitem.priority || 'Medium'}
                onChange={(e) => updateSubitemData('priority', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={selectedSubitem.description || ''}
                onChange={(e) => updateSubitemData('description', e.target.value)}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={closeSubitemModal}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={closeSubitemModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Filter items based on search and filters
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filters.status || item.status === filters.status;
    const matchesPriority =
      !filters.priority || item.priority === filters.priority;
    const matchesAssignee =
      !filters.assignee || item.owner === filters.assignee;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const updateItem = (itemId, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    );

    // Trigger automation if status changed
    if (field === "status" && value === "Done") {
      triggerAutomation(
        "When status changes to Done",
        items.find((i) => i.id === itemId)?.name,
      );
    }
  };

  const updateSubitem = (parentId, subitemId, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === parentId
          ? {
              ...item,
              subitems: item.subitems.map((subitem) =>
                subitem.id === subitemId
                  ? { ...subitem, [field]: value }
                  : subitem,
              ),
            }
          : item,
      ),
    );
  };

  const addNewItem = () => {
    if (newItemName.trim()) {
      const newItem = {
        id: Date.now(),
        name: newItemName,
        people: [],
        status: "New Lead",
        priority: "Medium",
        measureDate: "",
        installDate: "",
        materialsSpent: 0,
        firstBid: 0,
        lowestBid: 0,
        contractSent: false,
        expanded: false,
        progress: 0,
        owner: "",
        notes: "",
        subitems: [
          {
            id: Date.now() + 1,
            name: "Site Measurement",
            assignedTo: "John Doe",
            status: "Not Started",
            priority: "High",
            description: "Initial site measurement and assessment"
          },
          {
            id: Date.now() + 2,
            name: "Material Ordering",
            assignedTo: "Jane Smith",
            status: "Not Started", 
            priority: "Medium",
            description: "Order required materials and supplies"
          }
        ],
      };
      setItems([...items, newItem]);
      setNewItemName("");

      triggerAutomation("When item is created", newItem.name);
    }
  };

  const deleteItem = (itemId) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const addSubitem = (parentId) => {
    setItems(
      items.map((item) =>
        item.id === parentId
          ? {
              ...item,
              subitems: [
                ...item.subitems,
                {
                  id: Date.now(),
                  name: "New subitem",
                  owner: "",
                  status: "",
                  materialsSpent: "",
                  dimensions: "",
                  operation: "",
                  jambWidth: "",
                  frameType: "",
                  files: [],
                  progress: 0,
                },
              ],
            }
          : item,
      ),
    );
  };

  const deleteSubitem = (parentId, subitemId) => {
    setItems(
      items.map((item) =>
        item.id === parentId
          ? {
              ...item,
              subitems: item.subitems.filter(
                (subitem) => subitem.id !== subitemId,
              ),
            }
          : item,
      ),
    );
  };

  const toggleItemExpansion = (itemId) => {
    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, expanded: !item.expanded } : item,
      ),
    );
  };

  const triggerAutomation = (trigger, itemName) => {
    const automation = automations.find(
      (a) => a.trigger === trigger && a.active,
    );
    if (automation) {
      console.log(
        `🤖 Automation triggered: ${automation.action} for "${itemName}"`,
      );
      setAutomations((prev) =>
        prev.map((a) =>
          a.id === automation.id ? { ...a, runs: a.runs + 1 } : a,
        ),
      );
    }
  };

  const createAutomation = () => {
    const newAutomation = {
      id: Date.now(),
      name: "New automation",
      trigger: "When status changes to something",
      action: "Do something",
      active: true,
      runs: 0,
    };
    setAutomations([...automations, newAutomation]);
  };

  const updateAutomation = (automationId, field, value) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === automationId ? { ...a, [field]: value } : a)),
    );
  };

  const deleteAutomation = (automationId) => {
    setAutomations(automations.filter((a) => a.id !== automationId));
  };

  const EditableCell = ({
    value,
    onSave,
    type = "text",
    options = [],
    className = "",
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    const handleSave = () => {
      onSave(editValue);
      setIsEditing(false);
    };

    const handleKeyPress = (e) => {
      if (e.key === "Enter") {
        handleSave();
      } else if (e.key === "Escape") {
        setEditValue(value);
        setIsEditing(false);
      }
    };

    if (isEditing) {
      if (type === "select") {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyPress={handleKeyPress}
            className={`bg-gray-600 border border-blue-500 rounded px-2 py-1 text-white text-sm w-full ${className}`}
            autoFocus
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }

      return (
        <input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyPress={handleKeyPress}
          className={`bg-gray-600 border border-blue-500 rounded px-2 py-1 text-white text-sm w-full ${className}`}
          autoFocus
        />
      );
    }

    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`cursor-pointer hover:bg-gray-600 rounded px-2 py-1 transition-colors min-h-[24px] flex items-center ${className}`}
      >
        {type === "date" && value
          ? new Date(value).toLocaleDateString()
          : value || "Click to edit"}
      </div>
    );
  };

  const ColumnResizer = ({ columnKey }) => (
    <div
      className="absolute right-0 top-0 w-1 h-full bg-gray-600 hover:bg-blue-500 cursor-col-resize transition-colors"
      onMouseDown={(e) => handleMouseDown(e, columnKey)}
    >
      <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
        <GripVertical className="w-3 h-3 text-gray-400" />
      </div>
    </div>
  );

  const renderTableView = () => (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        {/* Table Header with Apple-style customization */}
        <div className="flex bg-gray-700 text-sm font-medium text-gray-300 border-b-2 border-gray-600">
          {Object.entries(columnConfig)
            .filter(([key, config]) => config.visible)
            .sort((a, b) => a[1].order - b[1].order)
            .map(([columnKey, config]) => (
              <div
                key={columnKey}
                className={`relative flex items-center gap-2 px-4 py-4 border-r border-gray-600 transition-all duration-200 ${
                  isCustomizationMode ? 'animate-pulse bg-blue-800/20' : 'hover:bg-gray-600'
                }`}
                style={{ width: columnWidths[columnKey] }}
                onTouchStart={(e) => handleTouchStart(e, columnKey)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={(e) => {
                  if (e.button === 0 && e.detail === 1) {
                    const timer = setTimeout(() => handleLongPress(columnKey), 500);
                    setLongPressTimer(timer);
                  }
                }}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
              >
                {/* Column icon based on type */}
                {columnKey === 'owner' && <User className="w-4 h-4" />}
                {columnKey === 'item' && <input type="checkbox" className="rounded" />}
                {columnKey === 'materials' && <Info className="w-4 h-4 text-gray-500" />}
                
                {/* Editable column name */}
                {editingColumnName === columnKey ? (
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => updateColumnName(columnKey, e.target.value)}
                    onBlur={() => setEditingColumnName(null)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') setEditingColumnName(null);
                      if (e.key === 'Escape') setEditingColumnName(null);
                    }}
                    className="bg-transparent border-b border-blue-500 text-white font-medium text-sm focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span 
                    onDoubleClick={() => setEditingColumnName(columnKey)}
                    className="cursor-pointer select-none"
                  >
                    {config.name}
                  </span>
                )}

                {/* Customization mode controls */}
                {isCustomizationMode && (
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addNewColumn(columnKey);
                      }}
                      className="w-5 h-5 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center transition-colors"
                      title="Add column"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeColumn(columnKey);
                      }}
                      className="w-5 h-5 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                      title="Remove column"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <ColumnResizer columnKey={columnKey} />
              </div>
            ))}
        </div>

        {/* Customization mode controls */}
        {isCustomizationMode && (
          <div className="bg-blue-900/50 p-4 border-b border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-blue-300 font-medium">Customization Mode</span>
                <span className="text-gray-400 text-sm">Long press columns to edit • Double-click names to rename</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addNewColumn}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Column
                </button>
                <button
                  onClick={() => setIsCustomizationMode(false)}
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Table Rows */}
      {filteredItems.map((item) => (
        <div key={item.id}>
          {/* Main Item Row */}
          <div className="flex border-b border-gray-700 hover:bg-gray-750 transition-colors">
            <div
              className="flex items-center gap-3 px-4 py-4 border-r border-gray-700"
              style={{ width: columnWidths.item }}
            >
              <input type="checkbox" className="rounded" />
              <button
                onClick={() => toggleItemExpansion(item.id)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${item.expanded ? "rotate-180" : ""}`}
                />
              </button>
              <div className="flex-1">
                <EditableCell
                  value={item.name}
                  onSave={(value) => updateItem(item.id, "name", value)}
                  className="text-white font-medium"
                />
              </div>
              <MessageCircle className="w-4 h-4 text-gray-500" />
            </div>

            <div
              className="flex items-center px-4 py-4 border-r border-gray-700"
              style={{ width: columnWidths.owner }}
            >
              <div className="flex items-center gap-2 w-full">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {item.owner ? item.owner.charAt(0) : "U"}
                </div>
                <EditableCell
                  value={item.owner}
                  onSave={(value) => updateItem(item.id, "owner", value)}
                  type="select"
                  options={["", ...teamMembers]}
                  className="text-gray-300 text-sm flex-1"
                />
              </div>
            </div>

            <div
              className="flex items-center px-4 py-4 border-r border-gray-700"
              style={{ width: columnWidths.status }}
            >
              <div
                className="px-3 py-1 rounded-full text-xs font-medium text-white w-full text-center cursor-pointer"
                style={{ backgroundColor: statusColors[item.status] }}
                onClick={() => {
                  const statusKeys = Object.keys(statusColors);
                  const currentIndex = statusKeys.indexOf(item.status);
                  const nextIndex = (currentIndex + 1) % statusKeys.length;
                  updateItem(item.id, "status", statusKeys[nextIndex]);
                }}
              >
                {item.status}
              </div>
            </div>

            <div
              className="flex items-center px-4 py-4 border-r border-gray-700"
              style={{ width: columnWidths.priority }}
            >
              <div
                className="px-3 py-1 rounded-full text-xs font-medium text-white w-full text-center cursor-pointer"
                style={{ backgroundColor: priorityColors[item.priority] }}
                onClick={() => {
                  const priorityKeys = Object.keys(priorityColors);
                  const currentIndex = priorityKeys.indexOf(item.priority);
                  const nextIndex = (currentIndex + 1) % priorityKeys.length;
                  updateItem(item.id, "priority", priorityKeys[nextIndex]);
                }}
              >
                {item.priority}
              </div>
            </div>

            <div
              className="flex items-center gap-3 px-4 py-4 border-r border-gray-700"
              style={{ width: columnWidths.progress }}
            >
              <div className="flex-1 bg-gray-600 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">
                {Math.round(item.progress)}%
              </span>
            </div>

            <div
              className="flex items-center px-4 py-4 border-r border-gray-700"
              style={{ width: columnWidths.measureDate }}
            >
              <EditableCell
                value={item.measureDate}
                onSave={(value) => updateItem(item.id, "measureDate", value)}
                type="date"
                className="w-full"
              />
            </div>

            <div
              className="flex items-center px-4 py-4 border-r border-gray-700"
              style={{ width: columnWidths.installDate }}
            >
              <EditableCell
                value={item.installDate}
                onSave={(value) => updateItem(item.id, "installDate", value)}
                type="date"
                className="w-full"
              />
            </div>

            <div
              className="flex items-center px-4 py-4 border-r border-gray-700"
              style={{ width: columnWidths.materials }}
            >
              <EditableCell
                value={item.materialsSpent}
                onSave={(value) =>
                  updateItem(item.id, "materialsSpent", Number(value))
                }
                type="number"
                className="text-green-400 font-medium"
              />
            </div>

            <div
              className="flex items-center px-4 py-4 border-r border-gray-700"
              style={{ width: columnWidths.firstBid }}
            >
              <EditableCell
                value={item.firstBid}
                onSave={(value) =>
                  updateItem(item.id, "firstBid", Number(value))
                }
                type="number"
                className="text-blue-400 font-medium"
              />
            </div>

            <div
              className="flex items-center px-4 py-4 border-r border-gray-700"
              style={{ width: columnWidths.notes }}
            >
              <EditableCell
                value={item.notes}
                onSave={(value) => updateItem(item.id, "notes", value)}
                className="text-gray-300 text-sm w-full"
              />
            </div>

            <div
              className="flex items-center gap-2 px-4 py-4"
              style={{ width: columnWidths.actions }}
            >
              <button
                onClick={() => addSubitem(item.id)}
                className="text-blue-400 hover:text-blue-300 p-1 hover:bg-gray-600 rounded"
                title="Add subitem"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteItem(item.id)}
                className="text-red-400 hover:text-red-300 p-1 hover:bg-gray-600 rounded"
                title="Delete item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subitems */}
          {item.expanded && (
            <div className="bg-gray-850 border-l-4 border-blue-500">
              {/* Subitem Header */}
              <div className="flex bg-gray-750 text-sm font-medium text-gray-400 border-b border-gray-600">
                <div
                  className="flex items-center gap-3 px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.item }}
                >
                  <div className="w-4"></div> {/* Spacing for checkbox */}
                  <div className="w-4"></div> {/* Spacing for chevron */}
                  <span>Subitem</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.owner }}
                >
                  <span>Owner</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.status }}
                >
                  <span>Status</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.priority }}
                >
                  <span>Priority</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.progress }}
                >
                  <span>Progress</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.measureDate }}
                >
                  <span>Measure Date</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.installDate }}
                >
                  <span>Install Date</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.materials }}
                >
                  <span>Materials</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.firstBid }}
                >
                  <span>1st Bid</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.notes }}
                >
                  <span>Notes</span>
                </div>
                <div
                  className="flex items-center px-4 py-3"
                  style={{ width: columnWidths.actions }}
                >
                  <span>Actions</span>
                </div>
              </div>

              {/* Subitem Rows */}
              {item.subitems.map((subitem) => (
                <div
                  key={subitem.id}
                  className="flex border-b border-gray-700 hover:bg-gray-800 transition-colors"
                >
                  <div
                    className="flex items-center gap-3 px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.item }}
                  >
                    <input type="checkbox" className="rounded" />
                    <div className="w-4"></div> {/* Spacing for chevron */}
                    <div className="flex-1">
                      <EditableCell
                        value={subitem.name}
                        onSave={(value) =>
                          updateSubitem(item.id, subitem.id, "name", value)
                        }
                        className="text-blue-400 font-medium"
                      />
                    </div>
                    <MessageCircle className="w-4 h-4 text-gray-500" />
                  </div>
                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.owner }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {subitem.owner ? subitem.owner.charAt(0) : "U"}
                      </div>
                      <EditableCell
                        value={subitem.owner}
                        onSave={(value) =>
                          updateSubitem(item.id, subitem.id, "owner", value)
                        }
                        type="select"
                        options={["", ...teamMembers]}
                        className="text-gray-300 text-sm flex-1"
                      />
                    </div>
                  </div>
                  
                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.status }}
                  >
                    <div
                      className="px-3 py-1 rounded-full text-xs font-medium text-white w-full text-center cursor-pointer"
                      style={{ backgroundColor: statusColors[subitem.status] || statusColors["New Lead"] }}
                      onClick={() => {
                        const statusKeys = Object.keys(statusColors);
                        const currentIndex = statusKeys.indexOf(subitem.status);
                        const nextIndex = (currentIndex + 1) % statusKeys.length;
                        updateSubitem(item.id, subitem.id, "status", statusKeys[nextIndex]);
                      }}
                    >
                      {subitem.status}
                    </div>
                  </div>
                  
                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.priority }}
                  >
                    <div
                      className="px-3 py-1 rounded-full text-xs font-medium text-white w-full text-center cursor-pointer"
                      style={{ backgroundColor: priorityColors[subitem.priority] || priorityColors["Medium"] }}
                      onClick={() => {
                        const priorityKeys = Object.keys(priorityColors);
                        const currentIndex = priorityKeys.indexOf(subitem.priority);
                        const nextIndex = (currentIndex + 1) % priorityKeys.length;
                        updateSubitem(item.id, subitem.id, "priority", priorityKeys[nextIndex]);
                      }}
                    >
                      {subitem.priority || "Medium"}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3 px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.progress }}
                  >
                    <div className="flex-1 bg-gray-600 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${subitem.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">
                      {Math.round(subitem.progress || 0)}%
                    </span>
                  </div>

                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.measureDate }}
                  >
                    <EditableCell
                      value={subitem.measureDate || ""}
                      onSave={(value) =>
                        updateSubitem(item.id, subitem.id, "measureDate", value)
                      }
                      type="date"
                      className="w-full text-gray-300"
                    />
                  </div>

                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.installDate }}
                  >
                    <EditableCell
                      value={subitem.installDate || ""}
                      onSave={(value) =>
                        updateSubitem(item.id, subitem.id, "installDate", value)
                      }
                      type="date"
                      className="w-full text-gray-300"
                    />
                  </div>

                  <div
                    className="flex items-center gap-1 px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.materials }}
                  >
                    <EditableCell
                      value={subitem.materials || ""}
                      onSave={(value) =>
                        updateSubitem(item.id, subitem.id, "materials", value)
                      }
                      className="w-full text-gray-300"
                    />
                    <Info className="w-4 h-4 text-gray-500" />
                  </div>

                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.firstBid }}
                  >
                    <EditableCell
                      value={subitem.firstBid || ""}
                      onSave={(value) =>
                        updateSubitem(item.id, subitem.id, "firstBid", value)
                      }
                      className="w-full text-gray-300"
                    />
                  </div>

                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.notes }}
                  >
                    <EditableCell
                      value={subitem.notes || ""}
                      onSave={(value) =>
                        updateSubitem(item.id, subitem.id, "notes", value)
                      }
                      className="w-full text-gray-300"
                    />
                  </div>
                  <div
                    className="flex items-center px-4 py-4"
                    style={{ width: columnWidths.actions }}
                  >
                    <button
                      onClick={() => deleteSubitem(item.id, subitem.id)}
                      className="text-red-400 hover:text-red-300 p-1 hover:bg-gray-600 rounded"
                      title="Delete subitem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Subitem Button */}
              <div className="px-8 py-4">
                <button
                  onClick={() => addSubitem(item.id)}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors hover:bg-gray-700 px-3 py-2 rounded"
                >
                  <Plus className="w-4 h-4" />
                  Add subitem
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add Item Row */}
      <div className="flex border-b border-gray-700 bg-gray-750">
        <div
          className="flex items-center gap-3 px-4 py-4 border-r border-gray-700"
          style={{ width: columnWidths.item }}
        >
          <input type="checkbox" className="rounded" />
          <Plus className="w-4 h-4 text-blue-400" />
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addNewItem()}
            className="bg-transparent border-none outline-none text-blue-400 flex-1 placeholder-gray-500"
            placeholder="Add new project..."
          />
        </div>
        <div
          className="flex items-center justify-center px-4 py-4"
          style={{
            width: Object.values(columnWidths)
              .slice(1, -1)
              .reduce((a, b) => a + b, 0),
          }}
        >
          <span className="text-gray-500 text-sm">
            Complete the item name and press Enter to add
          </span>
        </div>
        <div
          className="flex items-center px-4 py-4"
          style={{ width: columnWidths.actions }}
        >
          <button
            onClick={addNewItem}
            disabled={!newItemName.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors font-medium"
          >
            Add
          </button>
        </div>
      </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 p-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            {/* Project Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-white font-medium text-lg mb-1">{item.name}</h3>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {item.owner ? item.owner.charAt(0) : "U"}
                  </div>
                  <span className="text-gray-300 text-sm">{item.owner}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addSubitem(item.id)}
                  className="text-blue-400 hover:text-blue-300 p-2 hover:bg-gray-600 rounded"
                  title="Add subitem"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-red-400 hover:text-red-300 p-2 hover:bg-gray-600 rounded"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status and Priority Row */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <label className="text-gray-400 text-xs block mb-1">Status</label>
                <div
                  className="px-3 py-1 rounded-full text-xs font-medium text-white text-center cursor-pointer"
                  style={{ backgroundColor: statusColors[item.status] }}
                  onClick={() => {
                    const statusKeys = Object.keys(statusColors);
                    const currentIndex = statusKeys.indexOf(item.status);
                    const nextIndex = (currentIndex + 1) % statusKeys.length;
                    updateItem(item.id, "status", statusKeys[nextIndex]);
                  }}
                >
                  {item.status}
                </div>
              </div>
              <div className="flex-1">
                <label className="text-gray-400 text-xs block mb-1">Priority</label>
                <div
                  className="px-3 py-1 rounded-full text-xs font-medium text-white text-center cursor-pointer"
                  style={{ backgroundColor: priorityColors[item.priority] }}
                  onClick={() => {
                    const priorityKeys = Object.keys(priorityColors);
                    const currentIndex = priorityKeys.indexOf(item.priority);
                    const nextIndex = (currentIndex + 1) % priorityKeys.length;
                    updateItem(item.id, "priority", priorityKeys[nextIndex]);
                  }}
                >
                  {item.priority}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <label className="text-gray-400 text-xs block mb-1">Progress</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-600 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400 w-10 text-right">
                  {Math.round(item.progress)}%
                </span>
              </div>
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Measure Date</label>
                <EditableCell
                  value={item.measureDate}
                  onSave={(value) => updateItem(item.id, "measureDate", value)}
                  type="date"
                  className="w-full text-sm bg-gray-600 rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Install Date</label>
                <EditableCell
                  value={item.installDate}
                  onSave={(value) => updateItem(item.id, "installDate", value)}
                  type="date"
                  className="w-full text-sm bg-gray-600 rounded px-2 py-1"
                />
              </div>
            </div>

            {/* Financial Info Row */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Materials</label>
                <EditableCell
                  value={item.materialsSpent}
                  onSave={(value) => updateItem(item.id, "materialsSpent", Number(value))}
                  type="number"
                  className="text-green-400 font-medium text-sm w-full bg-gray-600 rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">First Bid</label>
                <EditableCell
                  value={item.firstBid}
                  onSave={(value) => updateItem(item.id, "firstBid", Number(value))}
                  type="number"
                  className="text-blue-400 font-medium text-sm w-full bg-gray-600 rounded px-2 py-1"
                />
              </div>
            </div>

            {/* Notes */}
            {item.notes && (
              <div className="mb-3">
                <label className="text-gray-400 text-xs block mb-1">Notes</label>
                <EditableCell
                  value={item.notes}
                  onSave={(value) => updateItem(item.id, "notes", value)}
                  className="text-gray-300 text-sm w-full bg-gray-600 rounded px-2 py-1"
                />
              </div>
            )}

            {/* Subitems for Mobile */}
            {item.expanded && item.subitems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">Subitems</h4>
                  <button
                    onClick={() => toggleItemExpansion(item.id)}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {item.subitems.map((subitem) => (
                    <div 
                      key={subitem.id} 
                      className="bg-gray-600 rounded p-3 cursor-pointer hover:bg-gray-550 transition-colors"
                      onClick={() => openSubitemModal(subitem, item.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-blue-400 font-medium text-sm">
                          {subitem.name || 'Click to edit sub-item'}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSubitem(item.id, subitem.id);
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">
                          {subitem.assignedTo ? subitem.assignedTo.charAt(0) : "U"}
                        </div>
                        <span className="text-gray-300 text-xs flex-1">
                          {subitem.assignedTo || 'Unassigned'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          subitem.status === 'Complete' ? 'bg-green-600' :
                          subitem.status === 'In Progress' ? 'bg-blue-600' :
                          subitem.status === 'On Hold' ? 'bg-yellow-600' :
                          'bg-gray-500'
                        }`}>
                          {subitem.status || 'Not Started'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expand/Collapse Button */}
            <div className="mt-3 pt-3 border-t border-gray-600 flex items-center justify-between">
              <button
                onClick={() => toggleItemExpansion(item.id)}
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
              >
                <ChevronDown 
                  className={`w-4 h-4 transition-transform ${item.expanded ? 'rotate-180' : ''}`} 
                />
                {item.expanded ? 'Hide' : 'Show'} subitems ({item.subitems.length})
              </button>
            </div>
          </div>
        ))}

        {/* Add New Item - Mobile */}
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Enter item name..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addNewItem()}
              className="flex-1 bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-blue-500 outline-none"
            />
            <button
              onClick={addNewItem}
              disabled={!newItemName.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderKanbanView = () => (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:overflow-x-auto pb-4">
      {Object.keys(statusColors).map((status) => (
        <div
          key={status}
          className="w-full lg:min-w-80 bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: statusColors[status] }}
            ></div>
            <h3 className="font-medium text-white text-lg">{status}</h3>
            <span className="text-gray-400 text-sm bg-gray-700 px-2 py-1 rounded-full">
              {filteredItems.filter((item) => item.status === status).length}
            </span>
          </div>
          <div className="space-y-4">
            {filteredItems
              .filter((item) => item.status === status)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors border border-gray-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <EditableCell
                      value={item.name}
                      onSave={(value) => updateItem(item.id, "name", value)}
                      className="font-medium text-white flex-1 text-base"
                    />
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-red-400 hover:text-red-300 p-1 ml-2 hover:bg-gray-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {item.owner ? item.owner.charAt(0) : "U"}
                      </div>
                      <EditableCell
                        value={item.owner}
                        onSave={(value) => updateItem(item.id, "owner", value)}
                        type="select"
                        options={["", ...teamMembers]}
                        className="text-sm text-gray-300"
                      />
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-xs font-medium text-white cursor-pointer"
                      style={{ backgroundColor: priorityColors[item.priority] }}
                      onClick={() => {
                        const priorityKeys = Object.keys(priorityColors);
                        const currentIndex = priorityKeys.indexOf(
                          item.priority,
                        );
                        const nextIndex =
                          (currentIndex + 1) % priorityKeys.length;
                        updateItem(
                          item.id,
                          "priority",
                          priorityKeys[nextIndex],
                        );
                      }}
                    >
                      {item.priority}
                    </div>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-3 mb-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-400">
                      {Math.round(item.progress)}% complete
                    </div>
                    <EditableCell
                      value={item.firstBid}
                      onSave={(value) =>
                        updateItem(item.id, "firstBid", Number(value))
                      }
                      type="number"
                      className="text-green-400 font-medium"
                    />
                  </div>
                  {item.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <EditableCell
                        value={item.notes}
                        onSave={(value) => updateItem(item.id, "notes", value)}
                        className="text-gray-400 text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAutomationCenter = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-96 overflow-y-auto border border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Automation Center
          </h3>
          <button
            onClick={() => setShowAutomations(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className="bg-gray-700 rounded-lg p-3 border border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <EditableCell
                  value={automation.name}
                  onSave={(value) =>
                    updateAutomation(automation.id, "name", value)
                  }
                  className="text-white font-medium flex-1"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {automation.runs} runs
                  </span>
                  <button
                    onClick={() =>
                      updateAutomation(
                        automation.id,
                        "active",
                        !automation.active,
                      )
                    }
                    className={`w-3 h-3 rounded-full ${automation.active ? "bg-green-500" : "bg-gray-500"}`}
                  ></button>
                  <button
                    onClick={() => deleteAutomation(automation.id)}
                    className="text-red-400 hover:text-red-300 p-1 hover:bg-gray-600 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-300 mb-1">
                <span className="text-blue-400">Trigger:</span>{" "}
                <EditableCell
                  value={automation.trigger}
                  onSave={(value) =>
                    updateAutomation(automation.id, "trigger", value)
                  }
                  className="inline"
                />
              </div>
              <div className="text-sm text-gray-300">
                <span className="text-green-400">Action:</span>{" "}
                <EditableCell
                  value={automation.action}
                  onSave={(value) =>
                    updateAutomation(automation.id, "action", value)
                  }
                  className="inline"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={createAutomation}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Automation
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Top Navigation Bar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <MoreHorizontal className="w-5 h-5 text-gray-400 sm:block hidden" />
              <ChevronDown className="w-4 h-4 text-gray-400 sm:block hidden" />
              <div className="bg-purple-600 px-3 py-1 rounded text-sm font-medium">
                Windows & Doors Projects
              </div>
              <span className="text-gray-400 text-sm hidden sm:inline">
                {filteredItems.length} of {items.length} items
              </span>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2 w-full sm:w-auto">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-sm flex-1 sm:w-auto"
              />
            </div>
          </div>

          {/* Mobile: Show count and simplified controls */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-gray-400 text-sm sm:hidden">
              {filteredItems.length} of {items.length} items
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAutomations(true)}
                className="flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Automate</span>
              </button>
              <button className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button className="text-gray-400 hover:text-white p-1 hidden sm:block">
                <Bell className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-white p-1">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* View Tabs and Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          {/* View Tabs - Responsive */}
          <div className="overflow-x-auto">
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700 w-max">
              {views.map((view) => {
                const IconComponent = view.icon;
                return (
                  <button
                    key={view.id}
                    onClick={() => setCurrentView(view.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      currentView === view.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="hidden sm:inline">{view.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls - Mobile-responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Filters row */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="bg-gray-800 text-white border border-gray-600 rounded px-2 sm:px-3 py-2 text-sm min-w-0 flex-shrink-0"
              >
                <option value="">All Status</option>
                {Object.keys(statusColors).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                value={filters.priority}
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value })
                }
                className="bg-gray-800 text-white border border-gray-600 rounded px-2 sm:px-3 py-2 text-sm min-w-0 flex-shrink-0"
              >
                <option value="">All Priority</option>
                {Object.keys(priorityColors).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <select
                value={filters.assignee}
                onChange={(e) =>
                  setFilters({ ...filters, assignee: e.target.value })
                }
                className="bg-gray-800 text-white border border-gray-600 rounded px-2 sm:px-3 py-2 text-sm min-w-0 flex-shrink-0"
              >
                <option value="">All Assignees</option>
                {teamMembers.map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                <Filter className="w-4 h-4" />
                <span className="hidden lg:inline">More Filters</span>
              </button>
              <button className="flex items-center gap-1 text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                <Download className="w-4 h-4" />
                <span className="hidden lg:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400 text-sm">Total Projects</span>
            </div>
            <div className="text-2xl font-bold text-white">{items.length}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm">Completed</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {
                items.filter(
                  (item) =>
                    item.status === "Done" || item.status === "Installed",
                ).length
              }
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <PlayCircle className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400 text-sm">In Progress</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {items.filter((item) => item.status === "In Progress").length}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400 text-sm">Team Members</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {teamMembers.length}
            </div>
          </div>
        </div>

        {/* Main Content */}
        {currentView === "table" && renderTableView()}
        {currentView === "kanban" && renderKanbanView()}
        {currentView === "gantt" && (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Gantt Chart View</h3>
            <p className="text-gray-400">
              Visualize project timelines and dependencies
            </p>
          </div>
        )}
        {currentView === "calendar" && (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Calendar View</h3>
            <p className="text-gray-400">
              View tasks and deadlines in calendar format
            </p>
          </div>
        )}
        {currentView === "dashboard" && (
          <div className="space-y-6">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Total Revenue</h3>
                      <p className="text-gray-400 text-sm">This month</p>
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  $
                  {items
                    .reduce((sum, item) => sum + item.firstBid, 0)
                    .toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Current total</span>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        Completed Projects
                      </h3>
                      <p className="text-gray-400 text-sm">This month</p>
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {
                    items.filter(
                      (item) =>
                        item.status === "Done" || item.status === "Installed",
                    ).length
                  }
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">This month</span>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        Avg. Project Time
                      </h3>
                      <p className="text-gray-400 text-sm">Days to complete</p>
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">0</div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">No data yet</span>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        Team Utilization
                      </h3>
                      <p className="text-gray-400 text-sm">Average workload</p>
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">0%</div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">No data yet</span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Project Status Distribution */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Project Status Distribution
                </h3>
                <div className="space-y-4">
                  {Object.entries(statusColors).map(([status, color]) => {
                    const count = items.filter(
                      (item) => item.status === status,
                    ).length;
                    const percentage =
                      items.length > 0 ? (count / items.length) * 100 : 0;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: color }}
                        ></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-300 text-sm">
                              {status}
                            </span>
                            <span className="text-gray-400 text-sm">
                              {count} projects
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: color,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revenue Trend */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Monthly Revenue Trend
                </h3>
                <div className="text-center py-8">
                  <p className="text-gray-400">No revenue data available yet</p>
                  <p className="text-gray-500 text-sm mt-1">Add projects to see revenue trends</p>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Recent Activity */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </h3>
                <div className="text-center py-8">
                  <p className="text-gray-400">No recent activity</p>
                  <p className="text-gray-500 text-sm mt-1">Project activities will appear here</p>
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Deadlines
                </h3>
                <div className="space-y-4">
                  {items
                    .filter((item) => item.installDate)
                    .map((item, index) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {item.installDate
                              ? new Date(item.installDate).getDate()
                              : "--"}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {item.installDate
                              ? new Date(item.installDate).toLocaleDateString(
                                  "en",
                                  { month: "short" },
                                )
                              : ""}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">
                            {item.name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Installation scheduled
                          </p>
                        </div>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: statusColors[item.status] }}
                        ></div>
                      </div>
                    ))}
                  {items.filter((item) => item.installDate).length === 0 && (
                    <p className="text-gray-500 text-sm">
                      No upcoming installations scheduled
                    </p>
                  )}
                </div>
              </div>

              {/* Team Performance */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Performance
                </h3>
                <div className="text-center py-8">
                  <p className="text-gray-400">No team members added yet</p>
                  <p className="text-gray-500 text-sm mt-1">Add team members to track performance</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Automation Center Modal */}
      {showAutomations && renderAutomationCenter()}
      
      {/* Sub-item Edit Modal */}
      <SubitemModal />
    </div>
  );
};

export default ProjectBoard;
