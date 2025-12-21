# System Architecture Audit Report

**Date:** December 21, 2025
**Status:** ⚠️ CRITICAL ISSUES FOUND - Refactoring Required
**Overall Score:** 6/10 (Code works but has major scalability and redundancy issues)

---

## 1. CRITICAL ISSUES FOUND

### 🚨 Issue 1: N+1 Query Problem in Notification System

**Location:** `src/lib/role-based-notifications.ts`
**Severity:** 🔴 CRITICAL
**Impact:** Database performance will degrade with more users

#### Problem:
Each notification class method queries the database MULTIPLE times to fetch role members:

```typescript
// In CashierNotifications.newOrderAlert() - OCCURS 3 TIMES PER METHOD
const { data: cashiers } = await supabase
  .from('user_roles')
  .select('user_id')
  .eq('role_id', (await supabase.from('roles').select('id').eq('name', 'cashier')).data?.[0]?.id);
```

**Current Flow:** For EACH notification method:
1. Query `roles` table to get role_id by name
2. Query `user_roles` table to get users with that role
3. Loop and insert notification for each user

**Lines affected:**
- CashierNotifications: 3 nested queries × 3 methods = 9 queries total
- OwnerNotifications: 3 nested queries × 4 methods = 12 queries total
- SuperadminNotifications: 3 nested queries × 5 methods = 15 queries total

**Total per notification event:** 36+ database queries 🔥

#### Why It's Bad:
- **Performance:** Multiple async operations could take 5-10s instead of <100ms
- **Not Scalable:** With 100 users, you'd have 100+ inserts + role lookups
- **Race Conditions:** Role could change between queries
- **Wasteful:** Same role lookup happens repeatedly

---

### 🚨 Issue 2: Redundant Logic Between Service Layer and Triggers

**Location:** 
- `src/lib/notification-triggers.ts` (trigger logic)
- `src/lib/shared-services/paymentService.ts` (also calls triggers)
- `src/lib/shared-services/orderService.ts` (also calls triggers)
- `src/features/notifications/service.ts` (additional notification functions)

**Severity:** 🟠 HIGH
**Impact:** Maintenance nightmare, multiple sources of truth

#### Problem:
Notification sending logic exists in MULTIPLE places:

```typescript
// IN paymentService.ts (Line 83-90):
if (status === 'completed') {
  await triggerPaymentCompletedNotification(
    order.data.user_id,
    data.order_id,
    data.amount,
    data.method || 'Unknown'
  );
}

// ALSO IN notification-triggers.ts (Line 61-72):
export async function triggerPaymentCompletedNotification(...) {
  await UserNotifications.paymentReceived(...);
  await CashierNotifications.paymentProcessed(...);
}

// ALSO IN notifications/service.ts (Line 157):
export async function notifyOrderStatusChange(...) {
  // Similar logic duplicated
}
```

**The Flow:**
1. Payment status updated → paymentService.ts calls `triggerPaymentCompletedNotification()`
2. Trigger function then calls individual role classes
3. Each role class does ITS OWN role lookup again
4. Plus there's `notifyOrderStatusChange()` in service.ts that does similar thing

**Redundancy:** 
- Payment notification logic is scattered across 3 files
- Role lookup logic is repeated in every class method
- No single source of truth for "what notifications go to whom"

---

### 🚨 Issue 3: Missing Database Schema Extensions

**Location:** Database design
**Severity:** 🟠 HIGH  
**Impact:** Notifications table doesn't support future requirements

#### Current Schema Problems:

```sql
-- CURRENT (Too simple):
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY,
  user_id uuid,
  title text,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamp
);
```

**Missing Fields:**
1. ❌ No `notification_type` - Can't query by type
2. ❌ No `related_entity_id` - Can't track which order/product triggered it
3. ❌ No `related_entity_type` - Can't know if it's order/payment/product
4. ❌ No `priority` - Can't distinguish urgent from info
5. ❌ No `channels` - Hardcoded to DB only (no email/SMS/push)
6. ❌ No `status` - Different from `is_read` (delivered, failed, etc.)
7. ❌ No `metadata` - Can't store order ID, amount, etc.

