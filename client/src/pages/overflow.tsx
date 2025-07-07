import React, { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  ArrowLeft,
  PanelLeft,
  PanelLeftClose,
  Home,
  Star,
  Briefcase,
  Search,
  Settings,
  Filter,
  MoreHorizontal,
  Users,
  Calendar,
  Tag
} from "lucide-react";
import { Link as RouterLink } from "wouter";

const MondayBoard = () => {
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [projects, setProjects] = useState([
    { id: 1, name: "Kachina Window Projects", isActive: true, boards: [
      { id: 1, name: "Main Board", isActive: true },
      { id: 2, name: "Sales Pipeline", isActive: false },
    ]},
  ]);
  const [activeProject, setActiveProject] = useState(1);
  const [activeBoard, setActiveBoard] = useState(1);

  const queryClient = useQueryClient();
  
  // Use sample data for now since API isn't working properly
  const sampleData = {
    columns: [
      { id: 1, name: "Item", type: "text", width: 200 },
      { id: 2, name: "Status", type: "status", width: 120 },
      { id: 3, name: "People", type: "people", width: 150 },
      { id: 4, name: "Location", type: "text", width: 180 },
      { id: 5, name: "Phone", type: "phone", width: 140 },
      { id: 6, name: "Due Date", type: "date", width: 120 }
    ],
    items: [
      {
        id: 1,
        group_name: "New Leads",
        values: {
          1: "Kitchen Renovation",
          2: "In Progress",
          3: "John Smith",
          4: "123 Main St, Gilbert",
          5: "(555) 123-4567",
          6: "2025-07-15"
        }
      },
      {
        id: 2,
        group_name: "New Leads",
        values: {
          1: "Bathroom Remodel",
          2: "Not Started",
          3: "Sarah Wilson", 
          4: "456 Oak Ave, Mesa",
          5: "(555) 234-5678",
          6: "2025-08-01"
        }
      },
      {
        id: 3,
        group_name: "Active Projects",
        values: {
          1: "Living Room Windows",
          2: "Complete",
          3: "Mike Johnson",
          4: "789 Pine St, Chandler",
          5: "(555) 345-6789",
          6: "2025-07-10"
        }
      }
    ]
  };
  
  const boardItems = sampleData.items;
  const columns = sampleData.columns;
  
  // Create new board item mutation
  const createItemMutation = useMutation({
    mutationFn: async ({ boardId, groupName }: { boardId: number; groupName: string }) => {
      return apiRequest(`/api/boards/${boardId}/items`, {
        method: 'POST',
        body: { groupName }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/boards/${activeBoard}/data`] });
    }
  });
  
  // Update cell value mutation  
  const updateValueMutation = useMutation({
    mutationFn: async ({ itemId, columnId, value }: { itemId: number; columnId: string; value: string }) => {
      return apiRequest(`/api/boards/items/${itemId}/values`, {
        method: 'POST',
        body: { columnId, value }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/boards/${activeBoard}/data`] });
    }
  });

  // Group items by group name
  const groupedItems = React.useMemo(() => {
    const groups = {};
    boardItems.forEach(item => {
      const groupName = item.group_name || "Main Group";
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(item);
    });
    return groups;
  }, [boardItems]);

  // Handle add item for the current group
  const handleAddItem = (groupName: string) => {
    createItemMutation.mutate({
      boardId: activeBoard,
      groupName: groupName
    });
  };

  // Handle cell value update
  const handleCellUpdate = (itemId: number, columnId: string, value: string) => {
    updateValueMutation.mutate({
      itemId,
      columnId,
      value
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden lg:w-64'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Workspace</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
          
          <nav className="space-y-2">
            <div className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300">
              <Star className="w-4 h-4" />
              <span>My work</span>
            </div>
          </nav>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Projects</h3>
            {projects.map(project => (
              <div key={project.id} className="mb-2">
                <div className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
                  <Briefcase className="w-4 h-4" />
                  <span className="flex-1">{project.name}</span>
                </div>
                {project.boards.map(board => (
                  <div
                    key={board.id}
                    onClick={() => setActiveBoard(board.id)}
                    className={`ml-6 px-3 py-1 text-sm rounded cursor-pointer ${
                      board.isActive ? 'bg-blue-600' : 'hover:bg-gray-800'
                    }`}
                  >
                    {board.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 text-gray-900 dark:text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
              
              <RouterLink href="/projects">
                <button className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Projects</span>
                </button>
              </RouterLink>
              
              <h1 className="text-xl font-semibold">
                {projects.find(p => p.id === activeProject)?.name || "Board"}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Board Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([groupName, items]) => (
              <div key={groupName} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                {/* Group Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <h3 className="font-medium text-lg text-gray-900 dark:text-white">{groupName}</h3>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded">
                      {items.length}
                    </span>
                  </div>
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {columns.map(column => (
                    <div key={column.id} className="col-span-2">
                      {column.name}
                    </div>
                  ))}
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {columns.map(column => (
                        <div key={column.id} className="col-span-2">
                          <input
                            type="text"
                            value={item.values?.[column.id] || ""}
                            onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
                            className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                            placeholder={`Enter ${column.name.toLowerCase()}...`}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Add Item Button */}
                <div className="p-4">
                  <button
                    onClick={() => handleAddItem(groupName)}
                    disabled={false}
                    className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add item</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Add Group Button */}
            {Object.keys(groupedItems).length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No items in this board yet</p>
                <button
                  onClick={() => handleAddItem("New Group")}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors text-white"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Create first item
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MondayBoard;