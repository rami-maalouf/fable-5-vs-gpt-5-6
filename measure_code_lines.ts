import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

const benchmarkCommit = 'e74a40b7d3aed86cdc14b038b85a15456dcc3188';
const repoRoot = import.meta.dir;
const sourceExtensions = /\.(ts|tsx|js|jsx|css)$/;

const projects = [
  { app: 'AI Calorie Tracker', appDir: 'ai-calorie-tracker', model: 'Fable 5', modelDir: 'fable-5' },
  { app: 'AI Calorie Tracker', appDir: 'ai-calorie-tracker', model: 'GPT-5.5', modelDir: 'gpt-5-5' },
  { app: 'AI Calorie Tracker', appDir: 'ai-calorie-tracker', model: 'GPT-5.6-Sol', modelDir: 'gpt-5-6' },
  { app: 'AI Chat App', appDir: 'ai-chat-app', model: 'Fable 5', modelDir: 'fable-5' },
  { app: 'AI Chat App', appDir: 'ai-chat-app', model: 'GPT-5.5', modelDir: 'gpt-5-5' },
  { app: 'AI Chat App', appDir: 'ai-chat-app', model: 'GPT-5.6-Sol', modelDir: 'gpt-5-6' },
  { app: 'Swift Rewrite', appDir: 'swift-rewrite', model: 'Fable 5', modelDir: 'fable-5' },
  { app: 'Swift Rewrite', appDir: 'swift-rewrite', model: 'GPT-5.5', modelDir: 'gpt-5-5' },
  { app: 'Swift Rewrite', appDir: 'swift-rewrite', model: 'GPT-5.6-Sol', modelDir: 'gpt-5-6' },
];

type ClocRow = { blank: number; comment: number; code: number; language: string };
type ClocOutput = Record<string, ClocRow> & {
  SUM?: ClocRow & { nFiles: number };
};

function run(command: string[], cwd: string) {
  const result = Bun.spawnSync(command, { cwd, stdout: 'pipe', stderr: 'pipe' });
  if (result.exitCode !== 0) {
    throw new Error(`${command[0]} failed: ${result.stderr.toString()}`);
  }
  return result.stdout.toString();
}

function walk(directory: string, files: string[] = []) {
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

function hashFile(path: string) {
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(readFileSync(path));
  return hasher.digest('hex');
}

function isSource(path: string) {
  return sourceExtensions.test(path);
}

function isTest(path: string) {
  return /(^|\/)(__tests__|tests)\/|\.(test|spec)\.[^.]+$/.test(path);
}

function isExcludedSpike(projectPath: string, path: string) {
  if (projectPath === 'swift-rewrite/gpt-5-5') {
    return path.endsWith('/src/services/live-activity-spike.ts');
  }
  if (projectPath === 'swift-rewrite/gpt-5-6') {
    return /\/app\/[^/]*-spike\.[^.]+$/.test(path);
  }
  return false;
}

function countWithCloc(files: string[], cwd: string) {
  if (files.length === 0) return { code: 0, files: 0, byFile: {} as ClocOutput };
  const output = run(
    ['bunx', 'cloc', '--json', '--by-file', '--quiet', '--skip-uniqueness', ...files],
    cwd,
  );
  const parsed = JSON.parse(output) as ClocOutput;
  return { code: parsed.SUM?.code ?? 0, files: parsed.SUM?.nFiles ?? 0, byFile: parsed };
}

const tempRoot = await mkdtemp(join(tmpdir(), 'benchmark-code-lines-'));

try {
  const archivePath = join(tempRoot, 'benchmark.tar');
  run(
    [
      'git',
      'archive',
      '--format=tar',
      `--output=${archivePath}`,
      benchmarkCommit,
      '_starter',
      'ai-calorie-tracker',
      'ai-chat-app',
      'swift-rewrite',
    ],
    repoRoot,
  );
  run(['tar', '-xf', archivePath, '-C', tempRoot], repoRoot);

  const starterHashes = new Set(
    walk(join(tempRoot, '_starter', 'src')).filter(isSource).map(hashFile),
  );

  const rows = projects.map(project => {
    const projectPath = `${project.appDir}/${project.modelDir}`;
    const absoluteProjectPath = join(tempRoot, projectPath);
    const sourceRoots = ['src', 'app', 'widgets']
      .map(root => join(absoluteProjectPath, root))
      .filter(existsSync);
    const sourceFiles = sourceRoots.flatMap(root => walk(root)).filter(isSource);
    const excludedProductSpikes = sourceFiles.filter(path => isExcludedSpike(projectPath, path));
    const productFiles = sourceFiles.filter(
      path => !isTest(path) && !isExcludedSpike(projectPath, path),
    );
    const product = countWithCloc(productFiles, tempRoot);

    let starterFiles = 0;
    let starterSloc = 0;
    for (const file of productFiles) {
      if (!starterHashes.has(hashFile(file))) continue;
      const key = relative(tempRoot, file);
      const clocRow = product.byFile[file] ?? product.byFile[key];
      if (!clocRow) throw new Error(`cloc omitted ${key}`);
      starterFiles += 1;
      starterSloc += clocRow.code;
    }

    const testExtensions = /\.(ts|tsx|js|jsx|css|swift)$/;
    const testFiles = walk(absoluteProjectPath).filter(
      path => testExtensions.test(path) && isTest(path),
    );
    const tests = countWithCloc(testFiles, tempRoot);
    const spikeFiles = [
      ...excludedProductSpikes,
      ...walk(join(absoluteProjectPath, 'spikes')).filter(path => isSource(path) && !isTest(path)),
    ];
    const spikes = countWithCloc(spikeFiles, tempRoot);

    return {
      app: project.app,
      model: project.model,
      project: projectPath,
      finalAppSloc: product.code,
      starterAdjustedSloc: product.code - starterSloc,
      exactStarterSloc: starterSloc,
      testSloc: tests.code,
      excludedSpikeSloc: spikes.code,
      productFiles: product.files,
      testFiles: tests.files,
      exactStarterFiles: starterFiles,
    };
  });

  console.log(
    JSON.stringify(
      {
        benchmarkCommit,
        counter: 'cloc 2.06 code lines with --skip-uniqueness',
        sourceRoots: ['src', 'app', 'widgets'],
        excluded: [
          'tests from product SLOC',
          'generated native projects',
          'dependencies and build output',
          'assets, fixtures, configuration, scripts, and agent files',
          'explicit spike implementations from product SLOC',
          'root-level generated declarations',
        ],
        rows,
      },
      null,
      2,
    ),
  );
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
