import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Building2, 
  Users, 
  LogOut,
  User,
  Settings,
  Eye,
  CheckCircle,
  Clock,
  Bell,
  MessageSquare,
  Calendar,
  ChevronRight,
  FileText,
  BarChart3,
  CalendarDays,
  Activity,
  Heart,
  Share,
  MoreHorizontal,
  Send,
  Camera,
  Smile,
  X
} from "lucide-react";
import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [previewRole, setPreviewRole] = useState<string | null>(null);
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const feelings = [
    { emoji: "😊", label: "happy" },
    { emoji: "😢", label: "sad" },
    { emoji: "😍", label: "loved" },
    { emoji: "😴", label: "tired" },
    { emoji: "🎉", label: "excited" },
    { emoji: "😤", label: "frustrated" },
    { emoji: "🤔", label: "thoughtful" },
    { emoji: "😎", label: "cool" },
    { emoji: "🥳", label: "celebrating" },
    { emoji: "💪", label: "motivated" },
    { emoji: "🤗", label: "grateful" },
    { emoji: "🔥", label: "fired up" },
  ];

  // Fetch company posts
  const { data: companyPosts = [] } = useQuery<any[]>({
    queryKey: ["/api/company-posts"],
  });

  // Fetch company settings for company name
  const { data: companySettings } = useQuery<any>({
    queryKey: ["/api/company-settings"],
  });

  // Record post views when component mounts or posts change
  useEffect(() => {
    if (companyPosts.length > 0 && user?.id) {
      companyPosts.forEach((post: any) => {
        // Record view for each post (API will handle duplicate prevention)
        apiRequest("POST", `/api/company-posts/${post.id}/view`).catch(() => {
          // Silently fail if view recording fails
        });
      });
    }
  }, [companyPosts, user?.id]);

  // Fetch viewers for posts
  const { data: postViewers = {} } = useQuery<Record<string, any[]>>({
    queryKey: ["/api/post-viewers", companyPosts.map((p: any) => p.id)],
    enabled: companyPosts.length > 0,
    queryFn: async () => {
      const viewersData: Record<string, any[]> = {};
      for (const post of companyPosts) {
        try {
          const response = await apiRequest("GET", `/api/company-posts/${post.id}/viewers`);
          viewersData[post.id] = await response.json();
        } catch (error) {
          viewersData[post.id] = [];
        }
      }
      return viewersData;
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; feeling?: string; image?: File }) => {
      const formData = new FormData();
      formData.append('content', postData.content);
      if (postData.feeling) {
        formData.append('feeling', postData.feeling);
      }
      if (postData.image) {
        formData.append('image', postData.image);
      }

      const response = await fetch('/api/company-posts', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Created",
        description: "Your post has been shared with the team.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company-posts"] });
      setPostContent("");
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedFeeling("");
    },
    onError: (error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitPost = () => {
    if (!postContent.trim() && !selectedImage) {
      toast({
        title: "Empty Post",
        description: "Please add some content or an image to your post.",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      content: postContent,
      feeling: selectedFeeling,
      image: selectedImage || undefined,
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const postDate = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return postDate.toLocaleDateString();
  };

  const handleLogout = () => {
    logout();
  };

  // For admin users, allow previewing different roles
  const effectiveUser = user?.role === 'admin' && previewRole 
    ? { ...user, role: previewRole } 
    : user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - Mobile Optimized */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Top row - Logo and User Info */}
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0">
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <span className="ml-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                {companySettings?.companyName || "Windows & Doors Near Me"}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.firstName} {user?.lastName} ({effectiveUser?.role})
                  {previewRole && <span className="text-blue-600 font-medium"> (Preview Mode)</span>}
                </span>
              </div>

              {/* Mobile User Dropdown */}
              <div className="sm:hidden">
                <Select value={previewRole || user?.role} onValueChange={setPreviewRole}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (Default)</SelectItem>
                    <SelectItem value="customer">Customer (Free)</SelectItem>
                    <SelectItem value="contractor_trial">Contractor (Trial)</SelectItem>
                    <SelectItem value="contractor_paid">Contractor (Paid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Admin Role Switcher */}
              {user?.role === 'admin' && (
                <div className="hidden sm:flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <Select value={previewRole || user.role} onValueChange={setPreviewRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Preview as..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin (Default)</SelectItem>
                      <SelectItem value="customer">Customer (Free)</SelectItem>
                      <SelectItem value="contractor_trial">Contractor (30-Day Trial)</SelectItem>
                      <SelectItem value="contractor_paid">Contractor (Paid)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Link href="/settings">
                <Button variant="outline" size="sm" className="hidden sm:flex h-9 min-w-[100px]">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              
              <Button variant="outline" size="sm" onClick={handleLogout} className="h-9 min-w-[80px]">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {companySettings?.companyName || 'Business Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Welcome back, {user?.firstName}! 
            {effectiveUser?.role === 'customer' ? ' You have access to window configuration and order tracking.' : 
             effectiveUser?.role === 'contractor_trial' ? ' You have access to project management during your 30-day trial.' :
             effectiveUser?.role === 'contractor_paid' ? ' You have full access to all contractor features.' :
             ' You have admin access to all system features.'}
          </p>
        </div>

        {/* Role-based Dashboard Content */}
        {effectiveUser?.role === 'customer' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {/* Window Configuration Tool */}
            <Link href="/quotes-manager">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                    <div className="p-2 sm:p-4 bg-blue-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <Building2 className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Window Configuration</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                        Design and price your windows
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* My Orders */}
            <Link href="/orders">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                    <div className="p-2 sm:p-4 bg-green-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <FileText className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">My Orders</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                        Track your window orders
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Delivery Tracking */}
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                  <div className="p-2 sm:p-4 bg-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
                    <CalendarDays className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Delivery Info</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                      Track delivery status
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Settings */}
            <Link href="/settings">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-800">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                    <div className="p-2 sm:p-4 bg-gray-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <Settings className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Profile Settings</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                        Update your information
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {/* Window Configuration Tool */}
            <Link href="/quotes-manager">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                    <div className="p-2 sm:p-4 bg-blue-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <Building2 className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Window Configuration</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                        Design and price windows
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Project Management */}
            <Link href="/projects">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                    <div className="p-2 sm:p-4 bg-indigo-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <BarChart3 className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Project Management</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                        Manage installation projects
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Calendar */}
            <Link href="/calendar">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                    <div className="p-2 sm:p-4 bg-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <CalendarDays className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Calendar & Scheduling</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                        Schedule and track jobs
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Manage Leads */}
            <Link href="/leads">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                    <div className="p-2 sm:p-4 bg-yellow-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <Users className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Manage Leads & Forms</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                        View customer inquiries
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Reports */}
            <Link href="/quotes">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                    <div className="p-2 sm:p-4 bg-green-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <FileText className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Reports</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                        Quote requests and forms
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Settings */}
            <Link href="/settings">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-800">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                    <div className="p-2 sm:p-4 bg-gray-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <Settings className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Settings & Configuration</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                        Configure your account
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Activity */}
            <Link href="/company-feed">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                    <div className="p-2 sm:p-4 bg-orange-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <Activity className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Activity</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                        Recent project updates
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Mobile-Only Notifications Section - Only for Contractors */}
        {effectiveUser?.role !== 'customer' && (
          <div className="lg:hidden mb-6 space-y-4">
            {/* Task Notification */}
            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500 rounded-xl">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        3 tasks are waiting for you in Quick Tasks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-purple-600 dark:text-purple-400 h-9 min-w-[60px]">
                      Open
                    </Button>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lead Notification */}
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500 rounded-xl">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        2 new leads need your attention
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        From website contact form
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-yellow-600 dark:text-yellow-400 h-9 min-w-[60px]">
                      View
                    </Button>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Project Pipeline Status - Only for Contractors */}
        {effectiveUser?.role !== 'customer' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Pipeline</h2>
              <Link href="/projects">
                <Button variant="outline" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* New Leads */}
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">12</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">New Leads</div>
                </CardContent>
              </Card>

              {/* Need Attention */}
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">5</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Need Attention</div>
                </CardContent>
              </Card>

              {/* Sent Estimate */}
              <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">8</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Sent Estimate</div>
                </CardContent>
              </Card>

              {/* Signed */}
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">3</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Signed</div>
                </CardContent>
              </Card>

              {/* In Progress */}
              <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">7</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">In Progress</div>
                </CardContent>
              </Card>

              {/* Complete */}
              <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">15</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Complete</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Company Activity Feed - Only for Contractors */}
        {effectiveUser?.role !== 'customer' && (
          <div className="space-y-6">
            {/* Create Post Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="Share something with your team..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="min-h-[100px] resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-base"
                    />
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-w-xs max-h-48 rounded-lg object-cover"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Photo
                        </Button>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <Smile className="h-4 w-4 mr-2" />
                              Feeling
                              {selectedFeeling && (
                                <span className="ml-2">
                                  {feelings.find(f => f.label === selectedFeeling)?.emoji}
                                </span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2">
                            <div className="grid grid-cols-4 gap-2">
                              {feelings.map((feeling) => (
                                <Button
                                  key={feeling.label}
                                  variant="ghost"
                                  size="sm"
                                  className="h-12 flex flex-col items-center justify-center hover:bg-gray-100"
                                  onClick={() => setSelectedFeeling(feeling.label)}
                                >
                                  <span className="text-lg">{feeling.emoji}</span>
                                  <span className="text-xs capitalize">{feeling.label}</span>
                                </Button>
                              ))}
                            </div>
                            {selectedFeeling && (
                              <div className="mt-2 pt-2 border-t">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedFeeling("")}
                                  className="w-full text-red-600 hover:text-red-700"
                                >
                                  Remove feeling
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </div>
                      
                      <Button
                        onClick={handleSubmitPost}
                        disabled={createPostMutation.isPending || (!postContent.trim() && !selectedImage)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-4">
              {companyPosts.map((post: any) => (
                <Card key={post.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {post.user?.firstName} {post.user?.lastName}
                          </span>
                          {post.feeling && (
                            <span className="text-sm text-gray-500">
                              is feeling {feelings.find(f => f.label === post.feeling)?.emoji} {post.feeling}
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            {formatTimeAgo(post.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-gray-900 dark:text-white mb-3">{post.content}</p>
                        
                        {post.imageUrl && (
                          <div className="mb-3">
                            <img 
                              src={post.imageUrl} 
                              alt="Post image" 
                              className="max-w-full h-auto rounded-lg"
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600">
                              <Heart className="h-4 w-4 mr-1" />
                              Like
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Comment
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-600">
                              <Share className="h-4 w-4 mr-1" />
                              Share
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            {postViewers[post.id] && postViewers[post.id].length > 0 && (
                              <span>
                                {postViewers[post.id].length} view{postViewers[post.id].length !== 1 ? 's' : ''}
                              </span>
                            )}
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}