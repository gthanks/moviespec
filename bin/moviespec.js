#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import chalk from 'chalk';
import { Command } from 'commander';
import fg from 'fast-glob';
import YAML from 'yaml';

function toPosix(p) {
  return p.split(path.sep).join(path.posix.sep);
}

function fromGlobRelativePath(baseDir, relPosixPath) {
  return path.join(baseDir, ...String(relPosixPath).split('/'));
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function readYamlFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return YAML.parse(raw);
}

async function writeYamlFile(filePath, data) {
  const raw = YAML.stringify(data);
  await fs.writeFile(filePath, raw, 'utf8');
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function writeJsonFile(filePath, data) {
  const raw = JSON.stringify(data, null, 2) + '\n';
  await fs.writeFile(filePath, raw, 'utf8');
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

async function sha256Hex(str) {
  const crypto = await import('node:crypto');
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

async function loadMovieSpecSchema() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const schemaPath = path.resolve(here, '..', 'schema', 'moviespec.schema.yaml');
  return readYamlFile(schemaPath);
}

function resolveProjectRoot(projectRoot) {
  return path.resolve(projectRoot ?? process.cwd());
}

async function readProjectConfig(projectRoot, schema) {
  const configPath = path.join(projectRoot, schema.project?.config ?? 'config.yaml');
  if (!(await pathExists(configPath))) return null;
  return readYamlFile(configPath);
}

async function listTypes(schema) {
  return Object.keys(schema.types ?? {}).sort((a, b) => {
    const aStep = Number(schema.types?.[a]?.step ?? Number.MAX_SAFE_INTEGER);
    const bStep = Number(schema.types?.[b]?.step ?? Number.MAX_SAFE_INTEGER);
    if (aStep !== bStep) return aStep - bStep;
    return a.localeCompare(b);
  });
}

function getTypeStep(schema, typeId) {
  const step = schema.types?.[typeId]?.step;
  return Number.isFinite(step) ? Number(step) : null;
}

function formatStepNumber(step) {
  return String(step).padStart(2, '0');
}

function stripDocumentStepPrefix(name) {
  return String(name).replace(/^\d{2,3}[_-]+/, '');
}

function detectNewline(text) {
  return String(text).includes('\r\n') ? '\r\n' : '\n';
}

function buildDocumentFilename(schema, typeId, name, extension = '.md') {
  const normalizedName = stripDocumentStepPrefix(name);
  const step = getTypeStep(schema, typeId);
  const stepPrefix = step ? `${formatStepNumber(step)}_` : '';
  return `${stepPrefix}${normalizedName}${extension}`;
}

function injectDocumentStepMetadata(template, step) {
  if (!step) return template;

  const nl = detectNewline(template);
  const frontmatterStart = `---${nl}`;
  if (!template.startsWith(frontmatterStart)) return template;

  const frontmatterDelimiter = `${nl}---${nl}`;
  const frontmatterEnd = template.indexOf(frontmatterDelimiter, frontmatterStart.length);
  if (frontmatterEnd === -1) return template;

  const frontmatter = template.slice(frontmatterStart.length, frontmatterEnd);
  if (/^step:/m.test(frontmatter)) return template;

  const body = template.slice(frontmatterEnd + frontmatterDelimiter.length);
  const normalizedFrontmatter = frontmatter.endsWith(nl) ? frontmatter : `${frontmatter}${nl}`;
  return `---${nl}${normalizedFrontmatter}step: ${step}${nl}---${nl}${body}`;
}

function prefixDocumentHeadingWithStep(document, step) {
  if (!step) return document;

  const nl = detectNewline(document);
  const stepLabel = `${formatStepNumber(step)}. `;
  const frontmatterStart = `---${nl}`;
  const frontmatterDelimiter = `${nl}---${nl}`;
  const frontmatterEnd = document.startsWith(frontmatterStart)
    ? document.indexOf(frontmatterDelimiter, frontmatterStart.length)
    : -1;
  const bodyOffset = frontmatterEnd === -1 ? 0 : frontmatterEnd + frontmatterDelimiter.length;
  const body = document.slice(bodyOffset);

  return `${document.slice(0, bodyOffset)}${body.replace(/^#\s+/m, `# ${stepLabel}`)}`;
}

function defaultTypePath(schema, typeId) {
  const type = schema.types?.[typeId];
  if (!type) throw new Error(`Unknown type: ${typeId}`);
  return type.defaultPath;
}

async function cmdInit(projectRoot) {
  const schema = await loadMovieSpecSchema();
  const root = resolveProjectRoot(projectRoot);

  const dirs = [
    schema.project?.specsDir ?? 'specs',
    schema.project?.storyboardDir ?? 'storyboard',
    schema.project?.promptsDir ?? 'prompts',
    schema.project?.outputDir ?? 'output',
    path.join(schema.project?.outputDir ?? 'output', schema.project?.manifestsDir ?? 'manifests'),
    path.join(schema.project?.outputDir ?? 'output', schema.project?.shotsDir ?? 'shots')
  ];

  for (const d of dirs) {
    await ensureDir(path.join(root, d));
  }

  const typeDirs = new Set();
  for (const typeId of await listTypes(schema)) {
    typeDirs.add(defaultTypePath(schema, typeId));
  }

  for (const d of typeDirs) {
    await ensureDir(path.join(root, d));
  }

  const configPath = path.join(root, schema.project?.config ?? 'config.yaml');
  if (!(await pathExists(configPath))) {
    const defaultConfig = {
      moviespec_version: schema.version,
      documents: {
        language: schema.project?.documentLanguage ?? 'zh-CN',
        language_policy: schema.project?.documentLanguagePolicy ?? 'required'
      },
      media: {
        resolution: '1920x1080',
        aspect_ratio: '16:9',
        fps: 24
      },
      lora: {
        characters: {},
        styles: {}
      },
      backend: {
        id: 'stub'
      }
    };
    await writeYamlFile(configPath, defaultConfig);
  }

  console.log(chalk.green(`Initialized MovieSpec project at: ${root}`));

  try {
    const prompts = await import('@inquirer/prompts');
    const selectedAgents = await prompts.checkbox({
      message: 'Select AI agents to configure for this MovieSpec project:',
      choices: [
        { name: 'Cursor', value: 'cursor' },
        { name: 'Windsurf', value: 'windsurf' },
        { name: 'Antigravity', value: 'antigravity' }
      ]
    });

    if (selectedAgents.length > 0) {
      const here = path.dirname(fileURLToPath(import.meta.url));
      const templatesDir = path.resolve(here, '..', 'templates', 'agents');

      const agentFiles = {
        cursor: '.cursorrules',
        windsurf: '.windsurfrules',
        antigravity: 'AGENTS.md'
      };

      for (const agent of selectedAgents) {
        const sourceFile = path.join(templatesDir, `${agent}.md`);
        const targetFile = path.join(root, agentFiles[agent]);

        if (await pathExists(sourceFile)) {
          const content = await fs.readFile(sourceFile, 'utf8');
          await fs.writeFile(targetFile, content, 'utf8');
          console.log(chalk.blue(`Configured rules for ${agent}: ${agentFiles[agent]}`));
        } else {
          console.log(chalk.yellow(`Warning: Template for ${agent} not found at ${sourceFile}`));
        }
      }
    }
  } catch (err) {
    // If the prompt is cancelled or in non-interactive environment, just ignore safely
    if (err.name !== 'ExitPromptError') {
      console.log(chalk.yellow(`Could not run interactive agent setup: ${err.message}`));
    }
  }
}

async function cmdListTypes() {
  const schema = await loadMovieSpecSchema();
  const types = await listTypes(schema);
  for (const t of types) {
    const step = getTypeStep(schema, t);
    const desc = schema.types?.[t]?.description ?? '';
    const prefix = step ? `${formatStepNumber(step)}\t` : '';
    console.log(`${prefix}${t}${desc ? `\t${desc}` : ''}`);
  }
}

async function cmdListAesthetics() {
  const schema = await loadMovieSpecSchema();
  const aestheticsDirRel = schema.project?.aestheticsDir ?? 'templates/aesthetics';
  const here = path.dirname(fileURLToPath(import.meta.url));
  const aestheticsDirAbs = path.resolve(here, '..', aestheticsDirRel);

  if (!(await pathExists(aestheticsDirAbs))) {
    console.log(chalk.yellow('No aesthetics library found.'));
    return;
  }

  const files = await fg(['**/*.md', '**/*.yaml'], { cwd: aestheticsDirAbs, onlyFiles: true });
  if (files.length === 0) {
    console.log(chalk.yellow('Aesthetics library is empty.'));
    return;
  }

  console.log(chalk.cyan('Available Cinematic Aesthetics:'));

  const categories = {};
  for (const f of files) {
    const parts = f.split('/');
    const category = parts.length > 1 ? parts[0] : 'uncategorized';
    const name = path.parse(f).name;

    if (!categories[category]) categories[category] = [];
    categories[category].push(name);
  }

  for (const [category, names] of Object.entries(categories)) {
    console.log(`\n  [${chalk.yellow(category)}]`);
    for (const name of names) {
      console.log(`    - ${chalk.green(name)}`);
    }
  }
}

async function cmdApplyAesthetic(aestheticName, { projectRoot }) {
  const schema = await loadMovieSpecSchema();
  const root = resolveProjectRoot(projectRoot);
  const normalizedAestheticName = stripDocumentStepPrefix(aestheticName);

  const aestheticsDirRel = schema.project?.aestheticsDir ?? 'templates/aesthetics';
  const here = path.dirname(fileURLToPath(import.meta.url));
  const aestheticsDirAbs = path.resolve(here, '..', aestheticsDirRel);

  // Search recursively for the aesthetic name
  const files = await fg([`**/${normalizedAestheticName}.md`, `**/${normalizedAestheticName}.yaml`], { cwd: aestheticsDirAbs, onlyFiles: true });

  if (files.length === 0) {
    throw new Error(`Aesthetic template '${normalizedAestheticName}' not found in library.`);
  }

  if (files.length > 1) {
    console.log(chalk.yellow(`Warning: Multiple aesthetic templates found named '${normalizedAestheticName}'. Using the first one: ${files[0]}`));
  }

  const sourceTemplate = path.join(aestheticsDirAbs, files[0]);

  const targetRel = defaultTypePath(schema, 'visual_style');
  const targetDir = path.join(root, targetRel);
  await ensureDir(targetDir);

  const ext = path.extname(sourceTemplate);
  const targetPath = path.join(targetDir, buildDocumentFilename(schema, 'visual_style', normalizedAestheticName, ext));
  const legacyTargetPath = path.join(targetDir, `${normalizedAestheticName}${ext}`);

  if ((await pathExists(targetPath)) || (await pathExists(legacyTargetPath))) {
    throw new Error(`File already exists: ${targetPath}`);
  }

  const step = getTypeStep(schema, 'visual_style');
  const content = await fs.readFile(sourceTemplate, 'utf8');
  const rendered = prefixDocumentHeadingWithStep(injectDocumentStepMetadata(content, step), step);
  await fs.writeFile(targetPath, rendered, 'utf8');
  console.log(chalk.green(`Applied cinematic aesthetic '${normalizedAestheticName}' to: ${toPosix(path.relative(root, targetPath))}`));
}

async function cmdNew(typeId, name, { projectRoot }) {
  const schema = await loadMovieSpecSchema();
  const root = resolveProjectRoot(projectRoot);

  const templateRel = schema.types?.[typeId]?.template;
  if (!templateRel) throw new Error(`Unknown type or missing template: ${typeId}`);
  const here = path.dirname(fileURLToPath(import.meta.url));
  const templateAbs = path.resolve(here, '..', templateRel);

  const targetRel = defaultTypePath(schema, typeId);
  const targetDir = path.join(root, targetRel);
  await ensureDir(targetDir);

  const normalizedName = stripDocumentStepPrefix(name);
  const step = getTypeStep(schema, typeId);
  const filename = buildDocumentFilename(schema, typeId, normalizedName);
  const targetPath = path.join(targetDir, filename);
  const legacyTargetPath = path.join(targetDir, `${normalizedName}.md`);
  if ((await pathExists(targetPath)) || (await pathExists(legacyTargetPath))) throw new Error(`File already exists: ${targetPath}`);

  const template = await fs.readFile(templateAbs, 'utf8');
  const renderedTemplate = template
    .replaceAll('{{name}}', normalizedName)
    .replaceAll('{{type}}', typeId);
  const rendered = prefixDocumentHeadingWithStep(
    injectDocumentStepMetadata(renderedTemplate, step),
    step
  );

  await fs.writeFile(targetPath, rendered, 'utf8');
  console.log(chalk.green(`Created ${typeId}: ${toPosix(path.relative(root, targetPath))}`));
}

async function cmdMigrate({ projectRoot, apply, renameFiles }) {
  const schema = await loadMovieSpecSchema();
  const root = resolveProjectRoot(projectRoot);
  const specsDirRel = schema.project?.specsDir ?? 'specs';

  const moveOps = [];
  for (const typeId of await listTypes(schema)) {
    const legacyRel = path.join(specsDirRel, typeId);
    const legacyAbs = path.join(root, legacyRel);
    const targetRel = defaultTypePath(schema, typeId);
    const targetAbs = path.join(root, targetRel);

    if (!(await pathExists(legacyAbs))) continue;

    if (await pathExists(targetAbs)) {
      console.log(
        chalk.yellow(
          `Skip (target exists): ${toPosix(path.relative(root, legacyAbs))} -> ${toPosix(path.relative(root, targetAbs))}`
        )
      );
      continue;
    }

    moveOps.push({ typeId, legacyRel, legacyAbs, targetRel, targetAbs });
  }

  const renameOps = [];
  if (renameFiles) {
    for (const typeId of await listTypes(schema)) {
      const typeDirRel = defaultTypePath(schema, typeId);
      const typeDirAbs = path.join(root, typeDirRel);
      if (!(await pathExists(typeDirAbs))) continue;

      const files = await fg(['**/*.md', '**/*.yaml', '**/*.yml', '**/*.json'], {
        cwd: typeDirAbs,
        dot: false,
        onlyFiles: true,
        suppressErrors: true
      });

      for (const f of files) {
        const parsed = path.posix.parse(f);
        if (/^\d{2,3}[_-]+/.test(parsed.name)) continue;

        const ext = parsed.ext || '';
        const nextBase = buildDocumentFilename(schema, typeId, parsed.name, ext);
        const nextRelPosix = parsed.dir ? `${parsed.dir}/${nextBase}` : nextBase;
        if (nextRelPosix === f) continue;

        const fromAbs = fromGlobRelativePath(typeDirAbs, f);
        const toAbs = fromGlobRelativePath(typeDirAbs, nextRelPosix);
        if (await pathExists(toAbs)) {
          console.log(
            chalk.yellow(
              `Skip (target exists): ${toPosix(path.relative(root, fromAbs))} -> ${toPosix(path.relative(root, toAbs))}`
            )
          );
          continue;
        }

        renameOps.push({ typeId, fromAbs, toAbs });
      }
    }
  }

  if (moveOps.length === 0 && renameOps.length === 0) {
    console.log(chalk.green('No migrations needed.'));
    return;
  }

  const header = apply ? 'Planned migrations (apply):' : 'Planned migrations (dry-run):';
  console.log(chalk.cyan(header));

  for (const op of moveOps) {
    console.log(`  MOVE  ${toPosix(op.legacyRel)} -> ${toPosix(op.targetRel)}`);
  }

  for (const op of renameOps) {
    console.log(`  RENAME ${toPosix(path.relative(root, op.fromAbs))} -> ${toPosix(path.relative(root, op.toAbs))}`);
  }

  if (!apply) {
    console.log(chalk.yellow('Dry-run only. Re-run with --apply to perform changes.'));
    return;
  }

  for (const op of moveOps) {
    await ensureDir(path.dirname(op.targetAbs));
    await fs.rename(op.legacyAbs, op.targetAbs);
  }

  for (const op of renameOps) {
    await fs.rename(op.fromAbs, op.toAbs);
  }

  console.log(chalk.green('Migration completed.'));
}

async function readAllSpecInputs(projectRoot, schema) {
  const root = resolveProjectRoot(projectRoot);
  const specsRoot = path.join(root, schema.project?.specsDir ?? 'specs');

  const inputs = {};
  for (const typeId of await listTypes(schema)) {
    const rel = defaultTypePath(schema, typeId);
    const abs = path.join(root, rel);
    const files = await fg(['**/*.md', '**/*.yaml', '**/*.yml', '**/*.json'], { cwd: abs, dot: false, onlyFiles: true, suppressErrors: true });
    inputs[typeId] = {
      baseDir: abs,
      files: files.map((f) => path.join(abs, f))
    };
  }

  const storyboardDir = path.join(root, schema.project?.storyboardDir ?? 'storyboard');
  const storyboardFiles = await fg(['**/*.yaml', '**/*.yml', '**/*.json'], { cwd: storyboardDir, dot: false, onlyFiles: true, suppressErrors: true });

  return {
    root,
    specsRoot,
    storyboardDir,
    storyboardFiles: storyboardFiles.map((f) => path.join(storyboardDir, f)),
    inputs
  };
}

async function readStoryboardShots(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return readJsonFile(filePath);
  return readYamlFile(filePath);
}

function normalizeShots(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.shots)) return data.shots;
  return [];
}

