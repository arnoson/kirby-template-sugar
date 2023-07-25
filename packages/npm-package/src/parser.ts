const html = `
<!-- <div> -->
<div
  class="<?= $className ?>"
  data-ref="hallo"
  aria-enabled
  id="123"
  --var="20"
  <?= aa ?>
>
  <img id="xxx" />
</div>
`

let position = -1
let isInsideQuotes = false
let isInsideTag = false
let isInsidePhpTag = false
let isInsideHtmlComment = false
let attributes = {}

let attribute = { name: '', value: '' }
const resetAttribute = () => (attribute = { name: '', value: '' })

const isWhitespace = (char) => char === ' ' || char === '\t' || char === '\n'

const consume = () => html[++position]

const consumeUntil = (untilChars) => {
  let result = ''

  while (position < html.length - 1) {
    if (untilChars.includes(peek())) break
    result += consume()
  }

  return result
}

const peekBack = (length = 1) => html.slice(position - length, position)

const peek = (length = 1) => html.slice(position + 1, position + 1 + length)

while (position < html.length - 1) {
  const char = consume()
  const nextChar = peek()
  const prevChar = peekBack()

  const isEscaped = prevChar === '\\'
  if (isEscaped) continue

  // Handle quotes.
  if (char === '"') {
    isInsideQuotes = !isInsideQuotes
    // If we encountered the ending quote inside a <tag>, the attribute value is
    // finished and we can add it.
    if (isInsideTag && !isInsideQuotes) {
      attributes[attribute.name] = attribute.value
      resetAttribute()
    }
    continue
  }

  // Any character that is both inside quotes and inside a <tag> is part of the
  // attribute value.
  if (isInsideQuotes) {
    if (isInsideTag) attribute.value += char
    continue
  }

  if (char === '<' && peek(3) === '!--') {
    isInsideHtmlComment = true
    continue
  }

  if (isInsideHtmlComment) {
    if (char === '>' && peekBack(2) === '--') {
      isInsideHtmlComment = false
    }
    continue
  }

  // Quotes are already handled, so this catches any php tags that are not
  // attribute values.
  if (char === '<' && nextChar === '?') {
    isInsidePhpTag = true
    continue
  }

  // Ignore anything inside php tags, so don't try to parse something like this
  // as an attribute: `<div <?= classes('red') ?>`.
  if (isInsidePhpTag) {
    if (char === '>' && prevChar === '?') {
      isInsidePhpTag = false
    }
    continue
  }

  // Inside a <tag> we expect a tag ending are attributes.
  if (isInsideTag) {
    if (char === '>') {
      isInsideTag = false
      // Handle value-less attributes at the end of a tag `<div aria-enabled>`
      if (attribute.name) attributes[attribute.name] = ''
      resetAttribute()
      console.log('attributes', attributes)
      attributes = {}
    } else if (isWhitespace(char)) {
      // Handle value-less attributes `<div aria-enabled class="fu">`.
      if (attribute.name) attributes[attribute.name] = ''
      resetAttribute()
    } else if (char !== '=' && char !== '/') {
      attribute.name += char
    }
    continue
  }

  // Outside of a tag we ignore everything and only wait for a new tag.
  if (char === '<') {
    isInsideTag = true
    attributes = {}
    const tag = consumeUntil([' ', '\n', '\t', '>'])
  }
}
