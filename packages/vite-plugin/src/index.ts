export type { Options } from 'kirby-template-sugar'
import { Options, transformFiles, watchFiles } from 'kirby-template-sugar'
import type { Plugin } from 'vite'

export default (pattern: string, options: Options = {}): Plugin => {
  let root: string | undefined

  return {
    name: 'vite-plugin-kirby-template-sugar',

    configResolved(config) {
      root = config.root
    },

    configureServer({ config: { root } }) {
      console.log('watch files ', pattern)
      watchFiles(pattern, options)
    },

    buildStart() {
      console.log('transform files ', pattern)
      transformFiles(pattern, options)
    },
  } as Plugin
}
