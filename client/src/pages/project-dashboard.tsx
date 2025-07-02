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
  const [items, setItems] = useState([
    {
      id: 1,
      name: "New Windows Project - Living Room",
      people: ["John Doe"],
      status: "New Lead",
      priority: "Medium",
      measureDate: "2025-07-15",
      installDate: "2025-08-01",
      materialsSpent: 250,
      firstBid: 1500,
      lowestBid: 1200,
      contractSent: false,
      expanded: true,
      progress: 25,
      owner: "John Doe",
      notes: "Customer wants energy-efficient windows",
      subitems: [
        {
          id: 1,
          name: "Initial consultation and measurement",
          owner: "John Doe",
          status: "In Progress",
          materialsSpent: "150",
          dimensions: '36" x 80"',
          operation: "Swing",
          jambWidth: '4-9/16"',
          frameType: "Wood",
          files: [],
          progress: 75,
        },
      ],
    },
    {
      id: 2,
      name: "Front Door Replacement - Smith Residence",
      people: ["Jane Smith"],
      status: "Measured",
      priority: "High",
      measureDate: "2025-07-10",
      installDate: "2025-07-25",
      materialsSpent: 400,
      firstBid: 2200,
      lowestBid: 2000,
      contractSent: true,
      expanded: false,
      progress: 60,
      owner: "Jane Smith",
      notes: "Custom mahogany door with glass panels",
      subitems: [],
    },
  ]);

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

  const [currentView, setCurrentView] = useState("table");
  const [showAutomations, setShowAutomations] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [automations, setAutomations] = useState([
    {
      id: 1,
      name: "Status change notification",
      trigger: "When status changes to Done",
      action: "Send notification to team",
      active: true,
      runs: 45,
    },
    {
      id: 2,
      name: "Auto-assign tasks",
      trigger: "When item is created",
      action: "Assign to project manager",
      active: true,
      runs: 12,
    },
  ]);

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

  const teamMembers = [
    "John Doe",
    "Jane Smith",
    "Mike Johnson",
    "Sarah Wilson",
    "Tom Brown",
  ];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          progress: Math.min(100, item.progress + Math.random() * 0.5),
        })),
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
        subitems: [],
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
      {/* Table Header */}
      <div className="flex bg-gray-700 text-sm font-medium text-gray-300 border-b-2 border-gray-600">
        <div
          className="relative flex items-center gap-3 px-4 py-4 border-r border-gray-600"
          style={{ width: columnWidths.item }}
        >
          <input type="checkbox" className="rounded" />
          <span>Item</span>
          <ColumnResizer columnKey="item" />
        </div>
        <div
          className="relative flex items-center gap-2 px-4 py-4 border-r border-gray-600"
          style={{ width: columnWidths.owner }}
        >
          <User className="w-4 h-4" />
          <span>Owner</span>
          <ColumnResizer columnKey="owner" />
        </div>
        <div
          className="relative flex items-center px-4 py-4 border-r border-gray-600"
          style={{ width: columnWidths.status }}
        >
          <span>Status</span>
          <ColumnResizer columnKey="status" />
        </div>
        <div
          className="relative flex items-center px-4 py-4 border-r border-gray-600"
          style={{ width: columnWidths.priority }}
        >
          <span>Priority</span>
          <ColumnResizer columnKey="priority" />
        </div>
        <div
          className="relative flex items-center px-4 py-4 border-r border-gray-600"
          style={{ width: columnWidths.progress }}
        >
          <span>Progress</span>
          <ColumnResizer columnKey="progress" />
        </div>
        <div
          className="relative flex items-center px-4 py-4 border-r border-gray-600"
          style={{ width: columnWidths.measureDate }}
        >
          <span>Measure Date</span>
          <ColumnResizer columnKey="measureDate" />
        </div>
        <div
          className="relative flex items-center px-4 py-4 border-r border-gray-600"
          style={{ width: columnWidths.installDate }}
        >
          <span>Install Date</span>
          <ColumnResizer columnKey="installDate" />
        </div>
        <div
          className="relative flex items-center gap-1 px-4 py-4 border-r border-gray-600"
          style={{ width: columnWidths.materials }}
        >
          <span>Materials</span>
          <Info className="w-4 h-4 text-gray-500" />
          <ColumnResizer columnKey="materials" />
        </div>
        <div
          className="relative flex items-center px-4 py-4 border-r border-gray-600"
          style={{ width: columnWidths.firstBid }}
        >
          <span>1st Bid</span>
          <ColumnResizer columnKey="firstBid" />
        </div>
        <div
          className="relative flex items-center px-4 py-4 border-r border-gray-600"
          style={{ width: columnWidths.notes }}
        >
          <span>Notes</span>
          <ColumnResizer columnKey="notes" />
        </div>
        <div
          className="relative flex items-center px-4 py-4"
          style={{ width: columnWidths.actions }}
        >
          <span>Actions</span>
          <ColumnResizer columnKey="actions" />
        </div>
      </div>

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
                  className="flex items-center px-8 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.item }}
                >
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
                  <span>Materials</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.progress }}
                >
                  <span>Dimensions</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.measureDate }}
                >
                  <span>Operation</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.installDate }}
                >
                  <span>Jamb Width</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.materials }}
                >
                  <span>Frame Type</span>
                </div>
                <div
                  className="flex items-center px-4 py-3 border-r border-gray-600"
                  style={{ width: columnWidths.firstBid }}
                >
                  <span>Progress</span>
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
                    className="flex items-center gap-3 px-8 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.item }}
                  >
                    <input type="checkbox" className="rounded" />
                    <EditableCell
                      value={subitem.name}
                      onSave={(value) =>
                        updateSubitem(item.id, subitem.id, "name", value)
                      }
                      className="text-blue-400 font-medium flex-1"
                    />
                  </div>
                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.owner }}
                  >
                    <EditableCell
                      value={subitem.owner}
                      onSave={(value) =>
                        updateSubitem(item.id, subitem.id, "owner", value)
                      }
                      type="select"
                      options={["", ...teamMembers]}
                      className="w-full"
                    />
                  </div>
                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.status }}
                  >
                    <EditableCell
                      value={subitem.status}
                      onSave={(value) =>
                        updateSubitem(item.id, subitem.id, "status", value)
                      }
                      type="select"
                      options={["", ...Object.keys(statusColors)]}
                      className="w-full"
                    />
                  </div>
                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.priority }}
                  >
                    <EditableCell
                      value={subitem.materialsSpent}
                      onSave={(value) =>
                        updateSubitem(
                          item.id,
                          subitem.id,
                          "materialsSpent",
                          value,
                        )
                      }
                      className="w-full"
                    />
                  </div>
                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.progress }}
                  >
                    <EditableCell
                      value={subitem.dimensions}
                      onSave={(value) =>
                        updateSubitem(item.id, subitem.id, "dimensions", value)
                      }
                      className="w-full"
                    />
                  </div>
                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.measureDate }}
                  >
                    <EditableCell
                      value={subitem.operation}
                      onSave={(value) =>
                        updateSubitem(item.id, subitem.id, "operation", value)
                      }
                      type="select"
                      options={["", "Swing", "Sliding", "Bi-fold", "French"]}
                      className="w-full"
                    />
                  </div>
                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.installDate }}
                  >
                    <EditableCell
                      value={subitem.jambWidth}
                      onSave={(value) =>
                        updateSubitem(item.id, subitem.id, "jambWidth", value)
                      }
                      type="select"
                      options={["", '4-9/16"', '5-1/4"', '6-9/16"']}
                      className="w-full"
                    />
                  </div>
                  <div
                    className="flex items-center px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.materials }}
                  >
                    <EditableCell
                      value={subitem.frameType}
                      onSave={(value) =>
                        updateSubitem(item.id, subitem.id, "frameType", value)
                      }
                      type="select"
                      options={["", "Wood", "Steel", "Composite", "Aluminum"]}
                      className="w-full"
                    />
                  </div>
                  <div
                    className="flex items-center gap-3 px-4 py-4 border-r border-gray-700"
                    style={{ width: columnWidths.firstBid }}
                  >
                    <div className="flex-1 bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${subitem.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">
                      {subitem.progress || 0}%
                    </span>
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
                      className="w-full"
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
  );

  const renderKanbanView = () => (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {Object.keys(statusColors).map((status) => (
        <div
          key={status}
          className="min-w-80 bg-gray-800 rounded-lg p-6 border border-gray-700"
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
              <ChevronDown className="w-4 h-4 text-gray-400" />
              <div className="bg-purple-600 px-3 py-1 rounded text-sm font-medium">
                Windows & Doors Projects
              </div>
              <span className="text-gray-400 text-sm">
                {filteredItems.length} of {items.length} items
              </span>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAutomations(true)}
              className="flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              Automate
            </button>
            <button className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="text-gray-400 hover:text-white p-1">
              <Bell className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-white p-1">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* View Tabs and Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
            {views.map((view) => {
              const IconComponent = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setCurrentView(view.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === view.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {view.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
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
                className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
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
                className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
              >
                <option value="">All Assignees</option>
                {teamMembers.map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>
            <button className="flex items-center gap-1 text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
            <button className="flex items-center gap-1 text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
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
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Dashboard View</h3>
            <p className="text-gray-400">Analytics and insights overview</p>
          </div>
        )}
      </div>

      {/* Automation Center Modal */}
      {showAutomations && renderAutomationCenter()}
    </div>
  );
};

export default ProjectBoard;
