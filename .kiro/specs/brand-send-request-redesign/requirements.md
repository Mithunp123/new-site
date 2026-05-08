# Requirements Document

## Introduction

This feature covers the visual redesign of the `/brand/send-request` page (`SendRequest.jsx`) to align it with the modern design system used consistently across the rest of the brand dashboard. The page already contains correct business logic (form submission, validation, API call, creator profile sidebar, budget summary with escrow fee calculation). The redesign replaces legacy styling patterns with the shared design system tokens, utility classes, and animation conventions — without altering any functional behaviour.

## Glossary

- **SendRequest_Page**: The React component rendered at `/brand/send-request`, responsible for collecting campaign brief details and submitting a collaboration request to a creator.
- **Design_System**: The set of shared CSS utility classes (`.card`, `.btn-primary-purple`, `.btn-secondary`, `.input`, `.input-label`, `.page-header`, `.page-title`, `.page-subtitle`, `.section-title`, `.badge`, `.badge-*`) defined in `index.css`, plus the `brand-theme` CSS scope and Framer Motion entrance animation conventions used across all brand dashboard pages.
- **Brand_Theme**: The `.brand-theme` CSS class applied by the brand layout wrapper that remaps blue accent variables to purple (`#7C3AED` / `#6D28D9`), ensuring primary actions render in purple inside brand pages.
- **Entrance_Animation**: The standard `motion.div` wrapper with `initial={{ opacity: 0, y: 10 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.3 }}` used on every brand dashboard page root element.
- **Creator_Profile_Sidebar**: The right-column panel displaying the target creator's avatar, name, platform stats, and niche categories.
- **Budget_Summary_Card**: The right-column panel displaying the budget offer, platform fee (8%), total-to-escrow calculation, and the escrow information notice.
- **Stat_Tile**: An individual stat display element inside the Creator_Profile_Sidebar showing a single metric (followers, engagement rate, average views, platform).
- **FormGroup**: The reusable sub-component rendering a labelled text or date input field.
- **FormSelect**: The reusable sub-component rendering a labelled `<select>` dropdown field.
- **Campaign_Brief_Card**: The main left-column `.card` container holding all form fields.

---

## Requirements

### Requirement 1: Page-Level Entrance Animation

**User Story:** As a brand user, I want the Send Request page to animate in smoothly when I navigate to it, so that the experience feels consistent with the rest of the brand dashboard.

#### Acceptance Criteria

1. WHEN the SendRequest_Page mounts, THE page content SHALL transition from invisible (opacity 0, shifted 10px downward) to fully visible (opacity 1, natural position) over approximately 0.3 seconds.
2. WHEN the SendRequest_Page is unmounted and remounted (e.g. navigating away and back), THE entrance animation SHALL replay from the initial invisible state.
3. THE SendRequest_Page root container SHALL maintain consistent vertical spacing between its child sections, matching the `space-y-6` gap used on other brand dashboard pages.
4. IF the user has enabled the operating system "reduce motion" accessibility preference, THEN THE page SHALL appear immediately without any positional or opacity transition.

---

### Requirement 2: Standard Page Header

**User Story:** As a brand user, I want the page header to use the same layout and typography as every other brand dashboard page, so that navigation and context feel familiar.

#### Acceptance Criteria

1. THE SendRequest_Page SHALL render a header container using the `.page-header` utility class.
2. THE SendRequest_Page SHALL render the primary heading "Send Collaboration Request" using the `.page-title` utility class.
3. THE SendRequest_Page SHALL render a subtitle line using the `.page-subtitle` utility class, displaying the target creator's name and display name in the format "Sending to: {creator.name} — {creator.display_name}"; WHEN `creator.display_name` is absent or empty, THE subtitle SHALL omit the display name portion gracefully.
4. THE SendRequest_Page SHALL render a "Back to Discovery" button that is visually separated from the heading text, appearing on the opposite side of the header row on screens wider than the `sm` breakpoint.
5. WHEN the "Back to Discovery" button is clicked, THE SendRequest_Page SHALL navigate the user to the Discover page (`/brand/discover`).

---

### Requirement 3: Campaign Brief Card Styling

**User Story:** As a brand user, I want the campaign brief form container to use the standard card style, so that it visually matches other content panels across the dashboard.

#### Acceptance Criteria

