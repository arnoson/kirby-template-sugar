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

// Escape characters that are special inside a PHP single-quoted string.
export const escapePhpString = (text: string) =>
  text.replaceAll('\\', '\\\\').replaceAll("'", "\\'")

const phpTagPattern = /<\?(?:php|=)?([\s\S]*?)\?>/gi

export const phpTagsToConcatenation = (
  value: string | undefined,
  isInsideQuotes = false,
) => {
  if (value === undefined) return

  // Split the value into literal text and embedded PHP code, so we can
  // escape the literal parts without touching the PHP code.
  const segments: { type: 'text' | 'code'; content: string }[] = []
  let lastIndex = 0
  for (const match of value.matchAll(phpTagPattern)) {
    const start = match.index
    if (start > lastIndex) {
      segments.push({ type: 'text', content: value.slice(lastIndex, start) })
    }
    segments.push({ type: 'code', content: match[1].trim() })
    lastIndex = start + match[0].length
  }
  if (lastIndex < value.length) {
    segments.push({ type: 'text', content: value.slice(lastIndex) })
  }
  const textSegments = segments.filter(
    (segment) => !(segment.type === 'text' && segment.content === ''),
  )
  if (textSegments.length === 0) {
    textSegments.push({ type: 'text', content: '' })
  }

  if (isInsideQuotes) {
    // The result is placed inside an outer PHP string that is already open,
    // so text stays bare and code breaks out of/back into that string.
    return textSegments
      .map((segment) =>
        segment.type === 'code'
          ? `' . ${segment.content} . '`
          : escapePhpString(segment.content),
      )
      .join('')
      .trim()
  }

  return textSegments
    .map((segment) =>
      segment.type === 'code'
        ? segment.content
        : `'${escapePhpString(segment.content)}'`,
    )
    .join(' . ')
    .trim()
}

export const changeFileExtension = (filename: string, newExtension: string) =>
  join(
    dirname(filename),
    `${basename(filename, extname(filename))}${newExtension}`,
  )

let hasWarnedAboutCssVarShorthand = false

export const warnAboutCssVarShorthand = () => {
  if (hasWarnedAboutCssVarShorthand) return
  hasWarnedAboutCssVarShorthand = true
  console.warn(
    '[kirby-template-sugar] Deprecation warning: CSS var shorthands like ' +
      '`--y="--some-variable"` are deprecated and will be removed in the next ' +
      'major version. Use `--y="var(--some-variable)"` instead and set the ' +
      '`cssVarShorthand` option to `false` to opt out early and silence this ' +
      'warning.',
  )
}
