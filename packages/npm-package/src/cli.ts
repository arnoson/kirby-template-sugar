#!/usr/bin/env node

import cac from 'cac'
import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'
import { transformFiles } from './transformFile'
import { Options } from './types'
import { watchFiles } from './watchFiles'

const cli = cac()

cli
  .command('<input> [outFile]')
  .option('--watch', 'watch', { default: false })
  .option('--root [root]', 'root directory', { default: './' })
  .option('--outDir [outDir]', 'output directory', { default: './' })
  .action(async (input: string, outFile: string, { watch, outDir, root }) => {
    const options: Options = { outFile, outDir, root }

    if (outDir && !existsSync(outDir)) await mkdir(outDir, { recursive: true })

    if (watch) watchFiles(input, options)
    else transformFiles(input, options)
  })

cli.parse()
