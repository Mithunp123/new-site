# Bugfix Requirements Document

## Introduction

This document covers a comprehensive set of UI bugs and design deficiencies identified across the Gradix frontend (React + Vite + Tailwind CSS). The issues span three role-based layouts (Creator, Brand, Admin) and affect visual correctness, functional correctness, and overall premium design quality.

The bugs are grouped into the following categories:

1. **Critical JS Bug**: `.toFixed()` TypeError crash on brand pages when API returns non-numeric values
2. **Search Icon Collision**: Icon overlaps placeholder text in search inputs
3. **Spurious Dropdown Arrow**: Non-functional ChevronDown icon in the topbar user profile
4. **Excessive Right-Side Gap**: Unbalanced whitespace in the main content area across all pages
5. **Floating Chat Button**: Wrong placement and missing access-control logic
6. **Logout Button Visibility**: Logout action hidden until hover
7. **Register Page Design**: Non-premium UI on `/brand/register`
8. **Brand Discover Filters**: Wrapping layout and missing filter options
9. **ROI Analytics**: Static mock data instead of real calculated metrics
10. **Overall Premium UI Polish**: Inconsistent design quality across all pages

---

## Bug Analysis

### Current Behavior (Defect)

**Bug 1 — .toFixed() TypeError**

1.1 WHEN a brand page (Dashboard, ROI Analytics, etc.) loads and the API returns a numeric field as a non-numeric type (e.g., a string like `"3.5"`, an object, or `null` that bypasses the `|| 0` fallback) THEN the system throws `TypeError: ((intermediate value) || 0).toFixed is not a function` and the page crashes

1.2 WHEN `totals?.avg_campaign_roi` in `RoiAnalytics.jsx` is passed directly as the `value` prop to `StatCard` without `.toFixed()` being called on it THEN the system renders the raw value without formatting, producing inconsistent display

1.3 WHEN the `|| 0` fallback is applied to a non-numeric value (e.g., an empty string `""` or an object `{}`), the result is still not a number THEN `.toFixed()` throws a TypeError because non-numeric types like objects do not have a `.toFixed` method

**Bug 2 — Search Icon Collision**

1.4 WHEN a user views any page containing a search input (e.g., Brand Discover, Collaboration Requests, Admin pages) THEN the system renders the search icon absolutely positioned at `left-3.5` while the input's `padding-left` is insufficient to prevent the icon from overlapping the placeholder text "Search requests..."

**Bug 3 — Non-functional Dropdown Arrow in Topbar**

1.5 WHEN a user views the topbar on any authenticated page THEN the system renders a `ChevronDown` icon next to the creator/brand name in the user profile section, implying a dropdown menu exists, but clicking it produces no action and no dropdown appears

**Bug 4 — Excessive Right-Side Gap**

1.6 WHEN a user views any brand, creator, or admin page on a standard desktop viewport THEN the system renders the `.page-content` area with `max-w-[1400px]` and `px-8` padding, creating a large unused whitespace gap on the right side of the content area that makes the layout feel unbalanced

**Bug 5 — Floating Chat Button Wrong Position and Logic**

1.7 WHEN a user is authenticated on any page THEN the system renders `ChatPanel.jsx` as a floating button fixed at `bottom-6 right-6`, appearing on all pages regardless of whether the user has an active campaign collaboration

1.8 WHEN a brand and creator do not have an accepted/active collaboration THEN the system still displays the floating chat button and allows access to the chat interface

**Bug 6 — Logout Button Not Visible by Default**

1.9 WHEN a user views the sidebar on any authenticated page THEN the system renders the logout button in the sidebar user section in a state that is not visible by default, only becoming visible on hover, making it difficult to discover

**Bug 7 — Register Page Non-Premium UI**

1.10 WHEN a user visits `/brand/register` THEN the system renders `BrandRegisterPage.jsx` with a generic single-column layout that lacks premium visual design, proper typography hierarchy, and brand-consistent styling

**Bug 8 — Brand Discover Filters Wrapping and Incomplete**

1.11 WHEN a user visits `/brand/discover` THEN the system renders the filter bar using `flex-wrap`, causing filter chips/dropdowns to wrap onto multiple lines on standard desktop viewports instead of staying in a single horizontal row