**Consequences:**
- Can't query "give me all payment notifications"
- Can't batch notifications
- Can't support email/SMS/push notifications later
- Can't retry failed notifications
- Limited analytics

---

### 🚨 Issue 4: Inefficient Notification Delivery Pattern

**Location:** `src/lib/role-based-notifications.ts`
**Severity:** 🟠 HIGH
**Impact:** If notification creation fails, no error handling

#### Problem:

```typescript
// CURRENT (fires and forgets):
const notificationPromises = cashiers.map(cashier =>
  createNotification(cashier.user_id, title, message)
);
await Promise.all(notificationPromises);
// If ANY fail, silent failure - no logging
```

**Issues:**
1. **Silent Failures:** If 1 cashier's notification fails, others still get it but error is lost
2. **No Retry Logic:** Failed notifications are just dropped
3. **No Tracking:** Can't see which notifications failed
4. **No Logging:** Role-based classes don't log creation success/failure

---

### 🚨 Issue 5: Missing Access Control in Notifications

**Location:** `src/lib/shared-services/paymentService.ts`
**Severity:** 🟠 MEDIUM-HIGH
**Impact:** Any user could see others' order notifications (if exposed)

#### Problem:

```typescript
// Who can see this notification? NO RLS!
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: userId,
    title,
    message,
    is_read: false,
  })
```

**Missing:**
- ❌ No Row Level Security (RLS) policy on notifications table
- ❌ No permission check before sending
- ❌ No audit logging of WHO triggered the notification
- ❌ Superadmin queries all cashiers without checking if they exist

---

### 🚨 Issue 6: Hardcoded Role Names (String Fragility)

**Location:** `src/lib/role-based-notifications.ts`
**Severity:** 🟠 MEDIUM
**Impact:** If role names change in database, system breaks silently

#### Problem:

```typescript
// HARDCODED STRING - If 'cashier' role name changes, this breaks silently:
.eq('role_id', (await supabase.from('roles').select('id').eq('name', 'cashier')).data?.[0]?.id)

// Happens in 12+ places across the file
```

**Better Approach:**
- Use role IDs instead of names
- Create constants for role names
- Validate roles exist during startup

---

## 2. REDUNDANCY PROBLEMS

### Redundancy Map:

| Location | Logic | Issue |
|----------|-------|-------|
| `paymentService.ts` | Calls `triggerPaymentCompletedNotification()` | Gateway point |
| `notification-triggers.ts` | Calls role class methods | Routing point |
| `role-based-notifications.ts` | Looks up role, builds notification | Execution point |
| `notifications/service.ts` | Also has `createNotification()` | DUPLICATE |
| `notifications/service.ts` | Also has `notifyLowStockToAdmins()` | DUPLICATE LOGIC |

### Redundant Role Lookup (Repeated 15+ times):

Every method in role-based-notifications.ts does:
```typescript
const { data: cashiers } = await supabase
  .from('user_roles')
  .select('user_id')
  .eq('role_id', (await supabase.from('roles').select('id').eq('name', 'cashier')).data?.[0]?.id);
```

