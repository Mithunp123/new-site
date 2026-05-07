# Requirements Document

## Introduction

This feature redesigns the `/register` page (`BrandRegisterPage.jsx`) to match the professional, premium dark aesthetic of the existing `LoginPage` component. The current register page uses a split layout with a plain white right panel that is visually inconsistent with the fully dark-themed login experience. The redesign must preserve all existing functionality — Google OAuth sign-up, email/password registration, all form fields, validation logic, and post-registration navigation — while delivering a cohesive dark design system across both auth pages.

## Glossary

- **Register_Page**: The `BrandRegisterPage.jsx` component rendered at the `/register` route for brand account creation.
- **Login_Page**: The existing `LoginPage.jsx` component, used as the visual reference for the dark design system.
- **Left_Panel**: The decorative, branding-focused left column of the split layout (visible on large screens).
- **Right_Panel**: The functional right column containing the registration form.
- **Dark_Theme**: The color palette defined by: `#000000` page background, `#1a1a1a` card/input backgrounds, `#333` borders, `#ffffff` primary text, `#666`–`#888` muted text, and `#2563EB` as the brand accent color.
- **Google_OAuth**: The Google sign-up flow powered by `@react-oauth/google`, which pre-fills name and email and sets `isGoogleSignUp: true`.
- **Auth_Store**: The `useAuthStore` Zustand store that exposes `registerBrand`, `loading`, `error`, and `clearError`.
- **Brand_Blue**: The accent color `#2563EB` (and its dark variant `#1D4ED8`) used for interactive elements and highlights.
- **Form_Validator**: The client-side validation logic within `BrandRegisterPage.jsx` that checks required fields, password length, and password match.
- **Gradix_Logo**: The Gradix wordmark and icon rendered in the Left_Panel and as a mobile fallback header.

---

## Requirements

### Requirement 1: Dark Page Background

**User Story:** As a brand user visiting the register page, I want the entire page to have a dark background, so that the visual experience is consistent with the login page and feels premium.

#### Acceptance Criteria

1. THE Register_Page SHALL render with a full-viewport background color of `#000000`.
2. THE Register_Page SHALL apply the `DM Sans` font family, consistent with the Login_Page typography.
3. THE Register_Page SHALL set the default text color to `#ffffff` for all content within the page.

---

### Requirement 2: Dark Left Branding Panel

**User Story:** As a brand user, I want the left panel to display a dark, visually rich branding section with the Gradix logo and feature highlights, so that the page communicates product value while I fill in the form.

#### Acceptance Criteria

1. THE Left_Panel SHALL be visible only on screens with a minimum width of 900px (matching the `@media (max-width: 900px)` breakpoint in `LoginPage.css`).
2. THE Left_Panel SHALL display a background image using the existing `brand-bg-v2.png` asset, consistent with how the Login_Page uses it for the brand theme.
3. THE Left_Panel SHALL render a dark overlay gradient (`linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)`) on top of the background image, matching the Login_Page's `.login-left::before` pseudo-element.
4. THE Left_Panel SHALL display the Gradix_Logo (icon + wordmark) in the top-left corner using the `.brand-logo` and `.logo-box` styles from `LoginPage.css`.
5. THE Left_Panel SHALL display a headline and at least one supporting tagline in white text, positioned in the lower portion of the panel.
6. THE Left_Panel SHALL display the three feature highlights (Verified Creator Network, Real-Time ROI Tracking, Smart Matching) with their icons and descriptions.
7. THE Left_Panel SHALL display the three stat items (Avg Campaign ROI, Verified Creators, Brands Onboarded) in a grid at the bottom of the panel.
8. WHEN the viewport width is less than 900px, THE Left_Panel SHALL be hidden and the Register_Page SHALL display only the Right_Panel.

---

### Requirement 3: Dark Right Form Panel

**User Story:** As a brand user, I want the form panel to have a dark background with dark inputs and consistent styling, so that the registration form feels like a natural continuation of the login page design.

#### Acceptance Criteria

1. THE Right_Panel SHALL render with a background color of `#000000`, matching the Login_Page's `.login-right` background.
2. THE Right_Panel SHALL center the form container horizontally and vertically within the panel.
3. THE Right_Panel SHALL constrain the form container to a maximum width of 400px, matching the Login_Page's `.login-form-container` width.
4. THE Right_Panel SHALL display a close/back button in the top-right corner that navigates to the home route (`/`), styled consistently with the Login_Page's `.close-btn`.
5. THE Right_Panel SHALL display the Gradix_Logo as a mobile-only header (visible when the Left_Panel is hidden) using dark-theme styling.

---

### Requirement 4: Dark Form Inputs

**User Story:** As a brand user filling in the registration form, I want all input fields to use the dark theme styling, so that the form is visually consistent with the login form.

#### Acceptance Criteria

1. THE Register_Page SHALL render all text inputs (brand name, email, phone, password, confirm password) with a background color of `#1a1a1a`, border color of `#333`, and text color of `#ffffff`.
2. WHEN an input field receives focus, THE Register_Page SHALL change the input border color to `#666`, matching the Login_Page's `.input-wrapper input:focus` style.
3. THE Register_Page SHALL render input placeholder text in a muted color (`#666` or `#888`).
4. THE Register_Page SHALL display the icon for each input field (Building2, Mail, Phone, Lock) in a muted color (`#666`) positioned inside the input on the left side.
5. THE Register_Page SHALL display the password visibility toggle button (Eye/EyeOff) inside the password input on the right side, styled in muted color (`#666`) with a hover state of `#ffffff`.
6. WHEN `formData.isGoogleSignUp` is `true`, THE Register_Page SHALL hide the password and confirm password fields, consistent with the existing conditional rendering logic.

---

### Requirement 5: Dark Google OAuth Button

