# Project Environment

- Expo Router universal React Native app using Expo SDK 57, React Native 0.86, and strict TypeScript.
- Routes currently live in `src/app`; the Nourish server route must be placed at the benchmark-required root `app/scan+api.ts` when the product routes migrate.
- Supported targets are iOS, Android, and web. The primary benchmark target is an iPhone Pro-class iOS simulator.
- Use Bun for JavaScript commands. Metro defaults to port 8081.
- The app requires server web output, a single small `RemainingCaloriesWidget`, and an `OPENAI_API_KEY` read only by the API route.
- Baseline quality commands are `bun run test -- --runInBand`, `bun run lint`, and `bunx tsc --noEmit`.
