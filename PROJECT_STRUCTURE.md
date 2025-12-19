# Lynx School Supplies - System Architecture & Folder Structure

## 📋 Overview

Lynx School Supplies is a full-stack e-commerce application built with **React + TypeScript (Vite)** frontend and **Supabase** backend. The system is designed with feature-based folder organization, separating concerns into authentication, products, orders, cart management, and admin dashboards.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  src/                                                    │   │
│  │  ├── components/        (UI Components & Layouts)        │   │
│  │  ├── features/          (Feature Modules)                │   │
│  │  ├── contexts/          (Global State - Cart)            │   │
│  │  ├── hooks/             (Custom Hooks)                   │   │
│  │  ├── integrations/      (Supabase Client)                │   │
│  │  ├── lib/               (Utilities & Helpers)            │   │
│  │  └── types/             (TypeScript Type Definitions)    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           ↓↕️ (API Calls via Supabase)
┌─────────────────────────────────────────────────────────────────┐
│              Backend (Supabase PostgreSQL Database)              │
│  ├── auth.users           (Authentication)                       │
│  ├── public.* tables      (Products, Orders, Cart, etc.)        │
│  └── Migrations           (Database Schema Management)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Detailed Folder Structure

### **Root Level**

```
LynxSchoolSupplies/
├── package.json             # Project dependencies & scripts
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS theme & config
├── eslint.config.js        # Code linting rules
├── index.html              # HTML entry point
├── bun.lockb               # Package lock file (Bun package manager)
├── supabase/               # Database migrations & config
├── public/                 # Static assets
└── src/                    # Source code (main application)
```

---

## 🎯 `src/` - Source Code Structure

### **1. `src/components/` - Reusable UI Components**

**Purpose:** Shared, reusable components used throughout the app.

```
components/
├── NavLink.tsx                      # Navigation link component
├── layout/
│   ├── Header.tsx                   # App header with navigation
│   └── MainLayout.tsx               # Main layout wrapper
└── ui/                              # Shadcn UI component library
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── form.tsx
    ├── input.tsx
    ├── select.tsx
    ├── table.tsx
    ├── tabs.tsx
    └── ... (40+ pre-built UI components)
```

**Key Components:**
- **Layout Components:** Structure and organization of pages
- **UI Library:** Pre-styled Shadcn UI components using Tailwind CSS

---

### **2. `src/features/` - Feature Modules (Core Business Logic)**

**Purpose:** Organized by feature/domain. Each feature is self-contained with its own services, components, and hooks.

```
features/
│
├── auth/                            # Authentication Feature
│   ├── LoginPage.tsx                # Login form page
│   ├── RegisterPage.tsx             # Registration form page
│   └── service.ts                   # Auth API calls (login, register, logout)
│
├── home/                            # Home Page Feature
│   └── HomePage.tsx                 # Landing/home page
│
├── products/                        # Products Feature
│   ├── ProductsPage.tsx             # Products listing page
│   ├── ProductDetailPage.tsx        # Individual product details
│   ├── service.ts                   # Products API calls (fetch, search, filter)
│   ├── hooks.ts                     # Custom hooks for products (e.g., useProducts)
│   └── components/
│       ├── ProductCard.tsx          # Reusable product card
│       └── CategoryFilter.tsx       # Product category filter
│
├── orders/                          # Orders Feature
│   ├── OrdersPage.tsx               # User orders history page
│   ├── CheckoutPage.tsx             # Checkout/payment page
│   ├── service.ts                   # Orders API calls (create, fetch)
│   └── components/
│       └── CartDrawer.tsx           # Shopping cart sidebar drawer
│
├── cart/                            # Cart Feature
│   └── service.ts                   # Cart API calls (add, remove, update items)
│
└── dashboard/                       # Admin Dashboard Feature
    ├── AdminDashboardPage.tsx       # Admin statistics & management
    ├── CashierDashboardPage.tsx     # Cashier sales dashboard
    ├── service.ts                   # Dashboard API calls
    └── components/
        └── StatCard.tsx             # Statistics card component
```

**Feature Pattern:**
```
feature-name/
├── FeaturePage.tsx          # Main page component
├── service.ts               # API & business logic
├── hooks.ts                 # Custom React hooks (optional)
└── components/              # Sub-components for this feature
    ├── Component1.tsx
    └── Component2.tsx
```

---

### **3. `src/contexts/` - Global State Management**

**Purpose:** React Context API for app-wide state (avoiding prop drilling).

```
contexts/
└── CartContext.tsx                  # Global shopping cart state
                                     # Provides: cart items, add/remove logic
```

**What it does:**
- Manages cart state globally
- Provides cart data to any component that needs it
- Handles cart actions (add, remove, update quantity)

---

### **4. `src/hooks/` - Custom React Hooks**

**Purpose:** Reusable React logic extracted into custom hooks.

```
hooks/
├── useAuth.ts                       # Authentication state & user info
├── useTheme.ts                      # Dark/light theme toggle
├── use-toast.ts                     # Toast notification logic
└── use-mobile.tsx                   # Mobile responsiveness detection
```

**Examples:**
- `useAuth()` - Get current user, login status
- `useTheme()` - Toggle and manage theme
- `useToast()` - Show notifications/alerts

---

### **5. `src/integrations/` - External Service Integrations**

**Purpose:** Supabase client setup and configuration.

```
integrations/
└── supabase/
    ├── client.ts                    # Supabase client initialization
    └── types.ts                     # Supabase type definitions
```

**What it does:**
- Initializes Supabase connection
- Exports reusable Supabase client for API calls
- Defines TypeScript types for database operations

