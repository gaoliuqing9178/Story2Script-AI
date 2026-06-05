import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const logFile = process.argv[2] ?? resolve(process.cwd(), 'logs/server-dev.jsonl');
const limit = Number.parseInt(process.argv[3] ?? '40', 10);

if (!existsSync(logFile)) {
  console.log(`No dev log file found at ${logFile}`);
  process.exit(0);
}

const lines = readFileSync(logFile, 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .slice(-limit);

for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    console.log(JSON.stringify(entry, null, 2));
  } catch {
    console.log(line);
  }
}
