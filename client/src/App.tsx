import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import MondayBoard from "@/pages/monday-board";
import LeadsPage from "@/pages/leads";
import SettingsPage from "@/pages/settings";
import ProjectDetailPage from "@/pages/project-detail";
import LeadDetailPage from "@/pages/lead-detail";
import UnifiedDashboard from "@/pages/unified-dashboard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Main routes */}
      <Route path="/" component={isAuthenticated ? Dashboard : AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected user routes */}
      {isAuthenticated ? (
        <>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/unified" component={UnifiedDashboard} />
          <Route path="/projects" component={MondayBoard} />
          <Route path="/projects/:id/detail" component={ProjectDetailPage} />
          <Route path="/leads" component={LeadsPage} />
          <Route path="/leads/:id" component={LeadDetailPage} />
          <Route path="/settings" component={SettingsPage} />
        </>
      ) : (
        <>
          <Route path="/dashboard" component={AuthPage} />
          <Route path="/projects" component={AuthPage} />
          <Route path="/leads" component={AuthPage} />
          <Route path="/settings" component={AuthPage} />
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
