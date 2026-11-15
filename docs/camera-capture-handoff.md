# Camera-first flag capture — prototype and Flutter handoff

## User flow

Map marker → original flag details sheet → Capture → Finding the flag… →
You found a flag → Tap the flag on the screen to capture it → 50-coin success.

The original flag header and reward pill remain unchanged. There is no help or
manual failure button in the camera view. Closing the camera returns to details.

## Automatic recovery

Each attempt either reveals a usable flag or records one failure. Camera errors,
playback rejection, 12 seconds without playback progress, and flag asset errors
or loading timeouts count as failures. The first two failures trigger an automatic
retry after 900 ms. The third consecutive failure opens the recovery modal.

The modal shows all three attempt results (camera unavailable, camera view
interrupted, or flag didn’t appear) and explains that coins are not collected yet.
**Collect directly** is the primary action only when the user is within 50 m.
**Try scanning again** starts a fresh three-attempt sequence. Outside the radius,
the modal asks the user to move closer and does not offer direct collection.

A successful flag render clears consecutive failures. Late events from old
attempts, repeated errors for one attempt, and repeated collection taps are ignored.
Timers are cancelled on unmount. Closing an attempt does not award coins.

## Demonstrating both flows without extra UI controls

Use the app's existing address, adding the query string below when needed:

- Normal success: `/` — open the flag, tap Capture, wait for the scan, tap the 3D flag.
- Three failed attempts: `/?captureDemo=fail` — open the flag and tap Capture.
  Three simulated 3.2-second scans fail automatically, separated by brief retries.
  After about 12 seconds, the modal appears with its attempt log and Collect directly.
- Radius check: `/?captureDemo=fail&captureDistance=75` — same failures, but direct
  collection is unavailable because the simulated distance exceeds 50 m.

Remove the query string or open the normal address to return to successful capture.
Demo selection is fixed when the camera opens. It is not saved to local storage.

## Prototype boundary

The camera uses the existing prerecorded video, marked Preview, with its existing
four-second loop. The 3D flag is a CSS perspective effect using the existing
Tomoboshi star asset. Normal scans need 3.2 seconds of progressing video plus a
loaded flag asset. The failure demo intentionally suppresses the flag and runs
independently of video availability so it can be demonstrated reliably.

Distance is **mocked at 20 m** (or the captureDistance query value), not measured GPS.
The unchanged `0.2 mi • Gold Flag` header is display-only legacy mock content;
it is not the distance input to the radius guard. No real reward API is called.

Flutter should replace simulated video/asset readiness with native camera and AR
render/tracking events, and replace mock distance with verified device location.
Native reward handling must verify eligibility and prevent duplicate awards.
The hidden demo query settings are presentation controls, not production checks.

## Active files and checks

- `src/CaptureSheet.tsx`: flag details and camera entry.
- `src/CaptureCamera.tsx`: camera display, attempts, preview controls, recovery modal.
- `src/captureAttemptState.ts`: consecutive failures, retries, and collection guards.
- `src/CaptureExperience.css`: scoped mobile styles and reduced motion.
- `src/useCaptureDialog.ts`: modal keyboard focus and scroll handling.
- `src/App.tsx`: integration and existing reward overlay.

Run `node --test src/captureAttemptState.test.ts`, `npx tsc --noEmit`, and `npm run build`.
The tests cover the three-attempt boundary, duplicate and stale events, successful
reset, radius validation, and single collection transition.

`src/CaptureFlow.tsx` and its CSS are legacy experiments, not imported by App.
Adventure cards and global styles are outside this change.