**User Story:** As a brand user, I want the "Continue with Google" button to use the dark theme styling, so that it matches the social buttons on the login page.

#### Acceptance Criteria

1. THE Register_Page SHALL render the Google sign-up button using the `.social-btn` style from `LoginPage.css`: background `#1a1a1a`, border `1px solid #333`, text color `#ffffff`.
2. WHEN the Google sign-up button is hovered, THE Register_Page SHALL change the button background to `#262626`, matching the Login_Page's `.social-btn:hover` style.
3. THE Register_Page SHALL display the Google SVG icon alongside the button label "Continue with Google".
4. WHEN the Google sign-up button is clicked, THE Register_Page SHALL invoke the `handleGoogleButtonClick` handler, preserving the existing Google OAuth flow.

---

### Requirement 6: Dark Divider

**User Story:** As a brand user, I want the "or continue with email" divider to use the dark theme styling, so that it is visually consistent with the login page divider.

#### Acceptance Criteria

1. THE Register_Page SHALL render the divider using the `.divider` style from `LoginPage.css`: horizontal lines in `#333` and label text in `#666`.
2. THE Register_Page SHALL display the divider label text as "or" or "or continue with email".

---

### Requirement 7: Dark Submit Button

**User Story:** As a brand user, I want the "Create Account" submit button to use the dark theme styling, so that it is visually consistent with the login page submit button.

#### Acceptance Criteria

1. THE Register_Page SHALL render the submit button using the `.submit-btn` style from `LoginPage.css`: background `#ffffff`, text color `#000000`, height 52px, border-radius 12px.
2. WHEN the submit button is hovered, THE Register_Page SHALL reduce the button opacity to 0.9.
3. WHEN `loading` is `true`, THE Register_Page SHALL display a spinning `Loader` icon inside the submit button and disable the button, preserving the existing loading state behavior.
4. WHEN `loading` is `false`, THE Register_Page SHALL display the label "Create Account" inside the submit button.

---

### Requirement 8: Form Validation Preservation

**User Story:** As a brand user, I want all existing form validation rules to remain intact after the redesign, so that I receive the same error feedback as before.

#### Acceptance Criteria

1. WHEN the form is submitted without a brand name, email, or password, THE Form_Validator SHALL display the error "Name, email, and password are required".
2. WHEN the password and confirm password fields contain different values, THE Form_Validator SHALL display the error "Passwords do not match".
3. WHEN the password field contains fewer than 8 characters, THE Form_Validator SHALL display the error "Password must be at least 8 characters".
4. WHEN `error` or `localError` is non-empty, THE Register_Page SHALL display the error message in a styled error container using dark-theme colors (e.g., `bg-red-500/10`, `border-red-500/20`, `text-red-400`), consistent with the Login_Page's error display.
5. WHEN the user modifies any input field, THE Form_Validator SHALL clear the current error by calling `clearError()` and resetting `localError` to an empty string.

---

### Requirement 9: Post-Registration Navigation Preservation

**User Story:** As a brand user, I want to be redirected to the brand dashboard after successful registration, so that I can immediately start using the platform.

#### Acceptance Criteria

1. WHEN `registerBrand` resolves successfully, THE Register_Page SHALL navigate to `/brand/dashboard` using React Router's `navigate`.
2. WHEN `registerBrand` rejects, THE Register_Page SHALL display the error from `err.response?.data?.error` or fall back to "Registration failed".

---

### Requirement 10: Dark Footer and Navigation Links

**User Story:** As a brand user, I want the footer links and sign-in link to use the dark theme styling, so that all text elements are readable and consistent.

#### Acceptance Criteria

1. THE Register_Page SHALL render the "Already have an account? Sign In" link with muted text (`#666`) and the "Sign In" anchor in `#888` with a hover state of `#ffffff`, matching the Login_Page's `.signup-text` style.
2. THE Register_Page SHALL render the Terms of Service and Privacy Policy links in `#888` with a hover state of `#ffffff`.
3. THE Register_Page SHALL render the copyright notice ("© 2024 Gradix. All rights reserved.") in a muted color (`#666`).

---

### Requirement 11: Responsive Layout

**User Story:** As a brand user on any device, I want the register page to be fully responsive, so that I can complete registration on mobile, tablet, or desktop.

#### Acceptance Criteria

1. WHEN the viewport width is 900px or greater, THE Register_Page SHALL display the two-column split layout (Left_Panel + Right_Panel).
2. WHEN the viewport width is less than 900px, THE Register_Page SHALL display a single-column layout showing only the Right_Panel with the mobile Gradix_Logo header.
3. THE Right_Panel SHALL be scrollable when the form content exceeds the viewport height, ensuring all fields remain accessible on small screens.
4. THE Register_Page SHALL apply a margin of 16px around the Left_Panel on large screens, matching the Login_Page's `.login-left` margin, so the panel has rounded corners with visible dark background behind it.

---

### Requirement 12: CSS Architecture Consistency

**User Story:** As a frontend developer, I want the register page to use a dedicated CSS file that mirrors the LoginPage.css architecture, so that the codebase is maintainable and styles are co-located with the component.

#### Acceptance Criteria

1. THE Register_Page SHALL import a dedicated CSS file (e.g., `BrandRegisterPage.css`) that reuses or extends the class names defined in `LoginPage.css`.
2. THE Register_Page SHALL use the `.login-container`, `.login-left`, `.login-right`, `.login-form-container`, `.social-btn`, `.divider`, `.input-wrapper`, `.submit-btn`, and `.signup-text` class names (or equivalent dark-theme classes) for styling, ensuring visual parity with the Login_Page.
3. THE Register_Page SHALL NOT introduce inline styles for colors or layout that duplicate values already defined in the CSS file.
