import {
  getAttributeInfo,
  getIndentation,
  joinLines,
  prepareAttributes,
  resolveCssValue,
  resolveValue,
} from '../utils'

const sortAttributesByCssVars = (attributes) => {
  const cssVars = []
  const rest = []

  for (const attribute of attributes) {
    const isCssVar = attribute[0].startsWith('--')
    if (isCssVar) cssVars.push(attribute)
    else rest.push(attribute)
  }

  const firstCssVarIndex = attributes.indexOf(cssVars[0])
  const sortedAttributes = rest
  sortedAttributes.splice(firstCssVarIndex, 0, ...cssVars)

  return {
    sortedAttributes,
    cssVarRange: [firstCssVarIndex, firstCssVarIndex + cssVars.length - 1],
  }
}

const match = () => true

const transformOpenTag = (
  tag: string,
  html: string,
  attributesRaw: Record<string, string>,
) => {
  const inputLines = html.split('\n')
  const lastLineIndex = inputLines.length - 1
  const isSelfClosing = html.endsWith('/>')

  const firstLine = {
    text: `<${tag} `,
    line: 0,
  }

  const attributes = prepareAttributes(attributesRaw, html)

  const attributeLines = attributes.map((attribute, index) => {
    const { value, name, line, indentation, isCssVar, cssVarPosition } =
      attribute

    // Add attributes and group css variable attributes inside a `style`
    // attribute.
    const text =
      cssVarPosition === 'only'
        ? `${indentation}style="${name}: ${resolveCssValue(value)}"`
        : cssVarPosition === 'first'
        ? `${indentation}style="${name}: ${resolveCssValue(value)}; `
        : cssVarPosition === 'last'
        ? `${indentation}${name}: ${resolveCssValue(value)}"`
        : isCssVar
        ? `${indentation}${name}: ${resolveCssValue(value)}; `
        : `${indentation}${name}="${value}"`

    return { text, line }
  })

  const indentation = getIndentation(inputLines[lastLineIndex])
  const lastLine = {
    text: `${indentation}>`,
    line: lastLineIndex,
  }

  return joinLines([firstLine, ...attributeLines, lastLine])
}

const transformCloseTag = (tag: string) => {
  return `</${tag}>`
}

export const tag = { match, transformOpenTag, transformCloseTag }