1. THE Campaign_Brief_Card SHALL use the `.card` utility class instead of the legacy `bg-white border border-gray-100 rounded-3xl shadow-sm` inline classes.
2. THE Campaign_Brief_Card SHALL apply `p-6` padding and `space-y-6` vertical spacing on the same wrapper element that carries the `.card` class.
3. THE Campaign_Brief_Card section heading "Campaign Brief" SHALL use the `.section-title` utility class exclusively, replacing any inline font, size, or weight classes (such as `text-xl`, `font-bold`) so that the heading renders at `text-[15px]`, `font-semibold`, `text-slate-900`, and `font-family: 'Sora'`.
4. THE Campaign_Brief_Card section heading SHALL NOT use `font-jakarta` or `font-sora` inline utility classes.

---

### Requirement 4: Form Input Styling

**User Story:** As a brand user, I want all form inputs to use the standard `.input` class, so that focus states, borders, and typography are consistent with other forms in the dashboard.

#### Acceptance Criteria

1. THE FormGroup component SHALL apply the `.input` utility class to its `<input>` element.
2. THE FormSelect component SHALL apply the `.input` utility class to its `<select>` element.
3. WHEN a user focuses any `.input` field, THE field SHALL display the focus ring and border colour defined by the `.input` class contract in `index.css`.
4. THE `<textarea>` fields for "Campaign Brief" and "Deliverables Required" SHALL apply the `.input` utility class.
5. THE "Campaign Brief" `<textarea>` SHALL retain `rows={5}` and the "Deliverables Required" `<textarea>` SHALL retain `rows={4}`; both SHALL include `resize-none` to prevent manual resizing.

---

### Requirement 5: Form Label Styling

**User Story:** As a brand user, I want all form labels to use the standard `.input-label` class, so that label typography is consistent across all dashboard forms.

#### Acceptance Criteria

1. THE FormGroup component SHALL apply the `.input-label` utility class to its `<label>` element, replacing the legacy `text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider text-[10px]` inline classes.
2. THE FormSelect component SHALL apply the `.input-label` utility class to its `<label>` element, replacing the legacy `text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider text-[10px]` inline classes.
3. THE `<label>` elements for the "Campaign Brief" and "Deliverables Required" textarea fields in the SendRequest form SHALL apply the `.input-label` utility class.
4. WHERE a field is required, THE label element SHALL contain a visible asterisk indicator rendered in red, so that required fields are distinguishable from optional ones without relying solely on colour.

---

### Requirement 6: Submit and Action Button Styling

**User Story:** As a brand user, I want the form action buttons to use the standard button classes so that they match the purple-accented brand theme and secondary button style used elsewhere.

#### Acceptance Criteria

1. THE submit button ("Send Collaboration Request") SHALL have the `.btn-primary-purple` utility class applied to it.
2. THE "Save as Draft" button SHALL have the `.btn-secondary` utility class applied to it.
3. WHEN `submitting` is `true`, THE submit button SHALL display an animated loading indicator and the label "Sending Request..." and SHALL be `disabled`.
4. WHEN `submitting` is `true`, THE "Save as Draft" button SHALL also be `disabled`.
5. WHEN `submitting` is `false`, THE submit button SHALL display a `Zap` icon rendered with a fill style applied.
6. THE "Save as Draft" button SHALL include a `Save` icon at all times.

---

### Requirement 7: Creator Profile Sidebar Card Styling

**User Story:** As a brand user, I want the creator profile sidebar to use the standard card style and stat tile pattern, so that it looks consistent with profile and stats panels on other dashboard pages.

#### Acceptance Criteria

1. THE Creator_Profile_Sidebar container SHALL use the `.card` utility class, replacing the legacy `bg-white border border-gray-100 rounded-3xl shadow-sm` inline classes.
2. THE Creator_Profile_Sidebar SHALL apply `p-6` padding and `space-y-5` vertical spacing internally.
3. THE Creator_Profile_Sidebar heading "Creator Profile" SHALL use the `.section-title` utility class, replacing the legacy `font-jakarta` class; the heading SHALL render using `font-family: 'Sora'` as defined by `.section-title`.
4. EACH Stat_Tile inside the Creator_Profile_Sidebar SHALL use `bg-slate-50 rounded-xl` as its container background, replacing the legacy `bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100` inline classes; the hover border interaction SHALL be intentionally removed as part of this change.
5. THE Stat_Tile label text SHALL use `text-[10px] font-semibold text-slate-400 uppercase tracking-wider` styling.
6. THE Stat_Tile value text SHALL use `text-sm font-bold text-slate-900` styling.
7. THE niche category badges inside the Creator_Profile_Sidebar SHALL use the `.badge` and `.badge-purple` utility classes, replacing the legacy `rounded-full` pill shape with the `rounded-lg` shape defined by `.badge`; this shape change is intentional.

