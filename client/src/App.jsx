import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Users from "@/pages/Users";
import Verification from "@/pages/Verification";
import Moderation from "@/pages/Moderation";
import Analytics from "@/pages/Analytics";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/" component={Analytics} />
      <Route path="/users" component={Users} />
      <Route path="/verification" component={Verification} />
      <Route path="/moderation" component={Moderation} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppRoutes />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
