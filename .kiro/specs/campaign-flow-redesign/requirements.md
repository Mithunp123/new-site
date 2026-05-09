# Requirements Document

## Introduction

This feature redesigns the end-to-end campaign collaboration flow between brands and creators on the Gradix platform. The redesign covers: structured negotiation with unlimited counter-offer rounds, escrow locking after acceptance, multi-platform content URL submission, brand content review with correction requests, a "Go Live" action that auto-releases payment and closes the campaign, a live-metrics page for brands that fetches data directly from YouTube Data API v3 and Instagram RapidAPI, a "Read All" button in notification dropdowns for both roles, and replacement of all emoji/cartoon icons with the existing `LottieIcon` component. The feature also requires targeted MySQL schema changes to support negotiation history, the `negotiating` status, and multi-URL content submissions.

---

## Glossary

- **Brand**: A registered company or individual on the platform who creates and funds campaigns.
- **Creator**: A registered content creator who receives and responds to campaign requests.
- **Campaign**: A record in the `campaigns` table representing a collaboration agreement between a Brand and a Creator.
- **Negotiation Round**: A single counter-offer entry consisting of a proposed amount and an optional message, stored in `campaign_negotiations`.
- **Escrow**: The held payment amount locked in the `campaigns.escrow_amount` field after both parties agree on a final amount.
- **Content Submission**: A record in `content_submissions` representing one or more platform-specific URLs uploaded by the Creator.
- **Go Live**: The brand action that marks content as approved, triggers automatic payment release, and closes the campaign.
- **Metrics Page**: The brand-only page (`/brand/metrics`) that fetches live performance data from external APIs on page load.
- **LottieIcon**: The existing React component at `frontend/src/components/ui/LottieIcon.jsx` that renders Lucide icons with optional animation.
- **YouTube Data API v3**: Google's API for fetching YouTube video statistics, accessed via the `youtube_date_key` environment variable.
- **Instagram RapidAPI**: The RapidAPI-hosted Instagram stats endpoint, accessed via the `RAPIDAPI_KEY` environment variable.
- **Read All**: A UI action that marks every unread notification as read in a single operation.
- **IncomingRequestsPage**: The creator-side page at `frontend/src/pages/IncomingRequestsPage.jsx` that lists campaign requests.
- **CampaignTracking**: The brand-side page at `frontend/src/pages/brand/CampaignTracking.jsx` that tracks campaign progress.
- **TopBar**: The creator layout header at `frontend/src/components/layout/TopBar.jsx` containing the notification dropdown.
- **BrandTopBar**: The brand layout header at `frontend/src/components/layout/BrandTopBar.jsx` containing the notification dropdown.

---

## Requirements

### Requirement 1 — Campaign Request: Creator Response Actions

**User Story:** As a creator, I want to see Accept, Decline, and Negotiate buttons on each incoming campaign request, so that I can respond to brand proposals directly from my dashboard.

#### Acceptance Criteria

1. WHEN a campaign with `status = 'request_sent'` is displayed in the IncomingRequestsPage, THE IncomingRequestsPage SHALL render three action buttons: "Accept", "Decline", and "Negotiate".
2. WHEN the creator clicks "Accept", THE System SHALL call the existing accept endpoint and transition the campaign status to `creator_accepted`.
3. WHEN the creator clicks "Decline", THE System SHALL call the existing decline endpoint and transition the campaign status to `declined`.
4. WHEN the creator clicks "Negotiate", THE System SHALL display an inline negotiation form containing an amount input field and an optional message text field.
5. THE IncomingRequestsPage SHALL replace all emoji and cartoon icon usages with the `LottieIcon` component.

---

### Requirement 2 — Negotiation: Unlimited Counter-Offer Rounds

**User Story:** As a creator or brand, I want to propose and counter-propose amounts across unlimited rounds, so that both parties can reach a mutually agreed price before committing.

#### Acceptance Criteria

1. WHEN a creator or brand submits a counter-offer, THE System SHALL insert a new row into the `campaign_negotiations` table containing `campaign_id`, `proposed_by` (enum: `brand` or `creator`), `amount` (DECIMAL), `message` (TEXT, nullable), and `created_at` (TIMESTAMP).
2. WHEN a counter-offer is submitted, THE System SHALL set `campaigns.status` to `negotiating` and update `campaigns.negotiate_amount` to the newly proposed amount.
3. WHILE `campaigns.status = 'negotiating'`, THE System SHALL display the full negotiation history to both the brand and the creator, ordered by `created_at` ascending.
4. WHILE `campaigns.status = 'negotiating'`, THE System SHALL allow either the brand or the creator to submit a new counter-offer, with no limit on the number of rounds.
5. WHEN either party submits a counter-offer, THE System SHALL create a notification for the opposing party indicating that a new counter-offer has been received.
6. IF a counter-offer `amount` is less than or equal to zero, THEN THE System SHALL return a 400 error with the message "Offer amount must be greater than zero" and SHALL NOT insert a negotiation row.

