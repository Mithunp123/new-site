# Design Document — Campaign Flow Redesign

## Overview

This document describes the technical architecture for the campaign flow redesign on the Gradix platform. The redesign introduces structured negotiation rounds, multi-platform content URL submission, an atomic "Go Live" action that auto-releases payment, a live-metrics page backed by external APIs, bulk notification read, and consistent icon usage via `LottieIcon`. The stack is **Node.js / Express** (backend), **MySQL** (database), and **React + Vite + TanStack Query** (frontend).

---

## Architecture

The system follows the existing layered architecture:

```
Frontend (React/Vite)
  └── API Layer (axios wrappers in src/api/)
        └── Express REST API (server/src/routes/ → controllers/)
              └── MySQL via mysql2 connection pool
```

WebSocket (`ws`) is used for real-time campaign status pushes via `broadcastCampaignUpdate`. All new endpoints follow the same pattern: route → controller → pool query → `success(res, data)` / `error(res, msg, code)`.

---

## Database Schema Changes

### 1. `campaigns` table — ENUM and new columns

```sql
-- Add 'negotiating' to status ENUM (before 'declined')
ALTER TABLE campaigns
  MODIFY COLUMN status ENUM(
    'request_sent',
    'creator_accepted',
    'agreement_locked',
    'content_uploaded',
    'brand_approved',
    'posted_live',
    'analytics_collected',
    'escrow_released',
    'campaign_closed',
    'negotiating',
    'declined'
  ) DEFAULT 'request_sent';

-- Add negotiation columns (idempotent)
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS negotiate_amount DECIMAL(10,2) NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS negotiate_message TEXT NULL DEFAULT NULL;
```

### 2. `campaign_negotiations` table — new

```sql
CREATE TABLE IF NOT EXISTS campaign_negotiations (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id  INT NOT NULL,
  proposed_by  ENUM('brand', 'creator') NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  message      TEXT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_neg_campaign (campaign_id)
);
```

### 3. `content_submissions` table — new columns

```sql
ALTER TABLE content_submissions
  ADD COLUMN IF NOT EXISTS platform    VARCHAR(50)  NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS content_url VARCHAR(500) NULL DEFAULT NULL;
```

> **Migration note:** The existing `file_path` column is kept for backward compatibility. New submissions use `content_url`; `file_path` is set to `NULL` for URL-only submissions.

---

## Backend Components

### New / Modified Routes

#### `server/src/routes/campaign.js` — additions

```js
router.post('/:id/negotiate',     campaignController.submitNegotiation);
router.put('/:id/accept-offer',   campaignController.acceptOffer);
```

#### `server/src/routes/creator.js` — modification

The existing `POST /api/creator/campaigns/:campaignId/upload-content` handler is updated to accept a JSON body with an array of `{ platform, content_url }` objects instead of a single URL.

#### `server/src/routes/brand.js` — additions

```js
router.put('/campaign/:campaignId/go-live',  brandController.goLive);
router.get('/metrics',                        brandController.getLiveMetrics);
```

#### New route file: `server/src/routes/notifications.js`

```js
const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');
const notificationsController = require('../controllers/notificationsController');

router.use(verifyToken);
router.put('/read-all', notificationsController.markAllRead);

module.exports = router;
```

Registered in `app.js`:

```js
app.use('/api/notifications', require('./src/routes/notifications'));
```

---

### Controller: `campaignController` — new methods

#### `submitNegotiation` — `POST /api/campaign/:id/negotiate`

```
1. Verify token (verifyToken middleware)
2. Load campaign by id — 404 if not found
3. Verify caller is brand_id or creator_id — 403 otherwise
4. Validate amount > 0 — 400 "Offer amount must be greater than zero"
5. Determine proposed_by from req.user.role ('brand' | 'creator')
6. INSERT into campaign_negotiations (campaign_id, proposed_by, amount, message)
7. UPDATE campaigns SET status='negotiating', negotiate_amount=amount, negotiate_message=message
8. INSERT campaign_timeline row
9. Determine opposing party (brand → notify creator, creator → notify brand)
10. INSERT notification for opposing party: title "New Counter-Offer", message includes amount
11. broadcastCampaignUpdate(id, { status: 'negotiating' })
12. Return success with { negotiation_id, status: 'negotiating' }
```

