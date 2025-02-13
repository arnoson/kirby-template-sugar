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
  let position = 0
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
    indent: getIndent(position - 1),
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

  const peek = (offset = 0) => input[position + offset]

  const read = (length = 1) => {
    if (position + length > input.length) return
    const chunk = input.slice(position, position + length)
    position += length
    return chunk
  }

  let char: string
  while (position < input.length) {
    const prevChar = char
    char = read()

    if (char === '\n' && currentTag) currentTag.lineCount++

    if (state === 'normal') {
      if (char === '<' && input.slice(position, position + 3) === '!--') {
        read(3) // !--
        // Ignore everything inside the comment
        while (peek(0) !== '-' || peek(1) !== '-' || peek(2) !== '>') read()
        read(3) // -->
      } else if (char === '<' && peek() === '?') {
        readPhp({ read, peek })
      } else if (char === '<') {
        const startIndex = position - 1
        let name = ''
        while (![' ', '\n', '\t', '>'].includes(peek())) name += read()

        // Ignore everything inside code tags (script & style).
        if (
          !currentTag ||
          !isCodeTag(currentTag) ||
          name === `/${currentTag.name}`
        ) {
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
        currentTag.endIndex = position - 1
        currentTag.indentBeforeEnd = currentTag.isSelfClosing
          ? getIndent(position - 2)
          : getIndent(position - 1)

        if (currentTag.isCloseTag) onCloseTag?.(currentTag)
        else onOpenTag?.(currentTag)

        state = 'normal'
      } else if (char === '<' && peek() === '?') {
        // Php tags are stored as nameless attributes.
        const startIndex = position - 1
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
