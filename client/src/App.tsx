import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import GilbertWindowsDoors from "@/pages/gilbert-windows-doors";
import MesaWindowsDoors from "@/pages/mesa-windows-doors";
import ChandlerWindowsDoors from "@/pages/chandler-windows-doors";
import TempeWindowsDoors from "@/pages/tempe-windows-doors";
import ScottsdaleWindowsDoors from "@/pages/scottsdale-windows-doors";
import QueenCreekWindowsDoors from "@/pages/queen-creek-windows-doors";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/gilbert-windows-doors" component={GilbertWindowsDoors} />
      <Route path="/mesa-windows-doors" component={MesaWindowsDoors} />
      <Route path="/chandler-windows-doors" component={ChandlerWindowsDoors} />
      <Route path="/tempe-windows-doors" component={TempeWindowsDoors} />
      <Route path="/scottsdale-windows-doors" component={ScottsdaleWindowsDoors} />
      <Route path="/queen-creek-windows-doors" component={QueenCreekWindowsDoors} />
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