---

### Requirement 3 — Negotiation: Accepting the Current Offer

**User Story:** As a creator or brand, I want to accept the current counter-offer at any point during negotiation, so that we can proceed to escrow without further back-and-forth.

#### Acceptance Criteria

1. WHILE `campaigns.status = 'negotiating'`, THE System SHALL display an "Accept Offer" button to both the brand and the creator alongside the latest negotiation entry.
2. WHEN either party clicks "Accept Offer", THE System SHALL set `campaigns.status` to `creator_accepted` and set `campaigns.budget` to the value of `campaigns.negotiate_amount`.
3. WHEN the offer is accepted, THE System SHALL create a notification for both the brand and the creator confirming that the negotiation has concluded and the agreed amount.
4. WHEN the offer is accepted, THE System SHALL prevent any further counter-offers from being submitted for that campaign.

---

### Requirement 4 — Escrow: Locking After Acceptance

**User Story:** As a creator, I want to receive a notification when the brand locks escrow after acceptance, so that I know the payment is secured before I start creating content.

#### Acceptance Criteria

1. WHEN `campaigns.status` transitions to `creator_accepted`, THE CampaignTracking page SHALL display a "Lock Escrow" action banner to the brand.
2. WHEN the brand locks escrow, THE System SHALL set `campaigns.escrow_status` to `held` and `campaigns.status` to `agreement_locked`.
3. WHEN escrow is locked, THE System SHALL create a notification for the creator with the title "Escrow Locked" and a message stating the held amount.
4. IF the escrow lock API call fails, THEN THE System SHALL display an inline error message to the brand and SHALL NOT change `campaigns.status`.

---

### Requirement 5 — Content Submission: Multi-Platform URL Upload

**User Story:** As a creator, I want to submit separate content URLs for each platform I am active on, so that the brand can review the correct link per platform.

#### Acceptance Criteria

1. WHEN a creator navigates to the content submission step for a campaign, THE System SHALL query `creator_social_profiles` for that creator and determine which platforms are connected.
2. WHERE the creator has both an Instagram profile and a YouTube profile in `creator_social_profiles`, THE System SHALL render two URL input fields: one labelled "Instagram URL" and one labelled "YouTube URL".
3. WHERE the creator has only one connected platform, THE System SHALL render a single URL input field labelled with that platform's name.
4. WHEN the creator submits content URLs, THE System SHALL insert one row per submitted URL into `content_submissions`, with a `platform` column (VARCHAR 50) storing the platform name and a `content_url` column (VARCHAR 500) storing the URL.
5. IF a submitted URL does not begin with `http://` or `https://`, THEN THE System SHALL return a 400 error with the message "Invalid URL format" and SHALL NOT insert any `content_submissions` rows.
6. WHEN content URLs are submitted, THE System SHALL set `campaigns.status` to `content_uploaded`.
7. WHEN content URLs are submitted, THE System SHALL create a notification for the brand indicating that the creator has uploaded content for review.

---

### Requirement 6 — Brand Content Review: Correction Requests and Go Live

**User Story:** As a brand, I want to review submitted content URLs, request corrections if needed, and then click "Go Live" to approve and release payment, so that I maintain quality control before the campaign goes public.

#### Acceptance Criteria

1. WHEN `campaigns.status = 'content_uploaded'`, THE CampaignTracking page SHALL display all submitted content URLs from `content_submissions` for that campaign, grouped by platform.
2. WHEN `campaigns.status = 'content_uploaded'`, THE CampaignTracking page SHALL display a "Request Corrections" button and a "Go Live" button to the brand.
3. WHEN the brand clicks "Request Corrections", THE System SHALL require the brand to enter a correction note before submitting.
4. WHEN the brand submits a correction request, THE System SHALL update the `content_submissions` row `status` to `revision_requested`, store the correction note in `rejection_note`, and set `campaigns.status` back to `creator_accepted`.
5. WHEN the brand submits a correction request, THE System SHALL create a notification for the creator containing the correction note.
6. WHEN the brand clicks "Go Live", THE System SHALL set `campaigns.status` to `posted_live`.
7. WHEN `campaigns.status` transitions to `posted_live`, THE System SHALL automatically release escrow by setting `campaigns.escrow_status` to `released` and creating an `earnings` record for the creator.
8. WHEN `campaigns.status` transitions to `posted_live`, THE System SHALL automatically set `campaigns.status` to `campaign_closed` after payment release is confirmed.
9. WHEN the campaign is closed, THE System SHALL create a notification for the creator confirming payment release and campaign closure.

---

### Requirement 7 — Metrics Page: Live Data from External APIs

**User Story:** As a brand, I want to see live performance metrics fetched directly from YouTube and Instagram APIs when I open the Metrics page, so that I always see up-to-date stats without manual refresh.

#### Acceptance Criteria