function buildPromptParts({ shot, config }) {
  const parts = [];
  if (shot?.prompt?.positive) parts.push(String(shot.prompt.positive));
  if (shot?.action) parts.push(String(shot.action));
  if (shot?.scene) parts.push(String(shot.scene));
  if (shot?.composition) parts.push(String(shot.composition));

  if (config?.media?.resolution) parts.push(`resolution:${config.media.resolution}`);
  if (config?.media?.aspect_ratio) parts.push(`aspect_ratio:${config.media.aspect_ratio}`);
  if (typeof config?.media?.fps !== 'undefined') parts.push(`fps:${config.media.fps}`);

  return parts.filter(Boolean);
}

async function cmdCompilePrompts({ shots, projectRoot }) {
  const schema = await loadMovieSpecSchema();
  const root = resolveProjectRoot(projectRoot);
  const config = await readProjectConfig(root, schema);
  if (!config) throw new Error(`Missing config file: ${path.join(root, schema.project?.config ?? 'config.yaml')}`);

  const storyboardPath = path.resolve(root, shots);
  const storyboardData = await readStoryboardShots(storyboardPath);
  const shotList = normalizeShots(storyboardData);

  const promptsDir = path.join(root, schema.project?.promptsDir ?? 'prompts');
  await ensureDir(promptsDir);

  const context = await readAllSpecInputs(root, schema);
  const depFingerprints = {};
  for (const [typeId, info] of Object.entries(context.inputs)) {
    const hashes = [];
    for (const f of info.files) {
      const raw = await fs.readFile(f, 'utf8');
      hashes.push(await sha256Hex(raw));
    }
    depFingerprints[typeId] = await sha256Hex(stableStringify(hashes.sort()));
  }

  const compiled = [];
  for (const s of shotList) {
    const shotId = s.id ?? s.shot_id;
    if (!shotId) throw new Error('Each shot must have an id (id or shot_id)');

    const mergedMedia = {
      resolution: s.media?.resolution ?? config.media?.resolution,
      aspect_ratio: s.media?.aspect_ratio ?? config.media?.aspect_ratio,
      fps: typeof s.media?.fps !== 'undefined' ? s.media.fps : config.media?.fps
    };

    const promptParts = buildPromptParts({ shot: s, config: { ...config, media: mergedMedia } });
    const positive = promptParts.join(', ');
    const negative = (s.prompt?.negative ?? '').toString();

    const out = {
      shot_id: shotId,
      prompt: {
        positive,
        negative
      },
      media: mergedMedia,
      deps: depFingerprints
    };

    compiled.push(out);
    await writeJsonFile(path.join(promptsDir, `${shotId}.prompt.json`), out);
  }

  console.log(chalk.green(`Compiled ${compiled.length} shot prompt(s) to ${toPosix(path.relative(root, promptsDir))}`));
}

