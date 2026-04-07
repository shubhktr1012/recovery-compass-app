# Android Google Sign-In

This app uses `expo-auth-session/providers/google` from [welcome.tsx](/Users/shubh/Development/recovery-compass/app/app/(auth)/welcome.tsx) for Google sign-in.

If Android shows:

```text
Error 400: invalid_request
Custom URI scheme is not enabled for your Android client.
```

the failure is in the Google Cloud OAuth client configuration, not the Supabase sign-in code.

## App identifiers

- Android package: `com.recoverycompass.app`
- Expo scheme: `recoverycompassapp`
- Android OAuth client env var: `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- Web OAuth client env var: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

## Fix checklist

1. Open Google Cloud Console
2. Go to `APIs & Services` -> `Credentials`
3. Open the Android OAuth client that matches `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
4. Confirm the package name is exactly `com.recoverycompass.app`
5. Confirm the SHA-1 fingerprint matches the signing key used by the distributed Android app
6. In the Android OAuth client advanced settings, enable the custom URI scheme option
7. Save the client

## SHA-1 note

For Play-distributed builds, Google sign-in may require the SHA-1 for the certificate that signs the Play-installed app.

Depending on your setup, that can mean:

- the Expo/EAS upload keystore SHA-1
- the Google Play App Signing certificate SHA-1

If sign-in still fails after enabling the custom URI scheme, add the Play App Signing SHA-1 to the Android OAuth client as well.

## Does this require a rebuild?

Not usually.

If the Android OAuth client ID value itself is unchanged, updating the Google Cloud client configuration should take effect without changing app code.

You only need a rebuild if you change:

- the client ID stored in `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- the app package name
- the Expo scheme

## Related repo config

- App scheme and package: [app.json](/Users/shubh/Development/recovery-compass/app/app.json)
- Runtime env wiring: [env.ts](/Users/shubh/Development/recovery-compass/app/lib/env.ts)
- Google auth flow: [welcome.tsx](/Users/shubh/Development/recovery-compass/app/app/(auth)/welcome.tsx)

## Deobfuscation support

Production EAS builds now retain Android `mapping.txt` through `buildArtifactPaths` in [eas.json](/Users/shubh/Development/recovery-compass/app/eas.json).

That gives you a stable deobfuscation artifact for Play Console crash and ANR analysis.
