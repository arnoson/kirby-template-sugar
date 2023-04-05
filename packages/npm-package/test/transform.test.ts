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
      @myProp="value"
      @myPhpProp="<? [1, 2, 3] ?>"
      class="red"
      id="<?= $id ?>"
      aria-label="<?php 'text' ?>"
    />`
    const output = `<?php snippet('test', __snippetData([
      '@myProp' => 'value',
      '@myPhpProp' => [1, 2, 3],
      'class' => 'red',
      'id' => $id,
      'aria-label' => 'text'
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
    let input = `<layout @myProp="<? $prop ?>" />`
    let output = `<?php layout('default', __snippetData(['@myProp' => $prop])); ?>`
    expect(transform(input)).toBe(output)

    input = `<layout:name class="no-js" />`
    output = `<?php layout('name', __snippetData(['class' => 'no-js'])); ?>`
    expect(transform(input)).toBe(output)
  })
})
