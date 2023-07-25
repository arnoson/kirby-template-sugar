import {
  getAttributeInfo,
  getIndentation,
  joinLines,
  prepareAttributes,
  resolveCssValue,
  resolveValue,
} from '../utils'

const match = (tag: string) => tag.startsWith('layout')

const transformOpenTag = (
  tag: string,
  html: string,
  attributesRaw: Record<string, string>,
): string => {
  const name = tag.slice(7) || 'default'
  const inputLines = html.split('\n')
  const lastLineIndex = inputLines.length - 1
  const attributes = prepareAttributes(attributesRaw, html)

  // Take a shortcut if there are no attributes to render
  // Todo: make sure line length stays the same.
  if (!attributes.length) {
    return name ? `<?php layout('${name}'); ?>` : `<?php layout(); ?>`
  }

  const firstLine = {
    text: `<?php layout('${name}', __snippetData([`,
    line: 0,
  }

  const attributeLines = attributes.map((attribute, index) => {
    const { value, name, line, indentation, isCssVar, cssVarPosition } =
      attribute

    const isLast = index === attributes.length - 1
    const comma = isLast ? '' : ','

    // Add and resolve attributes and group all css variables inside a `style`
    // attribute.
    const text =
      cssVarPosition === 'only'
        ? `${indentation}'style' => '${name}: ${resolveCssValue(value)}'`
        : cssVarPosition === 'first'
        ? `${indentation}'style' => '${name}: ${resolveCssValue(value)}; `
        : cssVarPosition === 'last'
        ? `${indentation}${name}: ${resolveCssValue(value)}'${comma}`
        : isCssVar
        ? `${indentation}${name}: ${resolveCssValue(value)}; `
        : `${indentation}'${name}' => ${resolveValue(value)}${comma}`

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
