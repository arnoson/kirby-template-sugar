import { transformFiles } from './transformFile'
import { watchFiles } from './watchFiles'

watchFiles('**/*.kirby', { outDir: 'transformed' })
// transformFiles('**/*.kirby', { root: 'fu', outDir: '../xxx' })
