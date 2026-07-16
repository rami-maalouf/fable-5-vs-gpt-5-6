# checkpoints

## checkpoint 1 - shared shell and chrome

covered tasks:

- task 1: Expo app scaffold, four-tab shell, iOS SF Symbols.
- task 2: domain models and sleep session rules.
- task 3: SQLite session repository and settings store.
- task 4: theme palettes and theme selection controller.
- task 5: shared screen chrome, starfield, moon accent, reusable glass cards, and tinted tab bar.

verification:

- `bun run test`: passed, 7 suites and 18 tests.
- `bunx tsc --noEmit`: passed.
- `bun run lint`: passed.
- `git diff --check -- .`: passed.
- em-dash scan over app files: no matches.
- Release iOS build succeeded for iPhone 17 Pro simulator
  `93EEF062-B4DC-4989-AF77-CF47EE2A9816`.
- Installed and launched release app bundle:
  `/Users/rami/Library/Developer/Xcode/DerivedData/Twilight-gdbapeqbfyfuisccwukhejoqtvbv/Build/Products/Release-iphonesimulator/Twilight.app`.

visual qa:

- Home screenshot:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-sN6PnM/media/627265000-1784196250627.png`.
- Metrics screenshot:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-sN6PnM/media/914274000-1784196264914.png`.
- Logs screenshot:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-sN6PnM/media/635408000-1784196276635.png`.
- Settings screenshot:
  `/var/folders/k0/qs1dydf540z0559w7544mhh00000gn/T/simserver-sN6PnM/media/847240000-1784196287847.png`.
- Dashboard was corrected after review so the title no longer wraps and the active tab
  background is rounded instead of square.
- Every tab rendered the shared gradient, starfield, glass card surfaces, moon accent,
  and tinted floating tab bar.

code quality gate:

- Reviewed task 5 changes after implementation.
- Fixed JSX indentation in the placeholder screen.
- Made `ScreenChrome` accept an optional `AppTheme` instead of locking the component
  to twilight internally.

known gaps:

- In-app switching between twilight and amethyst is not available yet. The chrome
  accepts an injected theme, but the settings UI that will expose appearance selection
  is a later task.
- Star placement and the shooting-star trail are deterministic and static in this
  checkpoint. Full twinkle and moving shooting-star behavior is deferred to the
  animation pass.
