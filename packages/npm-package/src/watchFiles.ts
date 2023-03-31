import { watch as createWatcher } from 'chokidar'
import { transformFile } from './transformFile'
import { Options } from './types'

export interface WatchFilesOptions extends Options {
  onTransform?: (file: string) => any
}

export const watchFiles = (
  paths: string | string[],
  options: WatchFilesOptions = {}
) => {
  const handleFile = async (file: string) => {
    await transformFile(file, options)
    options.onTransform?.(file)
  }

  const watcher = createWatcher(paths, { cwd: options.root })
  watcher.on('change', handleFile)
  watcher.on('add', handleFile)

  return watcher
}