async function cmdValidate({ projectRoot, shots }) {
  const schema = await loadMovieSpecSchema();
  const root = resolveProjectRoot(projectRoot);

  const configPath = path.join(root, schema.project?.config ?? 'config.yaml');
  if (!(await pathExists(configPath))) throw new Error(`Missing config file: ${configPath}`);

  const config = await readProjectConfig(root, schema);
  if (!config?.moviespec_version) throw new Error('config.yaml missing moviespec_version');

  const context = await readAllSpecInputs(root, schema);

  const currentDepFingerprints = {};
  for (const [typeId, info] of Object.entries(context.inputs)) {
    const hashes = [];
    for (const f of info.files) {
      const raw = await fs.readFile(f, 'utf8');
      hashes.push(await sha256Hex(raw));
    }
    currentDepFingerprints[typeId] = await sha256Hex(stableStringify(hashes.sort()));
  }

  const storyboardPath = shots ? path.resolve(root, shots) : null;
  if (storyboardPath) {
    if (!(await pathExists(storyboardPath))) throw new Error(`Shots file not found: ${storyboardPath}`);

    const data = await readStoryboardShots(storyboardPath);
    const shotList = normalizeShots(data);

    const characterDirRel = defaultTypePath(schema, 'characters');
    const characterDirAbs = path.join(root, characterDirRel);
    const characterFiles = await fg(['**/*.md', '**/*.yaml', '**/*.yml', '**/*.json'], { cwd: characterDirAbs, onlyFiles: true, suppressErrors: true });
    const characterNames = new Set(characterFiles.map((f) => stripDocumentStepPrefix(path.parse(f).name)));

    for (const s of shotList) {
      const shotId = s.id ?? s.shot_id ?? '(unknown)';
      const roles = Array.isArray(s.characters) ? s.characters : [];
      for (const r of roles) {
        if (!characterNames.has(String(r))) {
          throw new Error(`Storyboard shot ${shotId} references missing character: ${r}`);
        }
      }
    }

    const promptsDir = path.join(root, schema.project?.promptsDir ?? 'prompts');
    const dirty = [];
    for (const s of shotList) {
      const shotId = s.id ?? s.shot_id;
      if (!shotId) continue;
      const promptPath = path.join(promptsDir, `${shotId}.prompt.json`);
      if (!(await pathExists(promptPath))) continue;
      const compiled = await readJsonFile(promptPath);
      const previousDeps = compiled?.deps ?? {};
      if (stableStringify(previousDeps) !== stableStringify(currentDepFingerprints)) {
        dirty.push(String(shotId));
      }
    }
    if (dirty.length > 0) {
      console.log(chalk.yellow(`Out-of-sync/Dirty shots detected: ${dirty.join(', ')}`));
      console.log(chalk.yellow('Re-run compile-prompts (and re-generate if needed).'));
    }
  }

  const requiredDirs = [
    schema.project?.specsDir ?? 'specs',
    schema.project?.storyboardDir ?? 'storyboard',
    schema.project?.promptsDir ?? 'prompts',
    schema.project?.outputDir ?? 'output'
  ];

  for (const d of requiredDirs) {
    if (!(await pathExists(path.join(root, d)))) {
      throw new Error(`Missing required directory: ${path.join(root, d)}`);
    }
  }

  console.log(chalk.green('Validation passed (dry-run).'));
}

