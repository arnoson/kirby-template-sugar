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
          { name: 'disabled', value: undefined, indent: '  ', line: 2, isPhp: false },
          { name: 'class', value: '<?= $bar ?>', indent: '  ', line: 3, isPhp: false },
          { name: 'data-1', value: '1', indent: ' ', line: 3, isPhp: false },
          { name: 'data-2', value: '2', indent: '\t', line: 4, isPhp: false },
          { name: 'data-3', value: '3', indent: '\t\t', line: 4, isPhp: false },
          { name: 'aria-disabled', value: undefined, indent: '', line: 5, isPhp: false },
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
    const html = `<img />`
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

  it('handles tags with slashes', () => {
    // This is need for nested snippets, like `<k:seo/head />`
    const html = `<k:seo/head><k:seo/head>`
    const onOpenTag = vi.fn()
    parse(html, { onOpenTag })
    expect(onOpenTag).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'k:seo/head',
      }),
    )
  })

  it('handles self closing tags with slashes', () => {
    const html = `<k:seo/head/>`
    const onOpenTag = vi.fn()
    const onCloseTag = vi.fn()
    parse(html, { onOpenTag, onCloseTag })
    expect(onOpenTag).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'k:seo/head',
        isSelfClosing: true,
      }),
    )
    expect(onCloseTag).not.toHaveBeenCalled()
  })

  it('provides start and end indexes for tags', () => {
    const html = `   <div class="fu">   </div>`
    const onOpenTag = vi.fn()
    const onCloseTag = vi.fn()
    parse(html, { onOpenTag, onCloseTag })

    expect(onOpenTag).toBeCalledWith(
      expect.objectContaining({ startIndex: 3, endIndex: 18 }),
    )

    expect(onCloseTag).toBeCalledWith(
      expect.objectContaining({ startIndex: 22, endIndex: 27 }),
    )
  })

  it('handles PHP tags inside HTML tags', () => {
    const html = `<div
  id="fu"
  <?= classes('article')->merge($attr) ?>
  class="bar"
  <?php
    "?>"
    '?>'
    /* ?> */
    $fu = <<<TEXT
      ?>
    TEXT;
  ?>
>`
    const onOpenTag = vi.fn()
    parse(html, { onOpenTag })

    expect(onOpenTag).toBeCalledWith(
      expect.objectContaining({
        name: 'div',
        // prettier-ignore
        attributes: [
          { name: 'id', value: 'fu', indent: '  ', line: 1, isPhp: false },
          { name: '', value: `<?= classes('article')->merge($attr) ?>`, indent: '  ', line: 2, isPhp: true },
          { name: 'class', value: 'bar', indent: '  ', line: 3, isPhp: false },
          { name: '', value: `<?php\n    \"?>\"\n    '?>'\n    /* ?> */\n    $fu = <<<TEXT\n      ?>\n    TEXT;\n  ?>`, indent: '  ', line: 4, isPhp: true },
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

  it('ignores code blocks', () => {
    // Script
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

    // Style
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

    // PHP (outside of an HTML tag)
    html = `<?php
      /* ?> */
      // <img />
      /* <div>
      </div> */
      "<a>"
      $html = <<<HTML
        <img />
      HTML;
    ?>`
    onOpenTag = vi.fn()
    parse(html, { onOpenTag })
    expect(onOpenTag).not.toHaveBeenCalled()
  })
})
