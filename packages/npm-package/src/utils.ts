import { basename, dirname, extname, join } from 'path'

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

export const phpTagsToConcatenation = (
  value: string | undefined,
  isInsideQuotes = false,
) => {
  if (value === undefined) return

  const startsWithPhp = /^<\?(php|=)?/i.test(value)
  const endsWithPhp = value.endsWith('?>')

  if (!startsWithPhp && !isInsideQuotes) value = `'` + value
  if (!endsWithPhp && !isInsideQuotes) value = value + `'`

  value = value.replaceAll(/<\?(?:php|=)?/gi, (_, offset) => {
    const isStart = offset === 0
    return isStart && !isInsideQuotes ? '' : `' .`
  })

  value = value.replaceAll('?>', (_, offset) => {
    const isEnd = offset === value.length - 2
    return isEnd && !isInsideQuotes ? '' : `. '`
  })

  return value.trim()
}

export const changeFileExtension = (filename: string, newExtension: string) =>
  join(
    dirname(filename),
    `${basename(filename, extname(filename))}${newExtension}`,
  )
