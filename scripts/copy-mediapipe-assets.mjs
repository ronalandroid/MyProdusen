#!/usr/bin/env node
/**
 * Copy the @mediapipe/tasks-vision wasm runtime from node_modules into
 * public/ so the face detector loads it same-origin. Loading it from
 * cdn.jsdelivr.net violates the production CSP (script-src 'self' …), which
 * silently disabled liveness everywhere. Runs via the prebuild/predev npm
 * hooks; public/mediapipe is gitignored (generated, ~32MB).
 */
import { cpSync, existsSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const dest = join(root, 'public', 'mediapipe', 'wasm');

if (!existsSync(src)) {
  console.error('[mediapipe-assets] @mediapipe/tasks-vision not installed; run npm ci first.');
  process.exit(1);
}

const isFresh = (file) => {
  const from = join(src, file);
  const to = join(dest, file);
  return existsSync(to) && statSync(to).size === statSync(from).size;
};

const files = readdirSync(src);
if (files.every(isFresh)) {
  console.log(`[mediapipe-assets] up to date (${files.length} files in public/mediapipe/wasm)`);
} else {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[mediapipe-assets] copied ${files.length} files to public/mediapipe/wasm`);
}
