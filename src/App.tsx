import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Feature pages
import HomePage from "@/features/home/HomePage";
import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";
import ProductsPage from "@/features/products/ProductsPage";
import ProductDetailPage from "@/features/products/ProductDetailPage";
import ProductsManagePage from "@/features/products/ProductsManagePage";
import OrdersPage from "@/features/orders/OrdersPage";
import CheckoutPage from "@/features/orders/CheckoutPage";
import AdminDashboardPage from "@/features/dashboard/AdminDashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes (no layout) */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          
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
                  <AdminDashboardPage />
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
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
