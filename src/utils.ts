export const serializeToPhp = (obj: object) => {
  const result = Object.entries(obj)
    .map(([key, value]) => `'${key}' => ${value}`)
    .join(', ')
  return `[${result}]`
}
