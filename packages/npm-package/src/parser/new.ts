import { Attribute, ParseOptions, Tag } from '../types'
import { getIndent, isQuote, isWhitespace } from './utils'

export const parse = (html: string) => {
  let position = -1
  let commentType: 'single' | 'multi' | 'html' | undefined = undefined
  let currentTag: Tag | undefined
  let currentAttribute: Attribute | undefined

  const onOpenTag = console.log
  const onCloseTag = console.log

  const createTag = (data: Partial<Tag> = {}): Tag => ({
    name: '',
    attributes: [],
    isCloseTag: false,
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

  let char: string
  while (position < html.length - 1) {
    const prevChar = char
    char = consume()

    if (char === '\n' && currentTag) currentTag.lineCount++

    // Finish tag
    if (currentTag && char === '>') {
      // Finish value-less attributes directly at the end of a tag,
      // like `<div aria-enabled>`.
      if (currentAttribute?.name) currentTag.attributes.push(currentAttribute)
      currentAttribute = undefined

      currentTag.isSelfClosing = prevChar === '/'
      currentTag.endIndex = position
      currentTag.indentBeforeEnd = currentTag.isSelfClosing
        ? getIndent(html, position - 1)
        : getIndent(html, position)

      if (currentTag.isCloseTag) onCloseTag?.(currentTag)
      else onOpenTag?.(currentTag)

      currentTag = undefined
      continue
    }

    // Finish value-less attributes followed by a white space,
    // like `<div aria-enabled class="fu">`.
    if (currentTag && isWhitespace(char)) {
      if (currentAttribute?.name) currentTag.attributes.push(currentAttribute)
      currentAttribute = undefined
      continue
    }

    // Text inside quotes on an html tag can only be attribute values.
    if (currentTag && isQuote(char)) {
      let quote = char
      let value = ''

      let next: string
      let isPhp = false
      let isPhpString = false
      let isPhpComment = false
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

      continue
    }

    // An opening angle bracket on an html tag can only be a php tag,
    // like <img <?= "class='$red'" ?>>. We store these as nameless attributes
    // and set the `isPhp` flag.
    if (currentTag && char === '<') {
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

      continue
    }

    // All unquoted text that is not covered until now can only be an attribute
    // name.
    if (currentTag && char !== '/') {
      let name = char
      while (peek() !== '=') name += consume()
      consume() // consume the =
      currentAttribute = createAttribute({ name })
      continue
    }

    // New tag
    if (char === '<') {
      const startIndex = position

      let name = ''
      while (![' ', '\n', '\t', '>'].includes(peek())) name += consume()

      const isCloseTag = name.startsWith('/')
      name = name.replace('/', '')
      currentTag = createTag({ name, startIndex, isCloseTag })
    }
  }
}
