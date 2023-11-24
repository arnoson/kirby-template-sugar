import { describe, it, expect } from 'vitest'
import { transform } from '../src/transform'

describe('transform', () => {
  it('handles snippets', () => {
    const input = `<snippet:test></snippet:test>`
    const output = `<?php snippet('test', slots: true); ?><?php endsnippet(/* test */); ?>`
    expect(transform(input)).toBe(output)
  })

  it('handles self closing snippets', () => {
    const input = `<snippet:test />`
    const output = `<?php snippet('test'); ?>`
    expect(transform(input)).toBe(output)
  })

  it('handles snippet attributes', () => {
    const input = `<snippet:test
      $myProp="value"
      $myPhpProp="<? [1, 2, 3] ?>"
      class="red"
      id="id-<?= $id ?>-fu"
      aria-label="<?php 'text' ?>"
    />`
    const output = `<?php snippet('test', __snippetData([
      '$myProp' => 'value',
      '$myPhpProp' => [1, 2, 3],
      'class' => 'red',
      'id' => 'id-' . $id . '-fu',
      'aria-label' => 'text',
    ])); ?>`
    expect(transform(input)).toBe(output)
  })

  it('handles attribute shorthands', () => {
    const input = `<snippet:test
      $a="<?= $a ?>"
      $b
      $c
    />`
    const output = `<?php snippet('test', __snippetData([
      '$a' => $a,
      '$b' => $b,
      '$c' => $c,
    ])); ?>`
    expect(transform(input)).toBe(output)
  })

  it('handles slots', () => {
    const input = `<snippet:test>
      <slot>Default</slot>
      <slot:name><?= $myContent ?></slot:name>
    </snippet:test>
    `
    const output = `<?php snippet('test', slots: true); ?>
      <?php slot(); ?>Default<?php endslot(); ?>
      <?php slot('name'); ?><?= $myContent ?><?php endslot(/* name */); ?>
    <?php endsnippet(/* test */); ?>
    `
    expect(transform(input)).toBe(output)
  })

  it('handles layouts', () => {
    let input = `<layout $myProp="<? $prop ?>" />`
    let output = `<?php layout('default', __snippetData([ '$myProp' => $prop, ])); ?>`
    expect(transform(input)).toBe(output)

    input = `<layout:name class="no-js" />`
    output = `<?php layout('name', __snippetData([ 'class' => 'no-js', ])); ?>`
    expect(transform(input)).toBe(output)
  })

  it('handles CSS variables', () => {
    // Snippet
    let input = `<snippet:test
      --a="<?= $variable ?>"
      --b="2rem"
      --c="3rem"
    />`
    let output = `<?php snippet('test', __snippetData([
      'style' => '--a: ' . $variable . ';
      --b: 2rem;
      --c: 3rem',
    ])); ?>`
    expect(transform(input)).toBe(output)

    // Layout
    input = `<layout:test --shorthand="--my-var" />`
    output = `<?php layout('test', __snippetData([ 'style' => '--shorthand: var(--my-var)' ])); ?>`
    expect(transform(input)).toBe(output)

    // Normal tag
    input = `<div
      <?= classes('article')->merge($attr) ?>
      class="red"
      --a="1rem"
      --b="--shorthand"
      --c="<?= $val ?>rem"
    ></div>`
    output = `<div
      <?= classes('article')->merge($attr) ?>
      class="red"
      style="--a: 1rem;
      --b: var(--shorthand);
      --c: <?= $val ?>rem"
    ></div>`
    expect(transform(input)).toBe(output)
  })
})
