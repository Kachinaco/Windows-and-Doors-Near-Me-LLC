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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
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

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      
      // Get auth token from localStorage
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch("/api/company-posts", {
        method: "POST",
        headers,
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setPostContent("");
      setSelectedFeeling("");
      removeImage();
      queryClient.invalidateQueries({ queryKey: ["/api/company-posts"] });
      toast({
        title: "Post shared!",
        description: "Your update has been shared with the team.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to share post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePostSubmit = () => {
    if (postContent.trim()) {
      createPostMutation.mutate({
        content: postContent,
        feeling: selectedFeeling,
        image: selectedImage || undefined,
      });
    }
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
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
            {effectiveUser?.role === 'customer' ? ' You have admin access to all system features.' : 
             effectiveUser?.role === 'contractor_trial' ? ' You have access to project management during your 30-day trial.' :
             effectiveUser?.role === 'contractor_paid' ? ' You have full access to all contractor features.' :
             ' You have admin access to all system features.'}
          </p>
        </div>

        {/* Role-based Dashboard Content */}
        {effectiveUser?.role === 'customer' ? (
          // Customer Dashboard - Window Configuration, Delivery, Orders
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {/* Window Configuration Tool */}
            <Link href="/quote-request">
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
          </div>
        ) : (
          // Contractor Dashboard - Full Business Management
          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {/* Row 1 */}
            {/* Project Management */}
            <Link href="/projects">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                    <div className="p-2 sm:p-4 bg-blue-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <Building2 className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
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

            {/* Row 2 */}
            {/* Forms */}
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

          {/* Activity Feed */}
          <Link href="/updates">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                  <div className="p-2 sm:p-4 bg-indigo-600 rounded-xl sm:rounded-2xl shadow-lg">
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

        {/* Mobile-Only Notifications Section */}
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

          {/* Company Social Feed */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              {/* Post Creation */}
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <Textarea
                    placeholder="Share something with the team..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="min-h-[80px] resize-none border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        onClick={removeImage}
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Selected Feeling Display */}
                  {selectedFeeling && (
                    <div className="mt-3 flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Feeling {selectedFeeling}
                      </span>
                      <Button
                        onClick={() => setSelectedFeeling("")}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        Photo
                      </Button>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <Smile className="h-4 w-4 mr-1" />
                            Feeling
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" side="top">
                          <div className="grid grid-cols-4 gap-2 p-2">
                            {feelings.map((feeling) => (
                              <Button
                                key={feeling.label}
                                variant="ghost"
                                className="h-12 flex flex-col items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 border-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedFeeling(`${feeling.emoji} ${feeling.label}`);
                                  document.body.click();
                                }}
                              >
                                <span className="text-lg">{feeling.emoji}</span>
                                <span className="text-xs capitalize">{feeling.label}</span>
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button 
                      onClick={handlePostSubmit}
                      disabled={!postContent.trim() || createPostMutation.isPending}
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {createPostMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Share
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Company Posts Feed */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-4">
                {companyPosts.length > 0 ? (
                  companyPosts.map((post: any) => (
                    <div key={post.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {user?.firstName} {user?.lastName}
                          </span>
                          {post.feeling && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              is feeling {post.feeling}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatRelativeTime(post.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {post.content}
                        </p>

                        {/* Display uploaded image */}
                        {post.imageUrl && (
                          <div className="mb-2">
                            <img
                              src={post.imageUrl}
                              alt="Post image"
                              className="max-w-full h-auto rounded border border-gray-200 dark:border-gray-600"
                              style={{ maxHeight: '200px' }}
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <button className="flex items-center space-x-1 hover:text-blue-500">
                              <Heart className="h-3 w-3" />
                              <span>Like ({post.likesCount || 0})</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-blue-500">
                              <MessageSquare className="h-3 w-3" />
                              <span>Comment ({post.commentsCount || 0})</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-blue-500">
                              <Share className="h-3 w-3" />
                              <span>Share</span>
                            </button>
                          </div>
                          
                          {/* Post Viewers */}
                          {postViewers[post.id] && postViewers[post.id].length > 0 && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                              <Eye className="h-3 w-3" />
                              <span>
                                Viewed by {postViewers[post.id].slice(0, 3).map((viewer: any) => viewer.user.firstName || viewer.user.username).join(", ")}
                                {postViewers[post.id].length > 3 && ` and ${postViewers[post.id].length - 3} others`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {/* Sample Posts when no real posts exist */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">Sarah Johnson</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Great job everyone on completing the Henderson project! The client was thrilled with the new Milgard windows. 🎉
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <button className="flex items-center space-x-1 hover:text-blue-500">
                            <Heart className="h-3 w-3" />
                            <span>Like</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-blue-500">
                            <MessageSquare className="h-3 w-3" />
                            <span>Comment</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-blue-500">
                            <Share className="h-3 w-3" />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">Mike Torres</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">4 hours ago</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Reminder: Team meeting tomorrow at 9 AM to discuss the upcoming Mesa installation projects.
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <button className="flex items-center space-x-1 hover:text-blue-500">
                            <Heart className="h-3 w-3" />
                            <span>Like</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-blue-500">
                            <MessageSquare className="h-3 w-3" />
                            <span>Comment</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-blue-500">
                            <Share className="h-3 w-3" />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* View More Link */}
              <div className="text-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <Link href="/company-feed">
                  <span className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer">
                    View all status updates →
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Updates</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    ✓ Seen
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  System Update Available
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {new Date().toLocaleDateString()}
                </p>
                <p>
                  New project management features have been added to improve your workflow efficiency.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Banner */}
          <Card className="bg-blue-600 text-white border-blue-700">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Accept Scheduled Jobs Promptly</h3>
                <p className="text-sm text-blue-100 mb-3">
                  Respond to job assignments as soon as they appear on your schedule
                </p>
                <div className="flex items-center justify-center space-x-2 bg-blue-500/30 rounded-lg p-3">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Check your schedule regularly for new job assignments</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message - Mobile Optimized */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to your {user?.companyName || 'Business'} Portal
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base max-w-2xl mx-auto">
                Manage your window and door projects, track leads, and grow your business with our comprehensive management tools.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <Link href="/catalog" className="w-full sm:w-auto">
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto h-12 text-base font-medium">
                    Start Shopping
                  </Button>
                </Link>
                <Link href="/" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto h-12 text-base font-medium border-2">
                    Visit Website
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Subscription Tab */}
        <div className="mt-8 flex justify-center">
          <Link href="/subscription">
            <Card className="hover:shadow-md transition-all duration-200 cursor-pointer bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800 max-w-sm">
              <CardContent className="px-6 py-3">
                <div className="flex items-center justify-center space-x-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Subscription</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Manage subscription
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}