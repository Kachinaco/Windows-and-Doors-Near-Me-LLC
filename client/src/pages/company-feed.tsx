import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft,
  User,
  Heart,
  MessageSquare,
  Share,
  Send,
  Camera,
  Smile
} from "lucide-react";
import { Link } from "wouter";

export default function CompanyFeedPage() {
  const { user } = useAuth();
  const [postContent, setPostContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch company posts
  const { data: companyPosts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/company-posts"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/company-posts", { content });
    },
    onSuccess: () => {
      setPostContent("");
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
      createPostMutation.mutate(postContent);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="h-9 min-w-[140px]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Company Feed
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {user?.firstName} {user?.lastName} ({user?.role})
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Post Creation */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Share an update with your team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <Textarea
                  placeholder="What's happening at the company?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="min-h-[100px] resize-none border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                      <Camera className="h-4 w-4 mr-1" />
                      Photo
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                      <Smile className="h-4 w-4 mr-1" />
                      Feeling
                    </Button>
                  </div>
                  <Button 
                    onClick={handlePostSubmit}
                    disabled={!postContent.trim() || createPostMutation.isPending}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {createPostMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Share Update
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Updates Feed */}
        <div className="space-y-4">
          {companyPosts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No updates yet
                </h3>
                <p className="text-gray-500">
                  Be the first to share an update with your team!
                </p>
              </CardContent>
            </Card>
          ) : (
            companyPosts.map((post: any) => (
              <Card key={post.id} className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {user?.firstName} {user?.lastName}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(post.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-gray-900 dark:text-white mb-4 whitespace-pre-wrap">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
                          <Heart className="h-4 w-4" />
                          <span>Like ({post.likesCount || 0})</span>
                        </button>
                        <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
                          <MessageSquare className="h-4 w-4" />
                          <span>Comment ({post.commentsCount || 0})</span>
                        </button>
                        <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
                          <Share className="h-4 w-4" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}