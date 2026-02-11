# Add to Wallet – Android (Customer-App) Implementation Plan

**Status: Implemented.** Backend: `server/src/services/googleWalletService.ts`, `server/src/controllers/walletController.ts`, `server/src/routes/walletRoutes.ts`. Customer-app: `walletService.ts` (calls `POST /api/wallet/google-pass`, redirects to `saveUrl`), `SuccessScreen.tsx` (passes `customerId`, `restaurantId`). See server README for env vars.

---

## Context

- **Customer-app** is a **web app** (React + Vite + TypeScript) used in the browser or as a **PWA** on Android.
- **Add to Google Wallet** is already wired in the UI (`SuccessScreen.tsx`) and in `walletService.ts`, but:
  - There is **no backend** yet for Apple Wallet (`.pkpass`) or Google Wallet (JWT / save URL).
  - Google Wallet currently relies on `pay.google.com/gp/p/js/pay.js` and optional `VITE_GOOGLE_WALLET_API_ENDPOINT` fallback; production should use the **Google Wallet API** with **server-signed JWT** and save URLs.

This plan focuses on making **Add to Google Wallet** work reliably for **Android** users (Chrome/PWA) and aligning the flow with Google’s recommended approach.

---

## 1. Backend: Google Wallet API (server)

Google Wallet for loyalty passes uses a **signed JWT** and a **save URL**. The server must create the JWT and either return the save URL or the JWT for the client to open.

### 1.1 Google Cloud setup

