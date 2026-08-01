# Supabase schema setup

This project uses Firebase Authentication as Supabase Third-Party Auth. In the Supabase dashboard, add the Firebase project under **Authentication → Third-Party Auth**, then ensure Firebase users receive the `role: "authenticated"` custom claim.

The SQL migration must be generated with the Supabase CLI to preserve proper migration history. From this directory, after installing/authenticating the CLI, run:

```powershell
npx supabase login
npx supabase init
npx supabase migration new builderlink_core_schema
```

Then add the reviewed schema and RLS policies to the generated migration and apply it with `npx supabase db push`. Do not add service-role credentials to the Expo app.
