<p align="center">
  <img src="https://user-images.githubusercontent.com/15122993/230340162-3c838636-ba50-470e-8b41-e268dedc1986.svg"
 alt="Kirby Template Sugar" width="135" height="135">
</p>

<h1 align="center">Kirby Template Sugar</h1>

A lightweight template compiler that adds some [syntactic sugar](https://en.wikipedia.org/wiki/Syntactic_sugar) to Kirby's php templates.

Kirby's new [snippets with slots](https://getkirby.com/docs/guide/templates/snippets#passing-slots-to-snippets) allow you to adapt a component-based workflow, similar to Laravel blade templates or javascript frameworks like Vue. However, the plain php syntax can be verbose. So with some template sugar you can write this:

```html
<snippet:card @rounded="<? true ?>" class="bg-yellow" id="my-card">
  <slot:icon>🍬</slot:icon>
  <slot:title>
    <h2>Kirby Template Sugar</h2>
  </slot:title>
  <slot>
    <snippet:link @url="github.com/arnoson/kirby-template-sugar">
      <i>Read more ...</i>
    </snippet:link>
  </slot>
</snippet:card>
```

instead of this:

```php
<?php snippet('card', [
  'rounded' => true,
  'attr' => ['class' => 'bg-yellow', 'id' => 'my-card']
], slots: true); ?>
  <?php slot('icon'); ?>🍬<?php endslot(); ?>
  <?php slot('title'); ?>
    <h2>Kirby Template Sugar</h2>
  <?php endslot(); ?>
  <?php slot(); ?>
    <?php snippet('link', ['url' => 'github.com/arnoson/kirby-template-sugar'], slots: true); ?>
      <i>Read more ...</i>
    <?php endsnippet(); ?>
  <?php endslot(); ?>
<?php endsnippet(); ?>
```

## How Does It Work

Your template files need to be compiled into regular php, similar to how other template languages work. But the goal of this project is not to create a new full-fledged template language for Kirby. Instead it embraces the existing php templates and just adds a little sugar where they tend to get too messy. You still write php/html (with syntax highlighting, intellisense, ...) and add a special `<snippet>`, `<slot>` or `<layout>` tag here and there to keep things tidy.

## Getting Started

The easiest way to get started is to check out one of the examples:
- Use the [CLI example](https://github.com/arnoson/kirby-template-sugar/tree/main/examples/cli) if you want a minimal starter kit that doesn't rely on any other build tools.
- Use the [Vite example](https://github.com/arnoson/kirby-template-sugar/tree/main/examples/cli) to compile your templates alongside your other frontend assets.

To start manually (or convert an existing project), have a look at the [CLI](https://github.com/arnoson/kirby-template-sugar/tree/main/packages/npm-package#cli-usage) or the [Vite plugin](https://github.com/arnoson/kirby-template-sugar/tree/main/packages/vite-plugin). And make sure you also install the [Kirby plugin](https://github.com/arnoson/kirby-template-sugar/tree/main/packages/kirby-plugin).


## Syntax

### Snippets

Snippets can have slots or be self-closing:

<table>
<tr>
<th width="500px">With Sugar</th>
<th width="500px">Compiled</th>
</tr>
<tr>
<td valign="top">

```html
<snippet:my-snippet>
  <slot:title>
    Hello
  </slot:title>
</snippet:my-snippet>

<snippet:my-snippet />
```

</td>
<td valign="top">

```php
<?php snippet('my-snippet', slots: true); ?>
  <?php slot('title'); ?>
    Hello
  <?php endslot(/* title */); ?>
<?php endsnippet(/* my-snippet */); ?>

<?php snippet('my-snippet'); ?>
```

</td>
</tr>
</table>

### Props and attributes

Snippets can have `props`, which are passed directly to the snippet, and attributes, which are grouped into an `$attr` variable passed to the snippet along with the props. Props start with `@` (like `@open` and `@items`) and attributes are just specified like regular html attributes (`class`, `aria-label`).

If you want to pass a php expression to a snippet, e.g.: `items => $site->children()->listed()`, you just have to wrap it in php tags (see the code below):

<table>
<tr>
<th width="500px">With Sugar</th>
<th width="500px">Compiled</th>
</tr>
<tr>
<td valign="top">

```html
<snippet:menu
  @open="<? true ?>"
  @items="<? $site->children()->listed() ?>"
  class="bg-red"
  aria-label="Main Menu"
/>
```

</td>
<td valign="top">

```php
<?php snippet('menu', [
  'open' => true,
  'items' => $site->children()->listed(),
  'attr' => [
    'class' => 'bg-red',
    'aria-label' => 'Main Menu'
  ]
]); ?>
```

</td>
</tr>
</table>

Well... actually the compiled code looks like this. To make debugging easier, the line numbers will stay the same:

<table>
<tr>
<th width="500px">With Sugar</th>
<th width="500px">Compiled</th>
</tr>
<tr>
<td valign="top">

```html
<snippet:menu
  @open="<? true ?>"
  @items="<? $site->children() ?>"
  class="bg-red"
  aria-label="Main Menu"
/>
```

</td>
<td valign="top">

```php
<?php snippet('menu', __snippetData([
  '@open' => true,
  '@items' => $site->children(),
  'class' => 'bg-red',
  'aria-label' => 'Main Menu'
])); ?>
```

</td>
</tr>
</table>

This makes it super easy to implement a snippet like this:

```php
// snippets/menu.php
<nav <?= attr($attr) ?>>
  <?php foreach ($items as $item) { /* ... */ } ?>
</nav>
```

Or even better with @fabianmichael's fantastic [kirby-template-attributes](https://github.com/fabianmichael/kirby-template-attributes)

```php
// snippets/menu.php
<nav <?= classes('menu', ['menu--open' => $open])->merge($attr) ?>>
  <?php foreach ($items as $item) { /* ... */ } ?>
</nav>
```

### CSS Variables

You can assign CSS variables with an attribute-like syntax. This works on any tag, not just `<snippet>` and `<layout>`.

Note: you can omit the `var()` if you are referencing another variable name (like `--some-variable`).

<table>
<tr>
<th width="500px">With Sugar</th>
<th width="500px">Compiled</th>
</tr>
<tr>
<td valign="top">

```html
<snippet:point
  --x="10px"
  --y="--some-variable"
/>

<img --padding="2rem" />
```

</td>
<td valign="top">

```php
<?php snippet('point', __snippetData([
  'style' => ['--x: 10px;
  --y: var(--some-variable)']
])); ?>

<img style="--padding: 2rem" />
```

</td>
</tr>
</table>

### Layouts

If you also use Kirby's [layouts](https://github.com/getkirby/layouts) you can define them with the `<layout>` tag:

<table>
<tr>
<th width="500px">With Sugar</th>
<th width="500px">Compiled</th>
</tr>
<tr>
<td valign="top">

```html
<layout>

Your Content ...
```

</td>
<td valign="top">

```php
<?php layout('default'); ?>

Your Content ...
```

</td>
</tr>
</table>

Or with slots and even props and attributes

<table>
<tr>
<th width="500px">With Sugar</th>
<th width="500px">Compiled</th>
</tr>
<tr>
<td valign="top">

```html
<layout:gallery
  @showMenu="<? false ?>"
  @layout="portrait"
>

<slot:img><img /></slot:img>

<slot:caption>
  An image
</slot:caption>
```

</td>
<td valign="top">

```php
<?php layout('gallery', __snippetData([
  '@showMenu' => false,
  '@layout' => 'portrait'
])); ?>

<?php slot('img'); ?><img /><?php endslot(/* img */); ?>

<?php slot('caption'); ?>
  An image
<?php endslot(/* caption */); ?>
```

</td>
</tr>
</table>

## Debugging

If you are using [xdebug](https://xdebug.org/), you won't be able to set breakpoints through your IDE, but you can use `xdebug_break()` in your source file. To remove the breakpoint, simply remove `xdebug_break()` and save the source file again.

## Credits
- [magic-string](https://github.com/rich-harris/magic-string)
- [glob](https://github.com/isaacs/node-glob)
- [CAC](https://github.com/cacjs/cac)
- [chokidar](https://github.com/paulmillr/chokidar)
