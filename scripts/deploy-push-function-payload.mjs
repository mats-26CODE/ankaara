import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const files = [
  'supabase/functions/send-push-notification/index.ts',
  'supabase/functions/_shared/expo-push.ts',
  'supabase/functions/_shared/format-money-amount-for-sms.ts',
].map((relativePath) => ({
  name: relativePath.replace(/\\/g, '/'),
  content: fs.readFileSync(path.join(root, relativePath), 'utf8'),
}));

const payload = {
  project_id: 'rtpgpoodjfutanpwhaok',
  name: 'send-push-notification',
  entrypoint_path: 'supabase/functions/send-push-notification/index.ts',
  verify_jwt: false,
  files,
};

process.stdout.write(JSON.stringify(payload));
