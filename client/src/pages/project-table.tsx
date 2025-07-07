import React, { useState, useCallback, useRef, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
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
  X,
  Heart,
  Paperclip,
  Smile,
  AtSign,
  MessageCircle,
  Save,
  Timer,
  Globe,
  Link,
  FolderPlus,
  MoreHorizontal,
  Edit,
  Copy,
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
    { id: "priority", name: "Priority", type: "dropdown", order: 4, options: ["Low", "Medium", "High", "Critical"] },
    { id: "assignedTo", name: "People", type: "people", order: 5 },
    { id: "dueDate", name: "Due Date", type: "date", order: 6 },
    { id: "checkbox", name: "Done", type: "checkbox", order: 7 },
    { id: "progress", name: "Progress", type: "progress", order: 8 },
  ]);

  // Sub-item columns configuration (separate from main columns)
  const [subItemColumns, setSubItemColumns] = useState([
    { id: "status", name: "Status", type: "status", order: 1 },
    { id: "priority", name: "Priority", type: "dropdown", order: 2, options: ["Low", "Medium", "High", "Critical"] },
    { id: "assignedTo", name: "People", type: "people", order: 3 },
    { id: "dueDate", name: "Due Date", type: "date", order: 4 },
    { id: "checkbox", name: "Done", type: "checkbox", order: 5 },
    { id: "progress", name: "Progress", type: "progress", order: 6 },
  ]);

  // Initial board data with folders
  // Initial board data with sample items for testing email functionality
  const [boardItems, setBoardItems] = useState<any[]>([
    {
      id: 1,
      values: {
        item: "Kitchen Renovation Project",
        status: "in progress",
        priority: "High",
        assignedTo: "John Smith, Sarah Wilson",
        dueDate: "2025-07-15",
        checkbox: false,
        progress: 65,
        email: "client1@example.com",
        phone: "(555) 123-4567",
        location: "123 Main St, Anytown USA",
        cost: 25000,
        hoursBudget: 120,
        hoursSpent: 78
      },
      // Legacy properties for backwards compatibility
      name: "Kitchen Renovation Project",
      status: { id: "in-progress", color: "#0066CC", label: "In Progress" },
      assignedTo: ["John Smith", "Sarah Wilson"],
      dueDate: "2025-07-15",
      email: "client1@example.com",
      phone: "(555) 123-4567",
      location: "123 Main St, Anytown USA",
      checkbox: false,
      progress: 65,
      group: "Active Projects",
      folders: [
        {
          id: 3001,
          name: "Design Phase",
          expanded: false,
          items: [
            {
              id: 30001,
              status: { id: "complete", color: "#00C875", label: "Complete" },
              assignedTo: ["Design Team"],
              dueDate: "2025-07-10",
              checkbox: true,
              progress: 100
            },
            {
              id: 30002,
              status: { id: "in-progress", color: "#0066CC", label: "In Progress" },
              assignedTo: ["Sarah Wilson"],
              dueDate: "2025-07-12",
              checkbox: false,
              progress: 80
            }
          ]
        },
        {
          id: 3002,
          name: "Installation Phase",
          expanded: false,
          items: [
            {
              id: 30003,
              status: { id: "not-started", color: "#C4C4C4", label: "Not Started" },
              assignedTo: ["Installation Team"],
              dueDate: "2025-07-20",
              checkbox: false,
              progress: 0
            }
          ]
        }
      ]
    },
    {
      id: 2,
      values: {
        item: "Bathroom Remodel",
        status: "not started",
        priority: "Medium",
        assignedTo: "Mike Johnson",
        dueDate: "2025-08-01",
        checkbox: false,
        progress: 0,
        email: "client2@example.com",
        phone: "(555) 987-6543",
        location: "456 Oak Ave, Somewhere City"
      },
      name: "Bathroom Remodel",
      status: { id: "not-started", color: "#C4C4C4", label: "Not Started" },
      assignedTo: ["Mike Johnson"],
      dueDate: "2025-08-01",
      email: "client2@example.com",
      phone: "(555) 987-6543",
      location: "456 Oak Ave, Somewhere City",
      checkbox: false,
      progress: 0,
      group: "Scheduled Work",
      folders: [
        {
          id: 3003,
          name: "Planning Phase",
          expanded: false,
          items: [
            {
              id: 30004,
              status: { id: "not-started", color: "#C4C4C4", label: "Not Started" },
              assignedTo: ["Planning Team"],
              dueDate: "2025-07-25",
              checkbox: false,
              progress: 0
            }
          ]
        }
      ]
    },
    {
      id: 3,
      name: "Window Installation",
      status: { id: "complete", color: "#00C875", label: "Complete" },
      assignedTo: ["Alex Brown"],
      dueDate: "2025-06-30",
      email: "client3@example.com",
      phone: "(555) 456-7890",
      location: "789 Pine St, Demo Town",
      checkbox: true,
      progress: 100,
      group: "Completed",
      folders: [
        {
          id: 3004,
          name: "Installation Complete",
          expanded: false,
          items: [
            {
              id: 30005,
              status: { id: "complete", color: "#00C875", label: "Complete" },
              assignedTo: ["Alex Brown"],
              dueDate: "2025-06-30",
              checkbox: true,
              progress: 100
            }
          ]
        }
      ]
    }
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
  const [expandedSubItems, setExpandedSubItems] = useState(new Set());
  const [expandedFolders, setExpandedFolders] = useState(new Set());
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
  const [activeTab, setActiveTab] = useState("updates");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  // Formula editor state
  const [formulaEditor, setFormulaEditor] = useState({
    isOpen: false,
    columnId: null,
    currentFormula: "",
    aiSuggestions: []
  });

  // Column creation modal state
  const [columnCreationModal, setColumnCreationModal] = useState({
    isOpen: false,
    type: null,
    name: "",
    description: "",
    callback: null,
    isSubItem: false
  });

  // Column rename modal state
  const [columnRenameModal, setColumnRenameModal] = useState({
    isOpen: false,
    columnId: null,
    currentName: "",
    callback: null
  });

  // Generic modal states for prompts and confirms
  const [promptModal, setPromptModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    placeholder: "",
    defaultValue: "",
    callback: null
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    callback: null
  });

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  // AI Formula Assistant state
  const [formulaAssistant, setFormulaAssistant] = useState({
    isOpen: false,
    columnId: null,
    currentFormula: "",
    chatHistory: [],
    userInput: "",
    isProcessing: false
  });

  // Separate state for AI input and formula builder
  const [aiInput, setAiInput] = useState("");

  // Debug: Monitor column changes
  useEffect(() => {
    const formulaColumns = columns.filter(col => col.type === 'formula');
    console.log("Formula columns:", formulaColumns);
  }, [columns]);

  // Toast helper function
  const showToast = (message, type = "info") => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  // AI Formula Assistant functions
  const openFormulaAssistant = (columnId, currentFormula = "") => {
    const column = columns.find(col => col.id === columnId);
    setFormulaAssistant({
      isOpen: true,
      columnId,
      currentFormula,
      chatHistory: [
        {
          type: "system",
          message: `Hello! I'm your AI Formula Assistant. I'll help you create a formula for the "${column?.name}" column. You can ask me in natural language like "Calculate the total cost" or "Find the percentage completion". Available columns: ${columns.map(col => col.name).join(", ")}`
        }
      ],
      userInput: "",
      isProcessing: false
    });
  };

  const closeFormulaAssistant = () => {
    setFormulaAssistant({
      isOpen: false,
      columnId: null,
      currentFormula: "",
      chatHistory: [],
      userInput: "",
      isProcessing: false
    });
  };



  const sendMessageToAI = async (message) => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    
    setFormulaAssistant(prev => ({
      ...prev,
      isProcessing: true,
      userInput: "",
      chatHistory: [...prev.chatHistory, { type: "user", message: userMessage }]
    }));

    try {
      const response = await apiRequest('POST', '/api/ai/generate-formula', {
        message,
        availableColumns: columns.map(col => ({ id: col.id, name: col.name, type: col.type })),
        currentFormula: formulaAssistant.currentFormula
      });

      const data = await response.json();
      setFormulaAssistant(prev => ({
        ...prev,
        isProcessing: false,
        chatHistory: [...prev.chatHistory, { 
          type: "assistant", 
          message: data.explanation,
          formula: data.formula
        }]
      }));
    } catch (error) {
      setFormulaAssistant(prev => ({
        ...prev,
        isProcessing: false,
        chatHistory: [...prev.chatHistory, { 
          type: "assistant", 
          message: "I apologize, but I'm having trouble processing your request right now. Please try rephrasing your question or check that the OpenAI API is properly configured."
        }]
      }));
    }
  };

  const applyAIFormula = (formula) => {
    if (!formulaAssistant.columnId || !formula) {
      console.log("Cannot apply formula:", { columnId: formulaAssistant.columnId, formula });
      showToast("Error: No column selected or formula is empty", "error");
      return;
    }

    console.log("Applying formula:", { 
      columnId: formulaAssistant.columnId, 
      formula: formula,
      columns: columns 
    });

    // Update the column with the formula
    setColumns(prev => {
      const updated = prev.map(col => 
        col.id === formulaAssistant.columnId 
          ? { ...col, formula: formula.trim() }
          : col
      );
      console.log("Updated columns:", updated);
      return updated;
    });

    showToast("Formula saved successfully!", "success");
  };

  // Formula evaluation engine
  const evaluateFormula = (formula, item) => {
    if (!formula) return null;
    
    try {
      // Replace column names with actual values
      let expression = formula;
      
      // Get available column names and values
      const columnNames = columns.map(col => col.id);
      
      // Replace column references with actual values
      columnNames.forEach(columnId => {
        const columnValue = item.values[columnId];
        let numericValue = 0;
        
        // Convert different value types to numbers
        if (columnValue !== undefined && columnValue !== null && columnValue !== "") {
          if (typeof columnValue === 'number') {
            numericValue = columnValue;
          } else if (typeof columnValue === 'string') {
            const parsed = parseFloat(columnValue);
            numericValue = isNaN(parsed) ? 0 : parsed;
          } else if (typeof columnValue === 'boolean') {
            numericValue = columnValue ? 1 : 0;
          }
        }
        
        // Replace column references in the formula
        const regex = new RegExp(`\\b${columnId}\\b`, 'g');
        expression = expression.replace(regex, numericValue.toString());
      });
      
      // Basic safety check - only allow numbers, operators, and parentheses
      if (!/^[0-9+\-*/.() ]+$/.test(expression)) {
        return "Invalid formula";
      }
      
      // Evaluate the expression
      const result = Function('"use strict"; return (' + expression + ')')();
      
      // Round to 2 decimal places if it's a decimal
      if (typeof result === 'number') {
        return Math.round(result * 100) / 100;
      }
      
      return result;
    } catch (error) {
      return "Error";
    }
  };

  // AI Formula Assistant
  const generateFormulaWithAI = async (description) => {
    try {
      const availableColumns = columns
        .filter(col => col.type === 'number' || col.type === 'progress')
        .map(col => `${col.id} (${col.name})`)
        .join(', ');

      const response = await fetch('/api/generate-formula', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          availableColumns,
          columnList: columns.map(col => ({ id: col.id, name: col.name, type: col.type }))
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.formula;
      } else {
        throw new Error('Failed to generate formula');
      }
    } catch (error) {
      console.error('AI Formula generation error:', error);
      return null;
    }
  };

  const [isEmailSending, setIsEmailSending] = useState(false);

  // Column menu state
  const [columnMenuOpen, setColumnMenuOpen] = useState(null);
  const [addColumnMenuOpen, setAddColumnMenuOpen] = useState(null);
  
  // Enhanced dropdown state
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [editingDropdownColumn, setEditingDropdownColumn] = useState(null);

  // Settings functionality state
  const [columnFilters, setColumnFilters] = useState({});
  const [columnSortOrder, setColumnSortOrder] = useState({});
  const [collapsedColumns, setCollapsedColumns] = useState(new Set());
  const [showColumnSummary, setShowColumnSummary] = useState(new Set());
  const [isRenamingColumn, setIsRenamingColumn] = useState(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnType, setNewColumnType] = useState("text");
  const [openMenus, setOpenMenus] = useState({});

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
      if (openDropdown && !event.target.closest(".relative")) {
        setOpenDropdown(null);
        setDropdownSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [columnMenuOpen, addColumnMenuOpen, openDropdown]);

  // Handle column type selection from AddColumnMenu
  const handleSelectColumnType = (type) => {
    const columnTypeInfo = {
      text: { name: "Text Column", description: "Simple text field for notes and descriptions" },
      status: { name: "Status Column", description: "Status with colored labels" },
      dropdown: { name: "Dropdown Column", description: "Select from predefined options" },
      people: { name: "People Column", description: "Assign team members" },
      date: { name: "Date Column", description: "Date picker for deadlines and schedules" },
      number: { name: "Number Column", description: "Numeric values for costs, quantities, etc." },
      checkbox: { name: "Checkbox Column", description: "True/false toggle for completion" },
      progress: { name: "Progress Column", description: "Progress bar for tracking completion" },
      formula: { name: "Formula Column", description: "Calculate values from other columns" },
      email: { name: "Email Column", description: "Email addresses for contacts" },
      phone: { name: "Phone Column", description: "Phone numbers for communication" },
      location: { name: "Location Column", description: "Addresses and locations" }
    };

    const info = columnTypeInfo[type] || { name: "New Column", description: "Custom column" };
    
    // For formula columns, directly create and open AI Formula Assistant
    if (type === "formula") {
      const newColumn = {
        id: `col_${Date.now()}`,
        name: "Formula Column",
        type: "formula",
        order: Math.max(...columns.map(col => col.order)) + 1,
        formula: "" // Make sure this property exists
      };
      
      console.log("Creating formula column:", newColumn);
      
      setColumns(prev => {
        const updated = [...prev, newColumn];
        console.log("Columns after adding formula column:", updated);
        return updated;
      });
      
      setAddColumnMenuOpen(null);
      
      // Open AI Formula Assistant for the new column
      setTimeout(() => {
        openFormulaAssistant(newColumn.id, "");
      }, 100);
      return;
    }
    
    setColumnCreationModal({
      isOpen: true,
      type: type,
      name: info.name,
      description: info.description,
      callback: (name, formula = null) => {
        if (type === "formula" && formula) {
          handleAddColumn(type, name, formula);
        } else {
          handleAddColumn(type, name);
        }
        setAddColumnMenuOpen(null);
      },
      isSubItem: false
    });
  };

  // Handle sub-item column type selection from AddColumnMenu
  const handleSelectSubItemColumnType = (type) => {
    const columnTypeInfo = {
      text: { name: "Text Column", description: "Simple text field for notes and descriptions" },
      status: { name: "Status Column", description: "Status with colored labels" },
      dropdown: { name: "Dropdown Column", description: "Select from predefined options" },
      people: { name: "People Column", description: "Assign team members" },
      date: { name: "Date Column", description: "Date picker for deadlines and schedules" },
      number: { name: "Number Column", description: "Numeric values for costs, quantities, etc." },
      checkbox: { name: "Checkbox Column", description: "True/false toggle for completion" },
      progress: { name: "Progress Column", description: "Progress bar for tracking completion" }
    };

    const info = columnTypeInfo[type] || { name: "New Column", description: "Custom column" };
    
    setColumnCreationModal({
      isOpen: true,
      type: type,
      name: info.name,
      description: info.description,
      callback: (name) => {
        handleAddSubItemColumn(type, name);
        setAddColumnMenuOpen(null);
      },
      isSubItem: true
    });
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
      case "dropdown":
        return <ChevronDown className="w-3 h-3 text-blue-400" />;
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

    // Force component re-render to recalculate formulas
    setTimeout(() => {
      setBoardItems((prev) => [...prev]);
    }, 50);
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
      values: {}
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
    if (!newName || newName.trim() === "") {
      showToast("Column name cannot be empty", "error");
      return;
    }

    // Update the column name in the columns array
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, name: newName.trim() } : col
    ));
    
    showToast(`Column renamed to "${newName.trim()}"`, "success");
    
    // Reset the rename state
    setIsRenamingColumn(null);
    setNewColumnName("");
  };

  const handleDeleteColumn = (columnId) => {
    console.log('Deleting column:', columnId);
    
    // Check if this is a sub-item column (contains folder info)
    if (columnId.includes('folder-')) {
      // Extract the actual column ID from the folder-specific ID
      // Format: "folder-{folderId}-{columnId}"
      const parts = columnId.split('-');
      const actualColumnId = parts.slice(2).join('-'); // Everything after "folder-{folderId}-"
      console.log('Deleting sub-item column. Full ID:', columnId, 'Actual column ID:', actualColumnId);
      
      setConfirmModal({
        isOpen: true,
        title: "Delete Sub-Item Column",
        message: "Are you sure you want to delete this sub-item column?",
        callback: (confirmed) => {
          if (confirmed) {
            setSubItemColumns(prev => {
              const filtered = prev.filter(col => col.id !== actualColumnId);
              console.log('Previous sub-item columns:', prev);
              console.log('Filtered sub-item columns:', filtered);
              return filtered;
            });
          }
        }
      });
      return;
    }
    
    // Handle main columns
    setConfirmModal({
      isOpen: true,
      title: "Delete Column",
      message: "Are you sure you want to delete this column?",
      callback: (confirmed) => {
        if (confirmed) {
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
      }
    });
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

  const handleAddColumn = (type, name = "New Column", formula = null) => {
    const newColumn = {
      id: `col_${Date.now()}`,
      name: name,
      type: type,
      order: Math.max(...columns.map(col => col.order)) + 1,
      formula: formula
    };

    // Add default options for dropdown columns
    if (type === "dropdown") {
      newColumn.options = ["Option 1", "Option 2", "Option 3"];
    }

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

    // Add default options for dropdown columns
    if (type === "dropdown") {
      newColumn.options = ["Option 1", "Option 2", "Option 3"];
    }

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
                    ? { 
                        ...subItem, 
                        [field]: value,
                        values: {
                          ...subItem.values,
                          [field]: value
                        }
                      }
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
    console.log('Deleting sub-item:', { projectId, subItemId });
    
    setBoardItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id === projectId) {
          const updatedItem = {
            ...item,
            folders: (item.folders || []).map((folder) => ({
              ...folder,
              subItems: (folder.subItems || []).filter(
                (subItem) => subItem.id !== subItemId,
              ),
            })),
          };
          console.log('Updated item after deletion:', updatedItem);
          return updatedItem;
        }
        return item;
      });
      console.log('Updated board items:', updated);
      return updated;
    });
  };

  const handleDeleteItem = (itemId) => {
    setBoardItems((prev) => prev.filter((item) => item.id !== itemId));
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  const handleDeleteMainItem = (itemId) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Item",
      message: "Are you sure you want to delete this item? This action cannot be undone.",
      callback: (confirmed) => {
        if (confirmed) {
          setBoardItems((prev) => prev.filter((item) => item.id !== itemId));
          setSelectedItems((prev) => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        }
      }
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
    setActiveTab("updates"); // Reset to updates tab when opening
    setEmailSubject(""); // Clear email form
    setEmailMessage("");
  };

  // Email sending functionality
  const sendEmail = async () => {
    const currentItem = boardItems.find(item => item.id === updatesModal.itemId);
    if (!currentItem?.email || !emailSubject.trim() || !emailMessage.trim()) {
      showToast("Please fill in all email fields", "error");
      return;
    }

    setIsEmailSending(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: currentItem.email,
          subject: emailSubject,
          message: emailMessage,
          projectName: updatesModal.itemName,
          itemType: updatesModal.itemType
        }),
      });

      if (response.ok) {
        // Add email to updates log
        const updateKey = `${updatesModal.itemType}-${updatesModal.itemId}`;
        setItemUpdates(prev => ({
          ...prev,
          [updateKey]: [
            ...(prev[updateKey] || []),
            {
              id: Date.now(),
              content: `📧 Email sent: "${emailSubject}"`,
              author: "System",
              timestamp: new Date(),
              type: "email"
            }
          ]
        }));

        setEmailSubject("");
        setEmailMessage("");
        setActiveTab("updates"); // Switch back to updates tab
        showToast("Email sent successfully!", "success");
      } else {
        const error = await response.json();
        showToast(`Failed to send email: ${error.message}`, "error");
      }
    } catch (error) {
      console.error('Email sending error:', error);
      showToast("Failed to send email. Please check your connection and try again.", "error");
    } finally {
      setIsEmailSending(false);
    }
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
      { type: "dropdown", name: "Dropdown", icon: "📋", description: "Select from predefined options" },
      { type: "people", name: "People", icon: "👤", description: "Assign team members" },
      { type: "date", name: "Date", icon: "📅", description: "Date picker" },
      { type: "number", name: "Number", icon: "🔢", description: "Numeric values" },
      { type: "checkbox", name: "Checkbox", icon: "☑️", description: "True/false toggle" },
      { type: "progress", name: "Progress", icon: "📊", description: "Progress bar" },
      { type: "formula", name: "Formula", icon: "🧮", description: "Calculate values from other columns" },
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

  const SubItemMenu = ({ subItemId, projectId, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="absolute top-full right-0 mt-1 w-48 bg-gray-800 text-white rounded-lg shadow-xl border border-gray-700 z-50">
        <div className="py-2">
          <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Sub-item Options
            </div>
          </div>

          <div 
            onClick={() => {
              setPromptModal({
                isOpen: true,
                title: "Rename Sub-Item",
                message: "Enter a new name for this sub-item",
                placeholder: "Enter new name...",
                defaultValue: "",
                callback: (newName) => {
                  if (newName !== null && newName.trim()) {
                    // Update sub-item name logic would go here
                    showToast("Sub-item renamed successfully!", "success");
                  }
                }
              });
              onClose();
            }}
            className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Rename
          </div>

          <div 
            onClick={() => {
              showToast("Duplicate functionality coming soon!", "info");
              onClose();
            }}
            className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </div>

          <div className="border-t border-gray-700 my-1"></div>

          <div 
            onClick={() => {
              handleDeleteSubItem(projectId, subItemId);
              onClose();
            }}
            className="px-4 py-2 text-sm text-red-400 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Sub-item
          </div>
        </div>
      </div>
    );
  };

  const ColumnMenu = ({ columnId, columnName, isOpen, onClose, isSubItem = false, menuKey = null }) => {
    if (!isOpen) return null;

    // Check if this is a formula column
    const column = columns.find(col => col.id === columnId);
    const isFormulaColumn = column?.type === 'formula';

    return (
      <div className="absolute top-full right-0 mt-1 w-64 bg-gray-800 text-white rounded-lg shadow-xl border border-gray-700 z-50">
        <div className="py-2">
          <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </div>
          </div>

          {isFormulaColumn && (
            <div 
              onClick={() => {
                openFormulaAssistant(columnId, column?.formula || '');
                onClose();
              }}
              className="px-4 py-2 text-sm text-purple-400 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
            >
              <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded flex items-center justify-center text-xs">
                ✨
              </div>
              Formula Settings
            </div>
          )}

          <div 
            onClick={() => {
              openFormulaAssistant(columnId, column?.formula || '');
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
              setPromptModal({
                isOpen: true,
                title: "Filter Column",
                message: `Enter filter value for ${columnName}:`,
                placeholder: "Enter filter value...",
                defaultValue: "",
                callback: (filterValue) => {
                  if (filterValue !== null) {
                    handleFilterColumn(columnId, filterValue);
                  }
                }
              });
              onClose();
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
                // For main items, use the main- prefix to differentiate from sub-items
                setAddColumnMenuOpen(`main-${columnId}`);
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
              setPromptModal({
                isOpen: true,
                title: "Change Column Type",
                message: `Available types: ${columnTypes.join(", ")}`,
                placeholder: "Enter column type...",
                defaultValue: "",
                callback: (selectedType) => {
                  if (selectedType && columnTypes.includes(selectedType.toLowerCase())) {
                    setColumns(prev => prev.map(col => 
                      col.id === columnId ? { ...col, type: selectedType.toLowerCase() } : col
                    ));
                  }
                }
              });
              onClose();
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
              setColumnRenameModal({
                isOpen: true,
                columnId: columnId,
                currentName: columnName,
                callback: (colId, newName) => {
                  handleRenameColumn(colId, newName);
                  onClose();
                }
              });
            }}
            className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
          >
            <div className="w-4 h-4">✏️</div>
            Rename
          </div>

          <div 
            onClick={() => {
              // Use menuKey for sub-items, columnId for main items
              const deleteId = isSubItem && menuKey ? menuKey : columnId;
              handleDeleteColumn(deleteId);
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

  // Edit labels modal component
  const EditLabelsModal = () => {
    const [tempOptions, setTempOptions] = useState([]);
    const [newLabel, setNewLabel] = useState("");
    
    useEffect(() => {
      if (editingDropdownColumn) {
        const column = columns.find(col => col.id === editingDropdownColumn);
        setTempOptions(column?.options || []);
      }
    }, [editingDropdownColumn, columns]);

    const handleAddLabel = () => {
      if (newLabel.trim() && !tempOptions.includes(newLabel.trim())) {
        setTempOptions(prev => [...prev, newLabel.trim()]);
        setNewLabel("");
      }
    };

    const handleRemoveLabel = (indexToRemove) => {
      setTempOptions(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSave = () => {
      setColumns(prev => prev.map(col => 
        col.id === editingDropdownColumn 
          ? { ...col, options: tempOptions }
          : col
      ));
      setEditingDropdownColumn(null);
      showToast("Labels updated successfully!", "success");
    };

    if (!editingDropdownColumn) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
            <h3 className="text-lg font-semibold text-gray-900">Edit Labels</h3>
            <p className="text-sm text-gray-600">Manage dropdown options</p>
          </div>

          <div className="p-6 max-h-96 overflow-y-auto">
            {/* Add new label */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                  placeholder="Create or find labels"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddLabel}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Existing labels */}
            <div className="space-y-2">
              {tempOptions.map((option, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded ${
                      option === "Critical" ? "bg-red-500" :
                      option === "High" ? "bg-orange-500" :
                      option === "Medium" ? "bg-yellow-500" :
                      option === "Low" ? "bg-green-500" :
                      "bg-gray-400"
                    }`}></div>
                    <span className="text-sm text-gray-800">{option}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveLabel(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => setEditingDropdownColumn(null)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Save Changes
            </button>
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

      case "dropdown":
        const options = column.options || ["Option 1", "Option 2", "Option 3"];
        const dropdownId = `dropdown-${item.id}-${column.id}`;
        const isDropdownOpen = openDropdown === dropdownId;
        
        return (
          <div className="relative">
            <div
              onClick={() => setOpenDropdown(isDropdownOpen ? null : dropdownId)}
              className={`h-6 text-xs font-medium rounded px-2 border cursor-pointer flex items-center justify-between ${
                value === "Critical"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : value === "High"
                    ? "bg-orange-100 text-orange-700 border-orange-200"
                    : value === "Medium"
                      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                      : value === "Low"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
              }`}
            >
              <span className="truncate">{value || "Select..."}</span>
              <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
            </div>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200">
                <div className="p-3">
                  <input
                    type="text"
                    placeholder="Create or find labels"
                    value={dropdownSearch}
                    onChange={(e) => setDropdownSearch(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                
                <div className="max-h-48 overflow-y-auto">
                  {/* Filtered options */}
                  {options
                    .filter(option => 
                      option.toLowerCase().includes(dropdownSearch.toLowerCase())
                    )
                    .map((option, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          handleCellUpdate(item.id, column.id, option);
                          setOpenDropdown(null);
                          setDropdownSearch("");
                        }}
                        className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                      >
                        <div className={`w-3 h-3 rounded ${
                          option === "Critical" ? "bg-red-500" :
                          option === "High" ? "bg-orange-500" :
                          option === "Medium" ? "bg-yellow-500" :
                          option === "Low" ? "bg-green-500" :
                          "bg-gray-400"
                        }`}></div>
                        {option}
                      </div>
                    ))}
                  
                  {/* Create new option if search doesn't match existing */}
                  {dropdownSearch && 
                   !options.some(option => 
                     option.toLowerCase() === dropdownSearch.toLowerCase()
                   ) && (
                    <div
                      onClick={() => {
                        const newOptions = [...options, dropdownSearch];
                        setColumns(prev => prev.map(col => 
                          col.id === column.id 
                            ? { ...col, options: newOptions }
                            : col
                        ));
                        handleCellUpdate(item.id, column.id, dropdownSearch);
                        setOpenDropdown(null);
                        setDropdownSearch("");
                      }}
                      className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer text-blue-600 border-t border-gray-100"
                    >
                      + Create "{dropdownSearch}"
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-100 p-2">
                  <button
                    onClick={() => {
                      setEditingDropdownColumn(column.id);
                      setOpenDropdown(null);
                    }}
                    className="w-full text-sm text-gray-600 hover:text-gray-800 py-2 hover:bg-gray-50 rounded"
                  >
                    Edit labels
                  </button>
                </div>
              </div>
            )}
          </div>
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

      case "number":
        const isEditingNumber =
          editingCell?.projectId === item.id &&
          editingCell?.field === column.id;

        if (isEditingNumber) {
          return (
            <input
              type="number"
              value={value}
              onChange={(e) =>
                handleCellUpdate(item.id, column.id, parseFloat(e.target.value) || 0)
              }
              className="h-6 text-xs border-none bg-transparent text-gray-700 outline-none w-full"
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
            className="h-6 text-xs cursor-text hover:bg-gray-50 flex items-center px-2 rounded text-right"
            onClick={() =>
              setEditingCell({ projectId: item.id, field: column.id })
            }
          >
            {typeof value === 'number' ? value.toLocaleString() : value || "0"}
          </div>
        );

      case "formula":
        // Simple formula display and calculation
        const hasFormula = column.formula && column.formula.trim() !== "";
        let displayValue = "Click to add formula";
        
        if (hasFormula) {
          try {
            // Enhanced formula evaluation with proper column references
            let expression = column.formula;
            
            // Replace column references like {Numbers} with actual values
            const columnMatches = expression.match(/\{([^}]+)\}/g);
            if (columnMatches) {
              columnMatches.forEach(match => {
                const columnName = match.slice(1, -1); // Remove { and }
                let columnValue = 0;
                
                // Find the column in the columns array to get the correct ID
                const targetColumn = columns.find(col => col.name === columnName);
                if (targetColumn) {
                  columnValue = parseFloat(item.values?.[targetColumn.id]) || 0;
                }
                
                expression = expression.replace(match, columnValue);
              });
              
              // Evaluate the mathematical expression
              if (/^[0-9+\-*/.() ]+$/.test(expression)) {
                displayValue = Function('"use strict"; return (' + expression + ')')();
                // Round to 2 decimal places if needed
                if (typeof displayValue === 'number') {
                  displayValue = Math.round(displayValue * 100) / 100;
                }
              } else {
                displayValue = "Invalid formula";
              }
            } else {
              displayValue = column.formula; // Show the formula itself if no column references
            }
          } catch (error) {
            console.error('Formula Error:', error);
            displayValue = "Error";
          }
        }

        return (
          <div 
            className="h-6 text-xs flex items-center justify-between px-2 text-purple-700 bg-purple-50 rounded font-medium group hover:bg-purple-100 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              openFormulaAssistant(column.id, column.formula || "");
            }}
          >
            <span className={hasFormula ? "text-purple-800" : "text-gray-500"}>
              {displayValue}
            </span>
            <span className="opacity-0 group-hover:opacity-100 text-purple-600 transition-all">
              🧮
            </span>
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

  // AI Formula Assistant Component - Enhanced Interactive Version
  const AIFormulaAssistant = () => {
    const [localInput, setLocalInput] = React.useState("");
    const [localAiInput, setLocalAiInput] = React.useState("");

    React.useEffect(() => {
      if (formulaAssistant.isOpen) {
        setLocalInput("");
      }
    }, [formulaAssistant.isOpen]);

    if (!formulaAssistant.isOpen) return null;

    const currentColumn = columns.find(col => col.id === formulaAssistant.columnId);
    const availableColumns = columns.filter(col => col.type === 'number' || col.type === 'progress');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">AI Formula Assistant</h2>
                  <p className="text-purple-100 text-sm">
                    Creating formula for "{currentColumn?.name || 'Formula'}" column
                  </p>
                </div>
              </div>
              <button
                onClick={closeFormulaAssistant}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex" style={{ height: '500px' }}>
            {/* Chat Messages */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {formulaAssistant.chatHistory.map((message, index) => (
                  <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : message.type === 'system'
                        ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 border border-purple-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                      {message.formula && (
                        <div className="mt-2 p-2 bg-gray-800 rounded text-green-400 font-mono text-xs">
                          {message.formula}
                          <button
                            onClick={() => setLocalInput(message.formula)}
                            className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Copy to Builder
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {formulaAssistant.isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Input Area */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={localAiInput}
                    onChange={(e) => setLocalAiInput(e.target.value)}
                    placeholder="E.g., 'calculate profit margin' or 'sum all costs'"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !formulaAssistant.isProcessing && localAiInput.trim()) {
                        e.preventDefault();
                        sendMessageToAI(localAiInput);
                        setLocalAiInput("");
                      }
                    }}
                    disabled={formulaAssistant.isProcessing}
                    autoComplete="off"
                  />
                  <button
                    onClick={() => {
                      if (localAiInput.trim() && !formulaAssistant.isProcessing) {
                        sendMessageToAI(localAiInput);
                        setLocalAiInput("");
                      }
                    }}
                    disabled={formulaAssistant.isProcessing || !localAiInput.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {formulaAssistant.isProcessing ? 'Thinking...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>

            {/* Formula Builder Sidebar */}
            <div className="w-80 bg-green-50 dark:bg-green-900/20 border-l border-green-200 dark:border-green-700 flex flex-col">
              <div className="p-4 border-b border-green-200 dark:border-green-700">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Formula Builder</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Build and save your formula for "{formulaAssistant.columnId ? columns.find(c => c.id === formulaAssistant.columnId)?.name : 'this column'}"
                </p>
              </div>
              
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Formula Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formula</label>
                  <textarea
                    value={localInput}
                    onChange={(e) => setLocalInput(e.target.value)}
                    placeholder="Enter your formula here..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                    rows={3}
                  />
                </div>

                {/* Quick Formula Templates */}
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Templates</h4>
                  <div className="space-y-2">
                    {columns.filter(col => col.type === 'number' || col.type === 'progress' || col.id === 'progress').length > 0 && (
                      <>
                        <button
                          onClick={() => setLocalInput("SUM(" + columns.filter(col => col.type === 'number' || col.type === 'progress' || col.id === 'progress').map(col => col.id).join(', ') + ")")}
                          className="w-full text-left text-sm px-3 py-2 bg-white dark:bg-gray-800 rounded border hover:bg-green-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          📊 Sum All Numbers
                        </button>
                        <button
                          onClick={() => setLocalInput("AVG(" + columns.filter(col => col.type === 'number' || col.type === 'progress' || col.id === 'progress').map(col => col.id).join(', ') + ")")}
                          className="w-full text-left text-sm px-3 py-2 bg-white dark:bg-gray-800 rounded border hover:bg-green-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          📈 Average
                        </button>
                        <button
                          onClick={() => setLocalInput("MAX(" + columns.filter(col => col.type === 'number' || col.type === 'progress' || col.id === 'progress').map(col => col.id).join(', ') + ")")}
                          className="w-full text-left text-sm px-3 py-2 bg-white dark:bg-gray-800 rounded border hover:bg-green-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          ⭐ Maximum Value
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Available Columns */}
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Available Columns</h4>
                  <p className="text-xs text-gray-500 mb-2">Click to add to formula</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {columns.filter(col => col.type === 'number' || col.type === 'progress' || col.id === 'progress').map(col => (
                      <button
                        key={col.id}
                        onClick={() => {
                          const currentInput = localInput;
                          const newInput = currentInput ? `${currentInput} + {${col.name}}` : `{${col.name}}`;
                          setLocalInput(newInput);
                        }}
                        className="w-full text-left text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded border hover:bg-green-50 hover:border-green-300 transition-colors cursor-pointer"
                      >
                        <span className="text-green-600 dark:text-green-400">{"{" + col.name + "}"}</span>
                      </button>
                    ))}
                    {columns.filter(col => col.type === 'number' || col.type === 'progress' || col.id === 'progress').length === 0 && (
                      <div className="text-xs text-gray-500 italic">
                        No numeric columns available yet. Add Number or Progress columns first.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Operators */}
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Operators</h4>
                  <div className="grid grid-cols-4 gap-1">
                    {['+', '-', '*', '/', '(', ')', '%', '='].map(op => (
                      <button
                        key={op}
                        onClick={() => {
                          const currentInput = localInput;
                          setLocalInput(currentInput + (currentInput && !currentInput.endsWith(' ') ? ' ' : '') + op + ' ');
                        }}
                        className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-mono"
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-green-200 dark:border-green-700">
                  <button
                    onClick={() => {
                      const formulaToSave = localInput.trim();
                      if (formulaToSave && formulaAssistant.columnId) {
                        // Directly update the columns - simple approach
                        setColumns(prevColumns => 
                          prevColumns.map(col => 
                            col.id === formulaAssistant.columnId 
                              ? { ...col, formula: formulaToSave }
                              : col
                          )
                        );
                        
                        showToast("Formula saved successfully!", "success");
                        closeFormulaAssistant();
                      } else {
                        showToast("Please enter a formula", "error");
                      }
                    }}
                    disabled={!localInput.trim()}
                    className="w-full px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg transition-all"
                  >
                    Save Formula
                  </button>
                  
                  {/* Simple helper text */}
                  <div className="mt-2 text-xs text-gray-500">
                    Example: {"{Numbers}"} * 2 (multiplies Numbers column by 2)
                  </div>
                </div>

                {/* Help Tips */}
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">💡 Tips</h4>
                  <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                    <li>• Copy formulas from AI suggestions</li>
                    <li>• Use column IDs in your formulas</li>
                    <li>• Test with different operators</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Formula Editor Component
  const FormulaEditor = () => {
    const [formula, setFormula] = useState(formulaEditor.currentFormula);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [previewResult, setPreviewResult] = useState('');

    const availableColumns = columns.filter(col => col.type === 'number' || col.type === 'progress');

    // Calculate preview result in real-time
    useEffect(() => {
      if (formula && formula.trim()) {
        const sampleItem = projects[0] || {};
        const result = evaluateFormula(formula, sampleItem);
        setPreviewResult(result);
      } else {
        setPreviewResult('');
      }
    }, [formula]);

    const handleAIGeneration = async () => {
      if (!aiPrompt.trim()) return;
      
      setIsGenerating(true);
      try {
        const generatedFormula = await generateFormulaWithAI(aiPrompt);
        if (generatedFormula) {
          setFormula(generatedFormula);
          setSuggestions(prev => [generatedFormula, ...prev.slice(0, 4)]);
        }
      } catch (error) {
        console.error('AI generation failed:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    const handleSave = () => {
      // Find the column and update its formula
      const currentColumn = columns.find(col => col.id === formulaEditor.columnId);
      if (currentColumn) {
        setColumns(prev => prev.map(col => 
          col.id === formulaEditor.columnId 
            ? { ...col, formula: formula }
            : col
        ));
      }
      
      setFormulaEditor({ isOpen: false, columnId: null, currentFormula: "", aiSuggestions: [] });
    };

    const insertColumnReference = (columnId) => {
      setFormula(prev => prev + columnId);
    };

    if (!formulaEditor.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  ✨
                </div>
                <div>
                  <h2 className="text-xl font-bold">Formula Editor</h2>
                  <p className="text-purple-100 text-sm">Build powerful calculations with AI assistance</p>
                </div>
              </div>
              <button 
                onClick={() => setFormulaEditor({ isOpen: false, columnId: null, currentFormula: "", aiSuggestions: [] })}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* AI Assistant Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center text-white text-xs">
                  🤖
                </div>
                <h3 className="font-semibold text-gray-800">AI Formula Assistant</h3>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what you want to calculate... (e.g., 'remaining budget after expenses')"
                  className="flex-1 px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAIGeneration()}
                />
                <button
                  onClick={handleAIGeneration}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      ✨ Generate
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Formula Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Formula</label>
                {previewResult && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Preview:</span>
                    <span className="font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {previewResult}
                    </span>
                  </div>
                )}
              </div>
              <textarea
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Enter your formula here..."
                className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-none"
              />
            </div>

            {/* Available Columns */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Available Columns</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableColumns.map(col => (
                  <button
                    key={col.id}
                    onClick={() => insertColumnReference(col.id)}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-left text-sm transition-colors flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="font-mono text-blue-600">{col.id}</span>
                    <span className="text-gray-500">({col.name})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Functions */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Quick Functions</h4>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {['+', '-', '*', '/', '(', ')', 'MAX', 'MIN', 'ABS', 'ROUND', 'SUM', 'AVG'].map(func => (
                  <button
                    key={func}
                    onClick={() => setFormula(prev => prev + func)}
                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-sm font-mono text-purple-700 transition-colors"
                  >
                    {func}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Recent AI Suggestions</h4>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setFormula(suggestion)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-200 rounded-lg text-left text-sm font-mono transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Use column IDs in your formulas (e.g., cost + hoursBudget * 2)
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFormulaEditor({ isOpen: false, columnId: null, currentFormula: "", aiSuggestions: [] })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Save Formula
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Column Creation Modal Component
  const ColumnCreationModal = () => {
    const [name, setName] = useState(columnCreationModal.name);
    const [formula, setFormula] = useState('');
    const [showFormulaEditor, setShowFormulaEditor] = useState(false);

    const handleSubmit = () => {
      if (!name.trim()) return;
      
      if (columnCreationModal.type === 'formula') {
        if (!formula.trim()) {
          setShowFormulaEditor(true);
          return;
        }
        columnCreationModal.callback(name, formula);
      } else {
        columnCreationModal.callback(name);
      }
      
      setColumnCreationModal({
        isOpen: false,
        type: null,
        name: "",
        description: "",
        callback: null,
        isSubItem: false
      });
    };

    const handleClose = () => {
      setColumnCreationModal({
        isOpen: false,
        type: null,
        name: "",
        description: "",
        callback: null,
        isSubItem: false
      });
    };

    if (!columnCreationModal.isOpen) return null;

    const getColumnIcon = (type) => {
      const icons = {
        text: "📝",
        status: "🟡",
        people: "👤",
        date: "📅",
        number: "🔢",
        checkbox: "☑️",
        progress: "📊",
        formula: "🧮",
        email: "📧",
        phone: "📞",
        location: "📍"
      };
      return icons[type] || "📝";
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg">
                  {getColumnIcon(columnCreationModal.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Create New Column
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {columnCreationModal.description}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Column Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Column Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter column name..."
                autoFocus
              />
            </div>

            {/* Formula Editor for Formula Type */}
            {columnCreationModal.type === 'formula' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Formula
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="e.g., progress * 100, cost / hours"
                  />
                  <button
                    onClick={() => setShowFormulaEditor(true)}
                    className="absolute right-3 top-3 px-3 py-1.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg text-xs hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                  >
                    Advanced
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use column IDs like 'progress', 'cost', 'hours' with math operators (+, -, *, /, %)
                </p>
              </div>
            )}

            {/* Column Type Badge */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                {columnCreationModal.type}
              </span>
              {columnCreationModal.isSubItem && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                  Sub-item
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Create Column
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Column Rename Modal Component
  const ColumnRenameModal = () => {
    const [name, setName] = useState(columnRenameModal.currentName);

    useEffect(() => {
      setName(columnRenameModal.currentName);
    }, [columnRenameModal.currentName]);

    const isDisabled = !name.trim() || name === columnRenameModal.currentName;

    const handleSubmit = () => {
      if (!name.trim() || name === columnRenameModal.currentName) {
        return;
      }
      
      // Call the callback with the new name
      if (columnRenameModal.callback) {
        columnRenameModal.callback(columnRenameModal.columnId, name.trim());
      }
      
      // Close the modal
      setColumnRenameModal({
        isOpen: false,
        columnId: null,
        currentName: "",
        callback: null
      });
    };

    const handleClose = () => {
      setColumnRenameModal({
        isOpen: false,
        columnId: null,
        currentName: "",
        callback: null
      });
    };

    if (!columnRenameModal.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg">
                  ✏️
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Rename Column
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Change the column name
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Column Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  } else if (e.key === 'Escape') {
                    handleClose();
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter new column name..."
                autoFocus
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isDisabled}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Generic Prompt Modal Component
  const PromptModal = () => {
    const [value, setValue] = useState(promptModal.defaultValue);

    useEffect(() => {
      setValue(promptModal.defaultValue);
    }, [promptModal.defaultValue]);

    const handleSubmit = () => {
      if (promptModal.callback) {
        promptModal.callback(value);
      }
      
      setPromptModal({
        isOpen: false,
        title: "",
        message: "",
        placeholder: "",
        defaultValue: "",
        callback: null
      });
    };

    const handleClose = () => {
      if (promptModal.callback) {
        promptModal.callback(null);
      }
      
      setPromptModal({
        isOpen: false,
        title: "",
        message: "",
        placeholder: "",
        defaultValue: "",
        callback: null
      });
    };

    if (!promptModal.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg">
                  💬
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {promptModal.title}
                  </h3>
                  {promptModal.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {promptModal.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  } else if (e.key === 'Escape') {
                    handleClose();
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={promptModal.placeholder}
                autoFocus
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Generic Confirm Modal Component
  const ConfirmModal = () => {
    const handleConfirm = () => {
      if (confirmModal.callback) {
        confirmModal.callback(true);
      }
      
      setConfirmModal({
        isOpen: false,
        title: "",
        message: "",
        callback: null
      });
    };

    const handleCancel = () => {
      if (confirmModal.callback) {
        confirmModal.callback(false);
      }
      
      setConfirmModal({
        isOpen: false,
        title: "",
        message: "",
        callback: null
      });
    };

    if (!confirmModal.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-lg">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {confirmModal.title}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300">
              {confirmModal.message}
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
                <button 
                  className="text-gray-600 hover:text-gray-900 p-1 rounded"
                  aria-label="Undo last action"
                  title="Undo last action"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleAddItem("New Leads")}
                className="text-gray-600 hover:text-gray-900 p-1 rounded"
                aria-label="Add new item"
                title="Add new item"
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
                    id="select-all-checkbox"
                    name="select-all"
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
                    aria-label="Select all items"
                    title="Select all items"
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
                      id={`group-checkbox-${group.name}`}
                      name={`group-${group.name}`}
                      className="w-4 h-4 rounded border-gray-400 text-blue-500"
                      aria-label={`Select all items in ${group.name} group`}
                      title={`Select all items in ${group.name} group`}
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
                  <div className="w-16 px-2 py-3 flex items-center justify-center">
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
                          <div className="w-16 px-2 py-3 flex items-center justify-center">
                            <div className="flex items-center gap-1">
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMainItem(item.id);
                                }}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete item"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
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
                                    className="px-4 py-2 border-r border-blue-200 flex items-center overflow-hidden"
                                    style={{ 
                                      width: getColumnWidth("item"),
                                      minWidth: getColumnWidth("item")
                                    }}
                                  >
                                    <div className="flex items-center gap-2 text-sm w-full overflow-hidden">
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
                                          className="bg-white text-blue-900 text-sm px-2 py-1 border border-blue-300 rounded w-32 max-w-full"
                                          autoFocus
                                          placeholder="Folder name"
                                        />
                                      ) : (
                                        <span
                                          className="text-blue-900 text-sm font-medium cursor-pointer hover:text-blue-700 truncate"
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
                                  {expandedFolders.has(folder.id) && subItemColumns.map((column) => (
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
                                      className="flex hover:bg-blue-50 bg-blue-25 border-b border-blue-200 group relative"
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
                                          className="px-3 py-2 border-r border-blue-200 relative overflow-visible"
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
                                              {column.type === 'dropdown' && (
                                                <div className="relative flex-1">
                                                  <div
                                                    className="w-full text-xs text-blue-600 bg-transparent border-none outline-none cursor-pointer px-2 py-1 rounded hover:bg-blue-50 min-h-[20px] flex items-center"
                                                    data-dropdown-trigger={`subitem-${subItem.id}-${column.id}`}
                                                    onClick={() => {
                                                      const dropdownKey = `subitem-${subItem.id}-${column.id}`;
                                                      setOpenDropdown(openDropdown === dropdownKey ? null : dropdownKey);
                                                      setDropdownSearch("");
                                                    }}
                                                  >
                                                    <span className="flex items-center gap-1">
                                                      <div className={`w-2 h-2 rounded ${
                                                        (subItem.values && subItem.values[column.id]) === "Critical" ? "bg-red-500" :
                                                        (subItem.values && subItem.values[column.id]) === "High" ? "bg-orange-500" :
                                                        (subItem.values && subItem.values[column.id]) === "Medium" ? "bg-yellow-500" :
                                                        (subItem.values && subItem.values[column.id]) === "Low" ? "bg-green-500" :
                                                        "bg-gray-300"
                                                      }`}></div>
                                                      {(subItem.values && subItem.values[column.id]) || "Select..."}
                                                    </span>
                                                  </div>
                                                  
                                                  {openDropdown === `subitem-${subItem.id}-${column.id}` && (
                                                    <div className="absolute top-full left-0 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] mt-1">
                                                      <div className="p-2 border-b border-gray-100">
                                                        <input
                                                          type="text"
                                                          value={dropdownSearch}
                                                          onChange={(e) => setDropdownSearch(e.target.value)}
                                                          placeholder="Create or find labels"
                                                          className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                      </div>
                                                      
                                                      <div className="max-h-32 overflow-y-auto">
                                                        {(column.options || [])
                                                          .filter(option => 
                                                            option.toLowerCase().includes(dropdownSearch.toLowerCase())
                                                          )
                                                          .map((option, index) => (
                                                            <div
                                                              key={index}
                                                              onClick={() => {
                                                                handleUpdateSubItem(item.id, subItem.id, column.id, option);
                                                                setOpenDropdown(null);
                                                                setDropdownSearch("");
                                                              }}
                                                              className="px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                                                            >
                                                              <div className={`w-2 h-2 rounded ${
                                                                option === "Critical" ? "bg-red-500" :
                                                                option === "High" ? "bg-orange-500" :
                                                                option === "Medium" ? "bg-yellow-500" :
                                                                option === "Low" ? "bg-green-500" :
                                                                "bg-gray-400"
                                                              }`}></div>
                                                              {option}
                                                            </div>
                                                          ))}
                                                        
                                                        {/* Create new option if search doesn't match existing */}
                                                        {dropdownSearch && 
                                                         !(column.options || []).some(option => 
                                                           option.toLowerCase() === dropdownSearch.toLowerCase()
                                                         ) && (
                                                          <div
                                                            onClick={() => {
                                                              const newOptions = [...(column.options || []), dropdownSearch];
                                                              setSubItemColumns(prev => prev.map(col => 
                                                                col.id === column.id 
                                                                  ? { ...col, options: newOptions }
                                                                  : col
                                                              ));
                                                              handleUpdateSubItem(item.id, subItem.id, column.id, dropdownSearch);
                                                              setOpenDropdown(null);
                                                              setDropdownSearch("");
                                                            }}
                                                            className="px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer text-blue-600 border-t border-gray-100"
                                                          >
                                                            + Create "{dropdownSearch}"
                                                          </div>
                                                        )}
                                                      </div>
                                                      
                                                      <div className="border-t border-gray-100 p-2">
                                                        <button
                                                          onClick={() => {
                                                            setEditingDropdownColumn(column.id);
                                                            setOpenDropdown(null);
                                                          }}
                                                          className="text-xs text-blue-600 hover:text-blue-800"
                                                        >
                                                          Edit labels
                                                        </button>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
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
                                              {column.type === 'progress' && (
                                                <div className="flex items-center gap-2 w-full group">
                                                  <div className="flex-1 bg-gray-200 rounded-full h-2 relative cursor-pointer">
                                                    <div 
                                                      className="bg-green-500 h-2 rounded-full transition-all duration-200"
                                                      style={{ width: '75%' }}
                                                    ></div>
                                                    <input
                                                      type="range"
                                                      min="0"
                                                      max="100"
                                                      defaultValue="75"
                                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                      onChange={(e) => {
                                                        const progressBar = e.target.previousElementSibling;
                                                        const percentageSpan = e.target.parentElement.nextElementSibling;
                                                        if (progressBar && percentageSpan) {
                                                          progressBar.style.width = `${e.target.value}%`;
                                                          percentageSpan.textContent = `${e.target.value}%`;
                                                        }
                                                      }}
                                                    />
                                                  </div>
                                                  <span className="text-xs text-blue-600 font-medium min-w-[30px]">75%</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}

                                      {/* Actions for sub-item */}
                                      <div className="w-12 px-2 py-2 flex items-center justify-center">
                                        <div className="flex items-center gap-1">
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
                                          <div className="relative">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenus(prev => ({
                                                  ...prev,
                                                  [`subitem-${subItem.id}`]: !prev[`subitem-${subItem.id}`]
                                                }));
                                              }}
                                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                                              title="Sub-item options"
                                            >
                                              <MoreHorizontal className="w-3 h-3" />
                                            </button>
                                            <SubItemMenu
                                              subItemId={subItem.id}
                                              projectId={item.id}
                                              isOpen={openMenus[`subitem-${subItem.id}`] || false}
                                              onClose={() => setOpenMenus(prev => ({ ...prev, [`subitem-${subItem.id}`]: false }))}
                                            />
                                          </div>
                                        </div>
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

      {/* Enhanced Communication Modal with Side Tabs */}
      {updatesModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
          onClick={closeUpdatesModal}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Customer Communication Hub
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {updatesModal.itemType === "main" && "📋 Project: "}
                      {updatesModal.itemType === "folder" && "📁 Folder: "}
                      {updatesModal.itemType === "subitem" && "📌 Sub-item: "}
                      <span className="font-medium">{updatesModal.itemName}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeUpdatesModal}
                  className="w-8 h-8 rounded-full bg-white/80 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 transition-colors flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => setActiveTab("updates")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "updates"
                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Updates</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("sms")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "sms"
                    ? "border-b-2 border-green-500 text-green-600 dark:text-green-400 bg-white dark:bg-gray-900"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>SMS/Phone</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("email")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "email"
                    ? "border-b-2 border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-900"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {/* Updates Tab */}
              {activeTab === "updates" && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto px-6 py-4">
                    <div className="space-y-4">
                      {(() => {
                        const updateKey = `${updatesModal.itemType}-${updatesModal.itemId}`;
                        const updates = itemUpdates[updateKey] || [];

                        if (updates.length === 0) {
                          return (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                                <MessageCircle className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                              </div>
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Start the conversation
                              </h4>
                              <p className="text-gray-500 dark:text-gray-400 text-sm">
                                No updates yet. Be the first to share progress, ask questions, or provide feedback!
                              </p>
                            </div>
                          );
                        }

                        return updates.map((update, index) => (
                          <div key={update.id} className="group animate-in slide-in-from-left duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="flex space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm shadow-lg">
                                  {update.author[0].toUpperCase()}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                                    {update.author}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(update.timestamp).toLocaleString()}
                                  </span>
                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-gray-400 hover:text-blue-500 transition-colors">
                                      <Heart className="w-3 h-3" />
                                    </button>
                                    <button className="text-gray-400 hover:text-blue-500 transition-colors">
                                      <MoreHorizontal className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {update.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Updates Compose Area */}
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="p-6">
                      <div className="flex space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-medium text-sm">
                            U
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="relative">
                            <textarea
                              value={newUpdate}
                              onChange={(e) => setNewUpdate(e.target.value)}
                              placeholder="Share an update, ask a question, or provide feedback..."
                              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              rows={3}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                  e.preventDefault();
                                  if (newUpdate.trim()) {
                                    addUpdate();
                                  }
                                }
                              }}
                            />
                            {newUpdate.trim() && (
                              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                ⌘ + Enter to send
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-2">
                              <button 
                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Add attachment"
                              >
                                <Paperclip className="w-4 h-4" />
                              </button>
                              <button 
                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Add emoji"
                              >
                                <Smile className="w-4 h-4" />
                              </button>
                              <button 
                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Mention someone"
                              >
                                <AtSign className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={closeUpdatesModal}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={addUpdate}
                                disabled={!newUpdate.trim()}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg disabled:shadow-none"
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

              {/* SMS/Phone Tab */}
              {activeTab === "sms" && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto px-6 py-4">
                    <div className="space-y-4">
                      {/* Customer Phone Info */}
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-green-900 dark:text-green-100">
                              Customer Phone
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {(() => {
                                const currentItem = boardItems.find(item => item.id === updatesModal.itemId);
                                return currentItem?.phone || "No phone number available";
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* SMS Conversation */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">SMS Conversation</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 min-h-[200px]">
                          <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                            <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>SMS integration coming soon!</p>
                            <p className="text-xs mt-1">Connect with OpenPhone to send and receive text messages.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SMS Compose Area */}
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                    <div className="p-6">
                      <div className="flex space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium text-sm">
                            <Phone className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <textarea
                            placeholder="Type your SMS message here..."
                            className="w-full border border-green-200 dark:border-green-700 rounded-xl px-4 py-3 text-sm resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            rows={3}
                            disabled
                          />
                          <div className="flex items-center justify-between mt-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Requires OpenPhone integration
                            </div>
                            <button
                              disabled
                              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                            >
                              Send SMS
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Tab */}
              {activeTab === "email" && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto px-6 py-4">
                    <div className="space-y-4">
                      {/* Customer Email Info */}
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-purple-900 dark:text-purple-100">
                              Customer Email
                            </h4>
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                              {(() => {
                                const currentItem = boardItems.find(item => item.id === updatesModal.itemId);
                                return currentItem?.email || "No email address available";
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Email Thread */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">Email Thread</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 min-h-[200px]">
                          <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                            <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Email integration ready!</p>
                            <p className="text-xs mt-1">Connect with SendGrid to send professional emails.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Compose Area */}
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              To
                            </label>
                            <input
                              type="email"
                              value={(() => {
                                const currentItem = boardItems.find(item => item.id === updatesModal.itemId);
                                return currentItem?.email || "";
                              })()}
                              className="w-full border border-purple-200 dark:border-purple-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Subject
                            </label>
                            <input
                              type="text"
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              placeholder="Email subject..."
                              className="w-full border border-purple-200 dark:border-purple-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Message
                          </label>
                          <textarea
                            value={emailMessage}
                            onChange={(e) => setEmailMessage(e.target.value)}
                            placeholder="Compose your email message..."
                            className="w-full border border-purple-200 dark:border-purple-700 rounded-lg px-4 py-3 text-sm resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            rows={4}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {(() => {
                              const currentItem = boardItems.find(item => item.id === updatesModal.itemId);
                              return currentItem?.email ? "Email ready to send" : "No email address available";
                            })()}
                          </div>
                          <button
                            onClick={sendEmail}
                            disabled={isEmailSending || !emailSubject.trim() || !emailMessage.trim() || !(() => {
                              const currentItem = boardItems.find(item => item.id === updatesModal.itemId);
                              return currentItem?.email;
                            })()}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            {isEmailSending ? "Sending..." : "Send Email"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Formula Assistant */}
      <AIFormulaAssistant />

      {/* Formula Editor */}
      <FormulaEditor />

      {/* Column Creation Modal */}
      <ColumnCreationModal />

      {/* Column Rename Modal */}
      <ColumnRenameModal />

      {/* Generic Prompt Modal */}
      <PromptModal />

      {/* Generic Confirm Modal */}
      <ConfirmModal />

      {/* Edit Labels Modal */}
      <EditLabelsModal />
    </div>
  );
};

export default MondayBoard;
