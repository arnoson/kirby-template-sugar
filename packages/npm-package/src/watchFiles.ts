import { watch as createWatcher } from 'chokidar'
import { transformFile } from './transformFile'
import { Options } from './types'

export const watchFiles = (paths: string | string[], options: Options = {}) => {
  const watcher = createWatcher(paths)
  const handleFile = (file: string) => transformFile(file, options)

  watcher.on('change', handleFile)
  watcher.on('add', handleFile)
  return watcher
}