#### `acceptOffer` — `PUT /api/campaign/:id/accept-offer`

```
1. Verify token
2. Load campaign — 404 if not found
3. Verify caller is brand_id or creator_id — 403 otherwise
4. Verify status === 'negotiating' — 400 "No active negotiation"
5. UPDATE campaigns SET status='creator_accepted', budget=negotiate_amount
6. INSERT campaign_timeline row
7. INSERT notification for brand: title "Offer Accepted", message includes agreed amount
8. INSERT notification for creator: title "Offer Accepted", message includes agreed amount
9. broadcastCampaignUpdate(id, { status: 'creator_accepted' })
10. Return success with { status: 'creator_accepted', agreed_amount: negotiate_amount }
```

#### `getCampaignDetail` — modification

Extend the existing handler to also return:
- `negotiations`: `SELECT * FROM campaign_negotiations WHERE campaign_id = ? ORDER BY created_at ASC`
- `content_submissions`: `SELECT * FROM content_submissions WHERE campaign_id = ? ORDER BY submitted_at DESC`

---

### Controller: `creatorController` — modified method

#### `uploadContent` — `POST /api/creator/campaigns/:campaignId/upload-content`

Updated to accept a JSON body with `submissions: [{ platform: string, content_url: string }]`.

```
1. Verify token
2. Load campaign — 404 / 403 checks
3. Validate allowed statuses: ['agreement_locked', 'creator_accepted', 'content_uploaded']
4. Validate each URL starts with 'http://' or 'https://' — 400 "Invalid URL format" if any fail; abort all
5. For each { platform, content_url } in submissions:
   INSERT INTO content_submissions (campaign_id, creator_id, platform, content_url, file_path, status)
   VALUES (?, ?, ?, ?, NULL, 'submitted')
6. UPDATE campaigns SET status='content_uploaded', updated_at=NOW()
7. INSERT campaign_timeline row
8. INSERT notification for brand: "Content Uploaded"
9. broadcastCampaignUpdate(campaignId, { status: 'content_uploaded' })
10. Return success with { submitted_count, status: 'content_uploaded' }
```

---

### Controller: `brandController` — new methods

#### `goLive` — `PUT /api/brand/campaign/:campaignId/go-live`

Replaces the separate `mark-live` + `release-payment` flow with a single atomic action.

```
1. verifyBrand middleware
2. Load campaign — 404 if not found
3. Verify brand_id matches req.user.id — 403
4. Verify status === 'content_uploaded' — 400 "Campaign not in content_uploaded status"
5. BEGIN TRANSACTION
   a. UPDATE campaigns SET status='posted_live', updated_at=NOW()
   b. UPDATE campaigns SET escrow_status='released', status='campaign_closed', updated_at=NOW()
   c. Compute net_amount = budget * (1 - commission_rate/100)
   d. INSERT INTO earnings (creator_id, campaign_id, gross_amount, commission_rate, commission_amt, net_amount, payment_status, released_at)
      VALUES (creator_id, id, budget, commission_rate, budget*commission_rate/100, net_amount, 'released', NOW())
      ON DUPLICATE KEY UPDATE payment_status='released', released_at=NOW(), net_amount=net_amount
   e. INSERT campaign_timeline row: status='campaign_closed', changed_by='brand'
   f. INSERT notification for creator: title "Payment Released", message "Your payment of ₹{net_amount} has been released. Campaign closed."
6. COMMIT
7. broadcastCampaignUpdate(campaignId, { status: 'campaign_closed' })
8. Return success with { status: 'campaign_closed', net_amount }
```

