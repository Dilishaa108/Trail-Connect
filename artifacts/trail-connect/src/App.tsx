import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ExplorePage from "@/pages/explore";
import DestinationPage from "@/pages/destination";
import DashboardPage from "@/pages/dashboard";
import AdminPage from "@/pages/admin/index";
import AdminDestinationsPage from "@/pages/admin/destinations";
import AdminGuidesPage from "@/pages/admin/guides";
import AdminUsersPage from "@/pages/admin/users";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/login" component={LoginPage} />
              <Route path="/register" component={RegisterPage} />
              <Route path="/explore" component={ExplorePage} />
              <Route path="/destinations/:id" component={DestinationPage} />
              <Route path="/dashboard">
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              </Route>
              <Route path="/admin">
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              </Route>
              <Route path="/admin/destinations">
                <ProtectedRoute requireAdmin>
                  <AdminDestinationsPage />
                </ProtectedRoute>
              </Route>
              <Route path="/admin/guides">
                <ProtectedRoute requireAdmin>
                  <AdminGuidesPage />
                </ProtectedRoute>
              </Route>
              <Route path="/admin/users">
                <ProtectedRoute requireAdmin>
                  <AdminUsersPage />
                </ProtectedRoute>
              </Route>
              <Route component={NotFound} />
            </Switch>
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
