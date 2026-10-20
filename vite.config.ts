import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'

function commit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}

// base './' keeps asset paths relative, so the build works at
// https://sam-t-g.github.io/injector-lab/ without hard-coding the repo name.
export default defineConfig({
  base: './',
  define: { __COMMIT__: JSON.stringify(commit()) },
  // The CEA table ships inside the bundle (about 240 kB raw), so the main chunk is large on purpose.
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2022', chunkSizeWarningLimit: 800 },
  worker: { format: 'es' },
})
