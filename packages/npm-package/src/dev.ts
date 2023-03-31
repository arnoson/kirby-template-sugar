import { transformFiles } from './transformFile'
import { watchFiles } from './watchFiles'

watchFiles('**/*.kirby', { root: 'fu', outDir: '../xxx' })
// transformFiles('**/*.kirby', { root: 'fu', outDir: '../xxx' })