1.12 WHEN a user visits `/brand/discover` THEN the system only displays five filters (Niche, Platform, Followers, Min ER, Location) and is missing the following filters: Budget Range, Language, Engagement Rate (granular), Content Type, Verified Only toggle, and Sort By

**Bug 9 — ROI Analytics Static Mock Data**

1.13 WHEN a user views the ROI Analytics page at `/brand/roi-analytics` THEN the system displays static hardcoded mock data instead of calculating ROI from actual campaign records (spend vs. revenue)

1.14 WHEN a user views the ROI Analytics page THEN the system does not provide a date range filter, an export report function, or real data for the Campaign Performance Breakdown table, Best Performing Creator table, ROI by Campaign chart, or Key Metrics panel

**Bug 10 — Overall Premium UI Polish**

1.15 WHEN a user views any page across brand, creator, and admin roles THEN the system renders pages with inconsistent typography hierarchy, irregular spacing, weak card shadows, insufficient color contrast, and absent micro-interactions, giving the UI a generic appearance

---

### Expected Behavior (Correct)

**Bug 1 — .toFixed() TypeError**

2.1 WHEN a brand page loads and any numeric field from the API is a non-numeric type THEN the system SHALL safely coerce the value to a number using `Number(value)` before calling `.toFixed()`, preventing the TypeError crash

2.2 WHEN `totals?.avg_campaign_roi` is rendered in `RoiAnalytics.jsx` THEN the system SHALL apply consistent number formatting (e.g., `Number(totals?.avg_campaign_roi || 0).toFixed(1) + 'x'`) so the value displays correctly

2.3 WHEN any value is used with `.toFixed()` across all brand pages THEN the system SHALL ensure the value is explicitly cast to a `Number` before calling `.toFixed()`, so that non-numeric API responses never cause a crash

**Bug 2 — Search Icon Collision**

2.4 WHEN a user views any page containing a search input THEN the system SHALL render the search input with sufficient `padding-left` (e.g., `pl-10` or `pl-11`) so that the absolutely positioned search icon does not overlap the placeholder text or user-typed text

**Bug 3 — Non-functional Dropdown Arrow in Topbar**

2.5 WHEN a user views the topbar on any authenticated page THEN the system SHALL NOT render the `ChevronDown` icon next to the user profile name, as no dropdown functionality is implemented, eliminating the misleading affordance

**Bug 4 — Excessive Right-Side Gap**

2.6 WHEN a user views any brand, creator, or admin page THEN the system SHALL render the `.page-content` area without an excessive right-side gap, either by removing the `max-w-[1400px]` constraint, adjusting padding, or ensuring the content fills the available width in a balanced manner

**Bug 5 — Floating Chat Button Wrong Position and Logic**

2.7 WHEN a user is authenticated THEN the system SHALL NOT render `ChatPanel.jsx` as a floating fixed-position button; instead, Chat SHALL be placed as a navigation item in the left sidebar

2.8 WHEN a brand and creator do not have an accepted/active collaboration THEN the system SHALL render the Chat sidebar navigation item in a disabled/greyed-out state and prevent access to the chat interface

2.9 WHEN a brand and creator have an accepted/active collaboration THEN the system SHALL render the Chat sidebar navigation item as enabled and allow access to the chat interface

**Bug 6 — Logout Button Not Visible by Default**

2.10 WHEN a user views the sidebar on any authenticated page THEN the system SHALL render the logout button in a persistently visible state (not dependent on hover) so users can always discover and access the logout action

**Bug 7 — Register Page Non-Premium UI**

2.11 WHEN a user visits `/brand/register` THEN the system SHALL render `BrandRegisterPage.jsx` with a split-screen layout (left panel: branding/visual content; right panel: registration form), premium typography and spacing, proper visual hierarchy, and styling consistent with the Gradix brand (blue `#2563EB`, dark navy backgrounds, glassmorphism or elevated card design)

**Bug 8 — Brand Discover Filters Wrapping and Incomplete**

2.12 WHEN a user visits `/brand/discover` THEN the system SHALL render all filter controls in a single horizontal row on standard desktop viewports, using horizontal scrolling or a scrollable filter bar if needed, with no wrapping onto multiple lines

