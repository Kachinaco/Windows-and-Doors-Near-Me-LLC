// Complete Dashboard Code - client/src/pages/dashboard.tsx
// This is the full dashboard page with three-dot menus REMOVED from all dashboard boxes

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Building2, 
  BarChart3, 
  CalendarDays, 
  Users, 
  FileText, 
  Settings,
  Activity,
  DollarSign,
  Bell,
  CheckCircle,
  ChevronRight,
  Plus,
  Upload,
  Smile,
  Heart,
  ThumbsUp,
  Star,
  Coffee,
  Zap,
  Target,
  Trophy,
  Gift,
  Sun,
  Moon,
  Camera
} from "lucide-react";
import { useState, useRef } from "react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CompanyPost {
  id: number;
  content: string;
  feeling?: string;
  imageUrl?: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
  };
}

interface CompanySettings {
  id: number;
  companyName: string;
}

const feelingEmojis = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'excited', emoji: '🎉', label: 'Excited' },
  { value: 'grateful', emoji: '🙏', label: 'Grateful' },
  { value: 'accomplished', emoji: '💪', label: 'Accomplished' },
  { value: 'motivated', emoji: '🔥', label: 'Motivated' },
  { value: 'proud', emoji: '🏆', label: 'Proud' },
  { value: 'inspired', emoji: '✨', label: 'Inspired' },
  { value: 'focused', emoji: '🎯', label: 'Focused' },
  { value: 'energized', emoji: '⚡', label: 'Energized' },
  { value: 'blessed', emoji: '🌟', label: 'Blessed' },
  { value: 'creative', emoji: '🎨', label: 'Creative' },
  { value: 'confident', emoji: '💎', label: 'Confident' }
];

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postContent, setPostContent] = useState("");
  const [selectedFeeling, setSelectedFeeling] = useState<string>();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showFeelingPopover, setShowFeelingPopover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine effective user for display
  const effectiveUser = user;

  const { data: companySettings } = useQuery({
    queryKey: ['/api/company-settings'],
    enabled: !!user
  });

  const { data: companyPosts = [], refetch: refetchPosts } = useQuery({
    queryKey: ['/api/company-posts'],
    enabled: !!user
  });

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
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      return response.json();
    },
    onSuccess: () => {
      setPostContent("");
      setSelectedFeeling(undefined);
      setSelectedImage(null);
      setImagePreview(null);
      refetchPosts();
      toast({
        title: "Success",
        description: "Status update posted successfully!"
      });
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to post status update",
        variant: "destructive"
      });
    }
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image must be less than 5MB",
          variant: "destructive"
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

  const handleCreatePost = () => {
    if (!postContent.trim() && !selectedImage) {
      toast({
        title: "Error", 
        description: "Please enter some content or select an image",
        variant: "destructive"
      });
      return;
    }

    createPostMutation.mutate({
      content: postContent,
      feeling: selectedFeeling,
      image: selectedImage || undefined
    });
  };

  const handleFeelingSelect = (feeling: string) => {
    setSelectedFeeling(feeling);
    setShowFeelingPopover(false);
  };

  const selectedFeelingEmoji = feelingEmojis.find(f => f.value === selectedFeeling);

  // Show simplified interface for customers
  if (effectiveUser?.role === 'customer') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {companySettings?.companyName || 'Customer Portal'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back! Manage your orders and track deliveries.
            </p>
          </div>

          {/* Customer-Only Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Window Configuration Tool */}
            <div>
              <Link href="/quotes-manager">
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-4 bg-blue-600 rounded-2xl shadow-lg">
                        <Building2 className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Window Configuration</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Design and price windows
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Customer Orders */}
            <div>
              <Link href="/customer-orders">
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-4 bg-green-600 rounded-2xl shadow-lg">
                        <FileText className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">My Orders</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Track your orders
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Delivery Info */}
            <div>
              <Link href="/customer-delivery">
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-4 bg-purple-600 rounded-2xl shadow-lg">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Delivery Info</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Installation schedules
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {companySettings?.companyName || 'Business Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {effectiveUser?.username}! You have admin access to all system features.
          </p>
        </div>

        {/* Status Update Section - Only for Contractors */}
        {effectiveUser?.role !== 'customer' && (
          <div className="mb-8">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Post Creation Area */}
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                      {effectiveUser?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-3">
                      <Textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="Share something with your team..."
                        className="min-h-[80px] sm:min-h-[100px] resize-none border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base"
                      />
                      
                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-w-full h-32 sm:h-40 object-cover rounded-lg border"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0"
                            onClick={() => {
                              setSelectedImage(null);
                              setImagePreview(null);
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                          {/* Image Upload Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center space-x-1 sm:space-x-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                          >
                            <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Photo</span>
                          </Button>

                          {/* Feeling Selector */}
                          <Popover open={showFeelingPopover} onOpenChange={setShowFeelingPopover}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center space-x-1 sm:space-x-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                              >
                                {selectedFeelingEmoji ? (
                                  <>
                                    <span className="text-sm sm:text-base">{selectedFeelingEmoji.emoji}</span>
                                    <span className="hidden sm:inline">{selectedFeelingEmoji.label}</span>
                                  </>
                                ) : (
                                  <>
                                    <Smile className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Feeling</span>
                                  </>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 sm:w-80 p-4">
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {feelingEmojis.map((feeling) => (
                                  <button
                                    key={feeling.value}
                                    onClick={() => handleFeelingSelect(feeling.value)}
                                    className={cn(
                                      "flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                                      selectedFeeling === feeling.value && "bg-blue-100 dark:bg-blue-900"
                                    )}
                                  >
                                    <span className="text-lg sm:text-xl mb-1">{feeling.emoji}</span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 text-center">{feeling.label}</span>
                                  </button>
                                ))}
                              </div>
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
                          onClick={handleCreatePost}
                          disabled={createPostMutation.isPending || (!postContent.trim() && !selectedImage)}
                          size="sm"
                          className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                        >
                          {createPostMutation.isPending ? "Posting..." : "Post"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Posts Preview */}
            {companyPosts.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Updates</h3>
                  <Link href="/company-feed">
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      View all updates
                    </Button>
                  </Link>
                </div>
                
                {companyPosts.slice(0, 3).map((post: CompanyPost) => {
                  const selectedFeelingEmoji = feelingEmojis.find(f => f.value === post.feeling);
                  
                  return (
                    <Card key={post.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start space-x-3 sm:space-x-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                            {post.user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                                {post.user.username}
                              </p>
                              {selectedFeelingEmoji && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-sm">is feeling</span>
                                  <span className="text-sm sm:text-base">{selectedFeelingEmoji.emoji}</span>
                                  <span className="text-sm font-medium">{selectedFeelingEmoji.label}</span>
                                </div>
                              )}
                              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                {format(new Date(post.createdAt), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                            <p className="text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
                              {post.content}
                            </p>
                            {post.imageUrl && (
                              <img
                                src={post.imageUrl}
                                alt="Post image"
                                className="max-w-full h-32 sm:h-48 object-cover rounded-lg border mb-3"
                              />
                            )}
                            <div className="flex items-center space-x-4 sm:space-x-6 text-gray-500 dark:text-gray-400">
                              <button className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="text-xs sm:text-sm">Like</span>
                              </button>
                              <button className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                <span className="text-xs sm:text-sm">Comment</span>
                              </button>
                              <button className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                <span className="text-xs sm:text-sm">Share</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Dashboard Grid - Only for Contractors */}
        {effectiveUser?.role !== 'customer' && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {/* Window Configuration Tool */}
            <div>
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
            </div>

            {/* Project Management */}
            <div>
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
            </div>

            {/* Calendar */}
            <div>
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
            </div>

            {/* Manage Leads */}
            <div>
              <Link href="/leads">
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                      <div className="p-2 sm:p-4 bg-orange-600 rounded-xl sm:rounded-2xl shadow-lg">
                        <Users className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <div>
                        <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Manage Leads</p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                          Customer lead tracking
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Forms */}
            <div>
              <Link href="/quotes">
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                      <div className="p-2 sm:p-4 bg-emerald-600 rounded-xl sm:rounded-2xl shadow-lg">
                        <FileText className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <div>
                        <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Forms</p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                          Quote requests and forms
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Payroll */}
            <div>
              <Link href="/payroll">
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-800">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                      <div className="p-2 sm:p-4 bg-cyan-600 rounded-xl sm:rounded-2xl shadow-lg">
                        <DollarSign className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <div>
                        <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Payroll</p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                          Employee payments
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

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
              <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">8</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Need Attention</div>
                </CardContent>
              </Card>

              {/* Sent Estimate */}
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">15</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Sent Estimate</div>
                </CardContent>
              </Card>

              {/* Signed */}
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">6</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Signed</div>
                </CardContent>
              </Card>

              {/* In Progress */}
              <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">4</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">In Progress</div>
                </CardContent>
              </Card>

              {/* Complete */}
              <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">23</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Complete</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}