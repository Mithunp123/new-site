# Requirements Document

## Introduction

The campaign tracking flow on the creator side (`MyCampaignsPage.jsx`) currently allows creators to see the "Upload Content Links" button and upload form when a campaign is in the `creator_accepted` status. At that point, the brand has not yet locked escrow — escrow is only locked when the status transitions to `agreement_locked`. This is a UI correctness bug: the upload affordance must be gated on escrow being locked, not on the creator having accepted the deal.

The correct campaign status flow is:

`request_sent` → `negotiating` → `creator_accepted` → `agreement_locked` (escrow locked here) → `content_uploaded` → `brand_approved` → `posted_live` → `analytics_collected` → `escrow_released` → `campaign_closed`

This fix removes `creator_accepted` from the upload-eligibility check and adds a clear waiting message for that state, applied consistently to both the featured campaign card and the all-campaigns table rows.

## Glossary

- **Campaign**: A collaboration agreement between a brand and a creator, tracked through a defined sequence of statuses.
- **Creator**: The user on the creator side of the platform, viewing `MyCampaignsPage`.
- **Escrow**: Funds held by the platform on behalf of the brand, locked when the campaign reaches `agreement_locked` status.
- **canUpload**: The predicate function in `MyCampaignsPage.jsx` that determines whether the upload button and form are shown for a given campaign.
- **Featured Campaign Card**: The prominent top-level campaign card rendered for `campaigns[0]` in `MyCampaignsPage`.
- **All-Campaigns Table**: The table below the featured card that lists all campaigns with an inline Action column.
- **Status Info Block**: The `<div>` rendered when `!canUpload(c)` is true and the campaign is not closed, showing a contextual waiting message.
- **Upload Section**: The inline form (`UploadSection` component) that accepts per-platform content URLs and submits them.

## Requirements

### Requirement 1: Restrict Upload Eligibility to Escrow-Locked Statuses

**User Story:** As a creator, I want the upload button and form to appear only after the brand has locked escrow, so that I am not prompted to upload content before the payment guarantee is in place.

#### Acceptance Criteria

1. THE `canUpload` function SHALL return `true` only when the campaign status is `agreement_locked` or `escrow_locked`.
2. THE `canUpload` function SHALL return `false` when the campaign status is `creator_accepted`.
3. WHEN a campaign has status `agreement_locked`, THE `MyCampaignsPage` SHALL display the "Upload Content Links" button for that campaign.
4. WHEN a campaign has status `escrow_locked`, THE `MyCampaignsPage` SHALL display the "Upload Content Links" button for that campaign.
5. WHEN a campaign has status `creator_accepted`, THE `MyCampaignsPage` SHALL NOT display the "Upload Content Links" button or the upload form for that campaign.

### Requirement 2: Show Waiting Message for `creator_accepted` Status

**User Story:** As a creator, I want to see a clear message when I have accepted a deal but the brand has not yet locked escrow, so that I understand why I cannot upload content yet.

#### Acceptance Criteria

1. WHEN a campaign status is `creator_accepted`, THE `MyCampaignsPage` SHALL display the message: "Waiting for brand to lock escrow before you can upload content."
2. WHEN a campaign status is `creator_accepted`, THE `MyCampaignsPage` SHALL display the waiting message in the Status Info Block (the `bg-slate-50` info panel), not in place of the upload button.
3. THE Status Info Block SHALL include a case for `creator_accepted` that is distinct from the existing `request_sent` / `negotiating` case.

### Requirement 3: Correct Status Info Block Coverage

**User Story:** As a creator, I want the status info block to accurately reflect every non-upload, non-closed campaign state, so that I always have context on what is happening with my campaign.

#### Acceptance Criteria

1. WHEN a campaign status is `request_sent` or `negotiating`, THE `MyCampaignsPage` SHALL display the message: "Waiting for negotiation to complete and escrow to be locked."
2. WHEN a campaign status is `creator_accepted`, THE `MyCampaignsPage` SHALL display the message: "Waiting for brand to lock escrow before you can upload content."
3. WHEN a campaign status is `content_uploaded`, THE `MyCampaignsPage` SHALL display the message: "Content submitted. Waiting for brand review."
4. WHEN a campaign status is `brand_approved` or `posted_live`, THE `MyCampaignsPage` SHALL display the message: "Content approved and live! Payment will be released automatically."
5. WHEN a campaign status is `analytics_collected` or `escrow_released`, THE `MyCampaignsPage` SHALL display the message: "Payment released. Campaign closing."
6. THE Status Info Block SHALL be rendered for all non-upload, non-closed statuses listed in acceptance criteria 1–5 above.

### Requirement 4: Apply Fix Consistently Across Both UI Surfaces

**User Story:** As a creator, I want the upload gating to behave identically whether I am looking at the featured campaign card or the all-campaigns table, so that there is no inconsistency in what I can do.

#### Acceptance Criteria

1. WHEN a campaign has status `creator_accepted`, THE featured campaign card SHALL NOT render the "Upload Content Links" button or the `UploadSection` form.
2. WHEN a campaign has status `creator_accepted`, THE all-campaigns table Action column SHALL NOT render the "Upload" link for that campaign row.
3. WHEN a campaign has status `agreement_locked` or `escrow_locked`, THE featured campaign card SHALL render the "Upload Content Links" button.
4. WHEN a campaign has status `agreement_locked` or `escrow_locked`, THE all-campaigns table Action column SHALL render the "Upload" link for that campaign row.
5. THE fix SHALL be achieved by modifying the single shared `canUpload` predicate function so that both surfaces are corrected by one change.

### Requirement 5: No Changes to Brand Side

**User Story:** As a platform maintainer, I want the brand-side campaign tracking to remain unmodified, so that the fix is scoped only to the creator UI.

#### Acceptance Criteria

1. THE `CampaignTracking.jsx` file SHALL NOT be modified as part of this fix.
