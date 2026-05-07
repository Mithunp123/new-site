# UI Redesign Bugfix — Implementation Tasks

## Task List

- [ ] 1. Fix global CSS tokens and layout spacing
  - [ ] 1.1 Update `.page-content` in `index.css`: remove `max-w-[1400px]` so content fills full width without right-side gap
  - [ ] 1.2 Update `.page-wrapper` background to `#F8FAFC` for the premium light-gray page feel

- [ ] 2. Fix search icon collision in all TopBars
  - [ ] 2.1 In `TopBar.jsx`: change search input `pl-9` to `pl-10` so icon does not overlap placeholder text
  - [ ] 2.2 In `BrandTopBar.jsx`: same fix — change `pl-9` to `pl-10`
  - [ ] 2.3 In `AdminTopBar.jsx`: same fix — change `pl-9` to `pl-10`
  - [ ] 2.4 In `Discover.jsx` search input: change `pl-9` to `pl-10`

- [ ] 3. Remove non-functional ChevronDown from all TopBars
  - [ ] 3.1 In `TopBar.jsx`: remove `ChevronDown` import and the `<ChevronDown>` JSX element from the user profile section
  - [ ] 3.2 In `BrandTopBar.jsx`: same removal
  - [ ] 3.3 In `AdminTopBar.jsx`: same removal

- [ ] 4. Fix logout button visibility in all Sidebars
  - [ ] 4.1 In `Sidebar.jsx`: remove `opacity-0 group-hover:opacity-100` from the logout button, replace with `text-slate-400 hover:text-red-500 hover:bg-red-50`
  - [ ] 4.2 In `BrandSidebar.jsx`: same fix
  - [ ] 4.3 In `AdminSidebar.jsx`: same fix

- [ ] 5. Update sidebar active nav item style to premium blue pill
  - [ ] 5.1 In `Sidebar.jsx`: update active navLink class to solid blue pill `bg-[#2563EB] text-white font-semibold shadow-[0_2px_8px_rgba(37,99,235,0.3)]` and remove the left border accent span
  - [ ] 5.2 In `BrandSidebar.jsx`: same update
  - [ ] 5.3 In `AdminSidebar.jsx`: same update

- [ ] 6. Move Chat from floating button to sidebar navigation
  - [ ] 6.1 Remove `<ChatPanel />` from `Layout.jsx` (creator layout)
  - [ ] 6.2 Remove `<ChatPanel />` from `BrandLayout.jsx` (brand layout)
  - [ ] 6.3 Add `useQuery` in `Sidebar.jsx` to check if creator has active collaborations (`/api/creator/active-collaborations` or check existing requests query for accepted status)
  - [ ] 6.4 Add `MessageSquare` Chat nav item to `Sidebar.jsx` mainNav — enabled only when active collab exists, otherwise renders as disabled greyed-out item with "Soon" badge
  - [ ] 6.5 Add `useQuery` in `BrandSidebar.jsx` to check if brand has active collaborations
  - [ ] 6.6 Add `MessageSquare` Chat nav item to `BrandSidebar.jsx` — same enabled/disabled logic
  - [ ] 6.7 Create `frontend/src/pages/ChatPage.jsx` — full-page chat layout (conversation list left, message thread right) reusing logic from `ChatPanel.jsx`
  - [ ] 6.8 Create `frontend/src/pages/brand/ChatPage.jsx` — same full-page layout for brand role
  - [ ] 6.9 Add `/chat` route for creator and `/brand/chat` route for brand in `App.jsx`

- [ ] 7. Fix .toFixed() TypeError — add safeFixed utility and fix all usages
  - [ ] 7.1 Add `safeFixed(value, decimals)` helper to `frontend/src/utils/format.js` that does `Number(value || 0).toFixed(decimals)`
  - [ ] 7.2 In `RoiAnalytics.jsx`: fix `totals?.avg_campaign_roi` — wrap with `Number(...|| 0).toFixed(1)` before passing to StatCard
  - [ ] 7.3 In `RoiAnalytics.jsx`: audit all other `.toFixed()` calls and wrap with `Number()` coercion
  - [ ] 7.4 In `Dashboard.jsx`: audit all `.toFixed()` calls and apply same fix

- [ ] 8. Fix ROI Analytics — wire date range filter and export
  - [ ] 8.1 Add `period` state to `RoiAnalytics.jsx` and include it in the `useQuery` key so changing the period re-fetches data
  - [ ] 8.2 Wire the date range `<select>` onChange to update `period` state (options: `30d`, `90d`, `quarter`, `all`)
  - [ ] 8.3 Implement `handleExport` function that generates a CSV from `roi.campaign_breakdown` and triggers a browser download
  - [ ] 8.4 Add graceful empty state when `roi?.campaign_breakdown` is empty or undefined — show a card with "No campaign data for this period" message
  - [ ] 8.5 Add graceful empty state for `roi?.best_performing_creators` when empty

- [ ] 9. Fix Brand Discover filter bar — layout and missing filters
  - [ ] 9.1 Replace `flex flex-wrap` with `flex items-center gap-2 overflow-x-auto` on the filter container in `Discover.jsx` to prevent wrapping
  - [ ] 9.2 Extend `FILTER_OPTIONS` to add: `budget` (₹5K–₹25K, ₹25K–₹1L, ₹1L+), `language` (Any, Hindi, English, Tamil, Telugu, Kannada, Bengali), `content_type` (Reels, Stories, Posts, YouTube, Shorts), `sort_by` (Most Followers, Highest ER, Most Affordable, Best ROI)
  - [ ] 9.3 Add `verified_only` boolean to filter state and render a toggle button in the filter bar
  - [ ] 9.4 Update `clearAll` to reset all new filter fields including `verified_only: false`
  - [ ] 9.5 Pass new filter params (`budget`, `language`, `content_type`, `sort_by`, `verified_only`) to the API query params

- [ ] 10. Premium redesign of BrandRegisterPage
  - [ ] 10.1 Restructure `BrandRegisterPage.jsx` to a full-screen split layout: left panel (45%, dark navy `#0F172A`) and right panel (55%, white)
  - [ ] 10.2 Build left branding panel: Gradix logo, headline "Grow with the right creators", 3 feature bullets (Verified Creators, ROI Tracking, Smart Matching), decorative floating stat cards showing mock metrics
  - [ ] 10.3 Build right form panel: "Create your brand account" heading, Google OAuth button (premium styled), divider, form fields with proper labels, terms text, blue submit button, sign-in link
  - [ ] 10.4 Ensure all existing form logic (validation, Google OAuth, registerBrand, navigation) is preserved exactly — only the visual layout changes
  - [ ] 10.5 Make the left panel hidden on mobile (`hidden lg:flex`) so the form is full-width on small screens

- [ ] 11. Overall premium UI polish — update all page headers and stat cards
  - [ ] 11.1 Update `Dashboard.jsx` (brand): ensure all stat cards use consistent typography (`text-2xl font-bold` values, `text-[11px] uppercase tracking-wider` labels), remove any inline gradient overrides that conflict with the design system
  - [ ] 11.2 Update `DashboardPage.jsx` (creator): same stat card consistency pass
  - [ ] 11.3 Update `AdminDashboardPage.jsx`: same consistency pass
  - [ ] 11.4 Ensure all page titles across brand, creator, and admin pages use `.page-title` class (already defined in index.css)
  - [ ] 11.5 Update `RoiAnalytics.jsx` card containers: replace `rounded-3xl` with `rounded-2xl` and use `.card` utility class for consistency with the rest of the app
