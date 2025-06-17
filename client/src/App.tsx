import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import GilbertWindowsDoors from "@/pages/gilbert-windows-doors";
import MesaWindowsDoors from "@/pages/mesa-windows-doors";
import ChandlerWindowsDoors from "@/pages/chandler-windows-doors";
import TempeWindowsDoors from "@/pages/tempe-windows-doors";
import ScottsdaleWindowsDoors from "@/pages/scottsdale-windows-doors";
import QueenCreekWindowsDoors from "@/pages/queen-creek-windows-doors";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import ProjectsPage from "@/pages/projects";
import TasksPage from "@/pages/tasks";
import LeadsPage from "@/pages/leads";

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
      {/* Public marketing website routes */}
      <Route path="/" component={Home} />
      <Route path="/gilbert-windows-doors" component={GilbertWindowsDoors} />
      <Route path="/mesa-windows-doors" component={MesaWindowsDoors} />
      <Route path="/chandler-windows-doors" component={ChandlerWindowsDoors} />
      <Route path="/tempe-windows-doors" component={TempeWindowsDoors} />
      <Route path="/scottsdale-windows-doors" component={ScottsdaleWindowsDoors} />
      <Route path="/queen-creek-windows-doors" component={QueenCreekWindowsDoors} />
      
      {/* Authentication routes */}
      <Route path="/login" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected project management routes */}
      {isAuthenticated ? (
        <>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/projects" component={ProjectsPage} />
          <Route path="/projects/:id" component={ProjectsPage} />
          <Route path="/tasks" component={TasksPage} />
          <Route path="/leads" component={LeadsPage} />
        </>
      ) : (
        <>
          <Route path="/dashboard" component={AuthPage} />
          <Route path="/projects" component={AuthPage} />
          <Route path="/projects/:id" component={AuthPage} />
          <Route path="/tasks" component={AuthPage} />
          <Route path="/leads" component={AuthPage} />
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
