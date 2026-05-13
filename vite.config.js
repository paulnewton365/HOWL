import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'

// Build-time version metadata. We compute these here rather than reading
// package.json at runtime so the values are baked into the bundle and stay
// stable for that specific build artifact.
//   - __APP_VERSION__   : whatever is in package.json after the prebuild
//                          bump script runs (MAJOR.MINOR.PATCH).
//   - __BUILD_DATE__    : the date the build ran, in YYYY-MM-DD format.
//                          Guarantees the build badge looks different even
//                          across identical re-deploys.
//   - __BUILD_SHA__     : short git commit SHA if Vercel exposes one,
//                          otherwise 'local'. Useful for tracing prod
//                          builds back to commits.
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
const buildDate = new Date().toISOString().slice(0, 10)
const buildSha =
  (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || 'local'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(buildDate),
    __BUILD_SHA__: JSON.stringify(buildSha),
  },
})