---

### Requirement 8: Budget Summary Card Styling

**User Story:** As a brand user, I want the budget summary panel to use the standard card style and a consistent info-box pattern, so that it matches the visual language of other summary panels in the dashboard.

#### Acceptance Criteria

1. THE Budget_Summary_Card container SHALL use the `.card` utility class, replacing the legacy `bg-white border border-gray-100 rounded-3xl shadow-sm` inline classes.
2. THE Budget_Summary_Card SHALL apply `p-6` padding and `space-y-4` vertical spacing internally.
3. THE Budget_Summary_Card heading "Budget Summary" SHALL use the `.section-title` utility class.
4. THE escrow information notice box SHALL use `bg-blue-50 rounded-xl` as its container, replacing the legacy `rounded-2xl` radius.
5. THE escrow information notice SHALL display a `w-5 h-5 text-blue-600` `Info` icon and the exact copy: "Funds held in escrow until brand approves the posted content. Creator receives payment automatically." in `text-blue-700` colour.
6. THE divider between line items and the total row SHALL use `border-t border-slate-100` replacing the legacy `h-px bg-gray-50` spacer element.
7. THE numeric "Total to Escrow" value SHALL be styled with `text-lg text-[#7C3AED] font-bold`; the "Total to Escrow" label text SHALL retain `text-sm font-bold text-gray-900` styling.

---

### Requirement 9: Typography — Remove Legacy Font Classes

**User Story:** As a brand user, I want all headings on the Send Request page to use the `Sora` font consistent with the rest of the dashboard, so that typography is uniform.

#### Acceptance Criteria

1. THE SendRequest_Page SHALL NOT contain `font-jakarta` in any element's `className` prop or inline `style` attribute.
2. ALL section and page headings in the SendRequest_Page SHALL have either the `.page-title` or `.section-title` class applied; no additional inline font-family, font-size, or font-weight classes SHALL override these.
3. THE `<label>` elements rendered by FormGroup and FormSelect sub-components, the textarea labels, and the action buttons SHALL have their font family governed by `.input-label` or `.btn-*` utility classes respectively, with no additional inline `font-*` utility classes applied.

---

### Requirement 10: Functional Behaviour Preservation

**User Story:** As a brand user, I want all existing form functionality to continue working after the redesign, so that I can still submit collaboration requests without disruption.

#### Acceptance Criteria

1. WHEN the SendRequest_Page mounts without a `creator` object in `location.state`, THE SendRequest_Page SHALL redirect the user to the Discover page and replace the current history entry so the back button does not return to the empty send-request page.
2. WHEN a user submits the form with one or more required fields empty or with `budget_offer` ≤ 0, THE SendRequest_Page SHALL display an alert listing the human-readable names of the missing fields.
3. WHEN a user submits a valid form, THE SendRequest_Page SHALL send a POST request to `/api/brand/collaboration/send-request` containing all `formData` fields and, on a successful response, navigate the user to `/brand/requests`.
4. IF the API call returns an error response, THEN THE SendRequest_Page SHALL display the error message from the response body if present, falling back to the message "Error sending request. Please ensure all fields are valid." if no message is available.
5. WHEN the `budget_offer` field value changes, THE SendRequest_Page SHALL recalculate and display `fee` as `budget_offer * 0.08` and `total` as `budget_offer + fee`; WHEN `budget_offer` is zero, empty, or negative, THEN `fee` and `total` SHALL both display as `0`.
6. WHEN a valid form is submitted, THE POST request body SHALL include all of the following fields: `creator_id`, `campaign_name`, `campaign_goal`, `campaign_brief`, `platform`, `content_type`, `number_of_posts`, `start_date`, `end_date`, `respond_by`, `budget_offer`, `tracking_link`, `deliverables_required`.
7. THE `platform` field `<select>` SHALL display title-cased labels (e.g. "Instagram", "YouTube") to the user while submitting the corresponding lowercase values (`instagram`, `youtube`, `tiktok`, `twitter`) in the POST request body.
