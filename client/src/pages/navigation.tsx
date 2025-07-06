import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Building2, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  DollarSign,
  BarChart3,
  MessageSquare,
  Bell,
  UserCheck,
  MapPin,
  Briefcase,
  Target,
  Clock,
  ArrowRight,
  Shield,
  CreditCard,
  Package,
  Truck,
  FileCheck,
  Activity,
  TrendingUp,
  Phone,
  Mail,
  Star,
  Zap
} from "lucide-react";
import { Link } from "wouter";

interface PageLink {
  title: string;
  description: string;
  path: string;
  icon: any;
  category: string;
  requiresAuth?: boolean;
  roles?: string[];
  badge?: string;
}

export default function NavigationPage() {
  const { user, isAuthenticated } = useAuth();

  const pageLinks: PageLink[] = [
    // Public Pages
    {
      title: "Home",
      description: "Main landing page for Windows & Doors Near Me LLC",
      path: "/",
      icon: Home,
      category: "Public Pages"
    },
    {
      title: "Authentication",
      description: "Login and registration page",
      path: "/auth",
      icon: Shield,
      category: "Public Pages"
    },
    {
      title: "Gilbert Windows & Doors",
      description: "Services for Gilbert, Arizona",
      path: "/gilbert-windows-doors",
      icon: MapPin,
      category: "Location Pages"
    },
    {
      title: "Mesa Windows & Doors",
      description: "Services for Mesa, Arizona",
      path: "/mesa-windows-doors",
      icon: MapPin,
      category: "Location Pages"
    },
    {
      title: "Chandler Windows & Doors",
      description: "Services for Chandler, Arizona",
      path: "/chandler-windows-doors",
      icon: MapPin,
      category: "Location Pages"
    },
    {
      title: "Tempe Windows & Doors",
      description: "Services for Tempe, Arizona",
      path: "/tempe-windows-doors",
      icon: MapPin,
      category: "Location Pages"
    },
    {
      title: "Scottsdale Windows & Doors",
      description: "Services for Scottsdale, Arizona",
      path: "/scottsdale-windows-doors",
      icon: MapPin,
      category: "Location Pages"
    },
    {
      title: "Queen Creek Windows & Doors",
      description: "Services for Queen Creek, Arizona",
      path: "/queen-creek-windows-doors",
      icon: MapPin,
      category: "Location Pages"
    },

    // Dashboard & Main Pages
    {
      title: "Dashboard",
      description: "Main business dashboard with activity feed",
      path: "/dashboard",
      icon: BarChart3,
      category: "Dashboard",
      requiresAuth: true
    },
    {
      title: "Catalog",
      description: "Product catalog and window configurations",
      path: "/catalog",
      icon: Package,
      category: "Products",
      requiresAuth: true
    },
    {
      title: "Window Configurator",
      description: "Interactive window configuration tool",
      path: "/quote",
      icon: Zap,
      category: "Products",
      requiresAuth: true
    },

    // Project Management
    {
      title: "Monday.com Style Board",
      description: "Main project management board with drag-and-drop",
      path: "/projects",
      icon: Briefcase,
      category: "Project Management",
      requiresAuth: true,
      badge: "Main"
    },
    {
      title: "Projects List",
      description: "Traditional project list view",
      path: "/projects-list",
      icon: FileText,
      category: "Project Management",
      requiresAuth: true
    },
    {
      title: "Project Portfolio",
      description: "Comprehensive project portfolio system",
      path: "/project-portfolio",
      icon: Target,
      category: "Project Management",
      requiresAuth: true
    },
    {
      title: "Pipeline",
      description: "Sales pipeline and project stages",
      path: "/pipeline",
      icon: TrendingUp,
      category: "Project Management",
      requiresAuth: true
    },

    // Lead Management
    {
      title: "Leads Dashboard",
      description: "Lead management and tracking",
      path: "/leads",
      icon: Users,
      category: "Lead Management",
      requiresAuth: true
    },
    {
      title: "Quotes Dashboard",
      description: "Quote management and tracking",
      path: "/quotes",
      icon: DollarSign,
      category: "Lead Management",
      requiresAuth: true
    },
    {
      title: "Quotes Manager",
      description: "Comprehensive quote management system",
      path: "/quotes-manager",
      icon: FileCheck,
      category: "Lead Management",
      requiresAuth: true
    },

    // Scheduling & Calendar
    {
      title: "Scheduling",
      description: "Job scheduling and crew management",
      path: "/scheduling",
      icon: Clock,
      category: "Scheduling",
      requiresAuth: true
    },
    {
      title: "Calendar View",
      description: "Calendar interface for appointments",
      path: "/calendar",
      icon: Calendar,
      category: "Scheduling",
      requiresAuth: true
    },

    // Business Operations
    {
      title: "Proposals",
      description: "Proposal management and tracking",
      path: "/proposals",
      icon: FileText,
      category: "Business Operations",
      requiresAuth: true
    },
    {
      title: "Contracts",
      description: "Contract management system",
      path: "/contracts",
      icon: FileCheck,
      category: "Business Operations",
      requiresAuth: true
    },
    {
      title: "Payroll",
      description: "Employee payroll management",
      path: "/payroll",
      icon: CreditCard,
      category: "Business Operations",
      requiresAuth: true,
      roles: ["admin", "contractor_paid"]
    },

    // Communication & Updates
    {
      title: "Activity Updates",
      description: "Project activity and update tracking",
      path: "/updates",
      icon: Activity,
      category: "Communication",
      requiresAuth: true
    },
    {
      title: "Company Feed",
      description: "Internal company social feed",
      path: "/company-feed",
      icon: MessageSquare,
      category: "Communication",
      requiresAuth: true
    },

    // Customer Pages
    {
      title: "Customer Orders",
      description: "Customer order tracking and management",
      path: "/customer-orders",
      icon: Package,
      category: "Customer Portal",
      requiresAuth: true
    },
    {
      title: "Customer Delivery",
      description: "Delivery tracking and status",
      path: "/customer-delivery",
      icon: Truck,
      category: "Customer Portal",
      requiresAuth: true
    },
    {
      title: "Customer Settings",
      description: "Customer account settings",
      path: "/customer-settings",
      icon: Settings,
      category: "Customer Portal",
      requiresAuth: true
    },

    // Settings & Configuration
    {
      title: "Settings",
      description: "User profile and account settings",
      path: "/settings",
      icon: Settings,
      category: "Settings",
      requiresAuth: true
    },
    {
      title: "Company Settings",
      description: "Company-wide settings and configuration",
      path: "/company-settings",
      icon: Building2,
      category: "Settings",
      requiresAuth: true,
      roles: ["admin", "contractor_paid"]
    },
    {
      title: "Subscription",
      description: "Subscription management and billing",
      path: "/subscription",
      icon: CreditCard,
      category: "Settings",
      requiresAuth: true
    }
  ];

  const groupedPages = pageLinks.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, PageLink[]>);

  const canAccessPage = (page: PageLink) => {
    if (!page.requiresAuth) return true;
    if (!isAuthenticated) return false;
    if (!page.roles) return true;
    return page.roles.includes(user?.role || "");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Public Pages": return Home;
      case "Location Pages": return MapPin;
      case "Dashboard": return BarChart3;
      case "Products": return Package;
      case "Project Management": return Briefcase;
      case "Lead Management": return Users;
      case "Scheduling": return Calendar;
      case "Business Operations": return Building2;
      case "Communication": return MessageSquare;
      case "Customer Portal": return UserCheck;
      case "Settings": return Settings;
      default: return FileText;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Site Navigation</h1>
              <p className="text-gray-600 mt-2">
                Complete directory of all pages and features in Windows & Doors Near Me LLC
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {isAuthenticated ? (
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      Logged in as {user?.username}
                    </Badge>
                    <div className="text-xs">Role: {user?.role}</div>
                  </div>
                ) : (
                  <Badge variant="outline">Not authenticated</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Categories */}
        <div className="space-y-8">
          {Object.entries(groupedPages).map(([category, pages]) => {
            const CategoryIcon = getCategoryIcon(category);
            
            return (
              <Card key={category} className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-3">
                    <CategoryIcon className="h-6 w-6" />
                    {category}
                    <Badge variant="secondary" className="ml-2 text-blue-600">
                      {pages.length} pages
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pages.map((page) => {
                      const Icon = page.icon;
                      const canAccess = canAccessPage(page);
                      
                      return (
                        <div
                          key={page.path}
                          className={`border rounded-lg p-4 transition-all duration-200 ${
                            canAccess
                              ? "hover:shadow-md hover:border-blue-300 bg-white"
                              : "bg-gray-50 border-gray-200 opacity-60"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              canAccess ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-400"
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-semibold ${
                                  canAccess ? "text-gray-900" : "text-gray-500"
                                }`}>
                                  {page.title}
                                </h3>
                                {page.badge && (
                                  <Badge variant="outline" className="text-xs">
                                    {page.badge}
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-sm mb-3 ${
                                canAccess ? "text-gray-600" : "text-gray-400"
                              }`}>
                                {page.description}
                              </p>
                              {canAccess ? (
                                <Link href={page.path}>
                                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-0">
                                    Visit Page
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  </Button>
                                </Link>
                              ) : (
                                <div className="text-xs text-gray-400">
                                  {page.requiresAuth && !isAuthenticated ? (
                                    "Login required"
                                  ) : page.roles && !page.roles.includes(user?.role || "") ? (
                                    `Requires: ${page.roles.join(", ")}`
                                  ) : (
                                    "Access restricted"
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Total pages: {pageLinks.length} • 
            Accessible: {pageLinks.filter(canAccessPage).length} • 
            Restricted: {pageLinks.filter(p => !canAccessPage(p)).length}
          </p>
        </div>
      </div>
    </div>
  );
}