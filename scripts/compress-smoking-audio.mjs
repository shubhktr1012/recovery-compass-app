import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..');
const inputDir = '/Users/shubh/Downloads/SMOKING SERIES';
const outputDir = path.join(repoRoot, 'documents', 'Sent By Anjan', 'program_audio', 'smoking_alcohol_quit');
const ffmpegPath = '/opt/homebrew/bin/ffmpeg';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function compressFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // -ac 1 converts stereo to mono, which halves file size for voice
    // -b:a 32k sets it to 32kbps, extremely lightweight and perfect for voice
    const process = spawn(ffmpegPath, [
      '-y',
      '-i', inputPath,
      '-codec:a', 'libmp3lame',
      '-b:a', '32k',
      '-ac', '1',
      outputPath
    ]);

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log(`Starting compression from: ${inputDir}`);
  console.log(`Saving to: ${outputDir}`);

  for (let day = 1; day <= 21; day++) {
    const filename = `DAY ${day}.mp3`;
    const inputPath = path.join(inputDir, filename);
    const outputPath = path.join(outputDir, `day-${day}.mp3`);

    if (!fs.existsSync(inputPath)) {
      console.warn(`[Warning] Input file not found: ${filename} (skipping)`);
      continue;
    }

    console.log(`[Processing] Compressing Day ${day}...`);
    try {
      const start = Date.now();
      await compressFile(inputPath, outputPath);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const originalSize = (fs.statSync(inputPath).size / 1024 / 1024).toFixed(2);
      const compressedSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
      console.log(`[Success] Day ${day} completed in ${elapsed}s: ${originalSize} MB -> ${compressedSize} MB`);
    } catch (err) {
      console.error(`[Error] Failed compressing Day ${day}:`, err.message);
    }
  }

  console.log('All compression tasks finished!');
}

main().catch(console.error);
