/**
 * Fails if built JS contains secret key patterns (run after npm run build).
 */
import fs from 'fs'
import path from 'path'

const dist = path.resolve('dist')
// Firebase uses AIzaSy… in the client by design — not scanned here.
const patterns = [
  /nvapi-[A-Za-z0-9_-]{20,}/,
  /gsk_[A-Za-z0-9]{20,}/,
  /Secret[A-Za-z0-9]{10,}/,
]

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p, files)
    else if (p.endsWith('.js')) files.push(p)
  }
  return files
}

const hits = []
for (const file of walk(dist)) {
  const text = fs.readFileSync(file, 'utf8')
  for (const re of patterns) {
    if (re.test(text)) hits.push({ file, pattern: re.source })
  }
}

if (hits.length) {
  console.error('❌ Possible secrets in client bundle:')
  hits.forEach((h) => console.error(`  ${h.file} (${h.pattern})`))
  process.exit(1)
}

console.log('✓ No obvious API secrets in dist/')
