import { SignJWT, importPKCS8 } from 'jose';
import fs from 'node:fs/promises';

/**
 * Fill these 4 values before running:
 * - TEAM_ID: Apple Developer Team ID
 * - KEY_ID: Apple key ID (from Keys page)
 * - CLIENT_ID: Apple Service ID (Identifier), e.g. com.recoverycompass.app.auth
 * - PRIVATE_KEY_PATH: absolute or relative path to your downloaded .p8 file
 */
const TEAM_ID = 'HV9K32995S';
const KEY_ID = '576KVM7YXL';
const CLIENT_ID = 'com.recoverycompass.app.auth';
const PRIVATE_KEY_PATH = '/Users/shubh/Development/recovery-compass/documents/AuthKey_576KVM7YXL.p8';

async function main() {
  if (
    TEAM_ID.startsWith('REPLACE_') ||
    KEY_ID.startsWith('REPLACE_') ||
    CLIENT_ID.startsWith('REPLACE_') ||
    PRIVATE_KEY_PATH.includes('REPLACE_')
  ) {
    throw new Error('Please update TEAM_ID, KEY_ID, CLIENT_ID, and PRIVATE_KEY_PATH in scripts/generate-apple-client-secret.mjs');
  }

  const privateKeyPem = await fs.readFile(PRIVATE_KEY_PATH, 'utf8');
  const privateKey = await importPKCS8(privateKeyPem, 'ES256');

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24 * 180; // 180 days (Apple max)

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: KEY_ID })
    .setIssuer(TEAM_ID)
    .setSubject(CLIENT_ID)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(privateKey);

  console.log('\nAPPLE_CLIENT_SECRET\n');
  console.log(jwt);
  console.log('\nCopy this value into Supabase -> Auth -> Providers -> Apple -> Secret Key (for OAuth).\n');
}

main().catch((err) => {
  console.error('Failed to generate Apple client secret:', err.message);
  process.exit(1);
});
