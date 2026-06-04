const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', '.expo', 'dist', 'build', 'out',
  '.turbo', '.cache', 'coverage', '.vercel', 'android', 'ios',
  'public', '.claude', 'memory', 'scripts',
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.eslintrc') continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (EXTS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function strip(src) {
  let out = '';
  let i = 0;
  const n = src.length;

  let inSingle = false;
  let inDouble = false;
  let inTpl = 0;
  const tplBraceStack = [];

  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];

    if (inSingle) {
      out += c;
      if (c === '\\' && i + 1 < n) { out += src[++i]; i++; continue; }
      if (c === "'") inSingle = false;
      i++; continue;
    }
    if (inDouble) {
      out += c;
      if (c === '\\' && i + 1 < n) { out += src[++i]; i++; continue; }
      if (c === '"') inDouble = false;
      i++; continue;
    }
    if (inTpl > 0) {
      if (c === '\\' && i + 1 < n) { out += c + src[++i]; i++; continue; }
      if (c === '`') { out += c; inTpl--; i++; continue; }
      if (c === '$' && c2 === '{') {
        out += '${';
        tplBraceStack.push(inTpl);
        inTpl = 0;
        i += 2;
        continue;
      }
      out += c; i++; continue;
    }

    if (c === '}' && tplBraceStack.length) {
      const open = countBraces(out);
      if (open <= tplBraceStack[tplBraceStack.length - 1].open) {
      }
    }

    if (c === '/' && c2 === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && c2 === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    if (c === "'") { inSingle = true; out += c; i++; continue; }
    if (c === '"') { inDouble = true; out += c; i++; continue; }
    if (c === '`') { inTpl++; out += c; i++; continue; }

    out += c; i++;
  }

  out = out.replace(/\{\s*\}\s*\n/g, (m, off, full) => {
    return m;
  });

  out = out.replace(/[ \t]+\n/g, '\n');
  out = out.replace(/\n{3,}/g, '\n\n');

  return out;
}

function countBraces(s) {
  let open = 0;
  for (const ch of s) if (ch === '{') open++; else if (ch === '}') open--;
  return open;
}

const files = walk(ROOT);
let changed = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const out = strip(src);
  if (out !== src) {
    fs.writeFileSync(f, out, 'utf8');
    changed++;
  }
}
console.log(`Stripped comments in ${changed}/${files.length} files`);