2.13 WHEN a user visits `/brand/discover` THEN the system SHALL display all of the following filters: Niche, Platform, Followers, Min ER, Location, Budget Range (e.g., ₹5K–₹25K / ₹25K–₹1L / ₹1L+), Language (Any, Hindi, English, Tamil, Telugu, etc.), Engagement Rate (1–3% / 3–5% / 5%+), Content Type (Reels, Stories, Posts, YouTube, Shorts), Verified Only (toggle), and Sort By (Most Followers, Highest ER, Most Affordable, Best ROI)

**Bug 9 — ROI Analytics Static Mock Data**

2.14 WHEN a user views the ROI Analytics page THEN the system SHALL calculate ROI from actual campaign data using the formula: ROI = (Revenue Generated − Total Spend) / Total Spend × 100, and display real values for Total Spend, Revenue Generated, Avg Campaign ROI, and Cost Per Lead

2.15 WHEN a user views the ROI Analytics page THEN the system SHALL populate the Campaign Performance Breakdown table, Best Performing Creator table, ROI by Campaign bar chart, and Key Metrics panel (Total Reach, Total Engagement, Total Clicks, Repeat Collab %, Response Rate) with real data fetched from the API

2.16 WHEN a user views the ROI Analytics page THEN the system SHALL provide a date range filter (Last 30 Days, Last 90 Days, This Quarter, Custom) that re-fetches and recalculates all metrics for the selected period

2.17 WHEN a user activates the Export Report function on the ROI Analytics page THEN the system SHALL generate and download a report containing the currently displayed metrics and data

**Bug 10 — Overall Premium UI Polish**

2.18 WHEN a user views any page across brand, creator, and admin roles THEN the system SHALL render pages with consistent premium design: clear typography hierarchy using `Plus Jakarta Sans` headings and `Inter` body text, uniform card shadows and borders per the `.card` and `.card-hover` utility classes, consistent spacing with no random gaps, proper color contrast meeting WCAG AA standards, and hover/focus micro-interactions on interactive elements

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN numeric fields from the API are already valid numbers THEN the system SHALL CONTINUE TO format and display them correctly using `.toFixed()` without any change in output

3.2 WHEN a user interacts with the brand discover filters (selecting, clearing, applying) THEN the system SHALL CONTINUE TO filter creators correctly and update the results grid

3.3 WHEN the brand dashboard, ROI analytics, and other brand pages load with complete, well-formed API data THEN the system SHALL CONTINUE TO render all charts, tables, and stat cards as before

3.4 WHEN creator, admin, and register pages render THEN the system SHALL CONTINUE TO function correctly (authentication flows, data display, navigation) while receiving the premium UI improvements

3.5 WHEN the `index.css` global styles are updated THEN the system SHALL CONTINUE TO apply all existing utility classes (`.card`, `.btn-primary`, `.badge-*`, `.input`, etc.) correctly across all pages

3.6 WHEN a user with an active collaboration navigates to the Chat section via the sidebar THEN the system SHALL CONTINUE TO load and display the chat interface with existing message history and real-time functionality intact

3.7 WHEN a user performs authentication actions (login, logout, register) THEN the system SHALL CONTINUE TO process those actions correctly regardless of UI layout changes to the sidebar or register page

3.8 WHEN the Brand Discover page loads THEN the system SHALL CONTINUE TO fetch and display the creator list correctly after the filter bar is updated with additional filters

3.9 WHEN a user applies any combination of the existing filters (Niche, Platform, Followers, Min ER, Location) on Brand Discover THEN the system SHALL CONTINUE TO return correctly filtered results

3.10 WHEN the ROI Analytics page is updated to use real data THEN the system SHALL CONTINUE TO render the page without crashing when the API returns empty or partial data (graceful empty states)

---

## Bug Condition Pseudocode

### Bug 1 — .toFixed() TypeError

```pascal
FUNCTION isBugCondition_toFixed(X)
  INPUT: X — a value used as the operand of .toFixed()
  OUTPUT: boolean

  // Bug triggers when the value is not a number even after || 0 fallback
  RETURN typeof(X) !== 'number' AND typeof(X || 0) !== 'number'
END FUNCTION

// Property: Fix Checking
FOR ALL X WHERE isBugCondition_toFixed(X) DO
  result ← renderBrandPage'(X)
  ASSERT no_crash(result)
  ASSERT result contains a formatted numeric string
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_toFixed(X) DO
  ASSERT renderBrandPage(X) = renderBrandPage'(X)
END FOR
```

