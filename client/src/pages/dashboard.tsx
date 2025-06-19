import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  Users, 
  LogOut,
  User,
  Settings,
  Eye
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
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Windows & Doors Near Me
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.firstName} {user?.lastName} ({effectiveUser?.role})
                  {previewRole && <span className="text-blue-600 font-medium"> (Preview Mode)</span>}
                </span>
              </div>

              {/* Admin Role Switcher */}
              {user?.role === 'admin' && (
                <div className="flex items-center space-x-2">
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
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Milgard Product Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {user?.firstName}! 
            {effectiveUser?.role === 'customer' ? ' Browse our Milgard windows and doors catalog.' : 
             effectiveUser?.role === 'contractor_trial' ? ' You have access to project management during your 30-day trial.' :
             effectiveUser?.role === 'contractor_paid' ? ' You have full access to all contractor features.' :
             ' You have admin access to all system features.'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Product Catalog for Customers */}
          {effectiveUser?.role === 'customer' && (
            <Link href="/catalog">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">Browse Products</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        View Milgard windows and doors
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Project Management for Contractors */}
          {(effectiveUser?.role === 'contractor_trial' || effectiveUser?.role === 'contractor_paid' || effectiveUser?.role === 'admin') && (
            <Link href="/projects">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">Project Management</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {effectiveUser?.role === 'contractor_trial' ? 'Manage projects (trial)' : 'Manage installation projects'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          <Link href="/subscription">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-lg font-medium text-gray-900 dark:text-white">Subscription</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {effectiveUser?.role === 'customer' ? 'Upgrade to contractor' : 
                       effectiveUser?.role === 'contractor_trial' ? 'Upgrade to paid plan' :
                       'Manage subscription'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {(effectiveUser?.role === 'admin' || effectiveUser?.role === 'contractor_paid') && (
            <Link href="/leads">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <Users className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">Manage Leads</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        View customer inquiries
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Welcome Message */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Welcome to your Milgard Product Portal
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Browse our complete catalog of Milgard windows and doors. Add items to your cart and submit orders for quotes.
              </p>
              <div className="flex justify-center space-x-4">
                <Link href="/catalog">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Start Shopping
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">
                    Visit Website
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}