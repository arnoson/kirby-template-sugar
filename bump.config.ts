import { defineConfig } from 'bumpp'

export default defineConfig({
  files: [
    './composer.json',
    './package.json',
    './packages/npm-package/package.json',
    './packages/vite-plugin/package.json',
  ],
})
