import { Attribute, ParseOptions, Tag } from '../types'
import { getIndent, isQuote, isWhitespace } from './utils'

export const parse = (html: string) => {
  let position = -1
  let isInsideTag = false
  let isInsidePhp = false
  let commentType = undefined
  let openTagName = undefined
  let currentTag: Tag | undefined
  let currentAttribute: Attribute | undefined

  const onOpenTag = console.log
  const onCloseTag = console.log

  const createTag = (data: Partial<Tag> = {}): Tag => ({
    name: '',
    attributes: [],
    isSelfClosing: false,
    startIndex: 0,
    endIndex: 0,
    lineCount: 0,
    indentBeforeEnd: '',
    ...data,
  })

  const createAttribute = (data: Partial<Attribute> = {}): Attribute => ({
    name: '',
    value: undefined,
    isPhp: false,
    line: currentTag?.lineCount ?? 0,
    indent: getIndent(html, position),
    ...data,
  })

  const consume = (length = 1) => {
    let result = ''
    for (let i = 0; i < length; i++) result += html[++position]
    return result
  }

  const peek = (length = 1) => html.slice(position + 1, position + 1 + length)

  const readPhpTag = () => {}

  let char: string
  while (position < html.length - 1) {
    const prevChar = char
    char = consume()

    if (char === '\n' && currentTag) currentTag.lineCount++

    if (currentTag) {
      if (char === '>') {
        // Finish value-less attributes directly at the end of a tag,
        // like `<div aria-enabled>`.
        if (currentAttribute?.name) currentTag.attributes.push(currentAttribute)
        currentAttribute = undefined

        const isCloseTag = currentTag.name.startsWith('/')
        currentTag.isSelfClosing = prevChar === '/'

        currentTag.endIndex = position
        currentTag.indentBeforeEnd = currentTag.isSelfClosing
          ? getIndent(html, position - 1)
          : getIndent(html, position)

        if (isCloseTag) onCloseTag?.(currentTag)
        else onOpenTag?.(currentTag)

        currentTag = undefined
      } else if (isWhitespace(char)) {
        // Finish value-less attributes followed by a white space,
        // like `<div aria-enabled class="fu">`.
        if (currentAttribute?.name) currentTag.attributes.push(currentAttribute)
        currentAttribute = undefined
      } else if (isQuote(char)) {
        let quote = char
        let value = ''

        let next: string
        let isPhp = false
        let isPhpString = false
        let isEscaped = false
        while ((next = peek())) {
          if (isPhp && !isEscaped && next === quote) isPhpString = !isPhpString

          // We ignore php's ending tags inside strings,
          // like `<a id="<?= "why would you do this?>" ?>" />`
          if (!isPhpString) {
            if (peek(3) === '<?=') isPhp = true
            else if (peek(2) == '?>') isPhp = false
          }

          if (!isPhp && next === quote) break
          isEscaped = !isEscaped && next === '\\'
          value += consume()
        }
        consume() // consume the closing quote

        if (currentAttribute) {
          currentAttribute.value = value
          currentTag.attributes.push(currentAttribute)
          currentAttribute = undefined
        }
      } else if (char === '<') {
        // This can only be the begin of a php tag.
        let value = '<'
        let next: string
        let isEscaped = false
        let isPhpString = false
        let quote: string
        let i = 0

        while ((next = peek())) {
          if (isPhpString && !isEscaped && next === quote) {
            isPhpString = false
          } else if (!isPhpString && !isEscaped && isQuote(next)) {
            isPhpString = true
            quote = next
          }
          // We ignore php's ending tags inside strings,
          // like `<a <?= "why would you do this?>" ?> />`
          if (!isPhpString) {
            if (peek(2) === '?>') break
          }
          isEscaped = !isEscaped && next === '\\'
          value += consume()
          console.log(next, isPhpString)
          if (i++ > 200) break
        }
        value += consume(2) // consume the php end tag

        const attribute = createAttribute({ value, isPhp: true })
        currentTag.attributes.push(attribute)
      } else if (char !== '=' && char !== '/') {
        currentAttribute ??= createAttribute()
        currentAttribute.name += char
      }

      continue
    }

    // New tag
    if (char === '<') {
      const startIndex = position

      let name = ''
      while (![' ', '\n', '\t', '>'].includes(peek())) name += consume()

      // For a self-closing tag like <div/> the trailing / isn't part of the name.
      if (name.endsWith('/')) name = name.slice(0, -1)

      currentTag = createTag({ name, startIndex })
    }
  }
}
