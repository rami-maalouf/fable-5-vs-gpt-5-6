# task 16 - resilience and theme evidence

device: iPhone 17 Pro Max, iOS 27. real MacroLens route on metro port 8087. no mocks.

## files

- `05-not-food-error.png` - the non-food judging image (circuit board) returns the real
  `not_food` result; card reads "That doesn't look like food" with the distinct recovery
  actions "Try another photo" (primary) and "Discard", readable over the photo. light mode.
- `06-network-error.png` - metro (the dev server that serves `/scan`) was killed, so the
  request fails at the transport layer; card reads "Couldn't reach the analyzer / Check
  your connection, then retry with the same photo" with "Retry analysis" + "Discard".
  distinct copy from the analysis-failure variant. the prepared salad photo stays mounted
  behind the card. light mode.
- `07-dashboard-dark.png` - the three-meal dashboard in live dark mode: near-black
  surfaces, coral over-goal ring, legible macro bars and rows, no clipping, no default
  blue, safe areas and status bar correct.
- `08-result-card-dark.png` - a real result card over its photo in dark mode: dark card
  surface, legible text, coral accept, macro dots. no contrast or safe-area defect.

## recovery semantics verified (live, real backend)

1. non-food new-photo retry: circuit board -> not_food card -> "Try another photo" ->
   acquisition -> salad -> a transient provider 502 surfaced the "Analysis failed"
   recoverable card -> "Retry analysis" -> real 620 result. both the not-food recovery
   and the analysis-failure same-photo retry succeeded.
2. offline same-photo retry: metro killed -> salad scan -> "Couldn't reach the analyzer"
   network card -> metro restarted -> "Retry analysis" (no re-pick) -> real 650 result.
   the same prepared photo was reused; recovery succeeded.
3. discard isolation: discard from the result card and from error cards never changed the
   day. the dashboard held at exactly 3 meals / "1090 calories over" across every error,
   retry, and discard cycle in this session. no stale or late completion mutated state.

## theme

live appearance switching (`xcrun simctl ui <udid> appearance dark|light`) was used while
each screen was open. dashboard (populated), result card, and error cards all stayed
legible and intentional in both themes. reduce-motion was separately verified in task 13
(and a real crash under reduce motion was found and fixed there).

## note on provider flakiness

`gpt-5.6-luna` intermittently returns a 502 that the app maps to the safe
`analysis_failed` card; a direct `curl` to `/scan` returns 200 in ~1.5-3s, so this is
upstream provider variance, not an app defect. the "Retry analysis" path absorbs it, which
is the honest, spec-required behavior. no evidence here is mocked.
