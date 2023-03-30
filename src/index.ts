import { readFile, writeFile } from 'node:fs/promises'
import { transform } from './transform'
import { watch } from 'chokidar'

const watcher = watch('./input.php')
watcher.on('change', async (path) => {
  const html = await readFile('./input.php', { encoding: 'utf-8' })
  const output = transform(html)
  writeFile('./output.php', output)
})
;(async () => {
  const html = await readFile('./input.php', { encoding: 'utf-8' })
  const output = transform(html)
  writeFile('./output.php', output)
})()
