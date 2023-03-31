import kirbyTemplateSugar from 'vite-plugin-kirby-template-sugar'
import kirby from 'vite-plugin-kirby'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',

  plugins: [
    kirby({ watch: false }),
    kirbyTemplateSugar('**/*.kirby', { outDir: '../site' }),
  ],

  build: {
    rollupOptions: {
      input: 'src/index.js',
    },
  },
})
