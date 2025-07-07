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
} from "lucide-react";
import { Link as RouterLink } from "wouter";

const MondayBoard = () => {
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([
    { id: 1, name: "Kachina Window Projects", isActive: true, boards: [
      { id: 1, name: "Main Board", isActive: true },
      { id: 2, name: "Sales Pipeline", isActive: false },
    ]},
  ]);
  const [activeProject, setActiveProject] = useState(1);
  const [activeBoard, setActiveBoard] = useState(1);

  const queryClient = useQueryClient();
  
  // Fetch board data from API
  const { data: boardData, isLoading } = useQuery({
    queryKey: [`/api/boards/${activeBoard}/data`],
    enabled: !!activeBoard
  });
  
  const boardItems = boardData?.items || [];
  const columns = boardData?.columns || [];
  
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading board data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <div className={`bg-gray-900 border-r border-gray-800 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden lg:w-64'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Workspace</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-gray-800 rounded"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
          
          <nav className="space-y-2">
            <div className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
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
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-1 hover:bg-gray-800 rounded"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
              
              <RouterLink href="/projects">
                <button className="flex items-center space-x-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
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
                  className="bg-gray-800 border border-gray-700 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Board Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([groupName, items]) => (
              <div key={groupName} className="bg-gray-900 rounded-lg border border-gray-800">
                {/* Group Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <div className="flex items-center space-x-3">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                    <h3 className="font-medium text-lg">{groupName}</h3>
                    <span className="bg-gray-700 text-xs px-2 py-1 rounded">
                      {items.length}
                    </span>
                  </div>
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800 text-sm font-medium text-gray-400">
                  {columns.map(column => (
                    <div key={column.id} className="col-span-2">
                      {column.name}
                    </div>
                  ))}
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-800">
                  {items.map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-800/50 transition-colors">
                      {columns.map(column => (
                        <div key={column.id} className="col-span-2">
                          <input
                            type="text"
                            value={item.values?.[column.id] || ""}
                            onChange={(e) => handleCellUpdate(item.id, column.id, e.target.value)}
                            className="w-full bg-transparent border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
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
                    disabled={createItemMutation.isPending}
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {createItemMutation.isPending ? "Adding..." : "Add item"}
                    </span>
                  </button>
                </div>
              </div>
            ))}

            {/* Add Group Button */}
            {Object.keys(groupedItems).length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No items in this board yet</p>
                <button
                  onClick={() => handleAddItem("New Group")}
                  disabled={createItemMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors disabled:opacity-50"
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