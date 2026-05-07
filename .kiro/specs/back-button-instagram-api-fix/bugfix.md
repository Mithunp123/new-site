# Bugfix Requirements Document

## Introduction

This document covers two bugs:

**Bug 1 — Back Button Navigation:** After a successful login, pressing the browser back button appears to redirect authenticated users directly to the login page. The root cause is that `LoginPage.jsx` calls `navigate('/dashboard')`, `navigate('/brand/dashboard')`, or `navigate('/admin/dashboard')` **without `{ replace: true }`**, which pushes a new history entry instead of replacing `/login`. When the user presses back from the dashboard, the browser returns to `/login`. Because the user is still authenticated, `App.jsx` immediately redirects them forward to the dashboard again — so the user perceives it as "going to the login page" even though the redirect is instant. The fix is to use `{ replace: true }` on all three `navigate()` calls in `LoginPage.jsx` (in both `handleSubmit` and `loginWithGoogle`), so `/login` is never left in the history stack.

Additionally, the Google login endpoint (`POST /api/auth/google-login`) is returning 404. The frontend calls `creatorApi.googleLogin` which targets `/api/auth/google-login`, but the backend has no matching route registered for that path.

**Bug 2 — Instagram API 502 Error:** For some usernames, the Instagram data fetch fails with a 502 Bad Gateway from the third-party RapidAPI provider (`instagram-data1.p.rapidapi.com`). In `socialController.js`, the `fetchInstagramData` function has no retry logic — when the user info API call returns a 502, it is immediately propagated to the client. Since 502 errors from RapidAPI are often transient, adding up to 2 retries with exponential backoff on the user info call would allow the request to succeed on a subsequent attempt.

---

## Bug Analysis

### Current Behavior (Defect)

**Bug 1 — Back Button Navigation:**

1.1 WHEN a user successfully logs in and `LoginPage.jsx` calls `navigate('/dashboard')`, `navigate('/brand/dashboard')`, or `navigate('/admin/dashboard')` without `{ replace: true }` THEN the system pushes a new history entry, leaving `/login` in the browser history stack

1.2 WHEN an authenticated user presses the browser back button from the dashboard and the browser navigates to `/login` THEN the system immediately redirects them forward to the dashboard (because `App.jsx` detects `isAuthenticated` on the `/login` route), making the user perceive a direct redirect to the login page with no way to navigate back

1.3 WHEN the frontend calls `creatorApi.googleLogin` (targeting `POST /api/auth/google-login`) THEN the system returns a 404 Not Found response because no matching route is registered on the backend

**Bug 2 — Instagram API 502 Error:**

1.4 WHEN the RapidAPI Instagram provider returns a 502 Bad Gateway on the user info API call THEN the system immediately returns a 502 error response to the client with no retry attempt

1.5 WHEN the Instagram user info API call fails with a 502 THEN the system returns an error to the client even though the failure may be transient and a retry would succeed

---

### Expected Behavior (Correct)

**Bug 1 — Back Button Navigation:**

2.1 WHEN a user successfully logs in THEN the system SHALL call `navigate('/admin/dashboard', { replace: true })`, `navigate('/brand/dashboard', { replace: true })`, or `navigate('/dashboard', { replace: true })` so that `/login` is replaced in the history stack and not retained

2.2 WHEN an authenticated user presses the browser back button from the dashboard THEN the system SHALL navigate to the page the user was on before visiting `/login`, not back to the login page

2.3 WHEN the frontend initiates a Google login THEN the system SHALL route the request to a registered backend endpoint that handles `POST /api/auth/google-login` and returns a valid response

**Bug 2 — Instagram API 502 Error:**

2.4 WHEN the RapidAPI Instagram provider returns a 502 Bad Gateway on the user info API call THEN the system SHALL retry the request up to 2 times with exponential backoff before returning an error to the client

2.5 WHEN all retry attempts for the Instagram user info API call are exhausted THEN the system SHALL return a meaningful error response to the client indicating the service is temporarily unavailable

---

### Unchanged Behavior (Regression Prevention)

**Bug 1 — Back Button Navigation:**

