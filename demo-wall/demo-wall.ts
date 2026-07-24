import { existsSync } from 'node:fs';
import path from 'node:path';

type Target = {
  id: string;
  label: string;
  project: string;
  bundleId: string;
  appearance: 'light' | 'dark';
};

type DeviceRecord = Target & { udid: string };

const root = path.resolve(import.meta.dir, '..');
const stateDirectory = path.join(root, '.demo-wall');
const statePath = path.join(stateDirectory, 'devices.json');
// layouts live in the git-tracked demo-wall folder so the default arrangement survives reboots
const layoutsDirectory = path.join(import.meta.dir, 'layouts');
const deviceType = 'com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro';

const targets: Target[] = [
  { id: 'nourish-fable-5', label: 'Nourish - Fable 5', project: 'ai-calorie-tracker/fable-5', bundleId: 'com.ramimaalouf.nourish', appearance: 'light' },
  { id: 'nourish-gpt-5-5', label: 'Nourish - GPT-5.5', project: 'ai-calorie-tracker/gpt-5-5', bundleId: 'com.rami.nourish', appearance: 'light' },
  { id: 'nourish-gpt-5-6', label: 'Nourish - GPT-5.6', project: 'ai-calorie-tracker/gpt-5-6', bundleId: 'com.rami.nourish', appearance: 'light' },
  { id: 'nova-fable-5', label: 'Nova - Fable 5', project: 'ai-chat-app/fable-5', bundleId: 'com.ramimaalouf.nova', appearance: 'light' },
  { id: 'nova-gpt-5-5', label: 'Nova - GPT-5.5', project: 'ai-chat-app/gpt-5-5', bundleId: 'com.ramimaalouf.nova', appearance: 'light' },
  { id: 'nova-gpt-5-6', label: 'Nova - GPT-5.6', project: 'ai-chat-app/gpt-5-6', bundleId: 'com.rami.nova.gpt56', appearance: 'light' },
  { id: 'twilight-fable-5', label: 'Twilight - Fable 5', project: 'swift-rewrite/fable-5', bundleId: 'com.rami.twilight.port', appearance: 'dark' },
  { id: 'twilight-gpt-5-5', label: 'Twilight - GPT-5.5', project: 'swift-rewrite/gpt-5-5', bundleId: 'com.ramimaalouf.twilight-expo', appearance: 'dark' },
  { id: 'twilight-gpt-5-6', label: 'Twilight - GPT-5.6', project: 'swift-rewrite/gpt-5-6', bundleId: 'studio.orbitlabs.twilight.expo', appearance: 'dark' },
];

async function run(command: string[], options: { cwd?: string; capture?: boolean; allowFailure?: boolean; env?: Record<string, string | undefined> } = {}) {
  const process = Bun.spawn(command, {
    cwd: options.cwd ?? root,
    env: options.env ?? Bun.env,
    stdout: options.capture ? 'pipe' : 'inherit',
    stderr: options.capture ? 'pipe' : 'inherit',
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    process.exited,
    options.capture ? new Response(process.stdout).text() : Promise.resolve(''),
    options.capture ? new Response(process.stderr).text() : Promise.resolve(''),
  ]);
  if (exitCode !== 0 && !options.allowFailure) {
    throw new Error(`${command.join(' ')} failed${stderr ? `: ${stderr.trim()}` : ''}`);
  }
  return { exitCode, stdout, stderr };
}

async function readState(): Promise<DeviceRecord[]> {
  if (!existsSync(statePath)) return [];
  return Bun.file(statePath).json();
}

async function writeState(devices: DeviceRecord[]) {
  await run(['mkdir', '-p', stateDirectory]);
  await Bun.write(statePath, `${JSON.stringify(devices, null, 2)}\n`);
}

async function simulatorJson(argument: 'devices' | 'runtimes') {
  const result = await run(['xcrun', 'simctl', 'list', argument, '--json'], { capture: true });
  return JSON.parse(result.stdout) as Record<string, unknown>;
}

