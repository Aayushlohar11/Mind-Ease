/**
 * Creates .env.local from .env.example for first-time setup
 */

import fs from 'fs'
import path from 'path'

const root = process.cwd()
const examplePath = path.join(root, '.env.example')
const localPath = path.join(root, '.env.local')

if (!fs.existsSync(examplePath)) {
  console.error('Missing .env.example')
  process.exit(1)
}

if (fs.existsSync(localPath)) {
  console.log('✓ .env.local already exists')
  console.log('  Edit it and set OPENAI_API_KEY=sk-your-key-here')
  console.log(`  Path: ${localPath}`)
  process.exit(0)
}

fs.copyFileSync(examplePath, localPath)

// Ensure OPENAI_API_KEY line is empty for easy paste
let content = fs.readFileSync(localPath, 'utf8')
content = content.replace(
  /OPENAI_API_KEY=.*/,
  'OPENAI_API_KEY='
)
fs.writeFileSync(localPath, content)

console.log('✓ Created .env.local')
console.log('')
console.log('  Next steps:')
console.log('  1. Open .env.local in your editor')
console.log('  2. Set OPENAI_API_KEY=sk-your-key-from-openai')
console.log('  3. Run: npm run dev')
console.log('')
console.log(`  File: ${localPath}`)
