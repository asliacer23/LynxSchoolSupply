import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// SPA Fallback Middleware for development
const spaFallbackPlugin = {
  name: 'spa-fallback',
  configureServer(server: any) {
    return () => {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.method === 'GET' && !req.url.match(/\.(js|css|jpg|jpeg|png|gif|svg|ico|json|woff|woff2|ttf|eot)(\?|$)/) && !req.url.startsWith('/api')) {
          req.url = '/index.html';
        }
        next();
      });
    };
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), spaFallbackPlugin, mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          react: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tabs"],
          forms: ["react-hook-form", "zod"],
          tanstack: ["@tanstack/react-query"],
          
          // Feature chunks
          products: [
            "src/features/products/services/products.service.ts",
            "src/features/products/pages/ProductsPage.tsx",
            "src/features/products/pages/ProductDetailPage.tsx",
          ],
          orders: [
            "src/features/orders/services/orders.service.ts",
            "src/features/orders/pages/CheckoutPage.tsx",
            "src/features/orders/pages/OrdersPage.tsx",
          ],
          dashboard: [
            "src/features/dashboard/pages/DashboardPage.tsx",
            "src/features/dashboard/services/dashboard.service.ts",
          ],
          payments: [
            "src/features/payments/services/payments.service.ts",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
