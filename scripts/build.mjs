import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));

const dist = join(root, 'dist');
const zipName = `page-navigation-toolbar-v${version}.zip`;
const zipPath = join(dist, zipName);

mkdirSync(dist, { recursive: true });
if (existsSync(zipPath)) rmSync(zipPath);

const sevenZip = findSevenZip();
execFileSync(sevenZip, ['a', '-tzip', '-mx=9', zipPath, 'manifest.json', 'src', 'icons'], {
  cwd: root,
  stdio: 'inherit',
});

console.log(`Built ${zipName}`);

function findSevenZip() {
  const candidates = [
    'C:\\Program Files\\7-Zip\\7z.exe',
    'C:\\Program Files (x86)\\7-Zip\\7z.exe',
  ];
  return candidates.find((path) => existsSync(path)) ?? '7z';
}
