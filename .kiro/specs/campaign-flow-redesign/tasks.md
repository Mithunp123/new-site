# Implementation Plan: Campaign Flow Redesign

## Overview

Implement the end-to-end campaign flow redesign on the Gradix platform. The work is split into: database schema migrations, backend API additions/modifications (Node.js/Express), and frontend component rewrites (React/Vite/TanStack Query). Tasks are ordered so each step builds on the previous, ending with full integration.

---

## Tasks

- [ ] 1. Database schema migrations
  - [ ] 1.1 Apply `campaigns` table schema changes
    - Modify `campaigns.status` ENUM to include `'negotiating'` before `'declined'`
    - Add `negotiate_amount DECIMAL(10,2) NULL DEFAULT NULL` column (idempotent `ADD COLUMN IF NOT EXISTS`)
    - Add `negotiate_message TEXT NULL DEFAULT NULL` column (idempotent)
    - Write migration SQL file at `server/src/migrations/001_campaign_negotiation_schema.sql`
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 1.2 Create `campaign_negotiations` table
    - Create table with columns: `id`, `campaign_id` (FK → campaigns.id ON DELETE CASCADE), `proposed_by` ENUM('brand','creator'), `amount` DECIMAL(10,2), `message` TEXT NULL, `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    - Add index `idx_neg_campaign` on `campaign_id`
    - Write as part of `server/src/migrations/001_campaign_negotiation_schema.sql`
    - _Requirements: 10.4_

  - [ ] 1.3 Alter `content_submissions` table
    - Add `platform VARCHAR(50) NULL DEFAULT NULL` column (idempotent)
    - Add `content_url VARCHAR(500) NULL DEFAULT NULL` column (idempotent)
    - Append to `server/src/migrations/001_campaign_negotiation_schema.sql`
    - _Requirements: 10.5, 10.6_

- [ ] 2. Backend — notifications endpoint
  - [ ] 2.1 Create `notificationsController.js`
    - Create `server/src/controllers/notificationsController.js`
    - Implement `markAllRead`: read `user_type` and `user_id` from `req.user`, run `UPDATE notifications SET is_read = true WHERE user_type = ? AND user_id = ? AND is_read = false`, return `success(res, { updated_count })`
    - _Requirements: 8.3, 8.4, 10.7_

  - [ ] 2.2 Create `notifications.js` route and register in `app.js`
    - Create `server/src/routes/notifications.js` with `router.put('/read-all', notificationsController.markAllRead)` behind `verifyToken`
    - Register `app.use('/api/notifications', require('./src/routes/notifications'))` in `server/src/app.js`
    - _Requirements: 10.7_

  - [ ]* 2.3 Write unit tests for `markAllRead`
    - Test: marks all unread notifications for the correct user only
    - Test: returns `updated_count` equal to the number of rows changed
    - Test: returns 0 when no unread notifications exist
    - _Requirements: 8.3, 8.4_

- [ ] 3. Backend — negotiation endpoints
  - [ ] 3.1 Implement `submitNegotiation` in `campaignController.js`
    - Add `submitNegotiation` method: verify token, load campaign (404), verify caller is brand or creator (403), validate `amount > 0` (400), derive `proposed_by` from `req.user.role`, INSERT into `campaign_negotiations`, UPDATE `campaigns` status to `'negotiating'` and `negotiate_amount`, INSERT `campaign_timeline` row, INSERT notification for opposing party, call `broadcastCampaignUpdate`
    - _Requirements: 2.1, 2.2, 2.5, 2.6_

  - [ ]* 3.2 Write property test for `submitNegotiation` — Property 2
    - **Property 2: Counter-offer insertion and status transition**
    - For any valid counter-offer payload, assert exactly one `campaign_negotiations` row is inserted with matching fields AND `campaigns.status` becomes `'negotiating'`
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 3.3 Write property test for `submitNegotiation` — Property 5
    - **Property 5: Non-positive offer amounts are rejected**
    - For any `amount ≤ 0`, assert HTTP 400 with message "Offer amount must be greater than zero" and zero rows inserted into `campaign_negotiations`
    - **Validates: Requirements 2.6**

  - [ ]* 3.4 Write property test for `submitNegotiation` — Property 4
    - **Property 4: Counter-offer triggers opposing-party notification**
    - For brand-submitted offer, assert notification created for creator; for creator-submitted offer, assert notification created for brand
    - **Validates: Requirements 2.5**

  - [ ] 3.5 Implement `acceptOffer` in `campaignController.js`
    - Add `acceptOffer` method: verify token, load campaign (404), verify caller (403), verify `status === 'negotiating'` (400 "No active negotiation"), UPDATE `campaigns` SET `status='creator_accepted'`, `budget=negotiate_amount`, INSERT `campaign_timeline`, INSERT notifications for both brand and creator, call `broadcastCampaignUpdate`
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ]* 3.6 Write property test for `acceptOffer` — Property 6
    - **Property 6: Accept offer notifies both parties**
    - For any `PUT /api/campaign/:id/accept-offer` on a `negotiating` campaign, assert exactly two notification rows are created (one brand, one creator)
    - **Validates: Requirements 3.3**

  - [ ]* 3.7 Write property test for `acceptOffer` — Property 7
    - **Property 7: Post-acceptance negotiation is blocked**
    - After a campaign transitions away from `negotiating`, assert subsequent `POST /api/campaign/:id/negotiate` returns non-2xx
    - **Validates: Requirements 3.4**

  - [ ] 3.8 Register negotiation routes in `server/src/routes/campaign.js`
    - Add `router.post('/:id/negotiate', campaignController.submitNegotiation)`
    - Add `router.put('/:id/accept-offer', campaignController.acceptOffer)`
    - _Requirements: 2.1, 3.2_

  - [ ] 3.9 Extend `getCampaignDetail` to return negotiations and content submissions
    - Add `SELECT * FROM campaign_negotiations WHERE campaign_id = ? ORDER BY created_at ASC` to the existing detail query
    - Add `SELECT * FROM content_submissions WHERE campaign_id = ? ORDER BY submitted_at DESC`
    - Return both arrays in the response payload
    - _Requirements: 2.3_

  - [ ]* 3.10 Write property test for negotiation history ordering — Property 3
    - **Property 3: Negotiation history ordering invariant**
    - For any sequence of counter-offers, assert the returned history is strictly ascending by `created_at`
    - **Validates: Requirements 2.3**

- [ ] 4. Checkpoint — Ensure all negotiation backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Backend — content upload update
  - [ ] 5.1 Update `uploadContent` in `creatorController.js`
    - Accept JSON body `{ submissions: [{ platform, content_url }] }` instead of a single URL
    - Validate allowed statuses: `['agreement_locked', 'creator_accepted', 'content_uploaded']`
    - Validate each URL starts with `http://` or `https://` — return 400 "Invalid URL format" and abort all if any fail
    - INSERT one `content_submissions` row per entry with `platform`, `content_url`, `file_path=NULL`, `status='submitted'`
    - UPDATE `campaigns.status = 'content_uploaded'`, INSERT `campaign_timeline`, INSERT brand notification "Content Uploaded", call `broadcastCampaignUpdate`
    - Return `{ submitted_count, status: 'content_uploaded' }`
    - _Requirements: 5.4, 5.5, 5.6, 5.7_

  - [ ]* 5.2 Write property test for `uploadContent` — Property 10
    - **Property 10: Content submission row count invariant**
    - For any valid upload request with N URL entries, assert exactly N rows inserted into `content_submissions` with matching `platform` and `content_url`
    - **Validates: Requirements 5.4**

  - [ ]* 5.3 Write property test for `uploadContent` — Property 11
    - **Property 11: Invalid URL format is rejected atomically**
    - For any request where at least one URL lacks `http://`/`https://` prefix, assert HTTP 400 "Invalid URL format" and zero rows inserted
    - **Validates: Requirements 5.5**

  - [ ]* 5.4 Write property test for `uploadContent` — Property 12
    - **Property 12: Content submission triggers brand notification**
    - For any successful upload, assert a notification row is created for the campaign's brand
    - **Validates: Requirements 5.7**

