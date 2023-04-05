# Vite Example

This is a basic example that uses Kirby Template Sugar with it's vite plugin.

## Structure

```bash
...
site/
├── snippets/ # The compiled snippets
└── templates/ # The compiled templates
src/
├── snippets/ # The uncompiled snippets
└── templates/ # The uncompiled templates
```

## Install

Run `composer install` and `npm install`

## Dev

Start vite in watch mode with hot-reload for css and live-reload for js/template/snippet changes.

```bash
npm run dev
```

## Build

Bundle js/css and compile all templates/snippets

```bash
npm run build
```
