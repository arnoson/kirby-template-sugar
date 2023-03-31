import kirbyTemplateSugar from 'vite-plugin-kirby-template-sugar'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',

  plugins: [kirbyTemplateSugar('./**/*.kirby', { outDir: 'test' })],

  build: {
    rollupOptions: {
      input: 'src/index.ts',
    },
  },
})