3.1 WHEN an unauthenticated user attempts to access a protected route THEN the system SHALL CONTINUE TO redirect them to the login page

3.2 WHEN an authenticated user navigates between pages within the app using in-app links THEN the system SHALL CONTINUE TO maintain correct forward navigation history

3.3 WHEN a user with the wrong role attempts to access a route for a different role THEN the system SHALL CONTINUE TO redirect them to the login page

3.4 WHEN a user logs out THEN the system SHALL CONTINUE TO redirect them to the login page and clear their session

3.5 WHEN a Google login attempt results in a 404 from the backend (no account found) THEN the system SHALL CONTINUE TO redirect the user to `/register` with the Google profile pre-filled

**Bug 2 — Instagram API 502 Error:**

3.6 WHEN the Instagram API returns a valid response for a username THEN the system SHALL CONTINUE TO return the parsed follower count, engagement rate, and verification status

3.7 WHEN the Instagram API returns a non-502 error (e.g., 401 Unauthorized, 429 Rate Limit) THEN the system SHALL CONTINUE TO return an appropriate error response without unnecessary retries

3.8 WHEN the Instagram media feed API call fails after a successful user info call THEN the system SHALL CONTINUE TO return partial data (followers, verification status) with zeroed engagement metrics

---

## Bug Condition Pseudocode

### Bug 1 — Back Button Navigation

**Bug Condition Function:**
```pascal
FUNCTION isBugCondition_BackButton(X)
  INPUT: X of type NavigationEvent
  OUTPUT: boolean

  // Returns true when a successful login navigates without replace: true,
  // leaving /login in the browser history stack
  RETURN X.event = "successful_login"
    AND X.navigateOptions.replace != true
END FUNCTION
```

**Fix Checking Property:**
```pascal
// Property: Fix Checking — Login navigation replaces /login in history
FOR ALL X WHERE isBugCondition_BackButton(X) DO
  result ← loginAndNavigate'(X)
  ASSERT result.historyStack DOES NOT CONTAIN "/login"
  ASSERT pressing_back(result) NAVIGATES TO page_before_login
END FOR
```

**Preservation Checking:**
```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_BackButton(X) DO
  ASSERT loginAndNavigate(X) = loginAndNavigate'(X)
END FOR
```

---

### Bug 1b — Google Login 404

**Bug Condition Function:**
```pascal
FUNCTION isBugCondition_GoogleLogin404(X)
  INPUT: X of type GoogleLoginRequest
  OUTPUT: boolean

  // Returns true when the backend has no route registered for the Google login endpoint
  RETURN X.method = "POST"
    AND X.path = "/api/auth/google-login"
    AND backend.hasRoute(X.path) = false
END FUNCTION
```

**Fix Checking Property:**
```pascal
// Property: Fix Checking — Google login endpoint exists and responds
FOR ALL X WHERE isBugCondition_GoogleLogin404(X) DO
  result ← googleLoginEndpoint'(X)
  ASSERT result.status != 404
  ASSERT result.status IN [200, 401, 409]  // valid auth responses
END FOR
```

**Preservation Checking:**
```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_GoogleLogin404(X) DO
  ASSERT googleLoginEndpoint(X) = googleLoginEndpoint'(X)
END FOR
```

---

### Bug 2 — Instagram API 502 Error

**Bug Condition Function:**
```pascal
FUNCTION isBugCondition_Instagram502(X)
  INPUT: X of type InstagramAPIRequest
  OUTPUT: boolean

  // Returns true when the RapidAPI user info call returns a transient 502
  RETURN X.apiCall = "userInfo"
    AND X.apiResponse.status = 502
END FUNCTION
```

**Fix Checking Property:**
```pascal
// Property: Fix Checking — Retry on 502 with exponential backoff
FOR ALL X WHERE isBugCondition_Instagram502(X) DO
  result ← fetchInstagramData'(X)
  ASSERT result.retryAttempted = true
  ASSERT result.retryCount <= 2
  ASSERT (result.status != 502 OR result.retriesExhausted = true)
END FOR
```

**Preservation Checking:**
```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_Instagram502(X) DO
  ASSERT fetchInstagramData(X) = fetchInstagramData'(X)
END FOR
```
