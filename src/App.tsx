import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { SupportAuthProvider } from "./contexts/SupportAuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import SupportAuth from "./pages/SupportAuth";
import SupportDashboard from "./pages/SupportDashboard";
import SubscriptionExpired from "./pages/SubscriptionExpired";
import NotFound from "./pages/NotFound";

// Ultra-aggressive 100% device caching configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Never consider data stale - 100% device caching
      gcTime: 1000 * 60 * 60 * 24, // 24 hours in memory - maximum retention
      retry: 1,
      refetchOnWindowFocus: false, // Don't refetch on focus - use cache
      refetchOnMount: false, // Don't refetch on mount - use cache
      refetchOnReconnect: false, // Don't refetch on reconnect - use cache
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ErrorBoundary>
        <AuthProvider>
          <AdminAuthProvider>
            <SupportAuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <PWAInstallPrompt />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/admin/auth" element={<AdminAuth />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/support/auth" element={<SupportAuth />} />
                    <Route path="/support/dashboard" element={<SupportDashboard />} />
                    <Route path="/subscription-expired" element={<SubscriptionExpired />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </SupportAuthProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
