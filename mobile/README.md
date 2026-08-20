# FinHash — mobile

Native iOS/Android client for FinHash, built with Expo (SDK 57) and
expo-router. It talks to the **same Convex deployment and Firebase project as
the web app**, so an account is shared across both and edits sync live.

## Layout

```
mobile/
  app/            expo-router routes (thin re-exports of src/screens)
  src/
    components/   ui primitives, layout chrome, charts, transaction sheets
    hooks/        currency, auth, connection status
    lib/          firebase, haptics, csv, category icons
    providers/    convex + auth bridge, global add-transaction sheet
    screens/      one file per route
    theme/        design tokens, ThemeProvider
```

Two things are **shared with the web app rather than copied**, via Metro
aliases in `metro.config.js`:

| Alias      | Points at    | Why                                          |
| ---------- | ------------ | -------------------------------------------- |
| `@convex/` | `../convex/` | Same backend functions and generated types   |
| `@shared/` | `../src/lib` | Pure helpers (money/date formatting, CSV)    |

Editing a Convex function updates both clients. Keep anything platform-specific
out of `../src/lib`.

## Setup

```bash
cd mobile
bun install          # or npm install
cp .env.example .env # then fill it in
```

`.env` needs the **same** Convex URL and Firebase web config the root
`.env.local` uses, re-prefixed with `EXPO_PUBLIC_`, plus Google OAuth client
IDs.

### Google sign-in

Firebase's popup/redirect helpers assume a DOM, so the app obtains a Google ID
token through `expo-auth-session` and exchanges it for a Firebase credential.
Create OAuth clients in the Google Cloud console for the Firebase project:

- **Web client** — required; this is the audience Firebase validates against.
- **iOS client** — bundle ID `ai.museigen.finhash`.
- **Android client** — package `ai.museigen.finhash` plus the SHA-1 of the
  signing key (`eas credentials` prints it).

Add the redirect scheme `finhash` to the iOS/Android clients.

> Google sign-in needs a development build — it does not work in Expo Go,
> which uses its own bundle identifier.

## Running

```bash
bunx expo start                 # dev server
bunx expo run:ios               # local dev build
bunx expo run:android
bunx expo export --platform all # verify the bundle compiles
```

Native projects are generated (`expo prebuild`) and are **not** committed;
`ios/` and `android/` are gitignored.

## Design system

`src/theme/tokens.ts` mirrors the web app's CSS custom properties one-for-one —
the burnt-orange ramp, spacing scale, radii, springs. Anything visual should
read from there rather than hard-coding a hex value, so the two clients stay in
step.

Charts are hand-built on `react-native-svg`: the donut animates its sweep via
dashed circle strokes (worklet-friendly), while the cash-flow and trend charts
use `d3-scale`/`d3-shape` to compute static paths.
