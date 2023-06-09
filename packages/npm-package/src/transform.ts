import { Parser } from 'htmlparser2'
import MagicString from 'magic-string'
import { layout, slot, snippet } from './transformers'

export const transform = (input: string) => {
  const output = new MagicString(input)
  const transformers = [snippet, slot, layout]

  const parser = new Parser({
    onopentag(tag, attributes) {
      const { startIndex, endIndex } = parser
      const html = input.slice(parser.startIndex, parser.endIndex + 1)

      for (const { match, transformOpenTag } of transformers) {
        if (!match(tag)) continue
        const transformed = transformOpenTag(tag, html, attributes)
        output.overwrite(startIndex, endIndex + 1, transformed)
        break
      }
    },

    onclosetag(tag, isImplied) {
      if (isImplied) return

      const { startIndex, endIndex } = parser
      for (const { match, transformCloseTag } of transformers) {
        if (!match(tag)) continue
        const transformed = transformCloseTag(tag)
        output.overwrite(startIndex, endIndex + 1, transformed)
        break
      }
    },
  })

  parser.write(input)
  parser.end()
  return output.toString()
}