---

### **6. `src/lib/` - Utilities & Helper Functions**

**Purpose:** General-purpose utility functions and helpers.

```
lib/
├── supabase.ts                      # Supabase utility functions
└── utils.ts                         # General utility functions (formatting, validation, etc.)
```

**Common utilities:**
- Data formatting functions
- Validation helpers
- String manipulation
- API response handlers

---

### **7. `src/types/` - TypeScript Type Definitions**

**Purpose:** Centralized type definitions for the application.

```
types/
└── database.ts                      # Database schema types (generated from Supabase)
```

**What it includes:**
- User types
- Product types
- Order types
- Cart types
- All database table structures

---

### **8. `src/pages/` - Page Components**

**Purpose:** Catch-all for page-level components not organized in features.

```
pages/
└── NotFound.tsx                     # 404 error page
```

---

### **9. Root Level Files**

```
src/
├── main.tsx                         # React app entry point
├── App.tsx                          # Root component with routing
├── App.css                          # Global styles
├── index.css                        # Global CSS imports & Tailwind
└── vite-env.d.ts                    # Vite type definitions
```

---

## 🗄️ `supabase/` - Database & Migrations

**Purpose:** Database schema management and configuration.

```
supabase/
├── config.toml                      # Supabase project configuration
└── migrations/
    └── SUPABASE TABLE.sql           # Database schema migrations
```

**What it manages:**
- Database table definitions
- Schema structure
- Constraints and relationships
- Version control for database changes

---

## 🔄 Data Flow & System Interaction

### **1. User Authentication Flow**

```
LoginPage.tsx
    ↓
auth/service.ts (API call via Supabase)
    ↓
Supabase Auth (auth.users table)
    ↓
useAuth() hook (stores user state)
    ↓
Protected pages/features
```

### **2. Product Browsing Flow**

```
ProductsPage.tsx
    ↓
products/service.ts (Fetch products)
    ↓
Supabase Database (products table)
    ↓
ProductCard.tsx (Display product)
    ↓
ProductDetailPage.tsx (Show details)
```

### **3. Shopping Cart Flow**

```
ProductCard.tsx ("Add to Cart")
    ↓
CartContext.tsx (Global state update)
    ↓
cart/service.ts (Save to Supabase)
    ↓
CartDrawer.tsx (Display cart)
    ↓
CheckoutPage.tsx (Proceed to checkout)
    ↓
orders/service.ts (Create order)
    ↓
Supabase (Save order)
```

### **4. Admin Dashboard Flow**

```
AdminDashboardPage.tsx / CashierDashboardPage.tsx
    ↓
dashboard/service.ts (Fetch analytics data)
    ↓
Supabase (Query tables for statistics)
    ↓
StatCard.tsx (Display metrics)
```

---

## 📊 Key Database Tables (Supabase)

| Table | Purpose |
|-------|---------|
| `auth.users` | User authentication data |
| `public.products` | Product catalog |
| `public.categories` | Product categories |
| `public.carts` | Shopping carts |
| `public.cart_items` | Items in cart (line items) |
| `public.orders` | Customer orders |
| `public.order_items` | Items in orders (line items) |
| `public.favorites` | User favorite products |
| `public.audit_logs` | Activity logging |
| `public.files` | File storage metadata |

---

## 🔧 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS |
| **UI Components** | Shadcn UI |
| **State Management** | React Context API |
| **Backend/Database** | Supabase (PostgreSQL) |
| **Package Manager** | Bun |
| **Code Quality** | ESLint |

---

## 🔐 Authentication & Authorization

- **Provider:** Supabase Auth (Row Level Security - RLS)
- **User State:** Managed via `useAuth()` hook
- **Protected Routes:** Checked at feature level
- **Session Management:** Supabase handles JWT tokens

---

## 📦 Build & Development

### **Scripts (package.json)**
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run lint` - Run ESLint

---

## 🎨 Styling Architecture

- **Framework:** Tailwind CSS
- **UI Components:** Shadcn UI (pre-built, customizable components)
- **Theme:** Configured in `tailwind.config.ts`
- **Dark Mode:** Managed via `useTheme()` hook

---

## 📝 Summary: How the System Works

1. **User lands on homepage** → `HomePage.tsx` displays content
2. **User authenticates** → `auth/service.ts` communicates with Supabase Auth
3. **User browses products** → `products/service.ts` fetches from database → `ProductCard.tsx` renders
4. **User adds to cart** → `CartContext.tsx` manages state + `cart/service.ts` saves to database
5. **User checkouts** → `CheckoutPage.tsx` → `orders/service.ts` creates order in database
6. **Admin views dashboard** → `dashboard/service.ts` queries analytics → `StatCard.tsx` displays
7. **All data stored in Supabase** → PostgreSQL database with RLS security

This architecture ensures:
- ✅ **Modularity:** Each feature is independent
- ✅ **Scalability:** Easy to add new features
- ✅ **Maintainability:** Clear separation of concerns
- ✅ **Type Safety:** Full TypeScript coverage
- ✅ **Reusability:** Components, hooks, and utilities shared

---

## 🚀 Adding New Features

To add a new feature (e.g., "Wishlist"):

1. Create `src/features/wishlist/` folder
2. Add `WishlistPage.tsx`, `service.ts`, `components/` subfolder
3. Create API functions in `service.ts`
4. Build UI components
5. Add route in `App.tsx`
6. Create database table in Supabase
7. Export types in `src/types/database.ts`

**Pattern follows the existing feature structure for consistency.**