#### `getLiveMetrics` — `GET /api/brand/metrics`

```
1. verifyBrand middleware
2. Fetch all campaigns for brand_id where status IN ('posted_live', 'campaign_closed')
3. For each campaign, fetch content_submissions rows
4. Group submissions by platform (youtube / instagram)
5. For YouTube submissions:
   a. Extract video ID from content_url (regex: /(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
   b. Call YouTube Data API v3: GET https://www.googleapis.com/youtube/v3/videos
      params: { part: 'statistics', id: videoId, key: process.env.youtube_date_key }
   c. Timeout: 10 seconds (axios timeout option)
   d. On error/timeout: set youtube_stats = { error: 'YouTube data unavailable' }
6. For Instagram submissions:
   a. Extract shortcode from content_url
   b. Call RapidAPI Instagram endpoint
      headers: { 'X-RapidAPI-Key': process.env.RAPIDAPI_KEY, 'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com' }
   c. Timeout: 10 seconds
   d. On error/timeout: set instagram_stats = { error: 'Instagram data unavailable' }
7. Return array of campaign metric objects:
   {
     campaign_id, title, status,
     submissions: [{ platform, content_url, stats: { views, likes, comments, engagement_rate } | { error } }]
   }
```

---

### Controller: `notificationsController` — new file

#### `markAllRead` — `PUT /api/notifications/read-all`

```
1. verifyToken middleware
2. Determine user_type from req.user.role ('brand' | 'creator')
3. UPDATE notifications SET is_read = true
   WHERE user_type = ? AND user_id = ? AND is_read = false
4. Return success with { updated_count }
```

---

### Modified: `brandController.requestRevision`

Update to also set `campaigns.status = 'creator_accepted'` (currently only updates `content_submissions`):

```
UPDATE campaigns SET status='creator_accepted', updated_at=NOW() WHERE id=?
```

---

## Frontend Components

### API Layer additions

#### `frontend/src/api/creatorApi.js` — new exports

```js
export const submitNegotiation = (id, data) =>
  api.post(`/api/campaign/${id}/negotiate`, data);

export const acceptOffer = (id) =>
  api.put(`/api/campaign/${id}/accept-offer`);

export const uploadMultiContent = (id, submissions) =>
  api.post(`/api/creator/campaigns/${id}/upload-content`, { submissions });

export const markAllNotificationsRead = () =>
  api.put('/api/notifications/read-all');
```

#### `frontend/src/api/brandApi.js` — new exports

```js
export const goLive = (campaignId) =>
  api.put(`/api/brand/campaign/${campaignId}/go-live`);

export const getLiveMetrics = () =>
  api.get('/api/brand/metrics');

export const markAllBrandNotificationsRead = () =>
  api.put('/api/notifications/read-all');
```

---

### Page: `IncomingRequestsPage.jsx` — rewrite

**State additions:**
- `negotiatingId: number | null` — which campaign has the negotiate form open
- `negotiateAmount: string`
- `negotiateMessage: string`

**Mutations added:**
- `negotiateMut` — calls `submitNegotiation(id, { amount, message })`
- `acceptOfferMut` — calls `acceptOffer(id)`

**Rendering logic:**

```
For each campaign card:
  if status === 'request_sent':
    → Show Accept, Decline, Negotiate buttons
    → If negotiatingId === campaign_id: show inline form (amount input + message textarea + Submit + Cancel)

  if status === 'negotiating':
    → Show negotiation history (ordered by created_at ASC)
    → Show "Accept Offer" button
    → Show "Counter Offer" button (opens inline form)
    → Latest offer amount displayed prominently

  if ACCEPTED_STATUSES includes status:
    → Show "View Campaign" button
    → Show "View Brief" toggle
```