async function cmdGenerateImage({ projectRoot, shot }) {
  const schema = await loadMovieSpecSchema();
  const root = resolveProjectRoot(projectRoot);
  const config = await readProjectConfig(root, schema);
  if (!config) throw new Error('Missing config.yaml');

  const promptsDir = path.join(root, schema.project?.promptsDir ?? 'prompts');
  const promptPath = path.join(promptsDir, `${shot}.prompt.json`);
  if (!(await pathExists(promptPath))) {
    throw new Error(`Missing compiled prompt for shot ${shot}. Run compile-prompts first.`);
  }

  const compiled = await readJsonFile(promptPath);

  const outputRoot = path.join(root, schema.project?.outputDir ?? 'output');
  const shotsDir = path.join(outputRoot, schema.project?.shotsDir ?? 'shots');
  await ensureDir(shotsDir);

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const shotRunDir = path.join(shotsDir, String(shot), `run_${runId}`);
  await ensureDir(shotRunDir);

  const manifest = {
    shot_id: shot,
    backend: config.backend ?? { id: 'stub' },
    tool: { id: 'moviespec', version: '0.1.0' },
    created_at: new Date().toISOString(),
    prompt: compiled.prompt,
    media: compiled.media,
    deps: compiled.deps,
    lora: config.lora ?? { characters: {}, styles: {} },
    outputs: {
      placeholder: 'stub'
    }
  };

  await writeJsonFile(path.join(shotRunDir, 'manifest.json'), manifest);
  await fs.writeFile(path.join(shotRunDir, 'OUTPUT_STUB.txt'), 'stub output\n', 'utf8');

  console.log(chalk.green(`Generated stub output for shot ${shot}: ${toPosix(path.relative(root, shotRunDir))}`));
}

