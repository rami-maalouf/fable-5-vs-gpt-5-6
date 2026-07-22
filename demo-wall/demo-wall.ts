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
  console.log('All nine demo apps are running. Arrange the Simulator windows in a 3x3 grid or capture them as OBS window sources.');
}

async function reset() {
  const devices = await readState();
  if (devices.length !== targets.length) throw new Error('Run bun run demo:setup first.');
  for (const device of devices) await boot(device);
  for (const device of devices) await launch(device);
  console.log('All nine apps were returned to their deterministic launch scenes.');
}

async function stop() {
  const devices = await readState();
  for (const device of devices) {
    await run(['xcrun', 'simctl', 'shutdown', device.udid], { allowFailure: true });
  }
  console.log('Demo wall simulators are shut down.');
}

const command = process.argv[2];
const commands = { doctor, setup, start, reset, stop } as const;
if (!command || !(command in commands)) {
  console.error('Usage: bun demo-wall/demo-wall.ts <doctor|setup|start|reset|stop>');
  process.exit(1);
}

await commands[command as keyof typeof commands]();
