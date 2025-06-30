import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronDown, ChevronRight, Plus, Search, Star, StarOff, MoreVertical, Calendar, Users, BarChart3, Settings, Archive, Folder, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Board {
  id: number;
  name: string;
  icon: string;
  lastModified: string;
  isStarred: boolean;
  path: string;
}

interface Folder {
  id: number;
  name: string;
  isCollapsed: boolean;
  boards: Board[];
}

interface Workspace {
  id: number;
  name: string;
  isCollapsed: boolean;
  folders: Folder[];
}

export default function WorkspacesPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [newBoardForm, setNewBoardForm] = useState({
    name: '',
    description: '',
    folderId: '',
    icon: '📋',
    color: '#3b82f6'
  });
  
  // Mock data matching your screenshot
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: 1,
      name: 'Kachina Windows and Doors',
      isCollapsed: false,
      folders: [
        {
          id: 1,
          name: 'Kachina 2025',
          isCollapsed: false,
          boards: [
            {
              id: 1,
              name: 'Inventory',
              icon: '📦',
              lastModified: '3 weeks ago',
              isStarred: true,
              path: '/monday-board/1'
            },
            {
              id: 2,
              name: 'Full Calendar',
              icon: '📅',
              lastModified: '3 weeks ago',
              isStarred: true,
              path: '/monday-board/2'
            },
            {
              id: 3,
              name: 'Kachina_Projects',
              icon: '📋',
              lastModified: '3 days ago',
              isStarred: true,
              path: '/monday-board/3'
            }
          ]
        },
        {
          id: 2,
          name: 'Installers/Employees',
          isCollapsed: true,
          boards: []
        },
        {
          id: 3,
          name: 'W&D',
          isCollapsed: false,
          boards: [
            {
              id: 4,
              name: 'Osman Portillo',
              icon: '👤',
              lastModified: '3 days ago',
              isStarred: true,
              path: '/monday-board/4'
            },
            {
              id: 5,
              name: 'Corys Schedule 25',
              icon: '🗓️',
              lastModified: '2 months ago',
              isStarred: true,
              path: '/monday-board/5'
            },
            {
              id: 6,
              name: 'Dustin Crocker 25',
              icon: '🔧',
              lastModified: '5 months ago',
              isStarred: true,
              path: '/monday-board/6'
            },
            {
              id: 7,
              name: 'Nate and Jarred 25',
              icon: '👥',
              lastModified: '3 weeks ago',
              isStarred: true,
              path: '/monday-board/7'
            }
          ]
        }
      ]
    }
  ]);

  const toggleWorkspaceCollapse = (workspaceId: number) => {
    setWorkspaces(prev => prev.map(workspace => 
      workspace.id === workspaceId 
        ? { ...workspace, isCollapsed: !workspace.isCollapsed }
        : workspace
    ));
  };

  const toggleFolderCollapse = (workspaceId: number, folderId: number) => {
    setWorkspaces(prev => prev.map(workspace => 
      workspace.id === workspaceId 
        ? {
            ...workspace,
            folders: workspace.folders.map(folder =>
              folder.id === folderId
                ? { ...folder, isCollapsed: !folder.isCollapsed }
                : folder
            )
          }
        : workspace
    ));
  };

  const toggleBoardStar = (workspaceId: number, folderId: number, boardId: number) => {
    setWorkspaces(prev => prev.map(workspace => 
      workspace.id === workspaceId 
        ? {
            ...workspace,
            folders: workspace.folders.map(folder =>
              folder.id === folderId
                ? {
                    ...folder,
                    boards: folder.boards.map(board =>
                      board.id === boardId
                        ? { ...board, isStarred: !board.isStarred }
                        : board
                    )
                  }
                : folder
            )
          }
        : workspace
    ));
  };

  const createBoard = () => {
    if (!newBoardForm.name.trim()) return;
    
    // Find the folder to add the board to
    const workspaceId = 1; // Default to first workspace
    const folderId = parseInt(newBoardForm.folderId) || 1; // Default to first folder
    
    const boardId = Date.now();
    const newBoard: Board = {
      id: boardId,
      name: newBoardForm.name,
      icon: newBoardForm.icon,
      lastModified: 'just now',
      isStarred: false,
      path: `/monday-board/${boardId}`
    };

    // Store board name in localStorage for the Monday board to access
    localStorage.setItem(`board_${boardId}_name`, newBoardForm.name);

    setWorkspaces(prev => prev.map(workspace => 
      workspace.id === workspaceId 
        ? {
            ...workspace,
            folders: workspace.folders.map(folder =>
              folder.id === folderId
                ? {
                    ...folder,
                    boards: [...folder.boards, newBoard]
                  }
                : folder
            )
          }
        : workspace
    ));

    // Reset form and close modal
    setNewBoardForm({
      name: '',
      description: '',
      folderId: '',
      icon: '📋',
      color: '#3b82f6'
    });
    setIsCreateBoardModalOpen(false);
  };

  const filteredWorkspaces = workspaces.map(workspace => ({
    ...workspace,
    folders: workspace.folders.map(folder => ({
      ...folder,
      boards: folder.boards.filter(board =>
        board.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/dashboard')}
          >
            ←
          </Button>
          <h1 className="text-xl font-semibold">Workspaces</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 w-64"
            />
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {filteredWorkspaces.map((workspace) => (
          <div key={workspace.id} className="space-y-2">
            {/* Workspace Header */}
            <div className="flex items-center gap-2 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleWorkspaceCollapse(workspace.id)}
                className="p-1 h-8 w-8"
              >
                {workspace.isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-xs">
                  🏢
                </div>
                <span className="font-medium text-white">{workspace.name}</span>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto p-1 h-8 w-8">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Folders and Boards */}
            {!workspace.isCollapsed && (
              <div className="ml-8 space-y-2">
                {workspace.folders.map((folder) => (
                  <div key={folder.id} className="space-y-1">
                    {/* Folder Header */}
                    <div className="flex items-center gap-2 py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFolderCollapse(workspace.id, folder.id)}
                        className="p-1 h-6 w-6"
                      >
                        {folder.isCollapsed ? (
                          <ChevronRight className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                      <Folder className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">{folder.name}</span>
                      <Button variant="ghost" size="sm" className="ml-auto p-1 h-6 w-6">
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Boards */}
                    {!folder.isCollapsed && (
                      <div className="ml-6 space-y-1">
                        {folder.boards.map((board) => (
                          <div key={board.id} className="group">
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                              <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-sm">
                                <Grid3X3 className="h-4 w-4 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link href={board.path}>
                                  <div className="font-medium text-white cursor-pointer hover:text-blue-400">
                                    {board.name}
                                  </div>
                                </Link>
                                <div className="text-xs text-gray-400">
                                  {workspace.name} &gt; {folder.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Changed {board.lastModified}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleBoardStar(workspace.id, folder.id, board.id)}
                                className="p-1 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {board.isStarred ? (
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                ) : (
                                  <StarOff className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
        onClick={() => setIsCreateBoardModalOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Create Board Modal */}
      <Dialog open={isCreateBoardModalOpen} onOpenChange={setIsCreateBoardModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-300">Board Name *</Label>
              <Input
                value={newBoardForm.name}
                onChange={(e) => setNewBoardForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter board name"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            
            <div>
              <Label className="text-sm text-gray-300">Description</Label>
              <Input
                value={newBoardForm.description}
                onChange={(e) => setNewBoardForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Board description (optional)"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label className="text-sm text-gray-300">Folder</Label>
              <Select value={newBoardForm.folderId} onValueChange={(value) => setNewBoardForm(prev => ({ ...prev, folderId: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="1" className="text-white">Kachina 2025</SelectItem>
                  <SelectItem value="2" className="text-white">Installers/Employees</SelectItem>
                  <SelectItem value="3" className="text-white">W&D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-gray-300">Icon</Label>
              <div className="flex gap-2 flex-wrap">
                {['📋', '📦', '📅', '👤', '🗓️', '🔧', '👥', '📊', '💼', '🎯'].map((icon) => (
                  <Button
                    key={icon}
                    variant={newBoardForm.icon === icon ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewBoardForm(prev => ({ ...prev, icon }))}
                    className={`w-10 h-10 ${newBoardForm.icon === icon ? 'bg-blue-600' : 'bg-gray-800 border-gray-600'}`}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={createBoard}
                disabled={!newBoardForm.name.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Create Board
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateBoardModalOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}