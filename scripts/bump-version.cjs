// scripts/bump-version.cjs
// Auto-increments the patch version in package.json before each build.
// Runs as a `prebuild` hook on `npm run build` (locally and on Vercel).
//
// Format: MAJOR.MINOR.PATCH — only PATCH is auto-incremented.
// Bump MAJOR or MINOR manually in package.json when shipping a meaningful release.

const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const parts = String(pkg.version || '').split('.').map(Number);
if (parts.length !== 3 || parts.some(Number.isNaN)) {
  console.error(`✗ Invalid version in package.json: "${pkg.version}". Expected MAJOR.MINOR.PATCH.`);
  process.exit(1);
}

const [major, minor, patch] = parts;
const next = `${major}.${minor}.${patch + 1}`;
pkg.version = next;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`✓ Bumped HOWL READ to v${next}`);