- [ ] Create or use a **Google Cloud project** and enable **Google Wallet API**.
- [ ] Create a **Service Account** and download a **JSON key**.
- [ ] In [Google Pay & Wallet Console](https://pay.google.com/business/console):
  - Register the **Issuer** and get **Issuer ID**.
  - Create a **Loyalty program** and get the **Loyalty class ID** (or use a default).
  - Configure **origins** (e.g. `https://your-customer-app-domain.com`, and dev if needed).

### 1.2 Server implementation

- [ ] **New module**: e.g. `server/src/services/googleWalletService.ts`.
  - Dependencies: `google-auth-library` and a JWT library (e.g. `jsonwebtoken` or use `google-auth-library` with service account).
  - **Create loyalty class** (idempotent): one-time or on-demand creation of the class (program name, logo, etc.) using Issuer ID + Class ID.
  - **Create loyalty object** per user: member ID, name, barcode/QR, points, etc., using Issuer ID + Object ID (e.g. `issuerId.memberId`).
  - **Build JWT** per [Google’s spec](https://developers.google.com/wallet/retail/loyalty-cards/use-cases/jwt):
    - `iss`: service account email  
    - `aud`: `"google"`  
    - `typ`: `"savetowallet"`  
    - `iat`: current time  
    - `payload.loyaltyObjects`: array with the loyalty object  
    - `payload.loyaltyClasses`: array with the loyalty class (if not already created)  
    - `origins`: allowed web origins (must match console).
  - **Sign JWT** with the service account private key.
  - **Return save URL**: `https://pay.google.com/gp/v/save/{signedJwt}` (or equivalent per latest docs).

- [ ] **New HTTP endpoint**: e.g. `POST /api/customers/wallet/google` or `POST /api/wallet/google-pass`.
  - Auth: require the customer to be identified (e.g. session or JWT with `customerId` / `userId`).
  - Body/params: optionally `memberId`, `cardTitle`, or use server-stored customer data.
  - Handler:
    - Load or create loyalty class.
    - Create loyalty object for that customer.
    - Build and sign JWT, then return `{ saveUrl: "https://pay.google.com/gp/v/save/..." }` (and optionally `jwt` for debugging).
  - Env: `GOOGLE_APPLICATION_CREDENTIALS` or inline key (e.g. `GOOGLE_WALLET_SERVICE_ACCOUNT_JSON`), `GOOGLE_WALLET_ISSUER_ID`, optional class ID and image URLs.

### 1.3 Environment and security

- [ ] Store service account JSON in env or secret manager (never in client).
- [ ] Restrict endpoint to authenticated customers and validate `restaurantId`/tenant if multi-tenant.

---

## 2. Customer-app (web / Android PWA)

### 2.1 Use backend for Google Wallet

- [ ] **Remove or bypass** client-side Google Wallet object creation that depends on `window.google.wallet.objects.save` (or keep as fallback only if you later add a compatible flow).
- [ ] **Primary path**: call the new backend endpoint (e.g. `POST /api/wallet/google-pass`) with the current user’s context (and `memberId`/`userId` if needed).
- [ ] On success, **navigate to `saveUrl`**:
  - `window.location.href = response.saveUrl` (or `window.open(response.saveUrl)` if you prefer not to leave the page).
  - On Android Chrome/PWA this will open the Google Wallet flow (in-browser or app).

### 2.2 Environment variables

- [ ] **Optional**: keep `VITE_GOOGLE_WALLET_*` only for branding (e.g. issuer name) or remove if all issuer/config comes from backend.
- [ ] Ensure **API base URL** is set (e.g. `VITE_API_URL` or existing env) so the app can call the new wallet endpoint.

### 2.3 Android-specific behavior

- [ ] **User agent**: You already detect Android in `SuccessScreen` and show “Add to Google Wallet”; no change needed for visibility.
- [ ] **PWA**: When installed as PWA on Android, the same flow applies; ensure your backend allows the PWA origin in Google Wallet Console.
- [ ] **Loading state**: Keep existing “Adding…” and “Added to Google Wallet” states; after redirect to `saveUrl`, the user may not return to the app immediately, so consider:
  - Not setting “Added” until you can confirm (e.g. no easy way), or
  - Setting “Added” optimistically after a successful API response and redirect.

### 2.4 Error handling

- [ ] If the backend returns an error (e.g. 4xx/5xx), show a clear message and do not redirect.
- [ ] If the user cancels or closes the Google Wallet flow, they can tap “Add to Google Wallet” again (idempotent object creation is fine).

---

## 3. Optional: Apple Wallet (for completeness)

If you want **Add to Apple Wallet** to work on iOS from the same customer-app:

- [ ] **Backend**: New endpoint that generates a **.pkpass** (e.g. using `passkit-generator` or similar) and returns it as a file download.
- [ ] **Customer-app**: Already calls `VITE_APPLE_WALLET_API_ENDPOINT` and triggers download; point this to the new backend route and pass member data (and optionally restaurant branding).

This is independent of Android but part of a full “add to wallet” story.

---

## 4. Testing on Android

- [ ] Use a real Android device or Chrome Android emulator with a Google account that has Wallet available.
- [ ] Deploy or expose the customer-app over HTTPS (required for Wallet origins).
- [ ] As a signed-in customer, complete signup and reach the success screen.
- [ ] Tap “Add to Google Wallet” → backend returns `saveUrl` → redirect → pass appears in Google Wallet.
- [ ] Confirm the pass opens in Google Wallet and shows correct member ID / barcode.

---

## 5. Checklist summary

| Area | Task |
|------|------|
| **Google Cloud** | Enable Wallet API, create service account, register issuer and loyalty program, set origins |
| **Server** | Implement `googleWalletService` (class + object + JWT + save URL), add `POST /api/wallet/google-pass` (or equivalent) |
| **Server** | Env vars for credentials and issuer/class IDs |
| **Customer-app** | Call new backend endpoint and redirect to `saveUrl` for “Add to Google Wallet” |
| **Customer-app** | Ensure API base URL and (if needed) wallet-related env are set for Android/PWA |
| **Testing** | Verify end-to-end on Android (Chrome or PWA) with HTTPS |

---

## 6. If you add a native Android app later

If you later build a **native Android app** (Kotlin/Java):

- Use the **same backend** endpoint: the app calls `POST /api/wallet/google-pass`, gets `saveUrl`, and opens it with an intent (e.g. `Intent.ACTION_VIEW` with the save URL). No need to sign JWTs in the app.
- Alternatively, use the [Google Wallet API for Android](https://developers.google.com/wallet/retail/android) and have the backend return the **signed JWT** only; the app would use the Add to Wallet API to add the pass. The server would still sign the JWT (with service account for web, or with app’s SHA-1 for native if you switch to that model).

For the **current** customer-app (web/PWA on Android), the **save URL redirect** approach is the simplest and matches this plan.
