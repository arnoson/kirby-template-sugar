import MagicString from 'magic-string'
import { parse } from './parser'
import { slot, snippet, tag } from './transformers'
import { Options } from './types'

export const transform = (input: string, options: Options = {}) => {
  const output = new MagicString(input)
  const transformers = [snippet, slot, tag]

  parse(input, {
    onOpenTag(tag) {
      const transformer = transformers.find(({ match }) => match(tag))
      if (!transformer) return

      const transformed = transformer.transformOpenTag(tag, options)
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
