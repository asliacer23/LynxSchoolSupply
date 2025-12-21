# Database Migration Checklist

**Status:** ✅ SQL Query Ready
**Date:** December 21, 2025

## Issues Fixed in Your SQL

### ✅ Issue 1: Missing DEFAULT for Status Column
**Before:**
```sql
ADD COLUMN IF NOT EXISTS status VARCHAR(20),
```

**After:**
```sql
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
```

**Why:** New notifications inserted after migration won't have a status value unless explicitly provided. Default ensures data integrity.

---

### ✅ Issue 2: Missing NOT NULL Constraint
**Added:**
```sql
ALTER TABLE notifications
  ALTER COLUMN status SET NOT NULL;
```

**Why:** Prevents NULL values which would violate the CHECK constraint logic.

---

### ✅ Issue 3: Missing RLS (Row Level Security) Policies
**Added 4 RLS policies:**
1. Users can only see their own notifications
2. System can insert notifications
3. Users can update their own notifications (mark as read)
4. Users can delete their own notifications

**Why:** Prevents users from seeing others' notifications and improves security.

---

## Complete Migration Steps

### Step 1: Run the SQL in Supabase Dashboard
1. Go to Supabase Dashboard → Your Project
2. Click **SQL Editor** → **New Query**
3. Copy the entire content from `UpdateSQLQUERY.md`
4. Click **Run**

### Step 2: Verify the Migration
```sql
-- Check the new columns exist
\d notifications;

-- Should show:
-- notification_type | character varying(50)
-- related_entity_id | uuid
-- related_entity_type | character varying(50)
-- priority | character varying(20) | DEFAULT 'medium'
-- metadata | jsonb
-- status | character varying(20) | DEFAULT 'pending' | NOT NULL
-- delivery_channel | character varying(50) | DEFAULT 'database'
```

### Step 3: Update TypeScript Types
File: `src/integrations/supabase/types.ts`

You need to regenerate types from Supabase. Use the Supabase CLI:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

Or manually update the types:
```typescript
notifications: {
  Row: {
    id: string;
    user_id: string | null;
    title: string | null;
    message: string | null;
    is_read: boolean | null;
    created_at: string | null;
    notification_type: string | null;          // NEW
    related_entity_id: string | null;          // NEW
    related_entity_type: string | null;        // NEW
    priority: string;                          // NEW (default: 'medium')
    metadata: Json | null;                     // NEW
    status: string;                            // NEW (default: 'pending', NOT NULL)
    delivery_channel: string;                  // NEW (default: 'database')
  };
  Insert: {
    // All same as Row except id and created_at are optional
  };
  Update: {
    // All same as Row but all optional
  };
}
```

### Step 4: Update `createNotification()` Function
File: `src/features/notifications/service.ts`

Update to use new fields:
```typescript
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  options?: {
    notification_type?: string;
    related_entity_id?: string;
    related_entity_type?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
    delivery_channel?: 'database' | 'email' | 'sms' | 'push';
  }
) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      is_read: false,
      notification_type: options?.notification_type,
      related_entity_id: options?.related_entity_id,
      related_entity_type: options?.related_entity_type,
      priority: options?.priority ?? 'medium',
      metadata: options?.metadata,
      status: 'pending',
      delivery_channel: options?.delivery_channel ?? 'database',
    })
    .select()
    .single();

  return { data: data as Notification | null, error };
}
```

### Step 5: Update Role-Based Notifications
File: `src/lib/role-based-notifications.ts`

Update each notification class to pass the new fields:
```typescript
static async orderPlaced(userId: string, orderId: string, total: number) {
  return createNotification(
    userId,
    '✅ Order Placed',
    `Your order #${orderId.slice(0, 8)} for $${total.toFixed(2)} has been placed.`,
    {
      notification_type: 'ORDER_PLACED',
      related_entity_id: orderId,
      related_entity_type: 'order',
      priority: 'medium',
      metadata: { orderId, total },
      delivery_channel: 'database'
    }
  );
}
```

---

## Migration Validation

After running the SQL, verify everything works:

```typescript
// Test query - should work without errors
const { data, error } = await supabase
  .from('notifications')
  .select('*')
  .eq('notification_type', 'ORDER_PLACED')
  .limit(1);

// Test insert - should work
const { data: newNotif, error: insertError } = await supabase
  .from('notifications')
  .insert({
    user_id: 'test-uuid',
    title: 'Test',
    message: 'Test message',
    notification_type: 'TEST',
    related_entity_type: 'test',
    priority: 'high',
    status: 'pending'
  });
```

---

## Rollback Plan (If Issues Occur)

If something goes wrong, you can rollback:

```sql
-- Remove RLS policies
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON notifications;

-- Remove constraints
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_priority_check;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_status_check;

-- Remove indexes
DROP INDEX IF EXISTS notifications_type;
DROP INDEX IF EXISTS notifications_entity;
DROP INDEX IF EXISTS notifications_status_priority;

-- Remove columns (one by one)
ALTER TABLE notifications DROP COLUMN IF EXISTS notification_type;
ALTER TABLE notifications DROP COLUMN IF EXISTS related_entity_id;
ALTER TABLE notifications DROP COLUMN IF EXISTS related_entity_type;
ALTER TABLE notifications DROP COLUMN IF EXISTS priority;
ALTER TABLE notifications DROP COLUMN IF EXISTS metadata;
ALTER TABLE notifications DROP COLUMN IF EXISTS status;
ALTER TABLE notifications DROP COLUMN IF EXISTS delivery_channel;
```

---

## Summary

### ✅ What's Ready:
- SQL migration script (fully corrected)
- All 7 new columns added
- Constraints for data validation
- Indexes for performance
- RLS policies for security

### 📋 Next Steps:
1. Run SQL in Supabase Dashboard
2. Regenerate TypeScript types
3. Update `createNotification()` function signature
4. Update role-based notification classes
5. Test with sample data
6. Then proceed to Phase 2: Code refactoring

### ⏱️ Estimated Time:
- SQL execution: 30 seconds
- Types update: 5 minutes
- Code updates: 30 minutes
- Testing: 15 minutes
- **Total: ~50 minutes**

---

**Ready to proceed? I can help you:**
1. Update the TypeScript types automatically
2. Update the `createNotification()` function
3. Update the role-based notification classes
4. Add tests to verify everything works