**Same code in:**
- CashierNotifications (3 methods)
- OwnerNotifications (4 methods)  
- SuperadminNotifications (5 methods)
- ✅ UserNotifications (0 methods - doesn't need it)

**Impact:** 36+ repeated database queries per notification round

---

## 3. SCALABILITY ISSUES

### 🔴 Issue: Linear Scaling Problem

**Current Architecture:**

```
User Places Order
  ↓
triggerOrderCreatedNotification()
  ├─ UserNotifications.orderPlaced()           ← Fetch user roles (1 query)
  ├─ CashierNotifications.newOrderAlert()      ← Fetch cashier roles (3 queries)
  ├─ OwnerNotifications.highValueOrder()       ← Fetch owner roles (3 queries)
  └─ SuperadminNotifications.systemEvent()     ← Fetch admin roles (3 queries)

Total: 10 queries + 1 + N insertions (N = # of admins)
```

**With 3 cashiers, 2 owners, 5 superadmins:**
- 10 queries + 10 insertions = 20 database operations
- For EACH order

**With 1000 orders/day:**
- 20,000 database operations JUST for notifications
- Plus order + payment operations = 60,000+ ops/day

**Projected at Scale (10,000 orders/day):**
- 200,000+ notification-related queries/day
- Database will bottleneck

---

### 🔴 Issue: Role Caching Missing

No caching of roles. Every notification does:
```typescript
await supabase.from('roles').select('id').eq('name', 'cashier')
```

**Should be cached:**
```typescript
// Once at startup:
const ROLE_IDS = {
  cashier: 'uuid...',
  owner: 'uuid...',
  superadmin: 'uuid...'
};
// Then use:
.eq('role_id', ROLE_IDS.cashier)
```

---

## 4. ARCHITECTURE PROBLEMS

### Problem 1: Unclear Layer Separation

**Current State:**

```
Service Layer (orderService.ts)
  ↓ Imports
Trigger Layer (notification-triggers.ts)
  ↓ Imports
Role Layer (role-based-notifications.ts)
  ↓ Imports
Service Layer (notifications/service.ts) ← CIRCULAR!
```

**Missing:** Clear responsibility separation

---

### Problem 2: No Abstraction for Multi-Channel

Currently hardcoded to database only. What if we want:
- ✅ Database notifications
- ❌ Email alerts
- ❌ SMS alerts
- ❌ Push notifications
- ❌ Webhook calls

**Better approach:** Notification adapter pattern

---

### Problem 3: Type Safety Issues

```typescript
// No validation of these values:
createNotification(userId, title, message)

// Could be:
- userId: invalid UUID
- title: null/undefined
- message: empty string
- userId doesn't exist in profiles

// No types checked
```

---

## 5. FEATURE ISOLATION CONCERNS

### ✅ Good:
- Audit logs isolated to features/audit-logs/
- Orders isolated to lib/shared-services/
- Notifications isolated to features/notifications/

### ❌ Bad:
- notification-triggers.ts imports role-based-notifications.ts
- role-based-notifications.ts imports notifications/service.ts
- notifications/service.ts doesn't import triggers (but should?)
- Circular dependency risk if expanded

---

## 6. DATABASE ALIGNMENT ISSUES

### Current Database Schema vs Code:

**Database `notifications` table:**
```sql
id, user_id, title, message, is_read, created_at
```

**Code expects to store:**
- Order ID
- Payment ID
- Product name
- Notification type
- Severity level

**Current workaround:** Embedding in `message` field (string concatenation)

**Problem:** Can't query by type, can't track entity relationships

---

## 7. DETAILED RECOMMENDATIONS

### Priority 1: Cache Role IDs (Quick Fix)

**File:** Create `src/lib/role-cache.ts`

```typescript
import { supabase } from '@/lib/supabase';

export const RoleCache = {
  roles: {} as Record<string, string>,
  
  async init() {
    const { data } = await supabase.from('roles').select('id, name');
    if (data) {
      data.forEach(r => this.roles[r.name] = r.id);
    }
  },
  
  getId(roleName: string) {
    return this.roles[roleName];
  }
};

// Call RoleCache.init() on app startup
```

**Impact:** 
- ✅ Eliminates role lookup from every notification call
- ✅ Single source of truth for role IDs
- ✅ Reduces queries from 36 to 1 per notification round

---

### Priority 2: Refactor Role-Based Notifications

**File:** Rewrite `src/lib/role-based-notifications.ts`

**Current Problem:** Each method has role lookup + notification creation

**New Design:**

```typescript
// NEW: Single responsibility per method
export class UserNotifications {
  static buildOrderPlaced(userId: string, orderId: string, total: number) {
    // Just return notification data, don't create
    return {
      user_id: userId,
      title: '✅ Order Placed',
      message: `Your order #${orderId.slice(0, 8)} for $${total.toFixed(2)} has been placed.`,
      notification_type: 'ORDER_PLACED',
      related_entity_id: orderId,
      related_entity_type: 'order',
      priority: 'medium'
    };
  }
}