async function selectRuntime() {
  const payload = await simulatorJson('runtimes') as { runtimes?: Array<{ identifier: string; isAvailable: boolean; platform: string; version: string }> };
  const runtimes = (payload.runtimes ?? [])
    .filter((runtime) => runtime.isAvailable && runtime.platform === 'iOS')
    .sort((left, right) => right.version.localeCompare(left.version, undefined, { numeric: true }));
  const preferred = runtimes.find((runtime) => runtime.version === '26.5');
  const runtime = preferred ?? runtimes[0];
  if (!runtime) throw new Error('No available iOS Simulator runtime was found.');
  return runtime.identifier;
}

async function availableUdids() {
  const payload = await simulatorJson('devices') as { devices?: Record<string, Array<{ udid: string; isAvailable: boolean }>> };
  return new Set(Object.values(payload.devices ?? {}).flat().filter((device) => device.isAvailable).map((device) => device.udid));
}

async function ensureDevices() {
  const current = await readState();
  const available = await availableUdids();
  if (current.length === targets.length && current.every((device) => available.has(device.udid))) {
    return current;
  }

  const runtime = await selectRuntime();
  const devices: DeviceRecord[] = [];
  for (const target of targets) {
    const existing = current.find((device) => device.id === target.id && available.has(device.udid));
    if (existing) {
      devices.push(existing);
      continue;
    }
    const created = await run(['xcrun', 'simctl', 'create', `YouTube - ${target.label}`, deviceType, runtime], { capture: true });
    devices.push({ ...target, udid: created.stdout.trim() });
  }
  await writeState(devices);
  return devices;
}

async function boot(device: DeviceRecord) {
  await run(['xcrun', 'simctl', 'boot', device.udid], { allowFailure: true, capture: true });
  await run(['xcrun', 'simctl', 'bootstatus', device.udid, '-b']);
  await run(['xcrun', 'simctl', 'ui', device.udid, 'appearance', device.appearance]);
  await run([
    'xcrun', 'simctl', 'status_bar', device.udid, 'override',
    '--time', '9:41', '--batteryState', 'charged', '--batteryLevel', '100',
    '--wifiBars', '3', '--cellularBars', '4',
  ], { allowFailure: true });
}

async function launch(device: DeviceRecord) {
  await run(['xcrun', 'simctl', 'terminate', device.udid, device.bundleId], { allowFailure: true, capture: true });
  await run(['xcrun', 'simctl', 'launch', device.udid, device.bundleId]);
}

// a running app shows up in the simulator's launchd as "UIKitApplication:<bundleId>[...]"
async function isAppRunning(device: DeviceRecord): Promise<boolean> {
  const result = await run(['xcrun', 'simctl', 'spawn', device.udid, 'launchctl', 'list'], { capture: true, allowFailure: true });
  return result.stdout.includes(`UIKitApplication:${device.bundleId}[`);
}

async function bootedUdids(): Promise<Set<string>> {
  const payload = await simulatorJson('devices') as { devices?: Record<string, Array<{ udid: string; state: string }>> };
  return new Set(Object.values(payload.devices ?? {}).flat().filter((device) => device.state === 'Booted').map((device) => device.udid));
}

async function findBuiltApp(outputDirectory: string) {
  if (!existsSync(outputDirectory)) return undefined;
  const appSearch = await run(['find', outputDirectory, '-type', 'd', '-name', '*.app'], { capture: true });
  return appSearch.stdout.split('\n').find(Boolean);
}

async function doctor() {
  console.log('Checking demo wall prerequisites...');
  await run(['xcodebuild', '-version']);
  await run(['bun', '--version']);
  const runtime = await selectRuntime();
  console.log(`Runtime: ${runtime}`);
  for (const target of targets) {
    const projectPath = path.join(root, target.project);
    if (!existsSync(path.join(projectPath, 'ios')) || !existsSync(path.join(projectPath, 'node_modules'))) {
      throw new Error(`${target.label} is missing ios or node_modules.`);
    }
  }
  console.log('All nine projects are ready for setup.');
}

