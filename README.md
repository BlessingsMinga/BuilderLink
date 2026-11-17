# BuilderLink Malawi

A Malawi-localized construction marketplace connecting customers with verified
builders. Built with **Expo (React Native)**, **TypeScript**, **NativeWind** and
**expo-router**, on **Firebase Authentication** and **Cloud Firestore**.

## Feature status

| Area | Status |
| --- | --- |
| Onboarding, role-based registration (customer / builder) | ✅ Live |
| Sign-in with phone (SMS), Google, or email and password | ✅ Live (Google needs a native build) |
| Forgot password and email verification | ✅ Live |
| Builder catalogue: browse by trade, search, filter by district, builder profile | ✅ Live |
| Builder workspace: business details, district, skills | ✅ Live (new listings start as pending) |
| Bookings: request, accept / decline / complete, cancel | ✅ Live |
| Reviews (one per completed booking) and saved professionals | ✅ Live |
| Builder approval, photo and document uploads | 🚧 Approval is manual in the Firebase console; uploads not built |
| Chat, payments (PayChangu), notifications, admin dashboard | 🚧 Not built |

## Stack

- **Auth:** Firebase Authentication (phone, Google, email/password). Sessions
  persist to AsyncStorage.
- **Data:** Cloud Firestore, named database `builderlink`. Access is enforced by
  [`firestore.rules`](firestore.rules).
- **Client data layer:** TanStack React Query hooks per feature
  (`src/features/<feature>/hooks`).
- **Forms:** react-hook-form + Zod.
- **State:** Zustand `auth-store` holds the session (user id, role, email).
- **UI:** NativeWind 4 with light and dark themes, Plus Jakarta Sans,
  `lucide-react-native` icons, Expo SDK 54 / React Native 0.81.

## Data model (Firestore)

| Collection | Contents | Who can read |
| --- | --- | --- |
| `profiles/{uid}` | Name, role, phone, email | The user (and administrators) |
| `builders/{uid}` | Business name, trades, district, rating, verification status | Everyone signed in, once verified; the builder always |
| `bookings/{id}` | Customer, builder, service, date, location, status | The two parties (and administrators) |
| `reviews/{bookingId}` | Rating, detail ratings, comment | Everyone signed in |
| `favorites/{uid}_{builderId}` | A user's saved builder | The user |

Key rules: a profile's role can't be changed by the client; new builder
listings start as `pending` and only administrators can verify them; booking
status can only move along allowed paths (builder accepts, declines or
completes; customer cancels); a review requires a completed booking and is
permanent.

Deploy rules with:

```
npx firebase-tools deploy --only firestore:rules
```

To approve a builder, set `verification_status` to `verified` on their
`builders` document in the Firebase console.

## Project structure

```
app/                      # expo-router routes (typed routes enabled)
  (tabs)/                 # Home, Search, Bookings, Profile
  bookings/[id].tsx       # Booking detail and actions
  builders/[id].tsx       # Builder profile
  booking.tsx, review.tsx, saved.tsx, builder-profile.tsx
  login.tsx, register.tsx, register/[role].tsx, phone-sign-in.tsx, ...
src/
  features/               # authentication, builders, bookings, reviews, favorites
    <feature>/services/   # Firestore / Firebase calls
    <feature>/hooks/      # TanStack Query hooks
    <feature>/components/ # Feature-specific UI
  shared/
    services/firebase.ts  # Firebase app, auth and Firestore setup
    components/           # Screen, ScreenHeader, AppButton, Chip, states, ...
    theme/                # Colour tokens (keep in sync with global.css)
firestore.rules           # Security rules
```

## Security boundary

- The app only holds public Firebase configuration. Firebase admin credentials
  and payment gateway secrets must never ship in the client; they belong in
  server-side code (Cloud Functions).
- Builder ratings and job counts can't be written by clients. Keeping them in
  sync with reviews needs a Cloud Function.

## Run locally

1. Install Node.js 20.19+.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill in the Firebase values.
4. Run `npm start` (or `npm run android` for a development build).

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` / `npm run ios` | Build and run on a device or emulator |
| `npm run typecheck` | Validate TypeScript (`tsc --noEmit`) |

### Notes

- Google sign-in requires a native build (not Expo Go) and the
  `EXPO_PUBLIC_FIREBASE_*_CLIENT_ID` values; the button is hidden without them.
- Enable Email/Password, Google and Phone under Firebase Authentication. Phone
  sign-in also needs an SMS region policy that allows Malawi (`+265`).

## Roadmap

- **Next:** in-app builder approval for administrators; photo and document
  uploads (Firebase Storage).
- **Then:** Cloud Functions for builder rating stats and PayChangu payments;
  chat and notifications.
- Release-blocking items are tracked in
  [`RELEASE_READINESS.md`](RELEASE_READINESS.md).