async function cmdGenerateSequence({ projectRoot, shots }) {
  const schema = await loadMovieSpecSchema();
  const root = resolveProjectRoot(projectRoot);
  const storyboardPath = path.resolve(root, shots);
  if (!(await pathExists(storyboardPath))) throw new Error(`Shots file not found: ${storyboardPath}`);

  const data = await readStoryboardShots(storyboardPath);
  const shotList = normalizeShots(data);
  let count = 0;
  for (const s of shotList) {
    const shotId = s.id ?? s.shot_id;
    if (!shotId) continue;
    await cmdGenerateImage({ projectRoot: root, shot: String(shotId) });
    count += 1;
  }
  console.log(chalk.green(`Generated stub sequence for ${count} shot(s).`));
}

const program = new Command();
program.name('moviespec').description('MovieSpec CLI').version('0.1.0');

program
  .command('init')
  .option('-C, --project-root <path>', 'Project root (default: cwd)')
  .action(async (opts) => {
    await cmdInit(opts.projectRoot);
  });

program
  .command('list')
  .description('List resources')
  .command('types')
  .action(async () => {
    await cmdListTypes();
  });

program
  .command('list-aesthetics')
  .description('List available cinematic aesthetics templates')
  .action(async () => {
    await cmdListAesthetics();
  });