async function setup() {
  await doctor();
  const devices = await ensureDevices();
  for (const device of devices) await boot(device);
  await run(['open', '-a', 'Simulator']);

  for (const device of devices) {
    const outputDirectory = path.join(stateDirectory, 'builds', device.id);
    let appPath = Bun.env.DEMO_WALL_REBUILD === '1' ? undefined : await findBuiltApp(outputDirectory);
    if (appPath) {
      console.log(`\nReusing ${device.label} build...`);
    } else {
      console.log(`\nBuilding ${device.label}...`);
      await run(['mkdir', '-p', outputDirectory]);
      await run(
        ['bunx', 'expo', 'run:ios', '--configuration', 'Release', '--device', 'generic', '--output', outputDirectory],
        {
          cwd: path.join(root, device.project),
          env: {
            ...Bun.env,
            CI: '1',
            EXPO_PUBLIC_DEMO_MODE: '1',
            EXTRA_PACKAGER_ARGS: '--skip-server',
          },
        },
      );
      appPath = await findBuiltApp(outputDirectory);
    }
    if (!appPath) throw new Error(`No simulator app was produced for ${device.label}.`);
    await run(['xcrun', 'simctl', 'install', device.udid, appPath]);
    await launch(device);
  }
  console.log('\nDemo wall setup complete. Run: bun run demo:start');
}

async function start() {
  const devices = await ensureDevices();
  await Promise.all(devices.map(boot));
  await run(['open', '-a', 'Simulator']);
  for (const device of devices) await launch(device);
  if (existsSync(path.join(layoutsDirectory, 'default.json'))) {
    await applyLayoutNamed('default');
    console.log('All nine demo apps are running in the saved default layout.');
  } else {
    console.log('All nine demo apps are running. Arrange the windows, then run "bun run demo:save-layout" to make this the default.');
  }
}

async function reset() {
  const devices = await readState();
  if (devices.length !== targets.length) throw new Error('Run bun run demo:setup first.');
  for (const device of devices) await boot(device);
  for (const device of devices) await launch(device);
  console.log('All nine apps were returned to their deterministic launch scenes.');
}

// launch each app on its simulator only if it is not already running; never relaunches a live app
async function openApps() {
  const devices = await readState();
  if (devices.length === 0) throw new Error('No devices found. Run bun run demo:setup first.');
  const booted = await bootedUdids();
  let launched = 0;
  let running = 0;
  let notBooted = 0;
  for (const device of devices) {
    if (!booted.has(device.udid)) {
      console.log(`- ${device.label}: simulator not booted, skipped`);
      notBooted += 1;
      continue;
    }
    if (await isAppRunning(device)) {
      running += 1;
      continue;
    }
    await run(['xcrun', 'simctl', 'launch', device.udid, device.bundleId], { allowFailure: true, capture: true });
    console.log(`- ${device.label}: launched`);
    launched += 1;
  }
  console.log(`Opened ${launched} app(s); ${running} already running${notBooted ? `; ${notBooted} not booted` : ''}.`);
}

// window layout capture / restore via Simulator accessibility (System Events).
// positions are on-screen coordinates relative to the main display, top-left origin.
type WindowFrame = { x: number; y: number; w: number; h: number };
// simulator ignores programmatic (accessibility) resizing, so window size can only be set
// through its own Window menu presets. these are the four it offers.
const sizeMenuItem = {
  fit: 'Fit Screen', // fills the display height (~491x1041 on a 1920x1080 screen)
  point: 'Point Accurate', // ~456x972
  pixel: 'Pixel Accurate', // ~1368x2792 (device pixels 1:1)
  physical: 'Physical Size', // ~380x843
} as const;
type SizePreset = keyof typeof sizeMenuItem;
// approximate window width each preset produces, used as a threshold for `maxSize`
const sizePresetWidth: Record<SizePreset, number> = { fit: 491, point: 456, physical: 380, pixel: 1368 };

// a framed entry places the window; a hidden entry minimizes it. sizing options:
//   size    - always resize to this preset
//   maxSize - only resize (to this preset) if the window is currently WIDER than the preset,
//             otherwise leave it alone. lets `default` shrink oversized windows without
//             enlarging the ones that are already small.
type LayoutEntry = { id: string; label: string; hidden?: boolean; size?: SizePreset; maxSize?: SizePreset } & Partial<WindowFrame>;