- [ ] 6. Backend — brand `goLive` and `getLiveMetrics`
  - [ ] 6.1 Implement `goLive` in `brandController.js`
    - Add `goLive` method behind `verifyBrand`: load campaign (404), verify `brand_id === req.user.id` (403), verify `status === 'content_uploaded'` (400)
    - Wrap in a DB transaction: UPDATE `campaigns.status='posted_live'`, UPDATE `campaigns.escrow_status='released'` + `status='campaign_closed'`, compute `net_amount = budget * (1 - commission_rate/100)`, INSERT/UPSERT `earnings` row with `payment_status='released'`, INSERT `campaign_timeline`, INSERT creator notification "Payment Released"
    - COMMIT; call `broadcastCampaignUpdate`; return `{ status: 'campaign_closed', net_amount }`
    - _Requirements: 6.6, 6.7, 6.8, 6.9_

  - [ ]* 6.2 Write property test for `goLive` — Property 15
    - **Property 15: Go Live atomically releases escrow and creates earnings**
    - For any `content_uploaded` campaign, assert `escrow_status='released'`, `status='campaign_closed'`, and one `earnings` row with `payment_status='released'` are all set atomically; simulate transaction failure and assert no partial state
    - **Validates: Requirements 6.7, 6.8**

  - [ ]* 6.3 Write property test for `goLive` — Property 16
    - **Property 16: Campaign closure triggers creator payment notification**
    - For any campaign closed via go-live, assert a notification is created for the creator confirming payment release
    - **Validates: Requirements 6.9**

  - [ ] 6.4 Implement `getLiveMetrics` in `brandController.js`
    - Add `getLiveMetrics` method behind `verifyBrand`: fetch all campaigns for `brand_id` with status IN `('posted_live', 'campaign_closed')`, fetch their `content_submissions`, group by platform
    - For YouTube: extract video ID via regex, call YouTube Data API v3 with `process.env.youtube_date_key`, 10s timeout; on error set `{ error: 'YouTube data unavailable' }`
    - For Instagram: extract shortcode, call RapidAPI with `process.env.RAPIDAPI_KEY`, 10s timeout; on error set `{ error: 'Instagram data unavailable' }`
    - Return array of `{ campaign_id, title, status, submissions: [{ platform, content_url, stats }] }`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 6.5 Update `requestRevision` in `brandController.js`
    - Add `UPDATE campaigns SET status='creator_accepted', updated_at=NOW() WHERE id=?` to the existing revision handler
    - _Requirements: 6.4_

  - [ ] 6.6 Register new brand routes in `server/src/routes/brand.js`
    - Add `router.put('/campaign/:campaignId/go-live', brandController.goLive)`
    - Add `router.get('/metrics', brandController.getLiveMetrics)`
    - _Requirements: 6.6, 7.1_

