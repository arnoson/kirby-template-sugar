type Stream = {
  read(length?: number): string | undefined
  peek(offset?: number): string | undefined
}

/**
 * Read the input at the current position until we reach a php end tag `?>`.
 * Ignore the end tag in any comment or string to be consistent with how php
 * parses its code.
 */
export const readPhp = ({ read, peek }: Stream) => {
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
