import { Attribute, Tag } from '../types'
import { joinLines, phpTagsToConcatenation } from '../utils'

const match = ({ name }: Tag) =>
  name.startsWith('snippet:') || name.startsWith('layout')

const transformOpenTag = (tag: Tag): string => {
  const [type, name = 'default'] = tag.name.split(':')

  const slots = type === 'layout' || tag.isSelfClosing ? '' : ', slots: true'
  if (!tag.attributes.length) return `<?php ${type}('${name}'${slots}); ?>`

  const firstLine = {
    text: `<?php ${type}('${name}', __snippetData([`,
    line: 0,
  }

  // All CSS variables have to be grouped into a `style` attribute, so we have
  // to position them one after another. So some attributes like
  // [class, var1, id, var2] would be sorted to [class, var1, var2, id]
  const cssVars: Attribute[] = []
  const otherAttributes: Attribute[] = []
  for (const attribute of tag.attributes) {
    if (attribute.name === undefined) console.log('yikes!')
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
    const isCssVar = name?.startsWith('--')
    const isPhpVar = name?.startsWith('$')
    const isFirstCssVar = index === firstCssVarIndex
    const isLastCssVar = index === lastCssVarIndex
    const isOnlyCssVar = isFirstCssVar && isLastCssVar

    // CSS vars are grouped into a style attribute, so we are already inside
    // inside quotes: `'style' => '--a: fu; --b: bar'`, whereas normal
    // attributes are not inside quotes and we have to add them: `'attr' => 'string'`.
    let isInsideQuotes = isCssVar

    // PHP tags inside attribute values would generate invalid code (because we
    // are already inside PHP): `'attr' => 'id-<?= $id ?>'`. So we need to
    // translate them to string concatenation: `'attr' => 'id-' . $id`.
    let value = phpTagsToConcatenation(attribute.value, isInsideQuotes)

    // Allow css var shorthands: `<div --var="--fu" />` will be the same as
    // `<div --var="var(--fu)" />`.
    if (isCssVar) value = value?.startsWith('--') ? `var(${value})` : value

    // Allow php var shorthands: `<div $fu />` will be the same as
    // `<div $fu="<? $fu ?>" >`.
    if (isPhpVar) value ??= name

    let text = indent
    if (isOnlyCssVar) {
      text += `'style' => '${name}: ${value}'`
    } else if (isFirstCssVar) {
      text += `'style' => '${name}: ${value};`
    } else if (isLastCssVar) {
      text += `${name}: ${value}',`
    } else if (isCssVar) {
      text += `${name}: ${value};`
    } else {
      text += `'${name}' => ${value ?? "''"},`
    }

    return { text, line: attribute.line }
  })

  const lastLine = {
    text: `${tag.indentBeforeEnd}])${slots}); ?>`,
    line: tag.lineCount,
  }

  return joinLines([firstLine, ...attributeLines, lastLine])
}

const transformCloseTag = (tag: Tag) => {
  const [type, name] = tag.name.split(':')
  return type === 'snippet' ? `<?php endsnippet(/* ${name} */); ?>` : ''
}

export const snippetOrLayout = { match, transformOpenTag, transformCloseTag }
