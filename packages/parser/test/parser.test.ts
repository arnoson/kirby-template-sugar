import { describe, it, expect, vi } from 'vitest'
import { parse } from '../src/parser'

describe('parser', () => {
  it('handles open tags', () => {
    const html = `
<div
  id="fu"
  disabled
  class="<?= $bar ?>" data-1="1"
\tdata-2="2"\t\tdata-3="3"
aria-disabled></div>`

    const onOpenTag = vi.fn()
    parse(html, { onOpenTag })

    expect(onOpenTag).toBeCalledWith(
      expect.objectContaining({
        name: 'div',
        // prettier-ignore
        attributes: [
          { name: 'id', value: 'fu', indent: '  ', line: 1, isPhp: false },
          { name: 'disabled', value: '', indent: '  ', line: 2, isPhp: false },
          { name: 'class', value: '<?= $bar ?>', indent: '  ', line: 3, isPhp: false },
          { name: 'data-1', value: '1', indent: ' ', line: 3, isPhp: false },
          { name: 'data-2', value: '2', indent: '\t', line: 4, isPhp: false },
          { name: 'data-3', value: '3', indent: '\t\t', line: 4, isPhp: false },
          { name: 'aria-disabled', value: '', indent: '', line: 5, isPhp: false },
        ],
        isSelfClosing: false,
      }),
    )
  })

  it('handles close tags', () => {
    const html = `<div class="fu"></div>`
    const onCloseTag = vi.fn()
    parse(html, { onCloseTag })
    expect(onCloseTag).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'div',
      }),
    )
  })

  it('handles self closing tags', () => {
    const html = `<img class="fu" />`
    const onOpenTag = vi.fn()
    const onCloseTag = vi.fn()
    parse(html, { onOpenTag, onCloseTag })
    expect(onOpenTag).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'img',
        isSelfClosing: true,
      }),
    )
    expect(onCloseTag).not.toHaveBeenCalled()
  })

  it('handles PHP tags inside HTML tags', () => {
    const html = `<div id="fu" <?= $a ?> class="bar" <?php $b ?>>`
    const onOpenTag = vi.fn()
    parse(html, { onOpenTag })

    expect(onOpenTag).toBeCalledWith(
      expect.objectContaining({
        name: 'div',
        // prettier-ignore
        attributes: [
          { name: 'id', value: 'fu', indent: ' ', line: 0, isPhp: false },
          { name: '', value: '<?= $a ?>', indent: ' ', line: 0, isPhp: true },
          { name: 'class', value: 'bar', indent: ' ', line: 0, isPhp: false },
          { name: '', value: '<?php $b ?>', indent: ' ', line: 0, isPhp: true },
        ],
        isSelfClosing: false,
      }),
    )
  })

  it('ignores HTML comments', () => {
    const html = `<!-- <img /> -->`
    const onOpenTag = vi.fn()
    parse(html, { onOpenTag })
    expect(onOpenTag).not.toBeCalled()
  })

  it('ignores code comments', () => {
    let html = `
      <script>
        // <img />
        /* <div>
        </div> */
      </script>
    `
    let onOpenTag = vi.fn()
    parse(html, { onOpenTag })
    expect(onOpenTag).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: 'script' }),
    )

    html = `
      <style>
        // <i>sass style comment</i>
        /* <div>
        </div> */
      </style>
    `
    onOpenTag = vi.fn()
    parse(html, { onOpenTag })
    expect(onOpenTag).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: 'style' }),
    )
  })

  it('ignores code quotes', () => {
    let html = `
      <script>
        const fu = '<div>'
        const fu = \`<div>\`
        const fu = "<div>"
      </script>
    `
    let onOpenTag = vi.fn()
    parse(html, { onOpenTag })
    expect(onOpenTag).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: 'script' }),
    )

    html = `
      <style>
        a::after {
          content: '<div>';
        }
      </style>
    `
    onOpenTag = vi.fn()
    parse(html, { onOpenTag })
    expect(onOpenTag).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: 'style' }),
    )
  })
})