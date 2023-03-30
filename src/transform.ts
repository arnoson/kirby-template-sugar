import { Parser } from 'htmlparser2'
import MagicString from 'magic-string'
import { serializeToPhp } from './utils'

const openSnippet = (
  tagName: string,
  isSelfClosing: boolean,
  attributes: Record<string, string>
) => {
  const name = tagName.slice(8)

  const snippetData = {}
  const htmlAttributes = {}
  for (let [key, value] of Object.entries(attributes)) {
    if (key.startsWith('@')) {
      key = key.slice(1)

      const match = value.match(/^<\?=(.* )\?>$/s)
      const valueIsPhp = !!match
      value = valueIsPhp ? match[1].trim() : `'${value}'`

      snippetData[key] = value
    } else {
      htmlAttributes[key] = `'${value}'`
    }
  }

  if (Object.keys(htmlAttributes).length)
    snippetData['attr'] = serializeToPhp(htmlAttributes)

  const args = [`'${name}'`]
  if (Object.keys(snippetData).length) args.push(serializeToPhp(snippetData))
  if (!isSelfClosing) args.push('slots: true')

  return `<?php snippet(${args.join(', ')}); ?>`
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
      console.log(attributes)
      const isSelfClosing = input[parser.endIndex - 1] === '/'

      const text = input.slice(parser.startIndex, parser.endIndex + 1)
      const lines = text.split('\n').length

      const overwrite = tagName.startsWith('snippet:')
        ? openSnippet(tagName, isSelfClosing, attributes)
        : tagName.startsWith('slot')
        ? openSlot(tagName)
        : null

      const { startIndex, endIndex } = parser
      if (overwrite !== null)
        output.overwrite(
          startIndex,
          endIndex + 1,
          overwrite + '\n'.repeat(lines - 1)
        )
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
