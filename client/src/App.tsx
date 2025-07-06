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
import CatalogPage from "@/pages/catalog";
import QuotePage from "@/pages/quote";
import ProjectsPage from "@/pages/projects";

import SimpleExcelManager from "@/pages/simple-excel-manager";
import MondayBoard from "@/pages/monday-board";
import ProjectPanel from "@/pages/project-panel";
import PipelinePage from "@/pages/pipeline";
import LeadsPage from "@/pages/leads";
import SchedulingPage from "@/pages/scheduling";
import ProposalsPage from "@/pages/proposals";
import ProjectDetailPage from "@/pages/project-detail";
import SubscriptionPage from "@/pages/subscription";
import QuotesDashboard from "@/pages/quotes-dashboard";
import SettingsPage from "@/pages/settings";
import CalendarView from "@/pages/calendar";
import UpdatesPage from "@/pages/updates";
import CompanyFeedPage from "@/pages/company-feed";
import LeadDetailPage from "@/pages/lead-detail";
import ProjectDashboardPage from "@/pages/project-dashboard";
import ProjectPortfolioPage from "@/pages/project-portfolio";
import CompanySettingsPage from "@/pages/company-settings";
import QuoteDashboard from "@/pages/quote-dashboard";
import PayrollPage from "@/pages/payroll";
import CustomerOrdersPage from "@/pages/customer-orders";
import CustomerDeliveryPage from "@/pages/customer-delivery";
import CustomerSettingsPage from "@/pages/customer-settings";
import ContractsPage from "@/pages/contracts";
import ProposalClientPage from "@/pages/proposal-client";
import EnhancedBoard from "@/pages/enhanced-board";
import NavigationPage from "@/pages/navigation";
import Blog from "@/pages/blog";
import CrmDashboard from "@/pages/crm-dashboard";
import DashboardOld from "@/pages/dashboard-old";
import ExcelProjectManager from "@/pages/excel-project-manager";
import ProjectPanelClean from "@/pages/project-panel-clean";
import ProjectTable from "@/pages/project-table";
import QuoteBroken from "@/pages/quote-broken";
import SettingsBroken from "@/pages/settings-broken";

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
      <Route path="/" component={isAuthenticated ? Dashboard : AuthPage} />
      <Route path="/gilbert-windows-doors" component={GilbertWindowsDoors} />
      <Route path="/mesa-windows-doors" component={MesaWindowsDoors} />
      <Route path="/chandler-windows-doors" component={ChandlerWindowsDoors} />
      <Route path="/tempe-windows-doors" component={TempeWindowsDoors} />
      <Route path="/scottsdale-windows-doors" component={ScottsdaleWindowsDoors} />
      <Route path="/queen-creek-windows-doors" component={QueenCreekWindowsDoors} />
      
      {/* Authentication routes */}
      <Route path="/login" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Public proposal routes */}
      <Route path="/proposal/:id" component={ProposalClientPage} />
      <Route path="/proposal/:id/client-view" component={ProposalClientPage} />
      
      {/* Public catalog and quote routes */}
      <Route path="/catalog" component={CatalogPage} />
      <Route path="/quote" component={QuotePage} />
      <Route path="/quote/:id" component={QuoteDashboard} />
      
      {/* Navigation page */}
      <Route path="/navigation" component={NavigationPage} />
      <Route path="/nav" component={NavigationPage} />
      
      {/* Direct access to Monday.com board for testing */}
      <Route path="/board" component={MondayBoard} />
      <Route path="/monday-board" component={MondayBoard} />
      <Route path="/enhanced-board" component={EnhancedBoard} />
      <Route path="/project-panel" component={ProjectPanel} />
      <Route path="/project-panel-clean" component={ProjectPanelClean} />
      
      {/* Additional development and testing pages */}
      <Route path="/blog" component={Blog} />
      <Route path="/dashboard-old" component={DashboardOld} />
      <Route path="/excel-project-manager" component={ExcelProjectManager} />
      <Route path="/project-table" component={ProjectTable} />
      <Route path="/quote-broken" component={QuoteBroken} />
      <Route path="/settings-broken" component={SettingsBroken} />
      <Route path="/simple-excel-manager" component={SimpleExcelManager} />
      <Route path="/crm-dashboard" component={CrmDashboard} />
      
      {/* Protected user routes */}
      {isAuthenticated ? (
        <>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/catalog" component={CatalogPage} />
          <Route path="/quotes-manager" component={QuoteDashboard} />
          <Route path="/quote" component={QuotePage} />
          <Route path="/projects" component={MondayBoard} />
          <Route path="/projects/:id" component={ProjectDashboardPage} />
          <Route path="/projects/:id/detail" component={ProjectDetailPage} />
          <Route path="/projects-list" component={ProjectsPage} />
          <Route path="/project-portfolio" component={ProjectPortfolioPage} />
          <Route path="/pipeline" component={PipelinePage} />
          <Route path="/leads" component={LeadsPage} />
          <Route path="/leads/:id" component={LeadDetailPage} />
          <Route path="/scheduling" component={SchedulingPage} />
          <Route path="/proposals" component={ProposalsPage} />
          <Route path="/quotes" component={QuotesDashboard} />
          <Route path="/subscription" component={SubscriptionPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/company-settings" component={CompanySettingsPage} />
          <Route path="/calendar" component={CalendarView} />
          <Route path="/updates" component={UpdatesPage} />
          <Route path="/company-feed" component={CompanyFeedPage} />
          <Route path="/payroll" component={PayrollPage} />
          <Route path="/contracts" component={ContractsPage} />
          <Route path="/customer-orders" component={CustomerOrdersPage} />
          <Route path="/customer-delivery" component={CustomerDeliveryPage} />
          <Route path="/customer-settings" component={CustomerSettingsPage} />
        </>
      ) : (
        <>
          <Route path="/dashboard" component={AuthPage} />
          <Route path="/catalog" component={AuthPage} />
          <Route path="/projects" component={AuthPage} />
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
