export const isWhitespace = (char: string) =>
  char === ' ' || char === '\t' || char === '\n'

export const isQuote = (char: string) =>
  char === `'` || char === `"` || char === '`'

export const isCodeTag = (name: string) => name === 'script' || name === 'style'

export const getIndent = (string: string, position: number) => {
  let indent = ''
  while (position >= 0) {
    const char = string[--position]
    if (char === ' ' || char === '\t') indent += char
    else break
  }
  return indent
}
