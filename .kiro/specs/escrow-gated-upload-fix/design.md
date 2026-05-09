# Design Document: Escrow-Gated Upload Fix

## Overview

This is a targeted frontend bug fix in `MyCampaignsPage.jsx`. The upload affordance (button, form, and table action link) is currently shown to creators when a campaign is in the `creator_accepted` status — before the brand has locked escrow. The fix removes `creator_accepted` from the `canUpload` predicate and adds a distinct waiting message for that status in the Status Info Block.

No backend changes are required. No other files are touched.

---

## Architecture

The fix is entirely contained within a single file:

```
frontend/src/pages/MyCampaignsPage.jsx
```

The page renders two UI surfaces that both gate on the same `canUpload` predicate:

```
MyCampaignsPage
├── Featured Campaign Card
│   ├── canUpload(featured) → Upload button / UploadSection
│   └── !canUpload(featured) → Status Info Block
└── All-Campaigns Table
    └── canUpload(c) → "Upload" action link per row
```

Because both surfaces share the single `canUpload` function, fixing the predicate corrects both surfaces simultaneously.

---

## Components and Interfaces

### `canUpload(c)` — the predicate

This is a plain function (not a component) defined at module scope inside `MyCampaignsPage.jsx`. It takes a campaign object and returns a boolean.

**Current (buggy):**
```js
// Can upload when escrow is locked (agreement_locked) or creator_accepted
const canUpload = (c) =>
  c.status === 'agreement_locked' ||
  c.status === 'escrow_locked' ||
  c.status === 'creator_accepted';   // ← BUG
```

**Fixed:**
```js
// Can upload only when escrow is locked
const canUpload = (c) =>
  c.status === 'agreement_locked' ||
  c.status === 'escrow_locked';
```

The comment on the line above the function also needs updating to remove the misleading reference to `creator_accepted`.

---

### Status Info Block — the ternary chain

The Status Info Block is rendered when `!canUpload(c) && c.status !== 'campaign_closed'`. It uses a ternary chain to select the message string. Currently there is no branch for `creator_accepted`, so it falls through to the empty string `''`.

**Current (buggy — no creator_accepted branch):**
```jsx
{featured.status === 'request_sent' || featured.status === 'negotiating'
  ? 'Waiting for negotiation to complete and escrow to be locked.'
  : featured.status === 'content_uploaded'
  ? 'Content submitted. Waiting for brand review.'
  : featured.status === 'brand_approved' || featured.status === 'posted_live'
  ? 'Content approved and live! Payment will be released automatically.'
  : featured.status === 'analytics_collected' || featured.status === 'escrow_released'
  ? 'Payment released. Campaign closing.'
  : ''}
```

**Fixed — insert `creator_accepted` branch after the `request_sent`/`negotiating` branch:**
```jsx
{featured.status === 'request_sent' || featured.status === 'negotiating'
  ? 'Waiting for negotiation to complete and escrow to be locked.'
  : featured.status === 'creator_accepted'
  ? 'Waiting for brand to lock escrow before you can upload content.'
  : featured.status === 'content_uploaded'
  ? 'Content submitted. Waiting for brand review.'
  : featured.status === 'brand_approved' || featured.status === 'posted_live'
  ? 'Content approved and live! Payment will be released automatically.'
  : featured.status === 'analytics_collected' || featured.status === 'escrow_released'
  ? 'Payment released. Campaign closing.'
  : ''}
```

The same ternary pattern is used in the featured card. The all-campaigns table does not render a Status Info Block — it only renders the "Upload" action link, which is already gated by `canUpload(c)` and requires no separate change.

---

## Data Models

No data model changes. The campaign object shape is unchanged. The relevant field is:

```ts
campaign.status: string
// Possible values (in order):
// 'request_sent' | 'negotiating' | 'creator_accepted' | 'agreement_locked'
// | 'escrow_locked' | 'content_uploaded' | 'brand_approved' | 'posted_live'
// | 'analytics_collected' | 'escrow_released' | 'campaign_closed'
```

The `canUpload` predicate only reads `c.status`. No other fields are involved.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Upload eligibility is exactly the escrow-locked statuses

*For any* campaign object, `canUpload(c)` SHALL return `true` if and only if `c.status` is `'agreement_locked'` or `'escrow_locked'`, and SHALL return `false` for every other status value — including `'creator_accepted'`.

