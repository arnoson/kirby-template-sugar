# Kirby Template Sugar (Vite Plugin)

For a complete setup checkout the [example](https://github.com/arnoson/kirby-template-sugar/tree/main/examples/vite).

## Installation

```bash
npm i vite-plugin-kirby-template-sugar -D
```

## Usage

```js
// vite.config.js
import kirbyTemplateSugar from 'vite-plugin-kirby-template-sugar'

// Compile the snippets and templates from `src` to `site`.
// Note: paths are relative to vite's root.
export default {
  root: 'src',

  plugins: [
    kirbyTemplateSugar('{templates,snippets}/*.kirby', { outDir: '../site' }),
  ],
}
```

## Options

- `cssVarShorthand` (default: `true`): allows omitting `var()` when assigning a
  CSS variable to another variable, e.g. `--y="--some-variable"` instead of
  `--y="var(--some-variable)"`. This is **deprecated** and will be removed in
  the next major version. Using the shorthand prints a deprecation warning
  once; set this option to `false` to opt out early and silence the warning.
