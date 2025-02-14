import { existsSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { glob, hasMagic } from 'glob'
import { dirname, join } from 'path'
import { transform } from './transform'
import { Options } from './types'
import { changeFileExtension } from './utils'

export const transformFile = async (file: string, options: Options) => {
  const root = options.root ?? process.cwd()
  const text = await readFile(join(root, file), { encoding: 'utf-8' })
  const outFile = join(
    root,
    options.outDir ?? '',
    changeFileExtension(file, '.php'),
  )
  const dir = dirname(outFile)

  if (!existsSync(dir)) await mkdir(dir, { recursive: true })

  const content = transform(text)
  try {
    const oldContent = await readFile(outFile, { encoding: 'utf8' })
    if (content !== oldContent) return writeFile(outFile, content)
  } catch (e) {
    return writeFile(outFile, content)
  }
}

export const transformFiles = async (pattern: string, options: Options) => {
  const files = hasMagic(pattern)
    ? await glob(pattern, { cwd: options.root })
    : [pattern]

  files.forEach((file) => transformFile(file, options))
}
