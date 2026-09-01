# BuilderLink Malawi

A Malawi-localized construction marketplace connecting customers with verified
builders. Built with **Expo (React Native)**, **TypeScript**, **NativeWind**, and
**expo-router**, with **Firebase Authentication** for identity and **Supabase
(Postgres + Row-Level Security)** for all application data.

## Feature status

| Area | Status |
| --- | --- |
| Onboarding, role-based registration (customer / builder), email + password sign-in | ✅ Live |
| Google sign-in (OAuth via `expo-auth-session`) | ✅ Live (native builds) |
| Forgot password & email verification flows | ✅ Live |
| Session rehydration on launch + role-aware route guards (`<Protected>`) | ✅ Live |
| Builder catalogue — browse, search, filter by trade/district, builder detail | ✅ Live (Supabase-backed) |
| Builder profile screen (business info, skills, photo picker) | 🚧 UI ready, persistence pending |
| Booking, chat, payments, reviews, favorites, notifications screens | 🚧 Demo content / stubbed services |
| Admin dashboard (restricted to `administrator` role) | 🚧 UI ready, actions queued for Edge Functions |

## Stack

- **Auth:** Firebase Authentication (Email/Password + Google OAuth provider).
  Firebase runs as Supabase **Third-Party Auth**, and Firebase users carry the
  Supabase `role: authenticated` custom claim so RLS trusts the Firebase JWT.
  Sessions persist to AsyncStorage.
- **Data:** Supabase (Postgres + Row-Level Security) — profiles, categories,
  skills, builders, availability, portfolio items, documents, bookings, booking
  images, payments, reviews, messages, notifications, favorites and reports.
- **Auth bridge:** `@supabase/supabase-js` configured with an `accessToken`
  provider that mints the Firebase ID token as the Supabase token.
- **Client data layer:** TanStack React Query hooks per feature
  (`useBuilders`, `useBuilder` in `src/features/builders/hooks`).
- **Forms:** react-hook-form + Zod (via `@hookform/resolvers`).
- **State:** Zustand `auth-store` holds the session (user id, role, email).
- **UI:** NativeWind 4 (Tailwind for React Native), `lucide-react-native`
  icons, Expo SDK 54 / React Native 0.81.

## How auth and data connect

1. The user signs up/signs in through Firebase (email/password or Google).
2. A `profiles` row is created or upserted in Supabase keyed by the Firebase UID
   (`auth-service.ts`'s `ensureProfile` / `ensureGoogleProfile`).
3. The Supabase client (see `src/shared/services/supabase.ts`) mints the
   Firebase ID token on demand and passes it as the Supabase access token.
4. Postgres RLS policies read `auth.jwt() ->> 'sub'` to scope every query to the
   signed-in user. The role is loaded from `profiles.role` (defaults to `customer`).
5. `<Protected>` declaratively gates routes on session presence and role — e.g.
   the admin dashboard only renders for `administrator` sessions.

## Database (Supabase)

Two migrations live in `supabase/migrations/`:

- **`20260804072116_builderlink_core_schema.sql`** — enum types, tables for
  profiles, categories, skills, builders, bookings, payments, reviews, messages,
  notifications, favorites and reports, plus private storage buckets (`avatars`,
  `portfolio`, `documents`, `booking-images`).
- **`20260809000001_harden_rls_and_builder_stats.sql`** — hardens RLS for
  payments, booking images, booking updates and reviews, and adds a
  `recalculate_builder_stats()` trigger that keeps a builder's `average_rating`
  and `completed_jobs` in sync with submitted reviews.

Applying the schema (and registering Firebase as Supabase Third-Party Auth) is
documented in [`supabase/README.md`](supabase/README.md).

## Project structure

```
app/                      # expo-router routes (typed routes enabled)
  (tabs)/                 # Home, Search, Saved, Alerts, Profile
  login.tsx, register.tsx, register/[role].tsx
  onboarding.tsx, forgot-password.tsx, verify-email.tsx, reset-sent.tsx
  builders/[id].tsx, builder-profile.tsx
  booking.tsx, chat.tsx, payments.tsx, review.tsx
  admin.tsx               # Admin dashboard (role-guarded)
src/
  features/               # authentication, builders, payments, reviews, admin
    <feature>/services/   # Supabase/Firebase-facing service functions
    <feature>/hooks/      # TanStack Query hooks
    <feature>/store/      # Zustand stores
    <feature>/schemas/    # Zod schemas
    <feature>/components/ # Feature-specific UI
  shared/
    services/             # firebase.ts, supabase.ts client setup
    components/           # Screen, Protected, AppButton, FormField, ...
    theme/                # Brand colors
    types/                # UserRole, AuthSession; generated database types
supabase/
  migrations/             # SQL schema + RLS policies
```

## Security boundary

- The Expo app only ever holds public, publishable keys. Supabase
  `service_role`, PayChangu gateway secrets and Firebase admin credentials must
  never ship in this client — they belong server-side (Supabase Edge Functions).
- All table access is enforced by Postgres RLS keyed on the Firebase JWT `sub`
  claim ("own profile", "verified builders", "booking participants", etc.).
- Payment flows go through `src/features/payments/services/payment-service.ts`;
  the server-side PayChangu adapter holds the secret key and keeps the ledger
  append-only for clients (paid/refunded transitions happen in the Edge Function).
- Admin actions (`approve_builder`, `reject_document`, `suspend_user`,
  `resolve_report`) are declared in
  `src/features/admin/services/admin-service.ts` and must be implemented by an
  authenticated Edge Function — never by a client-side Supabase call.

## Run locally

1. Install Node.js 20.19+.
2. Run `npm install`.
3. Run `npx expo install --fix` to align Expo-managed packages with the SDK.
4. Copy `.env.example` to `.env` and fill in the Firebase and Supabase keys.
5. Optional: follow [`supabase/README.md`](supabase/README.md) to set up
   Third-Party Auth and push the migrations.
6. Run `npm start`.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` / `npm run ios` / `npm run web` | Start on a target platform |
| `npm run typecheck` | Validate TypeScript (`tsc --noEmit`) |

### Notes

- Google sign-in requires a development/production native build (it is not
  Expo Go-compatible) and the `EXPO_PUBLIC_FIREBASE_*_CLIENT_ID` env vars; the
  button is hidden when the web client id is not configured.
- The mobile client does not initialize Firestore — Supabase is the data layer.

## Roadmap

- **Next:** persist builder profiles (business name, skills, photos, document
  uploads) to the Supabase `builders` / `builder_skills` / `portfolio_items`
  tables from the existing `builder-profile` screen; connect bookings end-to-end.
- **Then:** back the messaging, payments (PayChangu), reviews, favorites and
  notifications screens with their already-defined RLS-protected tables.
- **Then:** implement the server-side Supabase Edge Functions for PayChangu and
  admin actions, apply production RLS verification across customer/builder/admin
  accounts, and ship EAS builds to physical devices.
- Release-blocking items are tracked in
  [`RELEASE_READINESS.md`](RELEASE_READINESS.md).
