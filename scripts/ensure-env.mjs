import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

const exists = (relativePath) => fs.existsSync(path.join(projectRoot, relativePath));

const copyFile = (fromRel, toRel) => {
  const fromAbs = path.join(projectRoot, fromRel);
  const toAbs = path.join(projectRoot, toRel);
  fs.copyFileSync(fromAbs, toAbs);
};

const ensureAnyEnvPresent = ({ label, candidates, example }) => {
  const hasAny = candidates.some((p) => exists(p));
  if (hasAny) return true;

  const exampleExists = example && exists(example);

  console.error(`[env] Missing ${label}. Looked for: ${candidates.join(', ')}`);

  if (exampleExists) {
    const target = candidates[0];
    copyFile(example, target);
    console.error(`[env] Created ${target} from ${example}. Please fill in real values, then re-run.`);
  } else {
    console.error(`[env] No example file found at ${example}. Create one of: ${candidates.join(', ')}`);
  }

  return false;
};

const ok = ensureAnyEnvPresent({
  label: 'admin env file',
  candidates: ['.env', '.env.production', '.env.local', '.env.production.local'],
  example: '.env.example'
});

if (!ok) {
  process.exit(1);
}

console.log('[env] OK');
