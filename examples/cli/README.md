# CLI Example

This is a basic example that uses Kirby Template Sugar's CLI to watch and build snippets and templates. You can either use the commands directly in the terminal or run them via the provided composer scripts.

## Structure

```bash
...
site/
├── dist/ # The compiled snippets/templates
│   ├── snippets/
│   └── templates/
├── snippets/ # The uncompiled snippets
└── templates/ # The uncompiled templates
```

In `index.php` we tell kirby where to find the compiled snippet/templates

```php
new Kirby\Cms\App([
  'roots' => [
    'snippets' => __DIR__ . '/site/dist/snippets',
    'templates' => __DIR__ . '/site/dist/templates',
  ]
])
```

## Perquisites

Make sure you have node.js installed

## Install

Run `composer install`

## Dev

```bash
composer run dev
```

This will start a development server (`php -S localhost:8888 kirby/router.php`)<br>
and run Kirby Template Sugar in watch mode (`npx kirby-template-sugar "{templates,snippets}/*.kirby" --root site --outDir dist --watch`)

## Build

```bash
composer run build
```

This will Build all templates/snippets (`npx kirby-template-sugar "{templates,snippets}/*.kirby" --root site --outDir dist`)
