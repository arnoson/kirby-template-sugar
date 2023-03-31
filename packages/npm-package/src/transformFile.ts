import { existsSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { glob, hasMagic } from 'glob'
import { dirname, resolve } from 'path'
import { transform } from './transform'
import { Options } from './types'
import { changeFileExtension } from './utils'

export const transformFile = async (file: string, options: Options) => {
  file = resolve(options.root ?? process.cwd(), file)
  const text = await readFile(file, { encoding: 'utf-8' })

  const outFile = resolve(options.outDir, changeFileExtension(file, '.php'))
  const dir = dirname(outFile)
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })

  return writeFile(outFile, transform(text))
}

export const transformFiles = async (pattern: string, options: Options) => {
  const files = hasMagic(pattern) ? await glob(pattern) : [pattern]
  files.forEach((file) => transformFile(file, options))
}
