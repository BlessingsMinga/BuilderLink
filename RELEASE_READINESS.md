# Release readiness

## Verified

- TypeScript: `npm run typecheck` passes.
- Expo Android bundle previously completed successfully after removal of Expo Go-incompatible Google Sign-In code.
- Public Firebase and Supabase configuration belongs in `.env`; service-role and payment secrets are never included in the mobile application.

## Required before store submission

- Configure an EAS development/production build and test it on physical Android and iOS devices.
- Complete the Supabase Edge Function implementations for PayChangu and admin actions; keep gateway and admin secrets server-side.
- Apply and test production RLS policies with a customer, builder, and administrator account.
- Enable Firebase Email/Password, configure production email templates, and verify password-reset and verification links.
- Test permissions, uploads, poor-network behavior, and offline recovery on Malawi mobile networks.
- Add unit/integration tests and E2E smoke coverage for auth, booking, payment initiation, chat authorization, and review moderation.
- Run `npx expo-doctor` once the local npm cache lock is cleared.
- Complete store metadata, privacy policy, support contacts, icons, screenshots, and data-safety forms.
