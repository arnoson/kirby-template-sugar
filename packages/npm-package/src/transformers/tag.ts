import { Attribute, Tag } from '../types'
import { joinLines } from '../utils'

// We can leave most HTML tags as is. We only have to transform them if they use
// the CSS variable attribute syntax, like `<div --color="red" >`.
const match = ({ attributes }: Tag) =>
  attributes.some(({ name }) => name?.startsWith('--'))

const transformOpenTag = (tag: Tag) => {
  const firstLine = {
    text: `<${tag.name}`,
    line: 0,
  }

  // All CSS variables have to be grouped into a `style` attribute, so we have
  // to position them one after another. So some attributes like
  // [class, var1, id, var2] would be sorted to [class, var1, var2, id]
  const cssVars: Attribute[] = []
  const otherAttributes: Attribute[] = []
  for (const attribute of tag.attributes) {
    const isCssVar = attribute.name?.startsWith('--')
    if (isCssVar) cssVars.push(attribute)
    else otherAttributes.push(attribute)
  }
  const firstCssVarIndex = tag.attributes.indexOf(cssVars[0])
  const lastCssVarIndex = firstCssVarIndex + cssVars.length - 1
  const sortedAttributes = otherAttributes
  sortedAttributes.splice(firstCssVarIndex, 0, ...cssVars)

  const attributeLines = sortedAttributes.map((attribute, index) => {
    const { name, indent } = attribute
    const isCssVar = attribute.name?.startsWith('--')
    const isFirstCssVar = index === firstCssVarIndex
    const isLastCssVar = index === lastCssVarIndex
    const isOnlyCssVar = isFirstCssVar && isLastCssVar

    let value = attribute.value
    // Allow css var shorthands: `<div --var="--fu" />` will be the same as
    // `<div --var="var(--fu)" />`.
    if (isCssVar) value = value?.startsWith('--') ? `var(${value})` : value

    let text = indent
    if (isOnlyCssVar) {
      text += `style="${name}: ${value}"`
    } else if (isFirstCssVar) {
      text += `style="${name}: ${value};`
    } else if (isLastCssVar) {
      text += `${name}: ${value}"`
    } else if (isCssVar) {
      text += `${name}: ${value};`
    } else if (attribute.isPhp) {
      text += value
    } else {
      text += value === undefined ? name : `${name}="${value}"`
    }

    return { text, line: attribute.line }
  })

  const lastLine = {
    text: `${tag.indentBeforeEnd}>`,
    line: tag.lineCount,
  }

  return joinLines([firstLine, ...attributeLines, lastLine])
}

const transformCloseTag = () => undefined

export const tag = { match, transformOpenTag, transformCloseTag }
