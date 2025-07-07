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
    { id: "subitems", name: "Folders", type: "subitems", order: 2 },
    { id: "status", name: "Status", type: "status", order: 3 },
    { id: "priority", name: "Priority", type: "dropdown", order: 4, options: ["Low", "Medium", "High", "Critical"] },
    { id: "assignedTo", name: "People", type: "people", order: 5 },
    { id: "dueDate", name: "Due Date", type: "date", order: 6 },
    { id: "progress", name: "Progress", type: "progress", order: 7 },
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
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Status options
  const statusOptions = [
    { id: "not-started", label: "Not Started", color: "#C4C4C4" },
    { id: "in-progress", label: "In Progress", color: "#0066CC" },
    { id: "complete", label: "Complete", color: "#00C875" },
    { id: "stuck", label: "Stuck", color: "#E2445C" },
    { id: "working-on-it", label: "Working on it", color: "#FDAB3D" },
  ];

  // Priority options
  const priorityOptions = [
    { id: "low", label: "Low", color: "#C4C4C4" },
    { id: "medium", label: "Medium", color: "#FDAB3D" },
    { id: "high", label: "High", color: "#E2445C" },
    { id: "critical", label: "Critical", color: "#FF6B6B" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.status-dropdown')) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  // Helper functions
  const getStatusColor = (status) => {
    if (typeof status === 'string') {
      const statusObj = statusOptions.find(s => s.id === status || s.label.toLowerCase() === status.toLowerCase());
      return statusObj ? statusObj.color : '#C4C4C4';
    }
    return status?.color || '#C4C4C4';
  };

  const getPriorityColor = (priority) => {
    if (typeof priority === 'string') {
      const priorityObj = priorityOptions.find(p => p.id === priority || p.label.toLowerCase() === priority.toLowerCase());
      return priorityObj ? priorityObj.color : '#C4C4C4';
    }
    return priority?.color || '#C4C4C4';
  };

  const toggleFolderExpansion = (itemId, folderId) => {
    setExpandedFolders(prev => {
      const key = `${itemId}-${folderId}`;
      const newExpanded = new Set(prev);
      if (newExpanded.has(key)) {
        newExpanded.delete(key);
      } else {
        newExpanded.add(key);
      }
      return newExpanded;
    });
  };

  const isFolderExpanded = (itemId, folderId) => {
    return expandedFolders.has(`${itemId}-${folderId}`);
  };

  // Render status cell
  const renderStatusCell = (item, columnId, isSubItem = false) => {
    const status = item.status;
    const statusColor = getStatusColor(status);
    const statusLabel = typeof status === 'string' ? 
      statusOptions.find(s => s.id === status)?.label || status : 
      status?.label || 'Unknown';

    return (
      <div className="relative status-dropdown">
        <div
          className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: statusColor + '20', color: statusColor, border: `1px solid ${statusColor}` }}
          onClick={() => setDropdownOpen(dropdownOpen === `${item.id}-${columnId}` ? null : `${item.id}-${columnId}`)}
        >
          {statusLabel}
        </div>
        {dropdownOpen === `${item.id}-${columnId}` && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[150px]">
            {statusOptions.map(option => (
              <div
                key={option.id}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => {
                  // Update status logic here
                  setDropdownOpen(null);
                }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render progress cell
  const renderProgressCell = (item) => {
    const progress = item.progress || 0;
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-600">{progress}%</span>
      </div>
    );
  };

  // Render people cell
  const renderPeopleCell = (item) => {
    const people = Array.isArray(item.assignedTo) ? item.assignedTo : [item.assignedTo].filter(Boolean);
    return (
      <div className="flex items-center gap-1">
        {people.slice(0, 2).map((person, idx) => (
          <div
            key={idx}
            className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
            title={person}
          >
            {person?.charAt(0)?.toUpperCase() || '?'}
          </div>
        ))}
        {people.length > 2 && (
          <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-xs text-white font-medium">
            +{people.length - 2}
          </div>
        )}
      </div>
    );
  };

  // Render date cell
  const renderDateCell = (date) => {
    if (!date) return <span className="text-gray-400">No date</span>;
    return (
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {new Date(date).toLocaleDateString()}
      </div>
    );
  };

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Windows & Doors Projects
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              {boardItems.length} item{boardItems.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors">
              Automate
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300 w-6">
                <input type="checkbox" className="rounded" />
              </th>
              {columns.map(column => (
                <th
                  key={column.id}
                  className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700"
                  style={{ width: columnWidths[column.id] || 'auto' }}
                >
                  <div className="flex items-center gap-2">
                    {column.type === 'people' && <User className="w-4 h-4" />}
                    {column.type === 'status' && <Hash className="w-4 h-4" />}
                    {column.type === 'date' && <Calendar className="w-4 h-4" />}
                    {column.type === 'progress' && <BarChart3 className="w-4 h-4" />}
                    {column.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {boardItems.map(item => (
              <React.Fragment key={item.id}>
                {/* Main item row */}
                <tr className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-3 w-6">
                    <input type="checkbox" className="rounded" />
                  </td>
                  {columns.map(column => (
                    <td key={column.id} className="p-3 border-l border-gray-200 dark:border-gray-700">
                      {column.id === 'item' && (
                        <div className="flex items-center gap-2">
                          {item.folders && item.folders.length > 0 && (
                            <button
                              className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              onClick={() => setExpandedSubItems(prev => {
                                const newExpanded = new Set(prev);
                                if (newExpanded.has(item.id)) {
                                  newExpanded.delete(item.id);
                                } else {
                                  newExpanded.add(item.id);
                                }
                                return newExpanded;
                              })}
                            >
                              {expandedSubItems.has(item.id) ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.values?.item || item.name}
                          </span>
                        </div>
                      )}
                      {column.id === 'subitems' && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Folder className="w-3 h-3" />
                          {item.folders?.length || 0} folders
                        </div>
                      )}
                      {column.id === 'status' && renderStatusCell(item, column.id)}
                      {column.id === 'priority' && (
                        <div
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: getPriorityColor(item.priority || item.values?.priority) + '20',
                            color: getPriorityColor(item.priority || item.values?.priority),
                            border: `1px solid ${getPriorityColor(item.priority || item.values?.priority)}`
                          }}
                        >
                          {item.priority || item.values?.priority || 'Low'}
                        </div>
                      )}
                      {column.id === 'assignedTo' && renderPeopleCell(item)}
                      {column.id === 'dueDate' && renderDateCell(item.dueDate || item.values?.dueDate)}
                      {column.id === 'progress' && renderProgressCell(item)}
                    </td>
                  ))}
                </tr>

                {/* Sub-items (folders) */}
                {expandedSubItems.has(item.id) && item.folders && item.folders.map(folder => (
                  <React.Fragment key={folder.id}>
                    {/* Folder header */}
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <td className="p-3 w-6"></td>
                      <td className="p-3 border-l border-gray-200 dark:border-gray-700 pl-8">
                        <div className="flex items-center gap-2">
                          <button
                            className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            onClick={() => toggleFolderExpansion(item.id, folder.id)}
                          >
                            {isFolderExpanded(item.id, folder.id) ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                          <Folder className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {folder.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({folder.items?.length || 0} items)
                          </span>
                        </div>
                      </td>
                      <td colSpan={columns.length - 1} className="p-3 border-l border-gray-200 dark:border-gray-700"></td>
                    </tr>

                    {/* Folder items */}
                    {isFolderExpanded(item.id, folder.id) && folder.items && folder.items.map(subItem => (
                      <tr key={subItem.id} className="bg-gray-25 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-600">
                        <td className="p-3 w-6"></td>
                        <td className="p-3 border-l border-gray-200 dark:border-gray-700 pl-12">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Sub-item {subItem.id}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 border-l border-gray-200 dark:border-gray-700"></td>
                        <td className="p-3 border-l border-gray-200 dark:border-gray-700">
                          {renderStatusCell(subItem, 'status', true)}
                        </td>
                        <td className="p-3 border-l border-gray-200 dark:border-gray-700">
                          <div
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: getPriorityColor('Medium') + '20',
                              color: getPriorityColor('Medium'),
                              border: `1px solid ${getPriorityColor('Medium')}`
                            }}
                          >
                            Medium
                          </div>
                        </td>
                        <td className="p-3 border-l border-gray-200 dark:border-gray-700">
                          {renderPeopleCell(subItem)}
                        </td>
                        <td className="p-3 border-l border-gray-200 dark:border-gray-700">
                          {renderDateCell(subItem.dueDate)}
                        </td>
                        <td className="p-3 border-l border-gray-200 dark:border-gray-700">
                          {renderProgressCell(subItem)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add item button */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <button className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <Plus className="w-4 h-4" />
          Add new project...
        </button>
      </div>
    </div>
  );
};

export default MondayBoard;