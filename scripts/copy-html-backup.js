import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, 'dist', 'client', 'index.html');
const destPath = path.join(projectRoot, 'dist', 'client', 'index.html.bak');

try {
  fs.copyFileSync(sourcePath, destPath);
} catch (error) {
  // Best-effort backup; don't fail builds if dist/client doesn't exist yet.
}
