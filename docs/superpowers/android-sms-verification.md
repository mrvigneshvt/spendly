# Android SMS live-capture manual verification

## Prerequisites
- Physical Android device (API 26+ / Android 8+) with a SIM card
- Build and install the APK: `npx react-native run-android`
- Grant SMS permission when prompted (or grant manually in Settings → Apps → Spendly → Permissions → SMS)

## Verify live capture
1. Open the app, navigate to the pending screen
2. Send an SMS from another phone (or use a second SIM): e.g. "Rs.500 debited from a/c XXXX at SWIGGY"
3. Wait ~10 seconds
4. The pending transaction should appear in the app
5. If using multi-part SMS (long message that splits into multiple PDUs), verify the full body is shown, not truncated

## Verify multi-part SMS concatenation
1. Send a long SMS that spans 2+ parts (typically > 160 characters)
2. Confirm the full message appears in the pending transaction body
3. Confirm the sender and date are from the first part (not the last)

## Verify backfill
1. Deny SMS permission on first launch
2. Close and reopen the app
3. Grant SMS permission when prompted
4. Pending SMS transactions from the inbox should appear (backfill)

## Known limitations
- The foreground service notification ("Spendly: Monitoring SMS transactions") appears after the first SMS is received; this is required by Android 8+ for background service execution.
- If the app was force-stopped by the user, `RECEIVE_SMS` broadcast may be delayed or dropped by the system (Android 12+).
- Some OEMs (Xiaomi, Oppo, etc.) have aggressive background restrictions that may prevent live capture even with the foreground service.
