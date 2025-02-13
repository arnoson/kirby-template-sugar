import { Attribute, ParseOptions, Tag } from '../types'
import { getIndent, isCodeTag, isQuote, isWhitespace } from './utils'

type Stream = {
  read(length?: number): string | undefined
  peek(offset?: number): string | undefined
}

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
    indent: getIndent(input, position - 1),
    ...data,
  })

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
          ? getIndent(input, position - 2)
          : getIndent(input, position - 1)

        if (currentTag.isCloseTag) onCloseTag?.(currentTag)
        else onOpenTag?.(currentTag)

        state = 'normal'
      } else if (char === '<' && peek() === '?') {
        // Php tags are stored as nameless attributes.
        const startIndex = position - 1
        const value = '<' + readPhp({ read, peek })
        const attribute = createAttribute({
          value,
          indent: getIndent(input, startIndex),
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

/**
 * Read the input at the current position until we reach a php end tag `?>`.
 * Ignore the end tag in any comment or string to be consistent with how php
 * parses its code.
 */
const readPhp = ({ read, peek }: Stream) => {
  let state:
    | 'normal'
    | 'single-quote'
    | 'double-quote'
    | 'line-comment'
    | 'block-comment'
    | 'heredoc' = 'normal'

  let heredocTag = ''
  let isEscaped = false
  let buffer = ''

  let char: string
  while ((char = read())) {
    buffer += char

    if (state === 'normal') {
      if (char === "'") {
        state = 'single-quote'
        isEscaped = false
      } else if (char === '"') {
        state = 'double-quote'
        isEscaped = false
      } else if (char === '/' && peek() === '/') {
        state = 'line-comment'
      } else if (char === '/' && peek() === '*') {
        state = 'block-comment'
      } else if (char === '<' && peek() === '<' && peek(1) === '<') {
        buffer += read(2) // consume the <<
        state = 'heredoc'
        heredocTag = ''
        while (peek() !== '\n') heredocTag += read()
        buffer += heredocTag
      } else if (char === '?' && peek() === '>') {
        buffer += read() // consume the >
        return buffer
      }
      continue
    }

    if (state === 'single-quote') {
      if (char === "'" && !isEscaped) state = 'normal'
      isEscaped = !isEscaped && char === '\\'
      continue
    }

    if (state === 'double-quote') {
      if (char === '"' && !isEscaped) state = 'normal'
      isEscaped = !isEscaped && char === '\\'
      continue
    }

    if (state === 'line-comment') {
      if (char === '\n') {
        state = 'normal'
      } else if (char === '?' && peek() === '>') {
        buffer += read() // consume the <
        return buffer
      }
      continue
    }

    if (state === 'block-comment') {
      if (char === '*' && peek() === '/') state = 'normal'
      continue
    }

    if (state === 'heredoc') {
      if (char === '\n') {
        let i = 0
        let heredocEndTag = ''
        let heredocEndFound = false
        while (peek(i) !== undefined && peek(i) !== '\n') {
          if (peek(i) === ';') {
            heredocEndFound = true
            break
          }
          heredocEndTag += peek(i++)
        }

        if (heredocEndFound && heredocEndTag.trim() === heredocTag) {
          // Consume the end tag + ;
          buffer += read(heredocEndTag.length + 1)
          state = 'normal'
        }
      }
      continue
    }
  }

  throw new Error("Couldn't parse php")
}