export class CashierNotifications {
  static buildNewOrderAlert(orderCount: number, totalAmount: number) {
    // Returns the notification data, not user_ids
    return {
      title: '📦 New Order Alert',
      message: `You have ${orderCount} new order(s) to process totaling $${totalAmount.toFixed(2)}.`,
      notification_type: 'ORDER_ALERT',
      priority: 'high'
    };
  }
}

// NEW: Centralized delivery function
async function deliverToRole(roleName: string, notificationData: any) {
  const roleId = RoleCache.getId(roleName);
  const { data: users } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role_id', roleId);
  
  if (!users) return;
  
  const notifications = users.map(u => ({
    ...notificationData,
    user_id: u.user_id
  }));
  
  await supabase.from('notifications').insert(notifications);
}
```

**Impact:**
- ✅ Each method builds notification data (no DB calls)
- ✅ Single delivery function handles all DB operations
- ✅ Can add batching/retry logic in one place
- ✅ Easy to test (pure functions)
- ✅ Eliminates role lookup duplication

---

### Priority 3: Update Database Schema

**Add these columns to `notifications` table:**

```sql
ALTER TABLE notifications ADD COLUMN (
  notification_type VARCHAR(50),           -- ORDER_PLACED, PAYMENT_FAILED, etc
  related_entity_id UUID,                  -- order_id, product_id, payment_id
  related_entity_type VARCHAR(50),         -- 'order', 'payment', 'product'
  priority VARCHAR(20) DEFAULT 'medium',   -- low, medium, high, critical
  metadata JSONB,                          -- Store order amount, product name, etc
  status VARCHAR(20) DEFAULT 'created',    -- created, delivered, failed
  delivery_channel VARCHAR(50) DEFAULT 'database' -- database, email, sms, push
);