**Validates: Requirements 1.1, 1.2, 4.5**

---

### Property 2: Status-to-message mapping is total and correct

*For any* campaign status that is not in the upload-eligible set and is not `'campaign_closed'`, the status info message function SHALL return a non-empty string that matches the specified message for that status. Specifically:

- `'request_sent'` or `'negotiating'` → `"Waiting for negotiation to complete and escrow to be locked."`
- `'creator_accepted'` → `"Waiting for brand to lock escrow before you can upload content."`
- `'content_uploaded'` → `"Content submitted. Waiting for brand review."`
- `'brand_approved'` or `'posted_live'` → `"Content approved and live! Payment will be released automatically."`
- `'analytics_collected'` or `'escrow_released'` → `"Payment released. Campaign closing."`

*For any* status in the above set, the mapping SHALL return the exact expected string (no empty fallthrough).

**Validates: Requirements 2.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

---

### Property 3: creator_accepted message is distinct from request_sent/negotiating message

*For any* invocation of the status message mapping, the string returned for `'creator_accepted'` SHALL NOT equal the string returned for `'request_sent'` or `'negotiating'`.

**Validates: Requirements 2.3**

> **Property Reflection note:** Property 3 is technically implied by Property 2 (which specifies exact strings for each status). It is retained as an explicit property because it directly encodes the distinctness requirement (Requirement 2.3) and makes the intent clear in test output.

---

## Error Handling

This fix introduces no new error paths. The `canUpload` predicate is a pure boolean expression with no side effects. The Status Info Block ternary is a pure string expression. Neither can throw.

The only risk is a status value arriving from the API that is not in the known set. The existing fallthrough to `''` (empty string) in the ternary handles unknown statuses gracefully — the info block renders but shows nothing. This behavior is unchanged by the fix.

---

## Testing Strategy

This feature is a pure logic fix in a predicate function and a string-mapping ternary. Both are well-suited to property-based testing.

**Property-based testing library:** [fast-check](https://github.com/dubzzz/fast-check) (already available in the JS/React ecosystem; install as a dev dependency if not present).

### Unit / Example Tests

Cover the specific scenarios from the requirements:

| Scenario | Expected |
|---|---|
| `canUpload({ status: 'creator_accepted' })` | `false` |
| `canUpload({ status: 'agreement_locked' })` | `true` |
| `canUpload({ status: 'escrow_locked' })` | `true` |
| `canUpload({ status: 'request_sent' })` | `false` |
| `canUpload({ status: 'campaign_closed' })` | `false` |
| `statusMessage('creator_accepted')` | `"Waiting for brand to lock escrow before you can upload content."` |
| `statusMessage('request_sent')` | `"Waiting for negotiation to complete and escrow to be locked."` |
| `statusMessage('creator_accepted') !== statusMessage('request_sent')` | `true` |

### Property-Based Tests

Each property test runs a minimum of 100 iterations.

**Property 1 test** — `canUpload` returns true iff status is in `{agreement_locked, escrow_locked}`:
- Generator: arbitrary string (covers all known statuses and unknown values)
- Assert: `canUpload({ status }) === (status === 'agreement_locked' || status === 'escrow_locked')`
- Tag: `Feature: escrow-gated-upload-fix, Property 1: Upload eligibility is exactly the escrow-locked statuses`

**Property 2 test** — status message mapping is total and correct for all non-upload, non-closed statuses:
- Generator: one of the known non-upload, non-closed status strings
- Assert: `statusMessage(status)` equals the exact expected string for that status, and is non-empty
- Tag: `Feature: escrow-gated-upload-fix, Property 2: Status-to-message mapping is total and correct`

**Property 3 test** — `creator_accepted` message is distinct:
- No generator needed (deterministic)
- Assert: `statusMessage('creator_accepted') !== statusMessage('request_sent')`
- Tag: `Feature: escrow-gated-upload-fix, Property 3: creator_accepted message is distinct`

### What is NOT tested here

- `CampaignTracking.jsx` — untouched, no tests needed
- Backend API — no changes, no tests needed
- UI rendering / DOM assertions — the logic is extracted into pure functions for testability; DOM-level tests are not required for this fix
