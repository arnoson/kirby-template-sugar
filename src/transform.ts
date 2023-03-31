import { Parser } from 'htmlparser2'
import MagicString from 'magic-string'

const entriesToPhp = (entries: Record<string, any>) =>
  entries.map(([key, value]) => `'${key}' => ${value}`).join(', ')

const resolveValue = (value: string) => {
  const match = value.match(/^<\?=(.* )\?>$/s)
  const valueIsPhp = !!match
  return valueIsPhp ? match[1].trim() : `'${value}'`
}

const parseLine = (line: string, attributes: Record<string, string>) => {
  const matches = line.match(/[\s\S](@?[\w-]+)="/g)
  if (!matches) return

  const props = []
  const attr = []
  const indent = line.match(/^[\s\t]*/)?.[0] ?? ''

  for (const match of matches) {
    const key = match.slice(0, -2).trim()
    const isProp = key.startsWith('@')
    const value = resolveValue(attributes[key])
    const name = isProp ? key.slice(1) : key
    if (isProp) props.push([name, value])
    else attr.push([name, value])
  }

  return { props, attr, indent }
}

const openSnippet = (
  tagHtml: string,
  tagName: string,
  isSelfClosing: boolean,
  attributes: Record<string, string>
) => {
  const name = tagName.slice(8)
  const lines = tagHtml.split('\n')
  const data: string[] = []
  const allAttr = []

  let lastIndent = ''

  for (const [i, line] of lines.entries()) {
    const { props, attr, indent } = parseLine(line, attributes) ?? {}
    const isFirstLine = i === 0
    const isLastLine = i === lines.length - 1

    lastIndent = indent ?? lastIndent

    if (attr) allAttr.push(...attr)

    if (isLastLine && !props?.length) {
      if (allAttr.length)
        data.push(`${lastIndent}${`'attr' => [${entriesToPhp(allAttr)}]`}`)
      else data.push('')
      continue
    }

    if (!props?.length && !attr?.length) {
      data.push('')
      continue
    }

    if (!props.length) {
      if (isFirstLine) {
        data.push('')
      } else {
        const keys = attr.map(([key]) => `[${key}]`)
        data.push(`${indent}// ${keys.join(' ')}`)
      }
      continue
    }

    if (isLastLine && allAttr.length) {
      props.push(['attr', `[${entriesToPhp(allAttr)}]`])
    }

    const comma = isLastLine ? '' : ','
    data.push(`${indent}${entriesToPhp(props)}${comma}`)
  }

  const args = [`'${name}'`]
  if (data.length) args.push(`[${data.join('\n')}]`)
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