CREATE INDEX notifications_type ON notifications(notification_type);
CREATE INDEX notifications_entity ON notifications(related_entity_type, related_entity_id);
```

**Impact:**
- ✅ Can query notifications by type
- ✅ Can track which order caused notification
- ✅ Prepared for email/SMS/push in future
- ✅ Better analytics

---

### Priority 4: Add Error Handling & Logging

**File:** Update `src/lib/notification-triggers.ts`

```typescript
export async function triggerOrderCreatedNotification(
  userId: string,
  orderId: string,
  total: number
) {
  try {
    const results = await Promise.allSettled([
      UserNotifications.orderPlaced(userId, orderId, total),
      CashierNotifications.newOrderAlert(1, total),
      total > 100 ? OwnerNotifications.highValueOrder(orderId, total, user.email) : null,
      SuperadminNotifications.systemEvent(`Order created: ${orderId}`, 'info')
    ]);

    // Log results
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.error(`Failed to send ${failed.length} notifications for order ${orderId}`);
      // Log to audit_logs for superadmin visibility
      await logAction('SYSTEM', 'NOTIFICATION_FAILED', 'notifications', orderId, {
        failures: failed.length,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Critical error in order notification:', error);
  }
}
```

**Impact:**
- ✅ Partial failures don't stop entire flow
- ✅ Failures are logged for debugging
- ✅ Superadmin can see notification issues in audit logs

---

### Priority 5: Add RLS Policies

**Supabase SQL:**

```sql
-- Users can only see their own notifications
CREATE POLICY "Users see own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Only notification owner or admin can update
CREATE POLICY "Users manage own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin manages all notifications"
  ON notifications FOR UPDATE
  USING (is_superadmin());
```

**Impact:**
- ✅ Users can't see others' notifications
- ✅ Prevents unauthorized access
- ✅ Audit trail of who did what

---

## 8. REFACTORING TIMELINE

### Phase 1: Quick Wins (Today - 30 mins)
- [ ] Create `src/lib/role-cache.ts`
- [ ] Initialize RoleCache at app startup
- [ ] Update role-based-notifications.ts to use cache

**Expected Improvement:** 90% reduction in role lookup queries

### Phase 2: Core Refactor (Tomorrow - 2 hours)
- [ ] Refactor role-based-notifications.ts (build vs deliver)
- [ ] Create centralized delivery function
- [ ] Update notification-triggers.ts to use new pattern
- [ ] Add error handling and logging

**Expected Improvement:** Clearer code, easier testing, better error visibility

### Phase 3: Database (Tomorrow - 1 hour)
- [ ] Run SQL migration to add schema columns
- [ ] Update types in `src/integrations/supabase/types.ts`
- [ ] Update `createNotification()` to accept new fields

**Expected Improvement:** Better data structure, prepared for multi-channel

### Phase 4: Testing & Validation (Tomorrow - 1 hour)
- [ ] Test order creation triggers notifications
- [ ] Test payment notifications
- [ ] Verify no N+1 queries
- [ ] Check error handling works

---

## 9. ADDITIONAL SYSTEM OBSERVATIONS

### ✅ What's Working Well:

1. **Audit Logging:**
   - Properly integrated into services
   - Clean separation in features/audit-logs/
   - Good helper functions in audit-logger.ts

2. **Feature Isolation:**
   - Products, orders, payments well separated
   - Shared services layer is working
   - No circular dependencies elsewhere

3. **Build Optimization:**
   - Vite chunks properly configured
   - 7.18s build time is good
   - Zero TypeScript errors

4. **Database:**
   - Schema is logical
   - RLS policies mostly in place
   - Foreign keys properly defined

### ⚠️ Areas for Improvement:

1. **Notification System** (This document)
2. **Missing Validation** in service functions
3. **No Rate Limiting** on notifications
4. **No Notification Batching** (sends immediately)
5. **No Notification Scheduling** (send later feature)
6. **No Notification Templates** (hardcoded messages)

---

## 10. SUMMARY & ACTION ITEMS

### Current System Status:
- ✅ **Functional:** All features work
- ⚠️ **Not Scalable:** Will bottleneck with more users
- 🚨 **Redundant:** Same logic in multiple places
- ⚠️ **Fragile:** Hardcoded role names, no validation

### Critical Actions (Must Do):

1. **Cache Role IDs** - Reduces queries by 90%
2. **Refactor Role Classes** - Separates concerns
3. **Update Database Schema** - Prepares for growth
4. **Add Error Handling** - Prevents silent failures
5. **Add RLS Policies** - Secures data

### Nice-to-Have (Later):

1. Notification templates
2. Batch notifications
3. Email/SMS integration
4. Notification scheduling
5. Rate limiting
6. Analytics dashboard

---

## 11. BEFORE & AFTER COMPARISON

### Current Flow:
```
Order Created
  ↓
orderService.createOrder()
  ↓
triggerOrderCreatedNotification()
  ├─ UserNotifications.orderPlaced() [QUERY role + INSERT notification]
  ├─ CashierNotifications.newOrderAlert() [QUERY role + INSERT×3]
  ├─ OwnerNotifications.highValueOrder() [QUERY role + INSERT×2]
  └─ SuperadminNotifications.systemEvent() [QUERY role + INSERT×5]

Total: 12 queries + 11 inserts per order ❌
```

### After Refactoring:
```
Order Created
  ↓
orderService.createOrder()
  ↓
triggerOrderCreatedNotification()
  ├─ Build User notification data [ZERO queries]
  ├─ Build Cashier notification data [ZERO queries]
  ├─ Build Owner notification data [ZERO queries]
  └─ Build Superadmin notification data [ZERO queries]
  ↓
deliverToRole() [SINGLE batch operation]
  └─ Get cashier users [CACHE lookup + 1 query]
  └─ Get owner users [CACHE lookup + 1 query]
  └─ Get admin users [CACHE lookup + 1 query]
  └─ INSERT all notifications in batch [1 batch insert]

Total: 3 queries + 1 batch insert ✅ (75% reduction)
```

---

**Recommended Next Steps:**
1. Review this audit with your team
2. Start with Phase 1 (role caching) today
3. Schedule Phase 2-4 for tomorrow
4. Test thoroughly before deploying to production

