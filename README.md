# Kirby Template Sugar

Kirby Template Sugar is a small template compiler that adds some syntactic sugar to Kirby's php templates.

Kirby's new snippets with slots enable you to adapt a component-based workflow like in laravel blade templates or javascript frameworks like Vue. But the syntax can be verbose. So with some template sugar you can write this:

```html
<snippet:card @rounded="<? true ?>" class="bg-yellow" id="my-card">
  <slot:icon>🍬</slot:icon>
  <slot:title> <h2>Kirby Template Sugar</h2> </slot:title>
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

## How does it work

On order to get this to work, your original template file has to be compiled to normal php, similar to how other template languages (like laravel blade) work. The difference with Kirby Template Sugar is that it is still just 99% html+php but with the added `<snippet:name>` and `<slot>` sugar. So you still have syntax highlighting, intellisense, ...

The templates can either be compiled via the `kirby-template-sugar` CLI or with a [Vite](https://vitejs.dev/) plugin. See the examples folder for both approaches.

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

Snippets can have `props` which are directly passed to snippet and attributes, which are grouped into an `$attr` variable passed to the snippet alongside the props.

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

Well ... actually the compiled code looks like this. To make the debugging easier, line numbers will stay the same:

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
