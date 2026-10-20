import { defineConfig } from 'vitest/config'

// src/physics imports nothing from Three or Motion, so the suite runs with no DOM.
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
})
