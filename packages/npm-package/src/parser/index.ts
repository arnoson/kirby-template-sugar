import { Attribute, ParseOptions, Tag } from '../types'
import { readPhp } from './readPhp'

const isWhitespace = (char: string) =>
  char === ' ' || char === '\t' || char === '\n' || char === '\r'

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

  let char: string | undefined
  while (position < input.length - 1) {
    const prevChar = char
    char = read()

    if (char === '\n' && currentTag) currentTag.lineCount++

    if (state === 'normal') {
      if (char === '<' && input.slice(position + 1, position + 4) === '!--') {
        read(3) // !--
        // Ignore everything inside the comment
        while (peek(0) !== '-' || peek(1) !== '-' || peek(2) !== '>') read()
        read(3) // -->
      } else if (char === '<' && peek() === '?') {
        readPhp({ read, peek }) // Ignore php tag
      } else if (char === '<') {
        const startIndex = position
        let name = ''
        while (
          !isWhitespace(peek()) &&
          peek() !== '>' &&
          !(peek() === '/' && peek(1) === '>')
        ) {
          name += read()
        }

        // Ignore any tags inside code blocks (script, style).
        const isInsideCodeBlock = currentTag && isCodeTag(currentTag)
        const isCodeCloseTag = currentTag && name === `/${currentTag.name}`
        if (!isInsideCodeBlock || isCodeCloseTag) {
          const isCloseTag = name.startsWith('/')
          if (isCloseTag) name = name.slice(1)
          currentTag = {
            name,
            isCloseTag,
            startIndex,
            attributes: [],
            endIndex: 0,
            lineCount: 0,
            isSelfClosing: false,
            indentBeforeEnd: '',
          }
          state = 'tag'
        }
      }
      continue
    }

    // All further state needs a current tag.
    if (!currentTag) throw new Error('No current tag')

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
        if (currentTag.isCloseTag || currentTag.isSelfClosing) {
          currentTag = undefined
        }
      } else if (char === '<' && peek() === '?') {
        // Php tags are stored as nameless attributes.
        const startIndex = position
        const value = '<' + readPhp({ read, peek })
        const line = currentTag.lineCount
        const indent = getIndent(startIndex)
        const attribute = { name: '', isPhp: true, value, line, indent }
        currentTag.attributes.push(attribute)
      } else if (char !== '/' && !isWhitespace(char)) {
        const line = currentTag.lineCount
        const indent = getIndent(position)
        currentAttribute = { name: char, isPhp: false, line, indent }
        state = 'attribute-name'
      }
      continue
    }

    // All further state needs a current attribute.
    if (!currentAttribute) throw new Error('No current attribute')

    if (state === 'attribute-name') {
      if (isWhitespace(char)) {
        currentTag.attributes.push(currentAttribute)
        state = 'tag'
      } else if (char === '/') {
        currentTag.attributes.push(currentAttribute)
        state = 'tag'
      } else if (char === '=' && (peek() === `"` || peek() === `'`)) {
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
      if (!currentTag) throw new Error('No current tag')

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
