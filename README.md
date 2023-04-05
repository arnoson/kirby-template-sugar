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
    <?php snippet('link', [
      'url' => 'github.com/arnoson/kirby-template-sugar'
    ], slots: true); ?>
      <i>Read more ...</i>
    <?php endsnippet(); ?>
  <?php endslot(); ?>
<?php endsnippet(); ?>
```

## How does it work

On order to get this to work, your original template file has to be compiled to normal php, similar to how other template languages (like laravel blade) work. The difference with Kirby Template Sugar is that it is still just 99% html+php but with the added `<snippet:name>` and `<slot>` sugar. So you still have syntax highlighting, intellisense, ...

The templates can either be compiled via the `kirby-template-sugar` CLI or with a [Vite](https://vitejs.dev/) plugin. See the examples folder for both approaches.

## Syntax

### Snippet

Snippets can have slots or be self-closing:

<table>
<tr>
<td>With Sugar</td>
<td>Compiled</td>
</tr>
<tr>
<td>

```html+php
<snippet:my-snippet>
  <slot:title>
    Hello
  </slot:title>
</snippet:my-snippet>

<snippet:my-snippet />
```

</td>
<td>

```html+php
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
