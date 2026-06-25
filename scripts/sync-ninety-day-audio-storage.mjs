import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..');
const bucketName = 'program-audio';
const ffmpegPath = '/opt/homebrew/bin/ffmpeg';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const equalsIndex = line.indexOf('=');
    if (equalsIndex <= 0) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function resolveSupabaseConfig() {
  loadEnvFile(path.join(appRoot, '.env.local'));
  loadEnvFile(path.join(repoRoot, 'web', '.env.local'));
  loadEnvFile(path.join(appRoot, '.env'));
  loadEnvFile(path.join(repoRoot, 'web', '.env'));

  const url =
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Missing Supabase URL. Set EXPO_PUBLIC_SUPABASE_URL or SUPABASE_URL.');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  return { url, serviceRoleKey };
}

function makePlaceholderMp3() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ninety-day-audio-'));
  const outputPath = path.join(tempDir, 'placeholder.mp3');

  const result = spawnSync(
    ffmpegPath,
    [
      '-f',
      'lavfi',
      '-i',
      'anullsrc=r=44100:cl=mono',
      '-t',
      '1',
      '-q:a',
      '9',
      '-acodec',
      'libmp3lame',
      outputPath,
    ],
    { stdio: 'inherit' }
  );

  if (result.status !== 0) {
    throw new Error('ffmpeg failed to create the placeholder MP3.');
  }

  return { tempDir, outputPath };
}

async function main() {
  const { url, serviceRoleKey } = resolveSupabaseConfig();
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sourceDir = path.join(repoRoot, 'ninety_day_transform');
  const placeholder = makePlaceholderMp3();
  const placeholderBytes = await readFile(placeholder.outputPath);

  const upload = async (storagePath, bytes) => {
    const { error } = await supabase.storage.from(bucketName).upload(storagePath, bytes, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

    if (error) {
      throw new Error(`Upload failed for ${storagePath}: ${error.message}`);
    }
  };

  try {
    for (let day = 1; day <= 90; day += 1) {
      const localFilePath = path.join(sourceDir, `day-${day}.mp3`);
      let bytes = placeholderBytes;
      let sourceLabel = 'placeholder';

      try {
        bytes = await readFile(localFilePath);
        sourceLabel = `day-${day}.mp3`;
      } catch {
        // Keep the placeholder for days that do not exist yet.
      }

      const canonicalPath = `ninety_day_transform/day-${day}.mp3`;
      const legacyPath = `ninety-day/day-${String(day).padStart(3, '0')}.mp3`;

      await upload(legacyPath, bytes);
      await upload(canonicalPath, bytes);

      console.log(`[${day}/90] uploaded ${sourceLabel} -> ${legacyPath} and ${canonicalPath}`);
    }
  } finally {
    await rm(placeholder.tempDir, { recursive: true, force: true });
  }
}

await main();
