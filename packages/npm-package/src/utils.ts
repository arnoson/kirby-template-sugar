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

export const getIndentation = (line: string): string =>
  line.match(/^[ \t]+/)?.[0] || ''

export const getAttributeInfo = (key: string, html: string) => {
  // `key` is parsed lowercase, so we have to search in the lowercase version
  // of the html.
  const index = html.toLowerCase().indexOf(`${key}="`)
  const lines = html.substring(0, index).split('\n')
  const indentation = getIndentation(lines[lines.length - 1])
  const line = lines.length - 1

  // Extract the case sensitive name from the non-lowercase html.
  const name = html.substring(index, index + key.length)
  return { line, indentation, name }
}

export const resolveValue = (value: string) => {
  const match = value.match(/^<\?(?:php|=)?(.*)\?>$/s)
  const valueIsPhp = !!match
  return valueIsPhp ? match[1].trim() : `'${value}'`
}

export const resolveCssValue = (value: string) => {
  const valueIsCssVar = value.startsWith('--')
  return valueIsCssVar ? `var(${value})` : value
}

export const changeFileExtension = (filename: string, newExtension: string) =>
  join(
    dirname(filename),
    `${basename(filename, extname(filename))}${newExtension}`,
  )

export const prepareAttributes = (
  attributes: Record<string, string>,
  html: string,
) => {
  const entries = Object.entries(attributes)

  const cssVars = []
  const rest = []
  for (const attribute of entries) {
    const isCssVar = attribute[0].startsWith('--')
    if (isCssVar) cssVars.push(attribute)
    else rest.push(attribute)
  }

  const firstCssVarIndex = entries.indexOf(cssVars[0])
  const lastCssVarIndex =
    firstCssVarIndex + firstCssVarIndex + cssVars.length - 1

  const sortedAttributes = rest
  sortedAttributes.splice(firstCssVarIndex, 0, ...cssVars)

  return sortedAttributes.map(([key, value], index) => {
    const { line, indentation, name } = getAttributeInfo(key, html)

    const isCssVar = index >= firstCssVarIndex && index <= lastCssVarIndex
    const isFirstCssVar = index === firstCssVarIndex
    const isLastCssVar = index === lastCssVarIndex
    const isOnlyCssVar = isFirstCssVar && isLastCssVar

    const cssVarPosition = isOnlyCssVar
      ? 'only'
      : isFirstCssVar
      ? 'first'
      : isLastCssVar
      ? 'last'
      : undefined

    return { key, name, value, line, indentation, isCssVar, cssVarPosition }
  })
}
