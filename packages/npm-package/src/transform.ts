import MagicString from 'magic-string'
import { parse } from './parser'
import { slot, snippetOrLayout, tag } from './transformers'

export const transform = (input: string) => {
  const output = new MagicString(input)
  const transformers = [snippetOrLayout, slot, tag]

  parse(input, {
    onOpenTag(tag) {
      const transformer = transformers.find(({ match }) => match(tag))
      if (!transformer) return

      const transformed = transformer.transformOpenTag(tag)
      if (transformed !== undefined)
        output.overwrite(tag.startIndex, tag.endIndex + 1, transformed)
    },

    onCloseTag(tag) {
      const transformer = transformers.find(({ match }) => match(tag))
      if (!transformer) return

      const transformed = transformer.transformCloseTag(tag)
      if (transformed !== undefined)
        output.overwrite(tag.startIndex, tag.endIndex + 1, transformed)
    },
  })

  return output.toString()
}