1. WHEN the brand navigates to `/brand/metrics`, THE Metrics Page SHALL fetch live video statistics from the YouTube Data API v3 using the `youtube_date_key` environment variable for each campaign that has a YouTube content URL.
2. WHEN the brand navigates to `/brand/metrics`, THE Metrics Page SHALL fetch live post statistics from the Instagram RapidAPI using the `RAPIDAPI_KEY` environment variable for each campaign that has an Instagram content URL.
3. THE Metrics Page SHALL display a campaign card for each closed or live campaign, showing the content video/post link and the fetched statistics including views, likes, comments, and engagement rate where available per platform.
4. IF the YouTube Data API v3 call returns an error or times out after 10 seconds, THEN THE Metrics Page SHALL display a "YouTube data unavailable" message in place of YouTube stats and SHALL NOT block rendering of other campaign cards.
5. IF the Instagram RapidAPI call returns an error or times out after 10 seconds, THEN THE Metrics Page SHALL display an "Instagram data unavailable" message in place of Instagram stats and SHALL NOT block rendering of other campaign cards.
6. THE Metrics Page SHALL be accessible only to authenticated users with the `brand` role.

---

### Requirement 8 — Notifications: "Read All" Button

**User Story:** As a brand or creator, I want a single "Read All" button in my notification dropdown, so that I can dismiss all unread notifications at once without clicking each one individually.

#### Acceptance Criteria

1. WHEN the notification dropdown is open and at least one unread notification exists, THE TopBar SHALL display a "Read All" button in the dropdown header area.
2. WHEN the notification dropdown is open and at least one unread notification exists, THE BrandTopBar SHALL display a "Read All" button in the dropdown header area.
3. WHEN the creator clicks "Read All" in the TopBar dropdown, THE System SHALL call a bulk-mark-read API endpoint and set `is_read = true` for all notifications where `user_type = 'creator'` and `user_id` matches the authenticated creator.
4. WHEN the brand clicks "Read All" in the BrandTopBar dropdown, THE System SHALL call a bulk-mark-read API endpoint and set `is_read = true` for all notifications where `user_type = 'brand'` and `user_id` matches the authenticated brand.
5. WHEN the "Read All" action completes successfully, THE notification dropdown SHALL update the local notification list to reflect all items as read and SHALL remove the unread indicator dot from the bell icon.
6. IF the bulk-mark-read API call fails, THEN THE notification dropdown SHALL display an inline error message and SHALL NOT update the local notification state.

---

### Requirement 9 — UI: Replace Emoji/Cartoon Icons with LottieIcon

**User Story:** As a user, I want consistent animated icons throughout the campaign flow pages, so that the interface looks polished and uniform.

#### Acceptance Criteria

1. THE System SHALL replace all emoji characters (e.g., 📅, 🔗, 💰, ✅, 📊, 🎉) used as visual indicators in IncomingRequestsPage, CampaignTracking, and BrandTopBar with the `LottieIcon` component using an appropriate named icon.
2. THE System SHALL replace all cartoon or decorative icon usages in the campaign flow pages with the `LottieIcon` component.
3. WHERE a required icon name does not exist in the `LottieIcon` ICONS map, THE System SHALL add the corresponding Lucide icon import and entry to the `ICONS` map in `LottieIcon.jsx` before using it.
4. THE `LottieIcon` component SHALL maintain its existing `name`, `size`, `loop`, and `className` prop API without breaking changes.

---

### Requirement 10 — Database: Schema Changes

**User Story:** As a developer, I want the database schema updated to support negotiation history, the negotiating status, and multi-URL content submissions, so that the new campaign flow can be persisted correctly.

#### Acceptance Criteria

1. THE System SHALL add `'negotiating'` to the `campaigns.status` ENUM, positioned before `'declined'`.
2. THE System SHALL add a `negotiate_amount` DECIMAL(10,2) column to the `campaigns` table if it does not already exist, defaulting to NULL.
3. THE System SHALL add a `negotiate_message` TEXT column to the `campaigns` table if it does not already exist, defaulting to NULL.
4. THE System SHALL create a `campaign_negotiations` table with columns: `id` INT AUTO_INCREMENT PRIMARY KEY, `campaign_id` INT NOT NULL (FK → campaigns.id ON DELETE CASCADE), `proposed_by` ENUM('brand','creator') NOT NULL, `amount` DECIMAL(10,2) NOT NULL, `message` TEXT NULL, `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP.
5. THE System SHALL add a `platform` VARCHAR(50) NULL column to the `content_submissions` table to record which platform each submitted URL belongs to.
6. THE System SHALL add a `content_url` VARCHAR(500) NULL column to the `content_submissions` table to store the submitted content URL per platform, replacing reliance on `campaigns.content_url` for multi-URL scenarios.
7. THE System SHALL add a bulk-mark-read API endpoint `PUT /api/notifications/read-all` that accepts `user_type` and `user_id` from the authenticated session and sets `is_read = true` for all matching unread notifications.