program
  .command('apply')
  .description('Apply a cinematic aesthetic template to your project')
  .argument('<aesthetic_name>', 'Name of the aesthetic template')
  .option('-C, --project-root <path>', 'Project root (default: cwd)')
  .action(async (name, opts) => {
    await cmdApplyAesthetic(name, { projectRoot: opts.projectRoot });
  });

program
  .command('new')
  .argument('<type>', 'Type id')
  .argument('<name>', 'Document name')
  .option('-C, --project-root <path>', 'Project root (default: cwd)')
  .action(async (type, name, opts) => {
    await cmdNew(type, name, { projectRoot: opts.projectRoot });
  });

program
  .command('migrate')
  .description('Migrate legacy specs directory structure to step-numbered paths')
  .option('-C, --project-root <path>', 'Project root (default: cwd)')
  .option('--apply', 'Apply changes (default: dry-run)')
  .option('--rename-files', 'Also rename spec files to step-prefixed names')
  .action(async (opts) => {
    await cmdMigrate({
      projectRoot: opts.projectRoot,
      apply: Boolean(opts.apply),
      renameFiles: Boolean(opts.renameFiles)
    });
  });

program
  .command('compile-prompts')
  .requiredOption('--shots <file>', 'Storyboard shots file (yaml/json)')
  .option('-C, --project-root <path>', 'Project root (default: cwd)')
  .action(async (opts) => {
    await cmdCompilePrompts({ shots: opts.shots, projectRoot: opts.projectRoot });
  });

