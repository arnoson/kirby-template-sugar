import { Attribute } from '../types'

export interface CssVarContext {
  isFirstCssVar: boolean
  isLastCssVar: boolean
  isOnlyCssVar: boolean
}

export interface ProcessedCssVars {
  sortedAttributes: Attribute[]
  firstCssVarIndex: number
  lastCssVarIndex: number
}

/**
 * Sorts attributes so that CSS variables are grouped together in their original position.
 * For example: [class, var1, id, var2] becomes [class, var1, var2, id]
 */
export function groupCssVariables(attributes: Attribute[]): ProcessedCssVars {
  const cssVars: Attribute[] = []
  const otherAttributes: Attribute[] = []

  for (const attribute of attributes) {
    const isCssVar = attribute.name?.startsWith('--')
    if (isCssVar) cssVars.push(attribute)
    else otherAttributes.push(attribute)
  }

  const firstCssVarIndex = attributes.indexOf(cssVars[0])
  const lastCssVarIndex = firstCssVarIndex + cssVars.length - 1
  const sortedAttributes = otherAttributes
  sortedAttributes.splice(firstCssVarIndex, 0, ...cssVars)

  return { sortedAttributes, firstCssVarIndex, lastCssVarIndex }
}

/**
 * Gets the context information for a CSS variable at a specific index
 */
export function getCssVarContext(
  index: number,
  firstCssVarIndex: number,
  lastCssVarIndex: number,
): CssVarContext {
  const isFirstCssVar = index === firstCssVarIndex
  const isLastCssVar = index === lastCssVarIndex
  const isOnlyCssVar = isFirstCssVar && isLastCssVar

  return { isFirstCssVar, isLastCssVar, isOnlyCssVar }
}

/**
 * Processes CSS variable value.
 */
export function processCssVarValue(
  value: string | undefined,
): string | undefined {
  return value
}
