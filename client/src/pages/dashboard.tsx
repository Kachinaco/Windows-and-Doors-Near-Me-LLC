import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  CalendarDays
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [previewRole, setPreviewRole] = useState<string | null>(null);

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
                Windows & Doors Near Me
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
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
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
            {user?.companyName || 'Business Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Welcome back, {user?.firstName}! 
            {effectiveUser?.role === 'customer' ? ' You have admin access to all system features.' : 
             effectiveUser?.role === 'contractor_trial' ? ' You have access to project management during your 30-day trial.' :
             effectiveUser?.role === 'contractor_paid' ? ' You have full access to all contractor features.' :
             ' You have admin access to all system features.'}
          </p>
        </div>

        {/* Main Action Cards - 2x3 Grid */}
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
          <Link href="/scheduling">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                  <div className="p-2 sm:p-4 bg-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
                    <CalendarDays className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Calendar</p>
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
                    <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Manage Leads</p>
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
                    <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Forms</p>
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
                    <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Settings</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                      Configure your account
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Reports */}
          <Link href="/pipeline">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                  <div className="p-2 sm:p-4 bg-indigo-600 rounded-xl sm:rounded-2xl shadow-lg">
                    <BarChart3 className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Reports</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                      Analytics and insights
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

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
                  <Button variant="ghost" size="sm" className="text-purple-600 dark:text-purple-400">
                    Open
                  </Button>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Share */}
          <Card className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <input 
                    type="text" 
                    placeholder="Share something..." 
                    className="w-full bg-transparent text-gray-500 dark:text-gray-400 text-sm border-none outline-none"
                    readOnly
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Updates */}
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