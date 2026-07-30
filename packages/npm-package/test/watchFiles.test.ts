import { beforeEach, describe, expect, it, vi } from 'vitest'

const { watcher, createWatcher, transformFile, removeCompiledFile } =
  vi.hoisted(() => {
    const watcher = {
      on: vi.fn(),
    }

    return {
      watcher,
      createWatcher: vi.fn(() => watcher),
      transformFile: vi.fn(async () => undefined),
      removeCompiledFile: vi.fn(async () => undefined),
    }
  })

vi.mock('chokidar', () => ({
  watch: createWatcher,
}))

vi.mock('../src/transformFile', () => ({
  transformFile,
  removeCompiledFile,
}))

import { watchFiles } from '../src/watchFiles'

describe('watchFiles', () => {
  beforeEach(() => {
    watcher.on.mockReset()
    createWatcher.mockClear()
    transformFile.mockClear()
    removeCompiledFile.mockClear()
  })

  it('removes compiled file on unlink', async () => {
    const onTransform = vi.fn()

    watchFiles('templates/**/*.kirby', {
      root: 'site',
      outDir: 'dist',
      onTransform,
    })

    expect(createWatcher).toHaveBeenCalledWith('templates/**/*.kirby', {
      cwd: 'site',
    })

    const unlinkHandler = watcher.on.mock.calls.find(
      ([event]) => event === 'unlink',
    )?.[1]

    expect(unlinkHandler).toBeTypeOf('function')

    await unlinkHandler?.('templates/home.kirby')

    expect(removeCompiledFile).toHaveBeenCalledWith('templates/home.kirby', {
      root: 'site',
      outDir: 'dist',
      onTransform,
    })
    expect(onTransform).toHaveBeenCalledWith('templates/home.kirby')
  })
})