### Bug 2 — Search Icon Collision

```pascal
FUNCTION isBugCondition_searchIcon(input)
  INPUT: input — a rendered search input element
  OUTPUT: boolean

  iconRight ← input.icon.boundingRect.right
  textStart ← input.paddingLeft

  RETURN iconRight > textStart
END FUNCTION

// Property: Fix Checking
FOR ALL input WHERE isBugCondition_searchIcon(input) DO
  result ← renderSearchInput'(input)
  ASSERT result.icon.boundingRect.right <= result.textStart
END FOR

// Property: Preservation Checking
FOR ALL input WHERE NOT isBugCondition_searchIcon(input) DO
  ASSERT renderSearchInput(input) = renderSearchInput'(input)
END FOR
```

### Bug 3 — Non-functional Dropdown Arrow

```pascal
FUNCTION isBugCondition_chevron(topbar)
  INPUT: topbar — rendered topbar component
  OUTPUT: boolean

  RETURN topbar contains ChevronDown icon AND no dropdown handler is attached
END FUNCTION

// Property: Fix Checking
FOR ALL topbar WHERE isBugCondition_chevron(topbar) DO
  result ← renderTopbar'(topbar)
  ASSERT result does NOT contain ChevronDown icon next to user profile name
END FOR

// Property: Preservation Checking
FOR ALL topbar WHERE NOT isBugCondition_chevron(topbar) DO
  ASSERT renderTopbar(topbar) = renderTopbar'(topbar)
END FOR
```

### Bug 4 — Excessive Right-Side Gap

```pascal
FUNCTION isBugCondition_rightGap(page)
  INPUT: page — a rendered page with .page-content
  OUTPUT: boolean

  contentWidth  ← page.pageContent.boundingRect.width
  viewportWidth ← page.viewport.width - page.sidebar.width

  RETURN (viewportWidth - contentWidth) > ACCEPTABLE_GAP_THRESHOLD
END FUNCTION

// Property: Fix Checking
FOR ALL page WHERE isBugCondition_rightGap(page) DO
  result ← renderPage'(page)
  unusedRight ← result.viewport.width - result.sidebar.width - result.pageContent.boundingRect.width
  ASSERT unusedRight <= ACCEPTABLE_GAP_THRESHOLD
END FOR

// Property: Preservation Checking
FOR ALL page WHERE NOT isBugCondition_rightGap(page) DO
  ASSERT renderPage(page) = renderPage'(page)
END FOR
```

### Bug 5 — Floating Chat Button

```pascal
FUNCTION isBugCondition_floatingChat(session)
  INPUT: session — current user session with collaboration status
  OUTPUT: boolean

  // Bug condition: chat is floating AND/OR accessible without active collaboration
  RETURN chatIsFloating(session) OR
         (chatIsAccessible(session) AND NOT hasActiveCollaboration(session))
END FUNCTION

// Property: Fix Checking
FOR ALL session WHERE isBugCondition_floatingChat(session) DO
  result ← renderApp'(session)
  ASSERT result does NOT contain floating ChatPanel at bottom-right
  ASSERT result.sidebar contains Chat navigation item
  IF NOT hasActiveCollaboration(session) THEN
    ASSERT result.sidebar.chatNavItem.isDisabled = true
  END IF
END FOR

// Property: Preservation Checking
FOR ALL session WHERE hasActiveCollaboration(session) DO
  ASSERT chatInterface(session) = chatInterface'(session)
END FOR
```

### Bug 6 — Logout Button Visibility

```pascal
FUNCTION isBugCondition_logout(sidebar)
  INPUT: sidebar — rendered sidebar component (not in hover state)
  OUTPUT: boolean

  RETURN sidebar.logoutButton.isVisible = false AND sidebar.hoverState = false
END FUNCTION

// Property: Fix Checking
FOR ALL sidebar WHERE isBugCondition_logout(sidebar) DO
  result ← renderSidebar'(sidebar)
  ASSERT result.logoutButton.isVisible = true
END FOR

// Property: Preservation Checking
FOR ALL sidebar WHERE NOT isBugCondition_logout(sidebar) DO
  ASSERT renderSidebar(sidebar) = renderSidebar'(sidebar)
END FOR
```

