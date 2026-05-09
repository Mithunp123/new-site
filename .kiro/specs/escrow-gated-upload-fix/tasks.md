# Implementation Plan: Escrow-Gated Upload Fix

## Overview

Two targeted edits to `frontend/src/pages/MyCampaignsPage.jsx`, followed by property-based tests that verify the fixed predicate and status-message mapping. No other files are touched.

## Tasks

- [x] 1. Fix `canUpload` predicate and Status Info Block in `MyCampaignsPage.jsx`
  - [x] 1.1 Remove `creator_accepted` from the `canUpload` predicate
    - In `MyCampaignsPage.jsx`, update the `canUpload` arrow function so it only returns `true` for `'agreement_locked'` and `'escrow_locked'`
    - Update the comment above the function to remove the misleading reference to `creator_accepted`
    - _Requirements: 1.1, 1.2, 4.5_

  - [x] 1.2 Add `creator_accepted` branch to the Status Info Block ternary
    - In the featured campaign card's Status Info Block, insert a new ternary branch for `featured.status === 'creator_accepted'` immediately after the `request_sent` / `negotiating` branch
    - The branch must return the exact string: `'Waiting for brand to lock escrow before you can upload content.'`
    - _Requirements: 2.1, 2.2, 2.3, 3.2, 3.6_

- [x] 2. Set up test infrastructure
  - Install `vitest` and `fast-check` as dev dependencies:
    ```
    npm install --save-dev vitest fast-check
    ```
  - Add a `test` script to `frontend/package.json`:
    ```json
    "test": "vitest run"
    ```
  - Create `frontend/src/pages/__tests__/MyCampaignsPage.logic.test.js`
  - Extract the two pure functions under test into the test file (or import them if they are exported — if not exported, copy the implementations directly into the test file as local helpers):
    - `canUpload(c)` — the fixed predicate
    - `statusMessage(status)` — a plain function that mirrors the ternary chain from the Status Info Block
  - _Requirements: 1.1, 1.2, 2.1, 3.1–3.6_

- [x] 3. Write property-based and unit tests
  - [x]* 3.1 Write property test for `canUpload` upload eligibility (Property 1)
    - Use `fc.string()` as the arbitrary to generate any status string
    - Assert: `canUpload({ status }) === (status === 'agreement_locked' || status === 'escrow_locked')`
    - Run minimum 100 iterations
    - Tag: `Feature: escrow-gated-upload-fix, Property 1: Upload eligibility is exactly the escrow-locked statuses`
    - _Requirements: 1.1, 1.2, 4.5_

  - [x]* 3.2 Write property test for status message mapping totality (Property 2)
    - Use `fc.constantFrom(...nonUploadNonClosedStatuses)` as the arbitrary
    - Assert: `statusMessage(status)` equals the exact expected string for each status and is non-empty
    - Run minimum 100 iterations
    - Tag: `Feature: escrow-gated-upload-fix, Property 2: Status-to-message mapping is total and correct`
    - _Requirements: 2.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x]* 3.3 Write property test for `creator_accepted` message distinctness (Property 3)
    - No generator needed — deterministic assertion
    - Assert: `statusMessage('creator_accepted') !== statusMessage('request_sent')` and `statusMessage('creator_accepted') !== statusMessage('negotiating')`
    - Tag: `Feature: escrow-gated-upload-fix, Property 3: creator_accepted message is distinct`
    - _Requirements: 2.3_

  - [x]* 3.4 Write unit tests for concrete status examples
    - `canUpload({ status: 'creator_accepted' })` → `false`
    - `canUpload({ status: 'agreement_locked' })` → `true`
    - `canUpload({ status: 'escrow_locked' })` → `true`
    - `canUpload({ status: 'request_sent' })` → `false`
    - `canUpload({ status: 'campaign_closed' })` → `false`
    - `statusMessage('creator_accepted')` → `'Waiting for brand to lock escrow before you can upload content.'`
    - `statusMessage('request_sent')` → `'Waiting for negotiation to complete and escrow to be locked.'`
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.2_

- [x] 4. Checkpoint — Ensure all tests pass
  - Run `npm test` from the `frontend/` directory and confirm all tests pass. Ask the user if any questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster fix
- `canUpload` and the Status Info Block ternary are pure logic — no DOM or React rendering setup is needed for the tests
- `CampaignTracking.jsx` is explicitly out of scope and must not be modified (Requirement 5.1)
- Both the featured card and the all-campaigns table are corrected by the single `canUpload` change in Task 1.1 — no separate table fix is needed
