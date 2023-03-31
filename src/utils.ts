/**
 * Join the provided lines, while each line provides a starting line number.
 * Create missing lines and handle lines that end/start on the same line number.
 * @example
 * joinLines([
 *  { text: 'one \ntwo ', line: 0 },
 *  { text: 'three ', line: 1 },
 *  { text: 'end ', line: 4 }
 * ])
 * // Will be:
 * `one
 * two three
 *
 * end`
 */
export const joinLines = (lines: { text: string; line: number }[]) => {
  let result = ''
  let currentLine = 0
  for (const { text, line } of lines) {
    const linesToAdd = line - currentLine

    if (linesToAdd > 0) result += '\n'.repeat(linesToAdd)
    result += text

    currentLine = result.split('\n').length - 1
  }
  return result
}

export const getIndentation = (line: string): string =>
  line.match(/^[ \t]+/)?.[0] || ''

export const getAttributePosition = (
  key: string,
  tagHtml: string
): { line: number; indentation: string } => {
  const index = tagHtml.indexOf(`${key}="`)
  const lines = tagHtml.substring(0, index).split('\n')
  const indentation = getIndentation(lines[lines.length - 1])
  const line = lines.length - 1
  return { line, indentation }
}

export const resolveValue = (value: string) => {
  const match = value.match(/^<\?=(.*)\?>$/s)
  const valueIsPhp = !!match
  return valueIsPhp ? match[1].trim() : `'${value}'`
}
