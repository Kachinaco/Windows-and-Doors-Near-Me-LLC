import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Folder,
  Trash2,
  User,
  Calendar,
  Hash,
  Tag,
  Check,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  ArrowLeft,
  Undo2,
  Settings,
  UserPlus,
  MessageCircle,
  Save,
  Timer,
  Globe,
  Link,
  FolderPlus,
} from "lucide-react";

const MondayBoard = () => {
  // Mock team members
  const [teamMembers] = useState([
    { id: 1, firstName: "John", lastName: "Doe" },
    { id: 2, firstName: "Jane", lastName: "Smith" },
    { id: 3, firstName: "Bob", lastName: "Wilson" },
    { id: 4, firstName: "Alice", lastName: "Johnson" },
  ]);

  // Board columns configuration
  const [columns, setColumns] = useState([
    { id: "item", name: "Main Item", type: "text", order: 1 },
    { id: "subitems", name: "Sub Items", type: "subitems", order: 2 },
    { id: "status", name: "Status", type: "status", order: 3 },
    { id: "assignedTo", name: "People", type: "people", order: 4 },
    { id: "dueDate", name: "Due Date", type: "date", order: 5 },
    { id: "checkbox", name: "Done", type: "checkbox", order: 6 },
    { id: "progress", name: "Progress", type: "progress", order: 7 },
  ]);

  // Sub-item columns configuration (separate from main columns)
  const [subItemColumns, setSubItemColumns] = useState([
    { id: "status", name: "Status", type: "status", order: 1 },
    { id: "assignedTo", name: "People", type: "people", order: 2 },
    { id: "dueDate", name: "Due Date", type: "date", order: 3 },
    { id: "checkbox", name: "Done", type: "checkbox", order: 4 },
    { id: "progress", name: "Progress", type: "progress", order: 5 },
  ]);

  // Initial board data with folders
  const [boardItems, setBoardItems] = useState([
    {
      id: 1,
      groupName: "New Leads",
      values: {
        item: "Website Redesign Project",
        status: "new lead",
        assignedTo: "1",
        dueDate: "2025-07-15",
        checkbox: false,
        progress: 0,
        email: "client@example.com",
        phone: "(555) 123-4567",
        location: "123 Main St, City",
      },
      folders: [
        {
          id: 1001,
          name: "Design Phase",
          collapsed: false,
          subItems: [
            {
              id: 10001,
              name: "Research user requirements",
              status: "not_started",
              assignedTo: "2",
              priority: 1,
              folderId: 1001,
            },
            {
              id: 10002,
              name: "Create wireframes",
              status: "in_progress",
              assignedTo: "1",
              priority: 2,
              folderId: 1001,
            },
            {
              id: 10003,
              name: "Design mockups",
              status: "not_started",
              assignedTo: "1",
              priority: 3,
              folderId: 1001,
            },
          ],
        },
        {
          id: 1002,
          name: "Development Phase",
          collapsed: true,
          subItems: [
            {
              id: 10004,
              name: "Set up development environment",
              status: "not_started",
              assignedTo: "3",
              priority: 1,
              folderId: 1002,
            },
            {
              id: 10005,
              name: "Frontend development",
              status: "not_started",
              assignedTo: "4",
              priority: 2,
              folderId: 1002,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      groupName: "In Progress",
      values: {
        item: "E-commerce Platform",
        status: "in progress",
        assignedTo: "3",
        dueDate: "2025-07-30",
        checkbox: false,
        progress: 60,
        email: "store@shop.com",
        phone: "(555) 456-7890",
        location: "789 Commerce Blvd, Downtown",
      },
      folders: [
        {
          id: 2001,
          name: "Backend Development",
          collapsed: false,
          subItems: [
            {
              id: 20001,
              name: "Database design",
              status: "completed",
              assignedTo: "3",
              priority: 1,
              folderId: 2001,
            },
            {
              id: 20002,
              name: "API development",
              status: "in_progress",
              assignedTo: "3",
              priority: 2,
              folderId: 2001,
            },
            {
              id: 20003,
              name: "Payment integration",
              status: "in_progress",
              assignedTo: "4",
              priority: 3,
              folderId: 2001,
            },
          ],
        },
        {
          id: 2002,
          name: "Frontend Development",
          collapsed: false,
          subItems: [
            {
              id: 20004,
              name: "Product catalog UI",
              status: "completed",
              assignedTo: "2",
              priority: 1,
              folderId: 2002,
            },
            {
              id: 20005,
              name: "Shopping cart functionality",
              status: "in_progress",
              assignedTo: "1",
              priority: 2,
              folderId: 2002,
            },
          ],
        },
      ],
    },
    {
      id: 3,
      groupName: "Complete",
      values: {
        item: "Blog Setup",
        status: "complete",
        assignedTo: "4",
        dueDate: "2025-06-15",
        checkbox: true,
        progress: 100,
        email: "blog@writer.com",
        phone: "(555) 111-2222",
        location: "Remote",
      },
      folders: [
        {
          id: 3001,
          name: "Content Creation",
          collapsed: false,
          subItems: [
            {
              id: 30001,
              name: "Write initial blog posts",
              status: "completed",
              assignedTo: "4",
              priority: 1,
              folderId: 3001,
            },
            {
              id: 30002,
              name: "Create content calendar",
              status: "completed",
              assignedTo: "4",
              priority: 2,
              folderId: 3001,
            },
          ],
        },
      ],
    },
  ]);

  // State management
  const [columnWidths, setColumnWidths] = useState({
    item: 250,
    subitems: 150,
    status: 130,
    assignedTo: 150,
    dueDate: 130,
    checkbox: 80,
    progress: 150,
    email: 180,
    phone: 140,
    location: 200,
  });

  const [selectedItems, setSelectedItems] = useState(new Set());
  const [expandedSubItems, setExpandedSubItems] = useState(new Set([1, 2])); // Start with some expanded
  const [expandedFolders, setExpandedFolders] = useState(
    new Set([1001, 2001, 2002, 3001]),
  );
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingSubItem, setEditingSubItem] = useState(null);
  const [isResizing, setIsResizing] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [selectedMainItem, setSelectedMainItem] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [newItemCounter, setNewItemCounter] = useState(4);
  const [newFolderCounter, setNewFolderCounter] = useState(4000);
  const [newSubItemCounter, setNewSubItemCounter] = useState(40000);

  // Updates modal state
  const [updatesModal, setUpdatesModal] = useState({
    isOpen: false,
    itemType: null, // 'main', 'folder', 'subitem'
    itemId: null,
    itemName: "",
  });
  const [itemUpdates, setItemUpdates] = useState({});
  const [newUpdate, setNewUpdate] = useState("");

  // Column menu state
  const [columnMenuOpen, setColumnMenuOpen] = useState(null);
  const [addColumnMenuOpen, setAddColumnMenuOpen] = useState(null);

  // Settings functionality state
  const [columnFilters, setColumnFilters] = useState({});
  const [columnSortOrder, setColumnSortOrder] = useState({});
  const [collapsedColumns, setCollapsedColumns] = useState(new Set());
  const [showColumnSummary, setShowColumnSummary] = useState(new Set());
  const [isRenamingColumn, setIsRenamingColumn] = useState(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnType, setNewColumnType] = useState("text");

  // Groups configuration
  const groupOrder = [
    "New Leads",
    "Need Attention",
    "Sent Estimate",
    "Signed",
    "In Progress",
    "Complete",
  ];

  // Close column menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnMenuOpen && !event.target.closest(".relative")) {
        setColumnMenuOpen(null);
      }
      if (addColumnMenuOpen && !event.target.closest(".relative")) {
        setAddColumnMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [columnMenuOpen, addColumnMenuOpen]);

  // Handle column type selection from AddColumnMenu
  const handleSelectColumnType = (type) => {
    const columnName = prompt("Enter column name:") || "New Column";
    handleAddColumn(type, columnName);
    setAddColumnMenuOpen(null);
  };

  // Handle sub-item column type selection from AddColumnMenu
  const handleSelectSubItemColumnType = (type) => {
    const columnName = prompt("Enter column name:") || "New Column";
    handleAddSubItemColumn(type, columnName);
    setAddColumnMenuOpen(null);
  };

  // Helper functions
  const getMemberDisplayName = (memberId) => {
    if (!memberId || memberId === "" || memberId === "unassigned")
      return "Unassigned";
    const member = teamMembers.find(
      (m) => m.id.toString() === memberId.toString(),
    );
    return member ? `${member.firstName} ${member.lastName}` : "Unassigned";
  };

  const getColumnWidth = (columnId) => {
    return columnWidths[columnId] || 140;
  };

  const getColumnIcon = (type) => {
    switch (type) {
      case "status":
        return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
      case "people":
        return <User className="w-3 h-3 text-purple-400" />;
      case "date":
        return <Calendar className="w-3 h-3 text-orange-400" />;
      case "number":
        return <Hash className="w-3 h-3 text-yellow-400" />;
      case "tags":
        return <Tag className="w-3 h-3 text-red-400" />;
      case "subitems":
        return <Folder className="w-3 h-3 text-blue-400" />;
      case "checkbox":
        return <Check className="w-3 h-3 text-green-400" />;
      case "progress":
        return <BarChart3 className="w-3 h-3 text-green-400" />;
      case "email":
        return <Mail className="w-3 h-3 text-blue-400" />;
      case "phone":
        return <Phone className="w-3 h-3 text-green-400" />;
      case "location":
        return <MapPin className="w-3 h-3 text-red-400" />;
      default:
        return <Hash className="w-3 h-3 text-gray-400" />;
    }
  };

  // Group items by group name
  const groupedItems = boardItems.reduce((groups, item) => {
    if (!groups[item.groupName]) {
      groups[item.groupName] = [];
    }
    groups[item.groupName].push(item);
    return groups;
  }, {});

  // Create board groups
  const boardGroups = groupOrder.map((groupName) => ({
    name: groupName,
    items: groupedItems[groupName] || [],
    collapsed: collapsedGroups[groupName] || false,
  }));

  // Event handlers
  const handleCellUpdate = useCallback((projectId, field, value) => {
    setBoardItems((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? { ...item, values: { ...item.values, [field]: value } }
          : item,
      ),
    );

    setUndoStack((prev) => [
      ...prev.slice(-9),
      {
        action: "update_cell",
        data: { projectId, field, value },
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const handleAddItem = (groupName = "New Leads") => {
    const newItem = {
      id: newItemCounter,
      groupName,
      values: {
        item: "",
        status:
          groupName === "New Leads"
            ? "new lead"
            : groupName === "In Progress"
              ? "in progress"
              : groupName === "Complete"
                ? "complete"
                : "new lead",
        assignedTo: "unassigned",
        dueDate: "",
        checkbox: false,
        progress: 0,
        email: "",
        phone: "",
        location: "",
      },
      folders: [],
    };

    setBoardItems((prev) => [...prev, newItem]);
    setNewItemCounter((prev) => prev + 1);
    setEditingCell({ projectId: newItemCounter, field: "item" });
  };

  const handleAddFolder = (projectId) => {
    const newFolder = {
      id: newFolderCounter,
      name: "",
      collapsed: false,
      subItems: [],
    };

    setBoardItems((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? { ...item, folders: [...(item.folders || []), newFolder] }
          : item,
      ),
    );

    setExpandedSubItems((prev) => new Set([...prev, projectId]));
    setExpandedFolders((prev) => new Set([...prev, newFolderCounter]));
    setEditingFolder(newFolderCounter);
    setNewFolderCounter((prev) => prev + 1);
  };

  const handleAddSubItem = (projectId, folderId) => {
    const newSubItem = {
      id: newSubItemCounter,
      name: "",
      status: "not_started",
      assignedTo: "unassigned",
      priority: 1,
      folderId: folderId,
    };

    setBoardItems((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? {
              ...item,
              folders: item.folders.map((folder) =>
                folder.id === folderId
                  ? { ...folder, subItems: [...folder.subItems, newSubItem] }
                  : folder,
              ),
            }
          : item,
      ),
    );

    setExpandedSubItems((prev) => new Set([...prev, projectId]));
    setExpandedFolders((prev) => new Set([...prev, folderId]));
    setEditingSubItem(newSubItemCounter);
    setNewSubItemCounter((prev) => prev + 1);
  };

  const handleUpdateFolder = (projectId, folderId, newName) => {
    setBoardItems((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? {
              ...item,
              folders: item.folders.map((folder) =>
                folder.id === folderId ? { ...folder, name: newName } : folder,
              ),
            }
          : item,
      ),
    );
  };

  // Settings functionality handlers
  const handleFilterColumn = (columnId, filterValue) => {
    setColumnFilters(prev => ({ ...prev, [columnId]: filterValue }));
  };

  const handleSortColumn = (columnId, sortOrder) => {
    setColumnSortOrder(prev => ({ ...prev, [columnId]: sortOrder }));
  };

  const handleCollapseColumn = (columnId) => {
    setCollapsedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const handleToggleColumnSummary = (columnId) => {
    setShowColumnSummary(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const handleRenameColumn = (columnId, newName) => {
    // Update the column name in the columns array
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, name: newName } : col
    ));
    setIsRenamingColumn(null);
    setNewColumnName("");
  };

  const handleDeleteColumn = (columnId) => {
    if (window.confirm("Are you sure you want to delete this column?")) {
      setColumns(prev => prev.filter(col => col.id !== columnId));
      // Clean up related state
      setColumnFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[columnId];
        return newFilters;
      });
      setColumnSortOrder(prev => {
        const newSort = { ...prev };
        delete newSort[columnId];
        return newSort;
      });
      setCollapsedColumns(prev => {
        const newSet = new Set(prev);
        newSet.delete(columnId);
        return newSet;
      });
    }
  };

  const handleDuplicateColumn = (columnId) => {
    const originalColumn = columns.find(col => col.id === columnId);
    if (originalColumn) {
      const newColumn = {
        ...originalColumn,
        id: `${columnId}_copy_${Date.now()}`,
        name: `${originalColumn.name} (Copy)`,
        order: Math.max(...columns.map(col => col.order)) + 1
      };
      setColumns(prev => [...prev, newColumn]);
    }
  };

  const handleAddColumn = (type, name = "New Column") => {
    const newColumn = {
      id: `col_${Date.now()}`,
      name: name,
      type: type,
      order: Math.max(...columns.map(col => col.order)) + 1
    };
    setColumns(prev => [...prev, newColumn]);
    setIsAddingColumn(false);
  };

  const handleAddSubItemColumn = (type, name = "New Column") => {
    const newColumn = {
      id: `subcol_${Date.now()}`,
      name: name,
      type: type,
      order: Math.max(...subItemColumns.map(col => col.order), 0) + 1,
      width: 150
    };
    setSubItemColumns(prev => [...prev, newColumn]);
  };

  const handleUpdateSubItem = (projectId, subItemId, field, value) => {
    setBoardItems((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? {
              ...item,
              folders: item.folders.map((folder) => ({
                ...folder,
                subItems: folder.subItems.map((subItem) =>
                  subItem.id === subItemId
                    ? { ...subItem, [field]: value }
                    : subItem,
                ),
              })),
            }
          : item,
      ),
    );
  };

  const handleDeleteFolder = (projectId, folderId) => {
    setBoardItems((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? {
              ...item,
              folders: item.folders.filter((folder) => folder.id !== folderId),
            }
          : item,
      ),
    );
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      newSet.delete(folderId);
      return newSet;
    });
  };

  const handleDeleteSubItem = (projectId, subItemId) => {
    setBoardItems((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? {
              ...item,
              folders: item.folders.map((folder) => ({
                ...folder,
                subItems: folder.subItems.filter(
                  (subItem) => subItem.id !== subItemId,
                ),
              })),
            }
          : item,
      ),
    );
  };

  const handleDeleteItem = (itemId) => {
    setBoardItems((prev) => prev.filter((item) => item.id !== itemId));
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  const handleSelectToggle = (id) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handlePointerDown = (columnId, e) => {
    e.preventDefault();
    setIsResizing(columnId);

    const startX = e.clientX;
    const startWidth = columnWidths[columnId] || 140;

    const handlePointerMove = (e) => {
      const newWidth = Math.max(80, startWidth + (e.clientX - startX));
      setColumnWidths((prev) => ({ ...prev, [columnId]: newWidth }));
    };

    const handlePointerUp = () => {
      setIsResizing(null);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const toggleGroup = (groupName) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Updates functionality
  const openUpdatesModal = (itemType, itemId, itemName) => {
    setUpdatesModal({
      isOpen: true,
      itemType,
      itemId,
      itemName,
    });
  };

  const closeUpdatesModal = () => {
    setUpdatesModal({
      isOpen: false,
      itemType: null,
      itemId: null,
      itemName: "",
    });
    setNewUpdate("");
  };

  const addUpdate = () => {
    if (!newUpdate.trim()) return;

    const updateKey = `${updatesModal.itemType}-${updatesModal.itemId}`;
    const newUpdateObj = {
      id: Date.now(),
      content: newUpdate.trim(),
      author: "You",
      timestamp: new Date(),
      type: updatesModal.itemType,
    };

    setItemUpdates((prev) => ({
      ...prev,
      [updateKey]: [...(prev[updateKey] || []), newUpdateObj],
    }));

    setNewUpdate("");
    closeUpdatesModal();
  };

  const getUpdateCount = (itemType, itemId) => {
    const updateKey = `${itemType}-${itemId}`;
    return itemUpdates[updateKey]?.length || 0;
  };

  // Column menu component
  const AddColumnMenu = ({ isOpen, onClose, onSelectType }) => {
    if (!isOpen) return null;

    const columnTypes = [
      { type: "text", name: "Text", icon: "📝", description: "Simple text field" },
      { type: "status", name: "Status", icon: "🟡", description: "Status with colored labels" },
      { type: "people", name: "People", icon: "👤", description: "Assign team members" },
      { type: "date", name: "Date", icon: "📅", description: "Date picker" },
      { type: "number", name: "Number", icon: "🔢", description: "Numeric values" },
      { type: "checkbox", name: "Checkbox", icon: "☑️", description: "True/false toggle" },
      { type: "progress", name: "Progress", icon: "📊", description: "Progress bar" },
      { type: "email", name: "Email", icon: "📧", description: "Email addresses" },
      { type: "phone", name: "Phone", icon: "📞", description: "Phone numbers" },
      { type: "location", name: "Location", icon: "📍", description: "Address or location" },
    ];

    return (
      <div className="absolute top-full left-0 z-50 mt-1 w-80 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 text-white">
        <div className="py-2">
          <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Column
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1 p-2">
              {columnTypes.map((columnType) => (
                <div
                  key={columnType.type}
                  onClick={() => {
                    onSelectType(columnType.type);
                    onClose();
                  }}
                  className="p-3 hover:bg-gray-700 cursor-pointer rounded-lg flex flex-col items-center text-center transition-all"
                >
                  <div className="text-2xl mb-1">{columnType.icon}</div>
                  <div className="text-sm font-medium text-gray-200">{columnType.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{columnType.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ColumnMenu = ({ columnId, columnName, isOpen, onClose, isSubItem = false, menuKey = null }) => {
    if (!isOpen) return null;

    return (
      <div className="absolute top-full right-0 mt-1 w-64 bg-gray-800 text-white rounded-lg shadow-xl border border-gray-700 z-50">
        <div className="py-2">
          <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </div>
          </div>

          <div 
            onClick={() => {
              alert("AI Autofill feature coming soon!");
              onClose();
            }}
            className="px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
          >
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded flex items-center justify-center text-xs">
              ✨
            </div>
            Autofill with AI
          </div>

          <div className="border-t border-gray-700 my-1"></div>

          <div 
            onClick={() => {
              const filterValue = prompt(`Enter filter value for ${columnName}:`);
              if (filterValue !== null) {
                handleFilterColumn(columnId, filterValue);
                onClose();
              }
            }}
            className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
          >
            <div className="w-4 h-4">🔍</div>
            Filter
          </div>



          <div className="border-t border-gray-700 my-1"></div>

          <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2">
            <div className="w-4 h-4">📊</div>
            Show Summary on Parent Item
          </div>

          <div 
            onClick={() => {
              if (isSubItem) {
                handleAddSubItemColumn("text"); // Default to text type for duplication
              } else {
                handleDuplicateColumn(columnId);
              }
              onClose();
            }}
            className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
          >
            <div className="w-4 h-4">📋</div>
            Duplicate column
            <ChevronRight className="w-3 h-3 ml-auto" />
          </div>

          <div 
            onClick={() => {
              if (isSubItem && menuKey) {
                // For sub-items, use the full menu key which contains the sub-item context
                setAddColumnMenuOpen(menuKey);
              } else {
                setAddColumnMenuOpen(columnId);
              }
              onClose();
            }}
            className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2 relative"
          >
            <Plus className="w-4 h-4" />
            Add column to the right
            <ChevronRight className="w-3 h-3 ml-auto" />
          </div>

          <div 
            onClick={() => {
              const columnTypes = ["text", "status", "people", "date", "number", "checkbox", "progress"];
              const selectedType = prompt(`Change column type to:\n${columnTypes.join(", ")}`);
              if (selectedType && columnTypes.includes(selectedType)) {
                setColumns(prev => prev.map(col => 
                  col.id === columnId ? { ...col, type: selectedType } : col
                ));
                onClose();
              }
            }}
            className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
          >
            <div className="w-4 h-4">🔄</div>
            Change column type
            <ChevronRight className="w-3 h-3 ml-auto" />
          </div>



          <div className="border-t border-gray-700 my-1"></div>

          <div 
            onClick={() => {
              const newName = prompt(`Rename column "${columnName}" to:`, columnName);
              if (newName && newName !== columnName) {
                handleRenameColumn(columnId, newName);
                onClose();
              }
            }}
            className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
          >
            <div className="w-4 h-4">✏️</div>
            Rename
          </div>

          <div 
            onClick={() => {
              handleDeleteColumn(columnId);
              onClose();
            }}
            className="px-4 py-2 text-sm text-red-400 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </div>
        </div>
      </div>
    );
  };

  const renderCell = (item, column) => {
    const value = item.values[column.id] || "";

    switch (column.type) {
      case "status":
        return (
          <select
            value={value}
            onChange={(e) =>
              handleCellUpdate(item.id, column.id, e.target.value)
            }
            className={`h-6 text-xs font-medium rounded-full px-2 border-none outline-none cursor-pointer ${
              value === "complete"
                ? "bg-green-100 text-green-700"
                : value === "in progress"
                  ? "bg-blue-100 text-blue-700"
                  : value === "signed"
                    ? "bg-emerald-100 text-emerald-700"
                    : value === "sent estimate"
                      ? "bg-purple-100 text-purple-700"
                      : value === "need attention"
                        ? "bg-yellow-100 text-yellow-700"
                        : value === "new lead"
                          ? "bg-cyan-100 text-cyan-700"
                          : "bg-gray-100 text-gray-700"
            }`}
          >
            <option value="new lead">New Lead</option>
            <option value="need attention">Need Attention</option>
            <option value="sent estimate">Sent Estimate</option>
            <option value="signed">Signed</option>
            <option value="in progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        );

      case "people":
        return (
          <select
            value={value}
            onChange={(e) =>
              handleCellUpdate(item.id, column.id, e.target.value)
            }
            className="h-6 text-xs border-none bg-transparent text-gray-700 outline-none cursor-pointer"
          >
            <option value="unassigned">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id.toString()}>
                {member.firstName} {member.lastName}
              </option>
            ))}
          </select>
        );

      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) =>
              handleCellUpdate(item.id, column.id, e.target.value)
            }
            className="h-6 text-xs border-none bg-transparent text-gray-700 outline-none"
          />
        );

      case "checkbox":
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={value === true || value === "true"}
              onChange={(e) =>
                handleCellUpdate(item.id, column.id, e.target.checked)
              }
              className="w-4 h-4 rounded border-gray-400 text-blue-500"
            />
          </div>
        );

      case "progress":
        const progressValue = parseInt(value) || 0;
        return (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, progressValue))}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-600 w-8">{progressValue}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={progressValue}
              onChange={(e) =>
                handleCellUpdate(item.id, column.id, parseInt(e.target.value))
              }
              className="w-12 h-1 cursor-pointer"
            />
          </div>
        );

      case "subitems":
        const isExpanded = expandedSubItems.has(item.id);
        const totalSubItems = (item.folders || []).reduce(
          (total, folder) => total + folder.subItems.length,
          0,
        );

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setExpandedSubItems((prev) => {
                  const newSet = new Set(prev);
                  if (newSet.has(item.id)) {
                    newSet.delete(item.id);
                  } else {
                    newSet.add(item.id);
                  }
                  return newSet;
                });
              }}
              className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded text-xs text-gray-600"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <Folder className="w-3 h-3" />
              <span>{totalSubItems} items</span>
            </button>
          </div>
        );

      default:
        const isEditing =
          editingCell?.projectId === item.id &&
          editingCell?.field === column.id;

        if (isEditing) {
          return (
            <input
              value={value}
              onChange={(e) =>
                handleCellUpdate(item.id, column.id, e.target.value)
              }
              className="h-6 text-xs border-none bg-transparent text-gray-700 outline-none w-full"
              placeholder={
                column.id === "item" ? "Enter project name" : "Enter text"
              }
              autoFocus
              onBlur={() => setEditingCell(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") {
                  setEditingCell(null);
                }
              }}
            />
          );
        }

        return (
          <div
            className="h-6 text-xs cursor-text hover:bg-gray-50 flex items-center px-2 rounded"
            onClick={() =>
              setEditingCell({ projectId: item.id, field: column.id })
            }
          >
            {column.id === "item" && (
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  item.values["status"] === "complete"
                    ? "bg-green-500"
                    : item.values["status"] === "in progress"
                      ? "bg-blue-500"
                      : item.values["status"] === "signed"
                        ? "bg-emerald-500"
                        : item.values["status"] === "sent estimate"
                          ? "bg-purple-500"
                          : item.values["status"] === "need attention"
                            ? "bg-yellow-500"
                            : item.values["status"] === "new lead"
                              ? "bg-cyan-500"
                              : "bg-gray-500"
                }`}
              />
            )}
            {value || <span className="text-gray-400">Click to add...</span>}
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-white text-gray-900 flex overflow-hidden">
      {/* Main Board Container */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button className="text-gray-600 hover:text-gray-900 text-sm px-3 py-2 rounded-md flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-sm" />
              </div>
              <h1 className="text-lg font-medium">Project Board</h1>
            </div>

            <div className="flex items-center space-x-2">
              {undoStack.length > 0 && (
                <button className="text-gray-600 hover:text-gray-900 p-1 rounded">
                  <Undo2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleAddItem("New Leads")}
                className="text-gray-600 hover:text-gray-900 p-1 rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Board Content */}
        <div className="flex-1 overflow-x-auto overflow-y-auto bg-white" style={{ scrollBehavior: 'smooth' }}>
          <div className="min-w-max w-full">
            {/* Column Headers */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
              <div className="flex">
                <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.size > 0 &&
                      selectedItems.size === boardItems.length
                    }
                    onChange={() => {
                      if (selectedItems.size === boardItems.length) {
                        setSelectedItems(new Set());
                      } else {
                        setSelectedItems(
                          new Set(boardItems.map((item) => item.id)),
                        );
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-400 text-blue-500"
                  />
                </div>
                {columns.map((column, index) => (
                  <div
                    key={column.id}
                    className="px-3 py-3 border-r border-gray-200 relative group flex-shrink-0 bg-white"
                    style={{ 
                      width: getColumnWidth(column.id),
                      minWidth: getColumnWidth(column.id)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getColumnIcon(column.type)}
                        <span className="font-medium text-sm text-gray-700">
                          {column.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setColumnMenuOpen(
                            columnMenuOpen === `main-${column.id}`
                              ? null
                              : `main-${column.id}`,
                          );
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded opacity-100 transition-opacity"
                      >
                        ⋯
                      </button>
                    </div>
                    <ColumnMenu
                      columnId={column.id}
                      columnName={column.name}
                      isOpen={columnMenuOpen === `main-${column.id}`}
                      onClose={() => setColumnMenuOpen(null)}
                    />
                    <AddColumnMenu
                      isOpen={addColumnMenuOpen === `main-${column.id}`}
                      onClose={() => setAddColumnMenuOpen(null)}
                      onSelectType={handleSelectColumnType}
                    />
                    {index < columns.length - 1 && (
                      <div
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center hover:bg-blue-100"
                        onPointerDown={(e) => handlePointerDown(column.id, e)}
                      >
                        <div className="w-0.5 h-4 bg-gray-400 hover:bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
                {/* Updates column header */}
                <div className="w-12 px-2 py-3 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Groups and Items */}
            {boardGroups.map((group) => (
              <div key={group.name} className="border-b border-gray-200">
                {/* Group Header */}
                <div
                  className={`flex border-b border-gray-200 hover:bg-gray-50 ${
                    group.name === "New Leads"
                      ? "bg-cyan-50"
                      : group.name === "Need Attention"
                        ? "bg-yellow-50"
                        : group.name === "Sent Estimate"
                          ? "bg-purple-50"
                          : group.name === "Signed"
                            ? "bg-emerald-50"
                            : group.name === "In Progress"
                              ? "bg-blue-50"
                              : group.name === "Complete"
                                ? "bg-green-50"
                                : "bg-gray-50"
                  }`}
                >
                  <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-400 text-blue-500"
                    />
                  </div>

                  <div
                    className="px-4 py-3 border-r border-gray-200 flex items-center space-x-2 cursor-pointer"
                    style={{ 
                      width: getColumnWidth("item"),
                      minWidth: getColumnWidth("item")
                    }}
                    onClick={() => toggleGroup(group.name)}
                  >
                    {group.collapsed ? (
                      <ChevronRight className="w-3 h-3 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    )}
                    <div
                      className={`w-3 h-3 rounded-full ${
                        group.name === "New Leads"
                          ? "bg-cyan-500"
                          : group.name === "Need Attention"
                            ? "bg-yellow-500"
                            : group.name === "Sent Estimate"
                              ? "bg-purple-500"
                              : group.name === "Signed"
                                ? "bg-emerald-500"
                                : group.name === "In Progress"
                                  ? "bg-blue-500"
                                  : group.name === "Complete"
                                    ? "bg-green-500"
                                    : "bg-gray-500"
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {group.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({group.items.length})
                    </span>
                  </div>

                  {columns.slice(1).map((column) => (
                    <div
                      key={column.id}
                      className="px-3 py-3 border-r border-gray-200"
                      style={{ 
                        width: getColumnWidth(column.id),
                        minWidth: getColumnWidth(column.id)
                      }}
                    >
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {column.name}
                      </span>
                    </div>
                  ))}

                  {/* Updates column in group header */}
                  <div className="w-12 px-2 py-3 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-500">
                      💬
                    </span>
                  </div>
                </div>

                {/* Group Items */}
                {!group.collapsed && (
                  <>
                    {group.items.map((item) => (
                      <React.Fragment key={item.id}>
                        {/* Main Item Row */}
                        <div className="flex hover:bg-gray-50 border-b border-gray-200 group">
                          <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectToggle(item.id);
                              }}
                              className="w-4 h-4 rounded border-gray-400 text-blue-500"
                            />
                          </div>
                          {columns.map((column) => (
                            <div
                              key={`${item.id}-${column.id}`}
                              className="px-4 py-3 border-r border-gray-200 flex items-center relative"
                              style={{ 
                                width: getColumnWidth(column.id),
                                minWidth: getColumnWidth(column.id)
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {renderCell(item, column)}
                            </div>
                          ))}
                          {/* Updates icon for main item */}
                          <div className="w-12 px-2 py-3 flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openUpdatesModal(
                                  "main",
                                  item.id,
                                  item.values.item || `Project #${item.id}`,
                                );
                              }}
                              className="relative p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Add update"
                            >
                              <MessageCircle className="w-4 h-4" />
                              {getUpdateCount("main", item.id) > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                  {getUpdateCount("main", item.id)}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Folders and Sub-Items */}
                        {expandedSubItems.has(item.id) && (
                          <>
                            {/* Render folders */}
                            {(item.folders || []).map((folder) => (
                              <React.Fragment key={folder.id}>
                                {/* Folder Header with Sub-item Column Headers */}
                                <div className="flex hover:bg-blue-50 bg-blue-25 border-b border-blue-200 group">
                                  <div className="w-12 px-2 py-2 border-r border-blue-200 flex items-center justify-center">
                                    <button
                                      onClick={() =>
                                        handleDeleteFolder(item.id, folder.id)
                                      }
                                      className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <div
                                    className="px-4 py-2 border-r border-blue-200 flex items-center"
                                    style={{ 
                                      width: getColumnWidth("item"),
                                      minWidth: getColumnWidth("item")
                                    }}
                                  >
                                    <div className="flex items-center gap-2 text-sm w-full">
                                      <div className="w-4 h-px bg-blue-400"></div>
                                      <button
                                        onClick={() => toggleFolder(folder.id)}
                                        className="p-0.5 hover:bg-blue-100 rounded"
                                      >
                                        <ChevronRight
                                          className={`w-3 h-3 text-blue-600 transition-transform ${
                                            expandedFolders.has(folder.id)
                                              ? "rotate-90"
                                              : ""
                                          }`}
                                        />
                                      </button>
                                      <span className="text-blue-600 text-xs bg-blue-100 px-1.5 rounded">
                                        ({folder.subItems.length})
                                      </span>
                                      <Folder className="w-4 h-4 text-blue-600" />

                                      {editingFolder === folder.id ? (
                                        <input
                                          type="text"
                                          value={folder.name}
                                          onChange={(e) =>
                                            handleUpdateFolder(
                                              item.id,
                                              folder.id,
                                              e.target.value,
                                            )
                                          }
                                          onBlur={() => setEditingFolder(null)}
                                          onKeyDown={(e) => {
                                            if (
                                              e.key === "Enter" ||
                                              e.key === "Escape"
                                            ) {
                                              setEditingFolder(null);
                                            }
                                          }}
                                          className="bg-white text-blue-900 text-sm px-2 py-1 border border-blue-300 rounded flex-1"
                                          autoFocus
                                          placeholder="Folder name"
                                        />
                                      ) : (
                                        <span
                                          className="text-blue-900 text-sm font-medium cursor-pointer hover:text-blue-700 flex-1"
                                          onClick={() =>
                                            setEditingFolder(folder.id)
                                          }
                                        >
                                          {folder.name || "Untitled Folder"}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Dynamic Sub-item Column Headers */}









                                  {/* Dynamic Sub-item Columns */}
                                  {subItemColumns.map((column) => (
                                    <div
                                      key={column.id}
                                      className="px-3 py-2 border-r border-blue-200 relative"
                                      style={{ width: getColumnWidth(column.type) }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-1">
                                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                                          <span className="text-xs font-medium text-blue-600 uppercase">
                                            {column.name}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() =>
                                            setColumnMenuOpen(
                                              columnMenuOpen === `folder-${folder.id}-${column.id}`
                                                ? null
                                                : `folder-${folder.id}-${column.id}`,
                                            )
                                          }
                                          className="text-blue-400 hover:text-blue-600 p-1 hover:bg-blue-100 rounded"
                                        >
                                          ⋯
                                        </button>
                                      </div>
                                      <ColumnMenu
                                        columnId={column.id}
                                        columnName={column.name}
                                        isOpen={
                                          columnMenuOpen === `folder-${folder.id}-${column.id}`
                                        }
                                        onClose={() => setColumnMenuOpen(null)}
                                        isSubItem={true}
                                        menuKey={`folder-${folder.id}-${column.id}`}
                                      />
                                      <AddColumnMenu
                                        isOpen={addColumnMenuOpen === `folder-${folder.id}-${column.id}`}
                                        onClose={() => setAddColumnMenuOpen(null)}
                                        onSelectType={handleSelectSubItemColumnType}
                                      />
                                    </div>
                                  ))}

                                  {/* Updates icon for folder */}
                                  <div className="w-12 px-2 py-2 flex items-center justify-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openUpdatesModal(
                                          "folder",
                                          folder.id,
                                          folder.name || "Untitled Folder",
                                        );
                                      }}
                                      className="relative p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                      title="Add update to folder"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      {getUpdateCount("folder", folder.id) >
                                        0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center text-[10px]">
                                          {getUpdateCount("folder", folder.id)}
                                        </span>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Sub-items in this folder */}
                                {expandedFolders.has(folder.id) &&
                                  folder.subItems.map((subItem) => (
                                    <div
                                      key={subItem.id}
                                      className="flex hover:bg-blue-50 bg-blue-25 border-b border-blue-200 group"
                                    >
                                      <div className="w-12 px-2 py-2 border-r border-blue-200 flex items-center justify-center">
                                        <button
                                          onClick={() =>
                                            handleDeleteSubItem(
                                              item.id,
                                              subItem.id,
                                            )
                                          }
                                          className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      </div>

                                      <div
                                        className="px-4 py-2 border-r border-blue-200 flex items-center"
                                        style={{
                                          width: getColumnWidth("item"),
                                        }}
                                      >
                                        <div className="flex items-center gap-2 text-sm w-full">
                                          <div className="w-6 h-px bg-blue-400"></div>
                                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>

                                          {editingSubItem === subItem.id ? (
                                            <input
                                              type="text"
                                              value={subItem.name}
                                              onChange={(e) =>
                                                handleUpdateSubItem(
                                                  item.id,
                                                  subItem.id,
                                                  "name",
                                                  e.target.value,
                                                )
                                              }
                                              onBlur={() =>
                                                setEditingSubItem(null)
                                              }
                                              onKeyDown={(e) => {
                                                if (
                                                  e.key === "Enter" ||
                                                  e.key === "Escape"
                                                ) {
                                                  setEditingSubItem(null);
                                                }
                                              }}
                                              className="bg-white text-gray-900 text-sm px-2 py-1 border border-gray-300 rounded flex-1"
                                              autoFocus
                                              placeholder="Sub-item name"
                                            />
                                          ) : (
                                            <span
                                              className="cursor-pointer hover:text-blue-700 text-blue-800 text-sm font-medium flex-1"
                                              onClick={() =>
                                                setEditingSubItem(subItem.id)
                                              }
                                            >
                                              {subItem.name ||
                                                "Untitled Sub-item"}
                                            </span>
                                          )}
                                        </div>
                                      </div>












                                      {/* Dynamic Sub-item Column Data */}
                                      {subItemColumns.map((column) => (
                                        <div
                                          key={column.id}
                                          className="px-3 py-2 border-r border-blue-200 relative"
                                          style={{ width: getColumnWidth(column.type) }}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 flex-1">
                                              {/* Render based on column type */}
                                              {column.type === 'text' && (
                                                <input
                                                  type="text"
                                                  placeholder="Enter text..."
                                                  className="w-full text-xs text-blue-600 bg-transparent border-none outline-none"
                                                />
                                              )}
                                              {column.type === 'status' && (
                                                <select className="w-full text-xs text-blue-600 bg-transparent border-none outline-none">
                                                  <option>Not Started</option>
                                                  <option>In Progress</option>
                                                  <option>Completed</option>
                                                </select>
                                              )}
                                              {column.type === 'people' && (
                                                <select className="w-full text-xs text-blue-600 bg-transparent border-none outline-none">
                                                  <option>Unassigned</option>
                                                  <option>John Doe</option>
                                                  <option>Jane Smith</option>
                                                </select>
                                              )}
                                              {column.type === 'date' && (
                                                <input
                                                  type="date"
                                                  className="w-full text-xs text-blue-600 bg-transparent border-none outline-none"
                                                />
                                              )}
                                              {column.type === 'number' && (
                                                <input
                                                  type="number"
                                                  placeholder="0"
                                                  className="w-full text-xs text-blue-600 bg-transparent border-none outline-none"
                                                />
                                              )}
                                              {column.type === 'checkbox' && (
                                                <input
                                                  type="checkbox"
                                                  className="w-3 h-3 rounded border-blue-400 text-blue-600"
                                                />
                                              )}
                                            </div>
                                            <button
                                              onClick={() =>
                                                setColumnMenuOpen(
                                                  columnMenuOpen === `subitem-${subItem.id}-${column.id}`
                                                    ? null
                                                    : `subitem-${subItem.id}-${column.id}`,
                                                )
                                              }
                                              className="text-blue-400 hover:text-blue-600 p-1 hover:bg-blue-100 rounded opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                            >
                                              ⋯
                                            </button>
                                          </div>
                                          <ColumnMenu
                                            columnId={column.id}
                                            columnName={column.name}
                                            isOpen={
                                              columnMenuOpen === `subitem-${subItem.id}-${column.id}`
                                            }
                                            onClose={() => setColumnMenuOpen(null)}
                                          />
                                        </div>
                                      ))}

                                      {/* Updates icon for sub-item */}
                                      <div className="w-12 px-2 py-2 flex items-center justify-center">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openUpdatesModal(
                                              "subitem",
                                              subItem.id,
                                              subItem.name ||
                                                "Untitled Sub-item",
                                            );
                                          }}
                                          className="relative p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                          title="Add update to sub-item"
                                        >
                                          <MessageCircle className="w-3 h-3" />
                                          {getUpdateCount(
                                            "subitem",
                                            subItem.id,
                                          ) > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center text-[10px]">
                                              {getUpdateCount(
                                                "subitem",
                                                subItem.id,
                                              )}
                                            </span>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                {/* Add Sub Item button for this folder */}
                                {expandedFolders.has(folder.id) && (
                                  <div className="flex bg-blue-50 border-b border-blue-200">
                                    <div className="w-12 px-2 py-1 border-r border-blue-200"></div>
                                    <div
                                      className="px-4 py-1 border-r border-blue-200"
                                      style={{ width: getColumnWidth("item") }}
                                    >
                                      <button
                                        onClick={() =>
                                          handleAddSubItem(item.id, folder.id)
                                        }
                                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2 border border-blue-300 px-2 py-1 rounded"
                                      >
                                        <Plus className="w-3 h-3" />
                                        Add Sub Item
                                      </button>
                                    </div>

                                    {/* Dynamic Sub-item Column Spaces */}
                                    {subItemColumns.map((column) => (
                                      <div
                                        key={column.id}
                                        className="px-3 py-1 border-r border-blue-200"
                                        style={{ width: getColumnWidth(column.type) }}
                                      />
                                    ))}
                                    {/* Updates column space */}
                                    <div className="w-12 px-2 py-1"></div>
                                  </div>
                                )}
                              </React.Fragment>
                            ))}

                            {/* Add Folder buttons */}
                            <div className="flex bg-blue-50 border-b border-blue-200">
                              <div className="w-12 px-2 py-2 border-r border-blue-200"></div>
                              <div
                                className="px-4 py-2 border-r border-blue-200 flex gap-2"
                                style={{ width: getColumnWidth("item") }}
                              >
                                <button
                                  onClick={() => handleAddFolder(item.id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2 border border-blue-300 px-3 py-1 rounded"
                                >
                                  <Folder className="w-3 h-3" />
                                  Add Folder
                                </button>
                              </div>
                              <div
                                className="px-4 py-2 border-r border-blue-200"
                                style={{ width: getColumnWidth("status") }}
                              />
                              <div
                                className="px-4 py-2 border-r border-blue-200"
                                style={{ width: getColumnWidth("assignedTo") }}
                              />
                              <div
                                className="px-4 py-2 border-r border-blue-200"
                                style={{ width: getColumnWidth("dueDate") }}
                              />
                              <div
                                className="px-4 py-2 border-r border-blue-200"
                                style={{ width: getColumnWidth("checkbox") }}
                              />
                              <div
                                className="px-4 py-2 border-r border-blue-200"
                                style={{ width: getColumnWidth("progress") }}
                              />
                              {/* Updates column space */}
                              <div className="w-12 px-2 py-2"></div>
                            </div>
                          </>
                        )}
                      </React.Fragment>
                    ))}

                    {/* Add Item Button */}
                    <div className="flex">
                      <div className="w-12 px-2 py-2 border-r border-gray-200"></div>
                      <div
                        className="px-4 py-2 border-r border-gray-200"
                        style={{ width: getColumnWidth("item") }}
                      >
                        <button
                          onClick={() => handleAddItem(group.name)}
                          className="text-gray-600 hover:text-blue-600 text-sm flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add item
                        </button>
                      </div>
                      {columns.slice(1).map((column) => (
                        <div
                          key={column.id}
                          className="px-4 py-2 border-r border-gray-200"
                          style={{ width: getColumnWidth(column.id) }}
                        />
                      ))}
                      {/* Updates column space */}
                      <div className="w-12 px-2 py-2"></div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-3">
            <span>{boardItems.length} items</span>
            <span>•</span>
            <span>{columns.length} columns</span>
            <span>•</span>
            <span>{boardGroups.length} groups</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Live</span>
          </div>
        </div>

        {/* Bulk Operations */}
        {selectedItems.size > 0 && (
          <div className="fixed bottom-4 left-4 right-4 bg-gray-900 text-white rounded-lg px-4 py-3 flex items-center justify-between shadow-lg z-50">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-xs font-medium">
                {selectedItems.size}
              </div>
              <span className="text-sm">
                {selectedItems.size} items selected
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  Array.from(selectedItems).forEach((id) =>
                    handleDeleteItem(id),
                  );
                  setSelectedItems(new Set());
                }}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Panel */}
      {sidePanelOpen && selectedMainItem && (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Project Updates</h3>
              <p className="text-xs text-gray-600">
                {selectedMainItem.values.item ||
                  `Project #${selectedMainItem.id}`}
              </p>
            </div>
            <button
              onClick={() => {
                setSidePanelOpen(false);
                setSelectedMainItem(null);
              }}
              className="text-gray-600 hover:text-gray-900 p-1"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              <div className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium">
                  JD
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="text-gray-900 font-medium">John Doe</span>{" "}
                    · 2 hours ago
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm">
                      Project kickoff meeting scheduled for tomorrow at 10 AM.
                      All stakeholders have been notified.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-xs text-white font-medium">
                  JS
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="text-gray-900 font-medium">
                      Jane Smith
                    </span>{" "}
                    · 1 day ago
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm">
                      Initial requirements document has been reviewed and
                      approved by the client.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-6">
              <div className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-xs text-white font-medium">
                  U
                </div>
                <div className="flex-1">
                  <textarea
                    placeholder="Add an update..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      Post Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Updates Modal */}
      {updatesModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Updates</h3>
                <p className="text-xs text-gray-600">
                  {updatesModal.itemType === "main"
                    ? "Project: "
                    : updatesModal.itemType === "folder"
                      ? "Folder: "
                      : "Sub-item: "}
                  {updatesModal.itemName}
                </p>
              </div>
              <button
                onClick={closeUpdatesModal}
                className="text-gray-600 hover:text-gray-900 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-auto">
              {/* Existing updates */}
              <div className="space-y-3 mb-4">
                {(() => {
                  const updateKey = `${updatesModal.itemType}-${updatesModal.itemId}`;
                  const updates = itemUpdates[updateKey] || [];

                  if (updates.length === 0) {
                    return (
                      <div className="text-center py-6 text-gray-500 text-sm">
                        No updates yet. Be the first to add one!
                      </div>
                    );
                  }

                  return updates.map((update) => (
                    <div key={update.id} className="flex space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium">
                        {update.author[0]}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-600 mb-1">
                          <span className="text-gray-900 font-medium">
                            {update.author}
                          </span>{" "}
                          · {update.timestamp.toLocaleString()}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm">{update.content}</p>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Add new update */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-xs text-white font-medium">
                    U
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newUpdate}
                      onChange={(e) => setNewUpdate(e.target.value)}
                      placeholder="Add an update..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2 space-x-2">
                      <button
                        onClick={closeUpdatesModal}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addUpdate}
                        disabled={!newUpdate.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Post Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MondayBoard;