**Icon replacements (Requirement 9):**
- `📅` → `<LottieIcon name="calendar" size={14} />`
- `🔗` → `<LottieIcon name="link" size={14} />`
- `💰` → `<LottieIcon name="money" size={14} />`
- `✅` → `<LottieIcon name="check" size={14} />`

New icons to add to `LottieIcon.jsx` ICONS map: `calendar` (CalendarDays), `link` (Link2), `check` (CheckCircle2), `handshake` (Handshake), `send` (Send).

---

### Page: `MyCampaignsPage.jsx` — rewrite

**State additions:**
- `uploadingId: number | null`
- `platformUrls: Record<string, string>` — keyed by platform name

**Mutation update:**
- `uploadMut` now calls `uploadMultiContent(id, submissions)` where `submissions` is built from `platformUrls`

**Rendering logic for upload section:**

```
When canUpload(campaign):
  1. Fetch creator's social profiles (useQuery, cached)
  2. For each connected platform (instagram / youtube):
     Render a labelled URL input: "Instagram URL" / "YouTube URL"
  3. Submit button calls uploadMultiContent with all filled inputs
```

**Icon replacements:**
- `🎯` → `<LottieIcon name="target" size={36} />`

---

### Page: `CampaignTracking.jsx` — rewrite

**Status map update** — add `negotiating`:

```js
const STATUS_STEP = {
  'request_sent':     0,
  'negotiating':      1,   // new
  'creator_accepted': 2,
  'agreement_locked': 3,
  'content_uploaded': 4,
  'posted_live':      5,
  'campaign_closed':  6,
};
```

**Stepper update** — 7 steps:

```
Request Sent → Negotiating → Creator Accepted → Escrow Locked →
Content Uploaded → Live → Closed
```

**Action banner additions:**

```js
if (status === 'negotiating') return {
  msg: 'Negotiation in progress. Review the latest offer below.',
  color: 'amber',
  isInfo: true,
};

if (status === 'content_uploaded') return {
  // existing "Review content" banner
  // PRIMARY: "Go Live" button → calls goLive(campaign.id)
  // SECONDARY: "Request Corrections" → opens correction note input
};
```

**Content display update:**
- Replace single `content_url` display with a grouped list from `content_submissions`
- Group by `platform`, show platform label + link per row

**Go Live mutation:**

```js
const goLiveMut = useMutation({
  mutationFn: (id) => goLive(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-tracking'] }),
});
```

**Icon replacements:**
- `✅` → `<LottieIcon name="check" size={15} />`
- `📊` → `<LottieIcon name="chart" size={15} />`
- `💰` → `<LottieIcon name="money" size={15} />`
- `🎉` → `<LottieIcon name="star" size={15} />`

New icons to add to `LottieIcon.jsx`: `star` (Star).

---

### Page: `Metrics.jsx` — rewrite

**Data source change:** Replace the existing `getCampaignTracking` query with a dedicated `getLiveMetrics` query.

```js
const { data: metrics, isLoading, isError } = useQuery({
  queryKey: ['brand-live-metrics', userId],
  queryFn: () => getLiveMetrics().then(r => r.data.data),
  staleTime: 0,
  refetchOnMount: 'always',
  enabled: !!userId,
});
```

**Per-campaign card rendering:**

```
For each campaign in metrics:
  Campaign header (title, status badge)
  For each submission in campaign.submissions:
    Platform label (YouTube / Instagram)
    Content link
    Stats grid:
      if stats.error: show platform-specific error message
      else: Views, Likes, Comments, Engagement Rate tiles
```

**Error states:**
- YouTube error: amber banner "YouTube data unavailable — API error or timeout"
- Instagram error: amber banner "Instagram data unavailable — API error or timeout"
- Both errors do not block other campaign cards from rendering

---

### Component: `TopBar.jsx` — modification

**State addition:** `readAllLoading: boolean`

**Mutation:**

