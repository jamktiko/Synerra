# Synerra Cypress E2E Plan

Simple, reliable, and fully stubbed end-to-end tests for the Synerra app. All tests run against local fixtures, so nothing depends on AWS.

## Test Suite Summary

| File | Tests | Focus |
| --- | --- | --- |
| `smoke-test.cy.ts` | 1 | Fast confidence check for the main flow |
| `login-logout.cy.ts` | 3 | Authentication lifecycle: success, failure, logout |
| `page-navigation.cy.ts` | 2 | Navigation between main routes and deep links |
| `user-search.cy.ts` | 4 | Find Players page structure and filters |
| `user-profile.cy.ts` | 2 | Loading and rendering of player profiles |

**Total: 12 tests**

---

## How to Run the Tests

```bash
cd frontend
npm install
npm start        # run dev server in another terminal
npm run cypress:open   # interactive
npm run cypress:run    # headless / CI
npx cypress run --spec "cypress/e2e/smoke-test.cy.ts"   # single spec
```

---

## Tests in Detail

### 1. `smoke-test.cy.ts`

#### Test: Quick Product Tour
> // Purpose: Make sure login, dashboard, and Find Players still work end-to-end.
- Log in with the demo credentials.
- Confirm the dashboard loads.
- Navigate to Find Players and confirm the user list appears.
- Go back to the dashboard.
- Runs in roughly 5–10 seconds, so it is the preferred high-signal check.

---

### 2. `login-logout.cy.ts`

#### Test: Successful Login
> // Purpose: Verify a correct login redirects to `/dashboard` and stores `auth_token`.
- Open `/login`.
- Enter `demo@mies.fi` and `Demo11`.
- Submit and confirm the redirect to `/dashboard`.
- Assert `auth_token` exists in `localStorage`.

#### Test: Wrong Password Error
> // Purpose: Confirm invalid credentials stay on `/login` and show the error message.
- Open `/login`.
- Enter the demo email with a wrong password.
- Submit and expect the copy “Wrong password or email”.
- Ensure the URL stays on `/login` and no token is stored.

#### Test: Logout Flow
> // Purpose: Ensure clicking the logout button clears auth state and returns to `/login`.
- Log in with the helper command.
- Click `.logout-btn`.
- Verify a redirect to `/login` and that `auth_token` is wiped.

---

### 3. `page-navigation.cy.ts`

#### Test: Main Navigation Links
> // Purpose: Check that the core dashboard routes render their key elements.
- Start from `/dashboard` and assert `.dashboard` is visible.
- Visit `/dashboard/find-players` and assert `.users-container`.
- Visit `/dashboard/settings/profile` and wait for content to load.
- Return to `/dashboard` and confirm it renders again.

#### Test: Deep Links and Query Params
> // Purpose: Make sure query strings and dynamic route params survive navigation.
- Visit `/dashboard/find-players?game=game-123` and check the parameter and list.
- Visit `/dashboard/profile/user-2` and confirm the URL and stubbed profile render.

---

### 4. `user-search.cy.ts`

#### Test: Player List Renders
> // Purpose: Confirm the Find Players layout loads after login.
- Log in and open `/dashboard/find-players`.
- Assert `.users-container` exists (structure only, not exact entries).

#### Test: Filter Endpoint Stub
> // Purpose: Validate `POST /user/filter` is stubbed before the page loads.
- Stub the endpoint, log in, and open Find Players.
- Confirm the page loads without real network calls.

#### Test: Page Finishes Loading
> // Purpose: Guard against endless loading states on Find Players.
- Log in and open the page.
- Assert `.users-container` shows, wait 1 second, and ensure no `.loading` class remains.

#### Test: Query Parameters Pass Through
> // Purpose: Ensure Find Players respects provided query strings.
- Log in and visit `/dashboard/find-players?game=game-123`.
- Check the URL contains the query and the list renders.

---

### 5. `user-profile.cy.ts`

#### Test: Direct Profile Visit
> // Purpose: Ensure `/dashboard/profile/user-2` renders when opened directly.
- Log in and navigate to that URL.
- Verify the URL matches and `.layout` or `.profile-header-container` is visible.

#### Test: Profile Structure
> // Purpose: Confirm the header, user info, and attributes sections render together.
- Reuse the direct profile visit steps.
- Check for `.profile-header-container`, `.user-info-section` (or `.username`), and `.profile-content-container`.

---

## Shared Test Setup

All specs call `cy.setupDefaultIntercepts()` to stub the following endpoints:

```ts
// Auth
POST /user/login → { token, user }
GET /me → fixture: me.json

// Users
GET /user → fixture: users.json
GET /user/:id → dynamic stub from fixtures

// Friends
GET /friends/get → { users: [] }
GET /friends/requests → { pendingRequests: [] }
POST /friends/friendrequest → { success: true }

// Messages
GET /messages/unread → []

// Games
GET /games → [{ GameId, Name }, ...]
```

Fixtures live under `frontend/cypress/fixtures/` and include `me.json` for the signed-in user and `users.json` for the player list.

---

## Testing Philosophy

- **Keep it structural**: Assert that the correct sections render instead of exact copy.
- **Rely on stubs**: Every request is intercepted so the suite never touches AWS.
- **Use stable selectors**: Target CSS classes such as `.dashboard` or `.users-container`.

---

## Common Failures & Fixes

- **“Element not found”**: Make sure the dev server is running, Cypress cache is clean, and selectors match (`.dashboard` vs `app-dashboard`).
- **`cy.wait()` timeout**: Ensure `cy.setupDefaultIntercepts()` runs before login and that alias names match (`@login`, `@getMe`).
- **“Network request failed”**: Define stubs *before* the request and double-check URL patterns (`**/user` instead of `/user`).

---

## Future Ideas

- Friend request flows
- Profile editing tests
- Filter interaction coverage
- Visual regression and accessibility checks
- Mobile viewport smoke run

---

## Quick Help

1. Dev server running? (`npm start`)
2. Cypress fully restarted?
3. Cache cleaned if issues persist? (`rm -rf node_modules/.cache`)
4. Working inside `frontend/`?

When adding a new Cypress spec, always stub defaults, log in via `cy.loginViaEmail('demo@mies.fi', 'Demo11')`, navigate with `cy.visit()`, and assert structural selectors.