async function osascript(script: string) {
  const result = await run(['osascript', '-e', script], { capture: true });
  return result.stdout;
}

function matchTarget(windowName: string): Target | undefined {
  // window titles read like "YouTube - Nourish - Fable 5 – iOS 26.5"; each label is a unique substring
  return targets.find((target) => windowName.includes(target.label));
}

async function readWindows(): Promise<Array<{ name: string } & WindowFrame>> {
  const script = `tell application "System Events"
  if not (exists process "Simulator") then return ""
  tell process "Simulator"
    set output to ""
    repeat with theWindow in windows
      set theName to name of theWindow
      set thePosition to position of theWindow
      set theSize to size of theWindow
      set output to output & theName & "|||" & (item 1 of thePosition) & "|||" & (item 2 of thePosition) & "|||" & (item 1 of theSize) & "|||" & (item 2 of theSize) & linefeed
    end repeat
    return output
  end tell
end tell`;
  const stdout = await osascript(script);
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, x, y, w, h] = line.split('|||');
      return { name, x: Number(x), y: Number(y), w: Number(w), h: Number(h) };
    });
}

async function readLayout(name: string): Promise<LayoutEntry[]> {
  const file = path.join(layoutsDirectory, `${name}.json`);
  if (!existsSync(file)) {
    throw new Error(`Layout "${name}" not found. Save one with: bun run demo:save-layout ${name === 'default' ? '' : name}`.trim());
  }
  return Bun.file(file).json();
}

// map a captured window width to the nearest size preset we can reproduce
function nearestSizePreset(width: number): SizePreset {
  const options: Array<[SizePreset, number]> = [['physical', 380], ['point', 456], ['fit', 491], ['pixel', 1368]];
  return options.reduce((best, option) => (Math.abs(option[1] - width) < Math.abs(best[1] - width) ? option : best))[0];
}

// capture the current arrangement: every app with a visible window on the active space becomes a
// framed entry (position + nearest size preset); every other app is marked hidden. so the workflow
// is: arrange the windows you want on screen, minimize the rest, then save.
async function saveLayoutNamed(name: string) {
  const windows = await readWindows();
  const visibleByTarget = new Map<string, { x: number; y: number; w: number; h: number }>();
  for (const window of windows) {
    const target = matchTarget(window.name);
    if (target && !visibleByTarget.has(target.id)) {
      visibleByTarget.set(target.id, { x: window.x, y: window.y, w: window.w, h: window.h });
    }
  }
  if (visibleByTarget.size === 0) {
    throw new Error('No demo windows are visible on the active display. Arrange the windows you want, then save.');
  }

  const entries: LayoutEntry[] = targets.map((target) => {
    const frame = visibleByTarget.get(target.id);
    if (!frame) return { id: target.id, label: target.label, hidden: true };
    return { id: target.id, label: target.label, size: nearestSizePreset(frame.w), x: frame.x, y: frame.y };
  });

  await run(['mkdir', '-p', layoutsDirectory]);
  const file = path.join(layoutsDirectory, `${name}.json`);
  await Bun.write(file, `${JSON.stringify(entries, null, 2)}\n`);
  const shown = entries.filter((entry) => !entry.hidden);
  console.log(`Saved layout "${name}": ${shown.length} windows shown, ${entries.length - shown.length} hidden.`);
  console.log(`Shown: ${shown.map((entry) => `${entry.label} (${entry.size})`).join(', ')}`);
}

// reopen (and un-minimize) a device window via File > Open Simulator; the device sits under an
// "iOS <version>" submenu. clicking an already-open window is a harmless focus.
async function ensureWindowOpen(label: string) {
  await osascript(`tell application "Simulator" to activate
delay 0.3
tell application "System Events" to tell process "Simulator"
  set openMenu to menu 1 of menu item "Open Simulator" of menu "File" of menu bar 1
  repeat with osItem in menu items of openMenu
    if (name of osItem as string) starts with "iOS" then
      try
        click menu item "YouTube - ${label}" of menu 1 of osItem
        exit repeat
      end try
    end if
  end repeat
end tell`);
}