```js
const markAllMut = useMutation({
  mutationFn: markAllNotificationsRead,
  onSuccess: () => setNotifications(n => n.map(x => ({ ...x, is_read: true }))),
  onError: () => setReadAllError('Failed to mark all as read'),
});
```

**Dropdown header update:**

```jsx
<div className="p-3 border-b flex items-center justify-between">
  <span className="text-sm font-semibold">Notifications</span>
  {notifications.some(n => !n.is_read) && (
    <button
      onClick={() => markAllMut.mutate()}
      disabled={markAllMut.isPending}
      className="text-xs text-blue-600 font-medium hover:underline"
    >
      {markAllMut.isPending ? 'Marking...' : 'Read All'}
    </button>
  )}
</div>
{readAllError && (
  <div className="px-3 py-1 text-xs text-red-500 bg-red-50">{readAllError}</div>
)}
```

---

### Component: `BrandTopBar.jsx` — modification

Identical change to `TopBar.jsx` but using `markAllBrandNotificationsRead` and the brand accent color (`#7C3AED`).

---

### Component: `LottieIcon.jsx` — additions

New Lucide imports and ICONS map entries:

```js
import {
  // existing imports...
  CalendarDays,
  Link2,
  CheckCircle2,
  Handshake,
  Send,
  Star,
} from 'lucide-react';

const ICONS = {
  // existing entries...
  calendar:  CalendarDays,
  link:      Link2,
  check:     CheckCircle2,
  handshake: Handshake,
  send:      Send,
  star:      Star,
};
```

No changes to the component's prop API (`name`, `size`, `loop`, `className`).

---

## Data Flow Diagrams

### Negotiation Flow

```
Creator (IncomingRequestsPage)
  │
  ├─ Clicks "Negotiate" → opens inline form
  │
  ├─ Submits amount + message
  │     POST /api/campaign/:id/negotiate
  │     → INSERT campaign_negotiations
  │     → UPDATE campaigns SET status='negotiating', negotiate_amount=amount
  │     → INSERT notification for brand
  │
  └─ Brand sees counter-offer in CampaignTracking
        ├─ Clicks "Accept Offer"
        │     PUT /api/campaign/:id/accept-offer
        │     → UPDATE campaigns SET status='creator_accepted', budget=negotiate_amount
        │     → INSERT notifications for both parties
        │
        └─ Clicks "Counter Offer" → submits new round (unlimited)
```

### Go Live Flow

```
Brand (CampaignTracking — content_uploaded status)
  │
  └─ Clicks "Go Live"
        PUT /api/brand/campaign/:id/go-live
        │
        ├─ UPDATE campaigns SET status='posted_live'
        ├─ UPDATE campaigns SET escrow_status='released', status='campaign_closed'
        ├─ INSERT earnings record (payment_status='released')
        ├─ INSERT campaign_timeline
        └─ INSERT notification for creator ("Payment Released")
```

### Multi-Platform Content Upload Flow

```
Creator (MyCampaignsPage — agreement_locked status)
  │
  ├─ GET /api/creator/social-profiles → determine platforms
  │
  ├─ Renders URL inputs per platform (Instagram URL / YouTube URL)
  │
  └─ Submits
        POST /api/creator/campaigns/:id/upload-content
        body: { submissions: [{ platform: 'instagram', content_url: '...' }, { platform: 'youtube', content_url: '...' }] }
        │
        ├─ Validate all URLs start with http:// or https://
        ├─ INSERT one content_submissions row per URL
        └─ UPDATE campaigns SET status='content_uploaded'
```

---

## Error Handling

