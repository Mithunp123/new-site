# Design: Brand-Creator Flow Fixes

## Architecture Overview

Four targeted fixes across the DB schema, backend controller, and frontend components. No new tables or API endpoints are needed — only a migration, a component replacement, a polling addition, and query key scoping.

---

## Fix 1 — DB Migration: Add missing columns to `campaigns`

### Problem
`sendCollaborationRequest` in `brandController.js` inserts 6 columns that don't exist in the `campaigns` table as defined in `schema.sql`:
- `campaign_goal TEXT`
- `number_of_posts INT DEFAULT 1`
- `start_date DATE`
- `platform_fee DECIMAL(10,2) DEFAULT 0`
- `total_to_escrow DECIMAL(10,2) DEFAULT 0`
- `deliverables_required TEXT`

### Solution
Create a migration file `server/migrations/001_add_missing_campaign_columns.sql` that uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for each missing column. Also update `schema.sql` to include these columns so future fresh installs work correctly.

The server's startup sequence should run pending migrations automatically, OR the migration can be run manually once.

### Migration SQL
```sql
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS campaign_goal TEXT AFTER title,
  ADD COLUMN IF NOT EXISTS number_of_posts INT DEFAULT 1 AFTER content_type,
  ADD COLUMN IF NOT EXISTS start_date DATE AFTER deadline,
  ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0 AFTER escrow_amount,
  ADD COLUMN IF NOT EXISTS total_to_escrow DECIMAL(10,2) DEFAULT 0 AFTER platform_fee,
  ADD COLUMN IF NOT EXISTS deliverables_required TEXT AFTER tracking_link_provided;
```

---

## Fix 2 — Brand TopBar: Replace static bell with functional notifications

### Problem
`BrandLayout.jsx` uses `BrandTopBar.jsx`, which has a hardcoded static bell with no data fetching. The functional `TopBar.jsx` (used by creators) already has working notification logic.

### Solution
Update `BrandTopBar.jsx` to include the same notification fetch + dropdown pattern as `TopBar.jsx`, adapted for the brand role. The brand-specific accent color (`#7C3AED`) and API calls (`brandApi.getBrandNotifications`, `brandApi.markBrandNotificationRead`) are already available.

### Component Structure
```
BrandTopBar
├── Search input (existing, unchanged)
├── Bell button
│   ├── Unread badge (count, hidden when 0)
│   └── Notification dropdown (AnimatePresence)
│       ├── Header ("Notifications" + unread count)
│       ├── Notification list (title, message, time, read/unread style)
│       └── Empty state ("No notifications yet")
└── SessionManager (existing, unchanged)
```

### Data Flow
- On mount: `brandApi.getBrandNotifications()` → set state
- On bell click: toggle dropdown open/close
- On notification click: `brandApi.markBrandNotificationRead(id)` → update local state (mark as read)
- Outside click: close dropdown (existing `useRef` + `mousedown` listener pattern)

---

## Fix 3 — Creator TopBar: Add polling for notifications

### Problem
`TopBar.jsx` fetches notifications once on mount. If the creator's page is open when a brand sends a request, the notification never appears until reload.

### Solution
Add a `setInterval` inside the existing `useEffect` that re-fetches notifications every 30 seconds. Clear the interval on unmount.

### Code Change (TopBar.jsx)
```js
useEffect(() => {
  const fetchNotifications = async () => { ... }; // existing logic
  fetchNotifications(); // immediate fetch on mount
  
  const interval = setInterval(fetchNotifications, 30_000); // poll every 30s
  return () => clearInterval(interval); // cleanup on unmount
}, [role]);
```

---

## Fix 4 — React Query: Scope keys to user ID + clear cache on logout

### Problem
Query keys like `['dashboard']`, `['requests']`, `['myCampaigns']` are not user-scoped. React Query's in-memory cache serves stale data from a previous user session. `logout()` in `authStore.js` never clears the cache.

### Solution

**Part A — Scope query keys** in all pages that use `useQuery`:
- `['dashboard', userId]`
- `['requests', userId, status, search]`
- `['myCampaigns', userId]`
- `['brand-dashboard', userId]`
- Any other user-specific query keys

**Part B — Clear cache on logout** by exporting the `queryClient` from `App.jsx` (or a dedicated `queryClient.js` file) and calling `queryClient.clear()` inside `authStore.logout()`.

### queryClient.js (new file)
```js
// src/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});
```

### authStore.js change
```js
import { queryClient } from '../queryClient';

logout: async () => {
  // ... existing server call ...
  queryClient.clear(); // ← add this
  clearSession();
  set({ ... });
}
```

### App.jsx change
```js
import { queryClient } from './queryClient';
// Remove the inline `new QueryClient(...)` definition
```

---

## Files to Change

| File | Change |
|---|---|
| `server/migrations/001_add_missing_campaign_columns.sql` | New file — migration SQL |
| `server/schema.sql` | Add 6 missing columns to `campaigns` table definition |
| `frontend/src/components/layout/BrandTopBar.jsx` | Replace static bell with functional notification dropdown |
| `frontend/src/components/layout/TopBar.jsx` | Add polling interval to notification fetch |
| `frontend/src/queryClient.js` | New file — extracted QueryClient instance |
| `frontend/src/App.jsx` | Import queryClient from new file instead of inline |
| `frontend/src/store/authStore.js` | Call `queryClient.clear()` in logout |
| `frontend/src/pages/creator/DashboardPage.jsx` | Scope query key to userId |
| `frontend/src/pages/creator/IncomingRequestsPage.jsx` | Scope query key to userId |
| `frontend/src/pages/creator/MyCampaignsPage.jsx` | Scope query key to userId |
| `frontend/src/pages/brand/BrandDashboard.jsx` | Scope query key to userId |
| Other brand/creator pages using useQuery | Scope query keys to userId |
