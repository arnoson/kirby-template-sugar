import {
  getAttributeInfo,
  getIndentation,
  joinLines,
  resolveValue,
} from '../utils'

const match = (tag: string) => tag.startsWith('layout')

const transformOpenTag = (
  tag: string,
  html: string,
  attributes: Record<string, string>
): string => {
  const name = tag.slice(7) || 'default'
  const inputLines = html.split('\n')
  const lastLineIndex = inputLines.length - 1
  const attributeEntries = Object.entries(attributes)

  // Take a shortcut if there are no attributes to render
  // Todo: make sure line length stays the same.
  if (!attributeEntries.length) {
    return name ? `<?php layout('${name}'); ?>` : `<?php layout(); ?>`
  }

  const firstLine = {
    text: `<?php layout('${name}', __snippetData([`,
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
    text: `${indentation}])); ?>`,
    line: lastLineIndex,
  }

  return joinLines([firstLine, ...attributeLines, lastLine])
}

// Layouts don't have a close tag
const transformCloseTag = () => ''

export const layout = { match, transformOpenTag, transformCloseTag }