| Scenario | HTTP Code | Message | Side Effects |
|---|---|---|---|
| Negotiate with amount ≤ 0 | 400 | "Offer amount must be greater than zero" | No DB writes |
| Negotiate on non-negotiating/request_sent campaign | 400 | "Cannot negotiate in current status" | No DB writes |
| Accept offer when status ≠ negotiating | 400 | "No active negotiation" | No DB writes |
| Upload content with invalid URL | 400 | "Invalid URL format" | No rows inserted |
| Go Live when status ≠ content_uploaded | 400 | "Campaign not in content_uploaded status" | No DB writes |
| Go Live transaction failure | 500 | "Failed to process go-live" | ROLLBACK — no partial state |
| YouTube API timeout (>10s) | — | "YouTube data unavailable" | Other cards render normally |
| Instagram API timeout (>10s) | — | "Instagram data unavailable" | Other cards render normally |
| Read All API failure | — | "Failed to mark all as read" | Local state unchanged |
| Unauthorized access to /brand/metrics | 403 | "Brand access only" | — |

---

## Security Considerations

- All new endpoints use existing `verifyToken` / `verifyBrand` middleware — no new auth surface.
- `proposed_by` is derived from `req.user.role` server-side, never from the request body, preventing spoofing.
- YouTube API key (`youtube_date_key`) and RapidAPI key (`RAPIDAPI_KEY`) are read from `process.env` only on the server; never exposed to the frontend.
- URL validation (`^https?://`) is enforced server-side before any DB write.
- The `go-live` endpoint verifies `brand_id === req.user.id` before executing the transaction.
- Bulk notification read filters by both `user_type` and `user_id` from the JWT, preventing cross-user reads.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Negotiate renders three action buttons for pending campaigns

*For any* campaign object with `status = 'request_sent'`, rendering `IncomingRequestsPage` SHALL produce a UI containing exactly the "Accept", "Decline", and "Negotiate" action buttons.

**Validates: Requirements 1.1**

---

### Property 2: Counter-offer insertion and status transition

*For any* valid counter-offer payload (positive amount, valid campaign_id, caller is brand or creator), submitting to `POST /api/campaign/:id/negotiate` SHALL insert exactly one row into `campaign_negotiations` with matching `campaign_id`, `proposed_by`, `amount`, and `message`, AND SHALL set `campaigns.status = 'negotiating'` and `campaigns.negotiate_amount` to the submitted amount.

**Validates: Requirements 2.1, 2.2**

---

### Property 3: Negotiation history ordering invariant

*For any* sequence of counter-offers submitted for a campaign, the negotiation history returned by the API SHALL be ordered strictly ascending by `created_at`, regardless of submission order or number of rounds.

**Validates: Requirements 2.3**

---

### Property 4: Counter-offer triggers opposing-party notification

*For any* counter-offer submitted by a brand, a notification SHALL be created for the creator of that campaign; and *for any* counter-offer submitted by a creator, a notification SHALL be created for the brand of that campaign.

**Validates: Requirements 2.5**

---

### Property 5: Non-positive offer amounts are rejected

*For any* counter-offer where `amount ≤ 0`, the system SHALL return HTTP 400 with message "Offer amount must be greater than zero" and SHALL NOT insert any row into `campaign_negotiations`.

**Validates: Requirements 2.6**

---

### Property 6: Accept offer notifies both parties

*For any* `PUT /api/campaign/:id/accept-offer` call on a campaign in `negotiating` status, the system SHALL create exactly two notification rows — one for the brand and one for the creator — confirming the agreed amount.

**Validates: Requirements 3.3**

---

### Property 7: Post-acceptance negotiation is blocked

*For any* campaign whose status has transitioned away from `negotiating` (i.e., offer was accepted), any subsequent call to `POST /api/campaign/:id/negotiate` SHALL be rejected with a non-2xx response.

**Validates: Requirements 3.4**

---

### Property 8: Escrow lock creates creator notification

*For any* campaign where the brand locks escrow, the system SHALL create a notification for the creator with title "Escrow Locked" containing the held amount.

**Validates: Requirements 4.3**

---

### Property 9: Platform-aware URL input rendering

