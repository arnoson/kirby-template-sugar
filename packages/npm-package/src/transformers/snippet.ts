import {
  getAttributeInfo,
  getIndentation,
  joinLines,
  resolveValue,
} from '../utils'

const match = (tag: string) => tag.startsWith('snippet:')

const transformOpenTag = (
  tag: string,
  html: string,
  attributes: Record<string, string>
): string => {
  const name = tag.slice(8)
  const inputLines = html.split('\n')
  const lastLineIndex = inputLines.length - 1
  const attributeEntries = Object.entries(attributes)
  const isSelfClosing = html.endsWith('/>')
  const slots = isSelfClosing ? '' : ', slots: true'

  // Take a shortcut if there are no attributes to render
  // Todo: make sure line length stays the same.
  if (!attributeEntries.length) {
    return `<?php snippet('${name}'${slots}); ?>`
  }

  const firstLine = {
    text: `<?php snippet('${name}', __snippetData([`,
    line: 0,
  }

  const attributeLines = attributeEntries.map(([key, value], index) => {
    const { line, indentation, name } = getAttributeInfo(key, html)
    const isLast = index === attributeEntries.length - 1
    const comma = isLast ? '' : ','
    const text = `${indentation}'${name}' => ${resolveValue(value)}${comma}`
    return { text, line }
  })

  const indentation = getIndentation(inputLines[lastLineIndex])
  const lastLine = {
    text: `${indentation}])${slots}); ?>`,
    line: lastLineIndex,
  }

  return joinLines([firstLine, ...attributeLines, lastLine])
}

const transformCloseTag = (tag: string) => {
  const name = tag.slice(8)
  return `<?php endsnippet(/* ${name} */); ?>`
}

export const snippet = { match, transformOpenTag, transformCloseTag }
