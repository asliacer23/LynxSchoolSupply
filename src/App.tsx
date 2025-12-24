import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { roleCache } from "@/lib/role-cache";

// Feature pages
import HomePage from "@/features/home/pages/HomePage";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import ProductsPage from "@/features/products/pages/ProductsPage";
import ProductDetailPage from "@/features/products/pages/ProductDetailPage";
import ProductsManagePage from "@/features/products/pages/ProductsManagePage";
import OrdersPage from "@/features/orders/pages/OrdersPage";
import CheckoutPage from "@/features/orders/pages/CheckoutPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import CleanupPage from "@/features/dashboard/pages/CleanupPage";
import NotificationsPage from "@/features/notifications/pages/NotificationsPage";
import PaymentHistoryPage from "@/features/payments/pages/PaymentHistoryPage";
import POSPage from "@/features/orders/pages/POSPage";
import AuditLogsPage from "@/features/audit-logs/pages/AuditLogsPage";
import AddressesPage from "@/features/address/pages/AddressesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize role cache in background (non-blocking)
  useEffect(() => {
    setIsInitializing(true);
    roleCache.init()
      .catch(err => console.error('Failed to initialize role cache:', err))
      .finally(() => setIsInitializing(false));
  }, []);

  // Show loading screen only on first load
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes (no layout) */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          
          {/* Main routes with layout */}
          <Route element={<MainLayout />}>
            {/* Public routes - accessible to everyone */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute config={{ allowGuest: true, requireAuth: false }}>
                  <HomePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/products" 
              element={
                <ProtectedRoute config={{ allowGuest: true, requireAuth: false }}>
                  <ProductsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/products/:id" 
              element={
                <ProtectedRoute config={{ allowGuest: true, requireAuth: false }}>
                  <ProductDetailPage />
                </ProtectedRoute>
              } 
            />

            {/* User orders - users can see only their orders, staff can see all */}
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute 
                  config={{ 
                    requireAuth: true,
                    requiredPermissions: ['view_own_orders', 'view_all_orders']
                  }}
                >
                  <OrdersPage />
                </ProtectedRoute>
              } 
            />

            {/* Checkout - requires checkout permission */}
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute 
                  config={{ 
                    requireAuth: true,
                    requiredPermissions: ['checkout']
                  }}
                >
                  <CheckoutPage />
                </ProtectedRoute>
              } 
            />

            {/* Dashboard - staff only (cashier, owner, superadmin) */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute 
                  config={{ 
                    requireAuth: true,
                    requiredRoles: ['superadmin', 'owner', 'cashier'],
                    requiredPermissions: ['view_dashboard']
                  }}
                >
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />

            {/* Products Management - admin only (superadmin, owner) */}
            <Route 
              path="/products/manage" 
              element={
                <ProtectedRoute 
                  config={{ 
                    requireAuth: true,
                    requiredRoles: ['superadmin', 'owner'],
                    requiredPermissions: ['create_product']
                  }}
                >
                  <ProductsManagePage />
                </ProtectedRoute>
              } 
            />

            {/* Notifications - authenticated users only */}
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute 
                  config={{ 
                    requireAuth: true
                  }}
                >
                  <NotificationsPage />
                </ProtectedRoute>
              } 
            />

            {/* Addresses - authenticated users only */}
            <Route 
              path="/addresses" 
              element={
                <ProtectedRoute 
                  config={{ 
                    requireAuth: true
                  }}
                >
                  <AddressesPage />
                </ProtectedRoute>
              } 
            />

            {/* Payment History - authenticated users only */}
            <Route 
              path="/payments" 
              element={
                <ProtectedRoute 
                  config={{ 
                    requireAuth: true
                  }}
                >
                  <PaymentHistoryPage />
                </ProtectedRoute>
              } 
            />

            {/* Cashier POS - cashier and staff only */}
            <Route 
              path="/cashier/pos" 
              element={
                <ProtectedRoute 
                  config={{ 
                    requireAuth: true,
                    requiredRoles: ['superadmin', 'owner', 'cashier']
                  }}
                >
                  <POSPage />
                </ProtectedRoute>
              } 
            />

            {/* Audit Logs - superadmin and owner only (NOT cashier) */}
            <Route 
              path="/admin/audit-logs" 
              element={
                <ProtectedRoute 
                  config={{ 
                    requireAuth: true,
                    requiredRoles: ['superadmin', 'owner'],
                    requiredPermissions: ['view_audit_logs']
                  }}
                >
                  <AuditLogsPage />
                </ProtectedRoute>
              } 
            />

            {/* Database Cleanup - admin only (superadmin, owner) */}
            <Route 
              path="/admin/cleanup" 
              element={
                <ProtectedRoute 
                  config={{ 
                    requireAuth: true,
                    requiredRoles: ['superadmin', 'owner'],
                    requiredPermissions: ['access_admin_panel']
                  }}
                >
                  <CleanupPage />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
