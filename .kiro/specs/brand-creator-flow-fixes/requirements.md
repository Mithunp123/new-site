# Requirements: Brand-Creator Flow Fixes

## Overview
Four bugs prevent the brand-to-creator collaboration flow from working end-to-end. This spec covers the fixes needed to make brand requests visible in the creator dashboard, notifications functional on both sides, and campaign data correctly scoped per user.

---

## Requirement 1 — Brand requests must persist and appear in the creator dashboard

**User Story:** As a creator, when a brand sends me a collaboration request, I should see it in my dashboard and requests page.

### Acceptance Criteria

1. WHEN a brand submits a collaboration request via `/brand/send-request`, THEN a campaign row is successfully inserted into the `campaigns` table with all required fields.
2. WHEN the creator visits their dashboard or `/requests` page, THEN the new campaign appears with status `request_sent`.
3. WHEN the brand's `sendCollaborationRequest` controller runs, THEN it does NOT throw a DB column-not-found error.
4. The `campaigns` table MUST contain the following columns: `campaign_goal`, `number_of_posts`, `start_date`, `platform_fee`, `total_to_escrow`, `deliverables_required`.
5. The migration MUST use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` so it is safe to run on an existing database.

---

## Requirement 2 — Brand notification bell must show real notifications

**User Story:** As a brand, I should see a notification when a creator responds to my request or when any relevant event occurs.

### Acceptance Criteria

1. WHEN the brand dashboard loads, THEN the top bar fetches notifications from `GET /api/brand/notifications`.
2. WHEN there are unread notifications, THEN the bell icon shows an unread count badge.
3. WHEN the brand clicks the bell, THEN a dropdown lists all notifications with title, message, and timestamp.
4. WHEN the brand clicks a notification, THEN it is marked as read via `PATCH /api/brand/notifications/:id/read` and the badge count decreases.
5. WHEN there are no unread notifications, THEN no badge is shown.
6. The brand notification UI MUST match the existing creator `TopBar` notification pattern.

---

## Requirement 3 — Creator notifications must update without a page reload

**User Story:** As a creator, when a brand sends me a request while my dashboard is open, I should see the notification appear automatically.

### Acceptance Criteria

1. WHEN the creator's `TopBar` mounts, THEN it fetches notifications immediately.
2. WHEN 30 seconds pass, THEN it automatically re-fetches notifications (polling).
3. WHEN the component unmounts, THEN the polling interval is cleared (no memory leaks).
4. WHEN a new unread notification arrives via polling, THEN the badge count updates without a full page reload.
5. The polling interval MUST be configurable (default 30 seconds).

---

## Requirement 4 — Campaign and dashboard data must be scoped to the logged-in user

**User Story:** As a user switching between accounts, I should only see my own data — not cached data from a previous session.

### Acceptance Criteria

1. WHEN React Query fetches dashboard, requests, or campaign data, THEN the query key MUST include the logged-in user's ID (e.g., `['dashboard', userId]`).
2. WHEN a user logs out, THEN `queryClient.clear()` is called to wipe all cached data.
3. WHEN a different user logs in on the same browser, THEN they see only their own data immediately.
4. The `staleTime` for user-specific queries MUST remain at 30 seconds (no change needed — scoping the key is sufficient).
5. The `queryClient` instance MUST be accessible from `authStore`'s logout action OR the logout flow must trigger a cache clear through another mechanism.