### Bug 7 — Register Page Design

```pascal
FUNCTION isBugCondition_registerUI(page)
  INPUT: page — rendered BrandRegisterPage
  OUTPUT: boolean

  RETURN NOT page.hasSplitScreenLayout OR
         NOT page.hasConsistentBrandColors OR
         NOT page.hasPremiumTypography
END FUNCTION

// Property: Fix Checking
FOR ALL page WHERE isBugCondition_registerUI(page) DO
  result ← renderBrandRegisterPage'(page)
  ASSERT result.hasSplitScreenLayout = true
  ASSERT result.leftPanel contains branding/visual content
  ASSERT result.rightPanel contains registration form
  ASSERT result.primaryColor = '#2563EB'
END FOR

// Property: Preservation Checking
FOR ALL page WHERE NOT isBugCondition_registerUI(page) DO
  ASSERT registerFormSubmission(page) = registerFormSubmission'(page)
END FOR
```

### Bug 8 — Brand Discover Filters

```pascal
FUNCTION isBugCondition_filters(filterBar)
  INPUT: filterBar — rendered filter bar on Brand Discover page
  OUTPUT: boolean

  RETURN filterBar.isWrapping = true OR
         filterBar.filterCount < REQUIRED_FILTER_COUNT
END FUNCTION

// Property: Fix Checking
FOR ALL filterBar WHERE isBugCondition_filters(filterBar) DO
  result ← renderFilterBar'(filterBar)
  ASSERT result.isWrapping = false
  ASSERT result.filters contains {Niche, Platform, Followers, MinER, Location,
         BudgetRange, Language, EngagementRate, ContentType, VerifiedOnly, SortBy}
END FOR

// Property: Preservation Checking
FOR ALL filterBar WHERE NOT isBugCondition_filters(filterBar) DO
  ASSERT applyFilters(filterBar) = applyFilters'(filterBar)
END FOR
```

### Bug 9 — ROI Analytics Mock Data

```pascal
FUNCTION isBugCondition_roiData(page)
  INPUT: page — rendered ROI Analytics page
  OUTPUT: boolean

  RETURN page.dataSource = STATIC_MOCK OR
         NOT page.hasDateRangeFilter OR
         NOT page.hasExportFunction
END FUNCTION

// Property: Fix Checking
FOR ALL page WHERE isBugCondition_roiData(page) DO
  result ← renderRoiAnalytics'(page)
  ASSERT result.dataSource = LIVE_API
  ASSERT result.roi = (result.revenueGenerated - result.totalSpend) / result.totalSpend * 100
  ASSERT result.hasDateRangeFilter = true
  ASSERT result.hasExportFunction = true
END FOR

// Property: Preservation Checking
FOR ALL page WHERE NOT isBugCondition_roiData(page) DO
  ASSERT renderRoiAnalytics(page) does NOT crash on empty or partial API data
END FOR
```

### Bug 10 — Overall Premium UI Polish

```pascal
FUNCTION isBugCondition_premiumUI(page)
  INPUT: page — any rendered page across brand/creator/admin roles
  OUTPUT: boolean

  RETURN NOT page.hasConsistentTypographyHierarchy OR
         NOT page.hasUniformCardShadows OR
         NOT page.hasConsistentSpacing OR
         NOT page.hasMicroInteractions
END FUNCTION

// Property: Fix Checking
FOR ALL page WHERE isBugCondition_premiumUI(page) DO
  result ← renderPage'(page)
  ASSERT result.headings use 'Plus Jakarta Sans'
  ASSERT result.body uses 'Inter' or 'DM Sans'
  ASSERT result.cards apply .card or .card-hover utility classes
  ASSERT result.interactiveElements have hover/focus states
END FOR

// Property: Preservation Checking
FOR ALL page WHERE NOT isBugCondition_premiumUI(page) DO
  ASSERT pageFunctionality(page) = pageFunctionality'(page)
END FOR
```