program
  .command('validate')
  .option('--shots <file>', 'Storyboard shots file (optional)')
  .option('-C, --project-root <path>', 'Project root (default: cwd)')
  .action(async (opts) => {
    await cmdValidate({ projectRoot: opts.projectRoot, shots: opts.shots });
  });

program
  .command('check')
  .option('--shots <file>', 'Storyboard shots file (optional)')
  .option('-C, --project-root <path>', 'Project root (default: cwd)')
  .action(async (opts) => {
    await cmdValidate({ projectRoot: opts.projectRoot, shots: opts.shots });
  });

const generate = program.command('generate').description('Generate assets');

generate
  .command('image')
  .requiredOption('--shot <id>', 'Shot id')
  .option('-C, --project-root <path>', 'Project root (default: cwd)')
  .action(async (opts) => {
    await cmdGenerateImage({ projectRoot: opts.projectRoot, shot: opts.shot });
  });

generate
  .command('sequence')
  .requiredOption('--shots <file>', 'Storyboard shots file (yaml/json)')
  .option('-C, --project-root <path>', 'Project root (default: cwd)')
  .action(async (opts) => {
    await cmdGenerateSequence({ projectRoot: opts.projectRoot, shots: opts.shots });
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red(err?.message ?? String(err)));
  process.exitCode = 1;
});
