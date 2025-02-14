import { Attribute, ParseOptions, Tag } from '../types'
import { readPhp } from './readPhp'

const isWhitespace = (char: string) =>
  char === ' ' || char === '\t' || char === '\n' || char === '\r'

const isQuote = (char: string) => char === `'` || char === `"` || char === '`'

const isCodeTag = ({ name }: Tag) => name === 'script' || name === 'style'

export const parse = (
  input: string,
  { onOpenTag, onCloseTag }: ParseOptions = {},
) => {
  let position = -1
  let state: 'normal' | 'tag' | 'attribute-name' | 'attribute-value' = 'normal'
  let currentTag: Tag | undefined
  let currentAttribute: Attribute | undefined
  let attributeQuote: `"` | `'` = `"`

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
    indent: getIndent(position),
    ...data,
  })

  const getIndent = (position: number) => {
    let indent = ''
    while (position >= 0) {
      const char = input[--position]
      if (char !== ' ' && char !== '\t') break
      indent += char
    }
    return indent
  }

  const peek = (offset = 0) => input[position + 1 + offset]

  const read = (length = 1) => {
    let chunk = ''
    for (let i = 0; i < length; i++) {
      const char = input[++position]
      if (char === undefined) break
      chunk += char
    }
    return chunk
  }

  let char: string
  while (position < input.length - 1) {
    const prevChar = char
    char = read()

    if (char === '\n' && currentTag) currentTag.lineCount++

    if (state === 'normal') {
      // prettier-ignore
      if (char === '<' && peek() === '!' && peek(1) === '-' && peek(2) === '-') {
        read(3) // !--
        // Ignore everything inside the comment
        while (peek(0) !== '-' || peek(1) !== '-' || peek(2) !== '>') read()
        read(3) // -->
      } else if (char === '<' && peek() === '?') {
        readPhp({ read, peek }) // Ignore php tag
      } else if (char === '<') {
        const startIndex = position
        let name = ''
        while (![' ', '\n', '\t', '>'].includes(peek())) name += read()

        // Ignore any tags inside code blocks (script, style).
        const isInsideCodeBlock = currentTag && isCodeTag(currentTag)
        const isCodeCloseTag = currentTag && name === `/${currentTag.name}`
        if (!isInsideCodeBlock || isCodeCloseTag) {
          const isCloseTag = name.startsWith('/')
          name = name.replace('/', '')
          currentTag = createTag({ name, isCloseTag, startIndex })
          state = 'tag'
        }
      }
      continue
    }

    if (state === 'tag') {
      if (char === '>') {
        currentTag.isSelfClosing = prevChar === '/'
        currentTag.endIndex = position
        currentTag.indentBeforeEnd = currentTag.isSelfClosing
          ? getIndent(position - 1)
          : getIndent(position)

        if (currentTag.isCloseTag) onCloseTag?.(currentTag)
        else onOpenTag?.(currentTag)

        state = 'normal'
      } else if (char === '<' && peek() === '?') {
        // Php tags are stored as nameless attributes.
        const startIndex = position
        const value = '<' + readPhp({ read, peek })
        const attribute = createAttribute({
          value,
          indent: getIndent(startIndex),
          isPhp: true,
        })
        currentTag.attributes.push(attribute)
      } else if (char !== '/' && !isWhitespace(char)) {
        currentAttribute = createAttribute({ name: char })
        state = 'attribute-name'
      }
      continue
    }

    if (state === 'attribute-name') {
      if (isWhitespace(char)) {
        currentTag.attributes.push(currentAttribute)
        state = 'tag'
      } else if (char === '/') {
        currentTag.attributes.push(currentAttribute)
        state = 'tag'
      } else if (char === '=' && isQuote(peek())) {
        attributeQuote = read() as `'` | `"`
        state = 'attribute-value'
      } else {
        currentAttribute.name += char
        if (peek() === '>') {
          currentTag.attributes.push(currentAttribute)
          state = 'tag'
        }
      }
      continue
    }

    if (state === 'attribute-value') {
      if (char === attributeQuote) {
        currentTag.attributes.push(currentAttribute)
        state = 'tag'
      } else if (char === '<' && peek() === '?') {
        const php = readPhp({ read, peek })
        currentAttribute.value ??= ''
        currentAttribute.value += '<' + php
      } else {
        currentAttribute.value ??= ''
        currentAttribute.value += char
      }
      continue
    }
  }
}