- [ ] 7. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Frontend — API layer additions
  - [ ] 8.1 Add new exports to `frontend/src/api/creatorApi.js`
    - Export `submitNegotiation(id, data)` → `api.post('/api/campaign/${id}/negotiate', data)`
    - Export `acceptOffer(id)` → `api.put('/api/campaign/${id}/accept-offer')`
    - Export `uploadMultiContent(id, submissions)` → `api.post('/api/creator/campaigns/${id}/upload-content', { submissions })`
    - Export `markAllNotificationsRead()` → `api.put('/api/notifications/read-all')`
    - _Requirements: 2.1, 3.2, 5.4, 8.3_

  - [ ] 8.2 Add new exports to `frontend/src/api/brandApi.js`
    - Export `goLive(campaignId)` → `api.put('/api/brand/campaign/${campaignId}/go-live')`
    - Export `getLiveMetrics()` → `api.get('/api/brand/metrics')`
    - Export `markAllBrandNotificationsRead()` → `api.put('/api/notifications/read-all')`
    - _Requirements: 6.6, 7.1, 8.4_

- [ ] 9. Frontend — `LottieIcon.jsx` additions
  - [ ] 9.1 Add new Lucide icon imports and ICONS map entries to `LottieIcon.jsx`
    - Import `CalendarDays`, `Link2`, `CheckCircle2`, `Handshake`, `Send`, `Star` from `lucide-react`
    - Add entries to ICONS map: `calendar: CalendarDays`, `link: Link2`, `check: CheckCircle2`, `handshake: Handshake`, `send: Send`, `star: Star`
    - Preserve existing prop API (`name`, `size`, `loop`, `className`) without changes
    - _Requirements: 9.3, 9.4_

  - [ ]* 9.2 Write property test for LottieIcon ICONS map — Property 21
    - **Property 21: All LottieIcon names used in campaign pages exist in ICONS map**
    - Enumerate all `<LottieIcon name={x} />` usages in `IncomingRequestsPage`, `MyCampaignsPage`, `CampaignTracking`, and `Metrics`; assert each `x` is a key in the ICONS map
    - **Validates: Requirements 9.3**

