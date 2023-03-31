import { readFile, writeFile } from 'fs/promises'
import { glob, hasMagic } from 'glob'
import { resolve } from 'path'
import { transform } from './transform'
import { Options } from './types'
import { changeFileExtension } from './utils'

export const transformFile = async (file: string, options: Options) => {
  const text = await readFile(file, { encoding: 'utf-8' })
  const outFile = options.outFile ?? changeFileExtension(file, '.php')
  return writeFile(resolve(options.outDir, outFile), transform(text))
}

export const transformFiles = async (pattern: string, options: Options) => {
  const files = hasMagic(pattern) ? await glob(pattern) : [pattern]
  files.forEach((file) => transformFile(file, options))
}
