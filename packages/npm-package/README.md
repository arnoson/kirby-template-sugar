# Kirby Template Sugar

## CLI Usage

No need to install the package, just run it with `npx`.

### Build

Compile all files inside `site/templates` and `site/snippets` into `site/dist`.<br>
Note: we're using `site` as the root folder, so the other paths will be relative to it.

```bash
npx kirby-template-sugar "{templates,snippets}/*.kirby" --root site --outDir dist
```

### Development

Same as [build](#build) but with the `--watch` flag

```bash
npx kirby-template-sugar "{templates,snippets}/*.kirby" --root site --outDir dist --watch
```

## Manual Usage

Install the package with

```bash
npm i kirby-template-sugar -D
```

and then

```ts
import { transform, transformFiles, watchFiles } from 'kirby-template-sugar'

const options = { root: 'src', outDir: 'dist' }

// either watch files
watchFiles('**/*.kirby', options)

// or compile them once
transformFiles('**/*.kirby', options)

// or compile a string
const result = transform(`<k:test $prop="<? true ?>" />`)
```