- [ ] 10. Frontend — `IncomingRequestsPage.jsx` rewrite
  - [ ] 10.1 Add negotiation state and mutations to `IncomingRequestsPage.jsx`
    - Add state: `negotiatingId`, `negotiateAmount`, `negotiateMessage`
    - Add `negotiateMut` using `submitNegotiation`; add `acceptOfferMut` using `acceptOffer`
    - Invalidate relevant TanStack Query keys on success
    - _Requirements: 1.4, 2.1, 3.2_

  - [ ] 10.2 Update campaign card rendering logic in `IncomingRequestsPage.jsx`
    - For `status === 'request_sent'`: render "Accept", "Decline", "Negotiate" buttons; if `negotiatingId === campaign.id` show inline form (amount input + message textarea + Submit + Cancel)
    - For `status === 'negotiating'`: render negotiation history ordered by `created_at` ASC, "Accept Offer" button, "Counter Offer" button (opens inline form), latest offer amount displayed prominently
    - For accepted statuses: render "View Campaign" and "View Brief" toggle
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.3, 2.4, 3.1_

  - [ ] 10.3 Replace emoji icons with `LottieIcon` in `IncomingRequestsPage.jsx`
    - Replace `📅` → `<LottieIcon name="calendar" size={14} />`
    - Replace `🔗` → `<LottieIcon name="link" size={14} />`
    - Replace `💰` → `<LottieIcon name="money" size={14} />`
    - Replace `✅` → `<LottieIcon name="check" size={14} />`
    - _Requirements: 1.5, 9.1, 9.2_

  - [ ]* 10.4 Write property test for `IncomingRequestsPage` — Property 1
    - **Property 1: Negotiate renders three action buttons for pending campaigns**
    - For any campaign object with `status = 'request_sent'`, assert the rendered output contains exactly "Accept", "Decline", and "Negotiate" buttons
    - **Validates: Requirements 1.1**

- [ ] 11. Frontend — `MyCampaignsPage.jsx` update
  - [ ] 11.1 Update upload state and mutation in `MyCampaignsPage.jsx`
    - Add state: `uploadingId`, `platformUrls` (Record keyed by platform name)
    - Replace existing upload mutation with `uploadMut` calling `uploadMultiContent(id, submissions)` built from `platformUrls`
    - _Requirements: 5.4_

  - [ ] 11.2 Update content upload UI in `MyCampaignsPage.jsx`
    - When `canUpload(campaign)`: fetch creator's social profiles via `useQuery` (cached)
    - For each connected platform (instagram / youtube): render a labelled URL input ("Instagram URL" / "YouTube URL")
    - Submit button calls `uploadMultiContent` with all filled inputs
    - Replace `🎯` → `<LottieIcon name="target" size={36} />`
    - _Requirements: 5.1, 5.2, 5.3, 9.1_

  - [ ]* 11.3 Write property test for platform-aware URL input rendering — Property 9
    - **Property 9: Platform-aware URL input rendering**
    - For a creator with both Instagram and YouTube profiles, assert two labelled URL inputs render; for a creator with one platform, assert exactly one labelled input renders
    - **Validates: Requirements 5.2, 5.3**

- [ ] 12. Frontend — `CampaignTracking.jsx` rewrite
  - [ ] 12.1 Update status map and stepper in `CampaignTracking.jsx`
    - Add `'negotiating': 1` to `STATUS_STEP` map and shift subsequent values
    - Update stepper to 7 steps: Request Sent → Negotiating → Creator Accepted → Escrow Locked → Content Uploaded → Live → Closed
    - _Requirements: 2.2_

  - [ ] 12.2 Add `goLive` mutation and action banners in `CampaignTracking.jsx`
    - Add `goLiveMut` using `goLive(id)` with `queryClient.invalidateQueries` on success
    - Add action banner for `status === 'negotiating'`: amber info banner "Negotiation in progress. Review the latest offer below."
    - Update `status === 'content_uploaded'` banner: add "Go Live" primary button calling `goLiveMut.mutate(campaign.id)` and "Request Corrections" secondary button with correction note input
    - _Requirements: 4.1, 6.2, 6.3, 6.6_

  - [ ] 12.3 Update content display to use `content_submissions` in `CampaignTracking.jsx`
    - Replace single `content_url` display with grouped list from `content_submissions`
    - Group by `platform`, show platform label + link per row
    - _Requirements: 6.1_

  - [ ] 12.4 Replace emoji icons with `LottieIcon` in `CampaignTracking.jsx`
    - Replace `✅` → `<LottieIcon name="check" size={15} />`
    - Replace `📊` → `<LottieIcon name="chart" size={15} />`
    - Replace `💰` → `<LottieIcon name="money" size={15} />`
    - Replace `🎉` → `<LottieIcon name="star" size={15} />`
    - _Requirements: 9.1, 9.2_

  - [ ]* 12.5 Write property test for content submissions grouping — Property 13
    - **Property 13: Content submissions grouped by platform in CampaignTracking**
    - For any set of `content_submissions` rows, assert the rendered output groups them by `platform` with all URLs per group visible
    - **Validates: Requirements 6.1**

