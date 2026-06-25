import { readFile } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..');
const bucketName = 'program-audio';

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

async function main() {
  const { url, serviceRoleKey } = resolveSupabaseConfig();
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sourceDir = path.join(repoRoot, 'documents', 'Sent By Anjan', 'program_audio', 'smoking_alcohol_quit');

  if (!fs.existsSync(sourceDir)) {
    console.error(`Error: Local source folder not found at: ${sourceDir}`);
    console.error('Please make sure the compressed day-1.mp3 to day-21.mp3 files are placed in this folder.');
    process.exit(1);
  }

  const upload = async (storagePath, bytes) => {
    const { error } = await supabase.storage.from(bucketName).upload(storagePath, bytes, {
      contentType: 'audio/mpeg',
      upsert: true,
    });
    if (error) {
      throw new Error(`Upload failed for ${storagePath}: ${error.message}`);
    }
  };

  console.log(`Starting sync from: ${sourceDir}`);
  console.log(`Target bucket: ${bucketName}/smoking_alcohol_quit/`);

  let successCount = 0;
  let missingCount = 0;

  for (let day = 1; day <= 21; day += 1) {
    const filename = `day-${day}.mp3`;
    const localFilePath = path.join(sourceDir, filename);
    const storagePath = `smoking_alcohol_quit/${filename}`;

    if (!fs.existsSync(localFilePath)) {
      console.warn(`[Warning] Local file not found: ${filename} (skipping)`);
      missingCount += 1;
      continue;
    }

    try {
      const bytes = await readFile(localFilePath);
      
      // 1. Upload to 21-day program path
      await upload(storagePath, bytes);

      // 2. Also upload to 90-day program canonical path (first 21 days)
      const canonical90DayPath = `ninety_day_transform/${filename}`;
      await upload(canonical90DayPath, bytes);

      // 3. Also upload to 90-day program legacy path (first 21 days)
      const legacy90DayPath = `ninety-day/day-${String(day).padStart(3, '0')}.mp3`;
      await upload(legacy90DayPath, bytes);

      console.log(`[Success] Uploaded ${filename} -> 3 paths (${(bytes.length / 1024 / 1024).toFixed(2)} MB)`);
      successCount += 1;
    } catch (err) {
      console.error(`[Error] Failed uploading ${filename}:`, err.message);
    }
  }

  console.log('\n--- Sync Summary ---');
  console.log(`Successfully uploaded: ${successCount} files`);
  console.log(`Skipped (missing locally): ${missingCount} files`);
}

await main();