*For any* creator with both Instagram and YouTube profiles in `creator_social_profiles`, the content upload UI SHALL render exactly two URL input fields labelled "Instagram URL" and "YouTube URL". *For any* creator with exactly one connected platform, the UI SHALL render exactly one URL input field labelled with that platform's name.

**Validates: Requirements 5.2, 5.3**

---

### Property 10: Content submission row count invariant

*For any* valid content upload request containing N URL entries (each with a platform and a valid URL), the system SHALL insert exactly N rows into `content_submissions`, each with the corresponding `platform` and `content_url` values.

**Validates: Requirements 5.4**

---

### Property 11: Invalid URL format is rejected atomically

*For any* content upload request where at least one URL does not begin with `http://` or `https://`, the system SHALL return HTTP 400 with message "Invalid URL format" and SHALL NOT insert any rows into `content_submissions` (all-or-nothing).

**Validates: Requirements 5.5**

---

### Property 12: Content submission triggers brand notification

*For any* successful content upload, the system SHALL create a notification for the brand of that campaign indicating that content has been uploaded for review.

**Validates: Requirements 5.7**

---

### Property 13: Content submissions grouped by platform in CampaignTracking

*For any* set of `content_submissions` rows for a campaign, the `CampaignTracking` page SHALL render them grouped by `platform`, with each group displaying all URLs belonging to that platform.

**Validates: Requirements 6.1**

---

### Property 14: Correction note propagated to creator notification

*For any* correction request submitted by a brand with a non-empty correction note, the system SHALL create a notification for the creator whose `message` field contains the submitted correction note text.

**Validates: Requirements 6.5**

---

### Property 15: Go Live atomically releases escrow and creates earnings

*For any* campaign in `content_uploaded` status, calling `PUT /api/brand/campaign/:id/go-live` SHALL atomically set `campaigns.escrow_status = 'released'`, set `campaigns.status = 'campaign_closed'`, and insert an `earnings` row for the creator with `payment_status = 'released'`. If any step fails, none of the changes SHALL be persisted.

**Validates: Requirements 6.7, 6.8**

---

### Property 16: Campaign closure triggers creator payment notification

*For any* campaign that transitions to `campaign_closed` via the go-live action, the system SHALL create a notification for the creator confirming payment release and campaign closure.

**Validates: Requirements 6.9**

---

### Property 17: Metrics page renders one card per live/closed campaign

*For any* set of campaigns with status `posted_live` or `campaign_closed`, the Metrics page SHALL render exactly one campaign card per campaign in that set.

**Validates: Requirements 7.3**

---

### Property 18: API failure does not block other metric cards

*For any* Metrics page render where the YouTube API returns an error or times out for one campaign, the remaining campaign cards SHALL still render with their available data, and the failed campaign SHALL display "YouTube data unavailable" in place of YouTube stats. The same property holds independently for Instagram API failures.

**Validates: Requirements 7.4, 7.5**

---

### Property 19: "Read All" button appears when unread notifications exist

*For any* notification dropdown state where at least one notification has `is_read = false`, both `TopBar` and `BrandTopBar` SHALL render a "Read All" button in the dropdown header.

**Validates: Requirements 8.1, 8.2**

---

### Property 20: Bulk mark-read sets all matching notifications to read

*For any* authenticated user (brand or creator) with N unread notifications, calling `PUT /api/notifications/read-all` SHALL set `is_read = true` for all N notifications belonging to that user, and the local notification state in the dropdown SHALL reflect all items as read with the unread indicator dot removed.

**Validates: Requirements 8.3, 8.4, 8.5**

---

### Property 21: All LottieIcon names used in campaign pages exist in ICONS map

*For any* `<LottieIcon name={x} />` usage in `IncomingRequestsPage`, `MyCampaignsPage`, `CampaignTracking`, and `Metrics`, the value `x` SHALL be a key present in the `ICONS` map in `LottieIcon.jsx`, ensuring no icon falls back to the neutral dot placeholder.

**Validates: Requirements 9.3**
