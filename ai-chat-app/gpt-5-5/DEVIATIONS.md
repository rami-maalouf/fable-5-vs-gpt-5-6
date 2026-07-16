# deviations

- using the spec default identity, Nova, because the workflow is autonomous and the
  prompt explicitly says not to stop for branding confirmation.
- using `@react-native-menu/menu` instead of `zeego` for the future native context
  menu implementation because `zeego@3.0.6` pulls iOS peer packages that depend on
  `RCT-Folly (= 2022.05.16.00)`, which does not resolve under the Expo SDK 57 /
  React Native 0.86 native project.
- leaving `expo-widgets` installed but not configured as an app plugin in task 1.
  the generated widget target failed before any widget feature exists, so native
  widget target work is deferred until the model selection/widget task needs it.
- disabling `experiments.reactCompiler` for now after the shell rendered stale
  layout during simulator verification. this keeps the task 1 surface predictable
  while the app has no compiler-specific code paths.