- [ ] 13. Frontend — `Metrics.jsx` rewrite
  - [ ] 13.1 Replace data source in `Metrics.jsx`
    - Replace existing `getCampaignTracking` query with `useQuery` calling `getLiveMetrics()`, keyed `['brand-live-metrics', userId]`, `staleTime: 0`, `refetchOnMount: 'always'`
    - _Requirements: 7.1, 7.2_

  - [ ] 13.2 Implement per-campaign card rendering in `Metrics.jsx`
    - For each campaign in metrics: render campaign header (title, status badge)
    - For each submission: render platform label, content link, stats grid
    - If `stats.error`: render amber banner with platform-specific error message ("YouTube data unavailable" / "Instagram data unavailable")
    - Else: render Views, Likes, Comments, Engagement Rate tiles
    - _Requirements: 7.3, 7.4, 7.5_

  - [ ]* 13.3 Write property test for Metrics page rendering — Property 17
    - **Property 17: Metrics page renders one card per live/closed campaign**
    - For any set of campaigns with status `posted_live` or `campaign_closed`, assert exactly one card renders per campaign
    - **Validates: Requirements 7.3**

  - [ ]* 13.4 Write property test for API failure isolation — Property 18
    - **Property 18: API failure does not block other metric cards**
    - When YouTube API returns error for one campaign, assert remaining cards still render and the failed campaign shows "YouTube data unavailable"; same for Instagram
    - **Validates: Requirements 7.4, 7.5**

- [ ] 14. Frontend — `TopBar.jsx` and `BrandTopBar.jsx` updates
  - [ ] 14.1 Add "Read All" button and mutation to `TopBar.jsx`
    - Add `readAllLoading` state and `readAllError` state
    - Add `markAllMut` using `markAllNotificationsRead`; on success update local notification state to all `is_read: true`; on error set `readAllError`
    - Render "Read All" button in dropdown header when any notification has `is_read === false`; show "Marking..." while pending
    - Render inline error message when `readAllError` is set
    - _Requirements: 8.1, 8.3, 8.5, 8.6_

  - [ ] 14.2 Add "Read All" button and mutation to `BrandTopBar.jsx`
    - Identical change to `TopBar.jsx` but using `markAllBrandNotificationsRead` and brand accent color `#7C3AED`
    - _Requirements: 8.2, 8.4, 8.5, 8.6_

  - [ ]* 14.3 Write property test for "Read All" button visibility — Property 19
    - **Property 19: "Read All" button appears when unread notifications exist**
    - For any dropdown state with at least one `is_read = false` notification, assert "Read All" button renders in both `TopBar` and `BrandTopBar`
    - **Validates: Requirements 8.1, 8.2**

  - [ ]* 14.4 Write property test for bulk mark-read — Property 20
    - **Property 20: Bulk mark-read sets all matching notifications to read**
    - For any user with N unread notifications, after `PUT /api/notifications/read-all` succeeds, assert all N notifications have `is_read = true` in local state and the unread indicator dot is removed
    - **Validates: Requirements 8.3, 8.4, 8.5**

- [ ] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key integration points
- Property tests validate universal correctness properties defined in the design document
- Unit tests validate specific examples and edge cases
- The migration SQL file should be run against the database before starting backend work
- `proposed_by` is always derived from `req.user.role` server-side — never from the request body
- The `go-live` transaction must use `BEGIN / COMMIT / ROLLBACK` to guarantee atomicity
- YouTube and Instagram API keys are server-side only (`process.env`) — never expose to frontend

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "3.1", "5.1", "6.1", "6.4", "6.5", "8.1", "8.2", "9.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "3.3", "3.4", "3.5", "3.8", "3.9", "5.2", "5.3", "5.4", "6.2", "6.3", "6.6", "9.2"] },
    { "id": 3, "tasks": ["2.3", "3.6", "3.7", "3.10", "10.1", "11.1", "13.1"] },
    { "id": 4, "tasks": ["10.2", "10.3", "11.2", "12.1", "12.2", "12.3", "12.4", "13.2", "14.1", "14.2"] },
    { "id": 5, "tasks": ["10.4", "11.3", "12.5", "13.3", "13.4", "14.3", "14.4"] }
  ]
}
```
