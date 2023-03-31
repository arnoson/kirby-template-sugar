import { Parser } from 'htmlparser2'
import MagicString from 'magic-string'
import {
  getAttributePosition,
  getIndentation,
  joinLines,
  resolveValue,
} from './utils'

const openSnippet = (
  tagHtml: string,
  tagName: string,
  isSelfClosing: boolean,
  attributes: Record<string, string>
) => {
  const name = tagName.slice(8)
  const inputLines = tagHtml.split('\n')
  const lastLineIndex = inputLines.length - 1
  const attributeEntries = Object.entries(attributes)
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
    const { line, indentation } = getAttributePosition(key, tagHtml)
    const isLast = index === attributeEntries.length - 1
    const comma = isLast ? '' : ','
    const text = `${indentation}'${key}' => ${resolveValue(value)}${comma}`
    return { text, line }
  })

  const indentation = getIndentation(inputLines[lastLineIndex])
  const lastLine = {
    text: `${indentation}])${slots}); ?>`,
    line: lastLineIndex,
  }

  return joinLines([firstLine, ...attributeLines, lastLine])
}

const closeSnippet = (tagName: string) => {
  const name = tagName.slice(8)
  return `<?php endsnippet(/* ${name} */); ?>`
}

const openSlot = (tagName: string) => {
  const name = tagName.slice(5)
  return name ? `<?php slot('${name}'); ?>` : `<?php slot(); ?>`
}

const closeSlot = (tagName: string) => {
  const name = tagName.slice(5)
  return name ? `<?php endslot(/* ${name} */); ?>` : `<?php endslot(); ?>`
}

export const transform = (input: string) => {
  const output = new MagicString(input)

  const parser = new Parser({
    onopentag(tagName, attributes) {
      const isSelfClosing = input[parser.endIndex - 1] === '/'
      const { startIndex, endIndex } = parser
      const tagHtml = input.slice(parser.startIndex, parser.endIndex + 1)

      const overwrite = tagName.startsWith('snippet:')
        ? openSnippet(tagHtml, tagName, isSelfClosing, attributes)
        : tagName.startsWith('slot')
        ? openSlot(tagName)
        : null

      if (overwrite !== null)
        output.overwrite(startIndex, endIndex + 1, overwrite)
    },

    onclosetag(tagName, isImplied) {
      if (isImplied) return

      const overwrite = tagName.startsWith('snippet:')
        ? closeSnippet(tagName)
        : tagName.startsWith('slot')
        ? closeSlot(tagName)
        : null

      const { startIndex, endIndex } = parser
      if (overwrite !== null)
        output.overwrite(startIndex, endIndex + 1, overwrite)
    },
  })

  parser.write(input)
  parser.end()
  return output.toString()
}