// size (via Window menu preset) then place (via accessibility position) one window.
//   - `size`: always apply that preset
//   - `maxSize`: apply the preset only if the window is currently wider than it (a cap)
//   - neither: leave the window at whatever size it already has
async function placeWindow(entry: LayoutEntry) {
  let resize = '';
  if (entry.size) {
    resize = `    click menu item "${sizeMenuItem[entry.size]}" of menu "Window" of menu bar 1
    delay 0.4`;
  } else if (entry.maxSize) {
    resize = `    set currentSize to size of theWindow
    if (item 1 of currentSize) > ${sizePresetWidth[entry.maxSize]} then
      click menu item "${sizeMenuItem[entry.maxSize]}" of menu "Window" of menu bar 1
      delay 0.4
    end if`;
  }
  await osascript(`tell application "Simulator" to activate
delay 0.3
tell application "System Events" to tell process "Simulator"
  try
    set theWindow to (first window whose name contains "${entry.label}")
    perform action "AXRaise" of theWindow
    set frontmost to true
    delay 0.2
${resize}
    set position of theWindow to {${Math.round(entry.x ?? 0)}, ${Math.round(entry.y ?? 0)}}
  end try
end tell`);
}

async function minimizeWindow(label: string) {
  await osascript(`tell application "Simulator" to activate
delay 0.3
tell application "System Events" to tell process "Simulator"
  try
    set theWindow to (first window whose name contains "${label}")
    perform action "AXRaise" of theWindow
    set frontmost to true
    delay 0.2
    click menu item "Minimize" of menu "Window" of menu bar 1
  end try
end tell`);
}

async function applyLayoutNamed(name: string) {
  const entries = await readLayout(name);
  const visible = entries.filter((entry) => !entry.hidden);
  const hidden = entries.filter((entry) => entry.hidden);

  await run(['open', '-a', 'Simulator']);
  await Bun.sleep(800);

  // 1. make sure every window this layout shows is open and un-minimized
  for (const entry of visible) await ensureWindowOpen(entry.label);
  await Bun.sleep(600);

  // 2. size + place each visible window (one at a time: menu presets act on the focused window)
  for (const entry of visible) await placeWindow(entry);

  // 3. minimize the windows this layout hides
  for (const entry of hidden) await minimizeWindow(entry.label);

  console.log(`Applied layout "${name}": ${visible.length} windows placed${hidden.length ? `, ${hidden.length} minimized` : ''}.`);
}

async function saveLayout() {
  await saveLayoutNamed(process.argv[3] ?? 'default');
}

async function applyLayout() {
  await applyLayoutNamed(process.argv[3] ?? 'default');
}

async function layouts() {
  if (!existsSync(layoutsDirectory)) {
    console.log('No layouts saved yet. Arrange the wall, then run: bun run demo:save-layout');
    return;
  }
  const listing = await run(['ls', layoutsDirectory], { capture: true });
  const names = listing.stdout
    .split('\n')
    .filter((entry) => entry.endsWith('.json'))
    .map((entry) => entry.replace(/\.json$/, ''));
  if (names.length === 0) {
    console.log('No layouts saved yet. Arrange the wall, then run: bun run demo:save-layout');
    return;
  }
  console.log('Saved layouts:');
  for (const name of names) console.log(`  - ${name}${name === 'default' ? ' (applied automatically on demo:start)' : ''}`);
}

async function stop() {
  const devices = await readState();
  for (const device of devices) {
    await run(['xcrun', 'simctl', 'shutdown', device.udid], { allowFailure: true });
  }
  console.log('Demo wall simulators are shut down.');
}

const command = process.argv[2];
const commands = { doctor, setup, start, reset, stop, 'open-apps': openApps, 'save-layout': saveLayout, 'apply-layout': applyLayout, layouts } as const;
if (!command || !(command in commands)) {
  console.error('Usage: bun demo-wall/demo-wall.ts <doctor|setup|start|reset|stop|open-apps|save-layout [name]|apply-layout [name]|layouts>');
  process.exit(1);
}

await commands[command as keyof typeof commands]();
