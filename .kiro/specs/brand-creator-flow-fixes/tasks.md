# Tasks: Brand-Creator Flow Fixes

## Task 1: DB Migration — Add missing columns to campaigns table

- Create `server/migrations/001_add_missing_campaign_columns.sql` with `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS` for all 6 missing columns: `campaign_goal`, `number_of_posts`, `start_date`, `platform_fee`, `total_to_escrow`, `deliverables_required`
- Update `server/schema.sql` to include these 6 columns in the `campaigns` table definition so future fresh installs work
- Verify the migration SQL is syntactically correct

## Task 2: Fix BrandTopBar — Replace static bell with functional notifications

- Rewrite `frontend/src/components/layout/BrandTopBar.jsx` to fetch notifications from `brandApi.getBrandNotifications()` on mount
- Add a notification dropdown with unread count badge, notification list (title, message, timestamp), and empty state
- Wire up `brandApi.markBrandNotificationRead(id)` on notification click to mark as read and update local state
- Add outside-click handler to close the dropdown (same pattern as `TopBar.jsx`)
- Use `framer-motion` `AnimatePresence` for the dropdown animation (already used in `TopBar.jsx`)
- Keep the existing search input and `SessionManager` unchanged

## Task 3: Fix Creator TopBar — Add notification polling

- In `frontend/src/components/layout/TopBar.jsx`, add a `setInterval` inside the existing notification `useEffect` to re-fetch every 30 seconds
- Return a cleanup function from the `useEffect` that calls `clearInterval` to prevent memory leaks
- Ensure the immediate fetch on mount still happens before the first interval fires

## Task 4: Extract QueryClient and clear cache on logout

- Create `frontend/src/queryClient.js` exporting a single `QueryClient` instance with the existing default options
- Update `frontend/src/App.jsx` to import `queryClient` from `./queryClient` instead of defining it inline
- Update `frontend/src/store/authStore.js` to import `queryClient` from `../queryClient` and call `queryClient.clear()` inside both `logout` and `forceLogout` actions

## Task 5: Scope React Query keys to user ID

- In `frontend/src/pages/creator/DashboardPage.jsx`, update the `useQuery` key to include the logged-in user's ID
- In `frontend/src/pages/creator/IncomingRequestsPage.jsx`, update the `useQuery` key to include userId, status, and search params
- In `frontend/src/pages/creator/MyCampaignsPage.jsx`, update the `useQuery` key to include userId
- In `frontend/src/pages/brand/BrandDashboard.jsx`, update the `useQuery` key to include userId
- Search for any other `useQuery` calls in brand/creator pages and scope their keys to userId
- Use `useAuthStore(state => state.user?.id)` to get the userId in each page component
