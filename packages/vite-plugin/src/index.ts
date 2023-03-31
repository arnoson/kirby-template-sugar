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

    configureServer({ ws, config: { root } }) {
      console.log('watch files ', pattern)

      const onTransform = (path: string) =>
        ws.send({ type: 'full-reload', path })
      watchFiles(pattern, { root, ...options, onTransform })
    },

    buildStart() {
      console.log('transform files ', pattern)
      transformFiles(pattern, { root, ...options })
    },
  } as Plugin
}
