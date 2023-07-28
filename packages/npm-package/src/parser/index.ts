import { Attribute, ParseOptions, Tag } from '../types'
import { isQuote, isWhitespace, getIndent, isCodeTag } from './utils'

let html = ''

let position: number
let isInsideHtmlTag: boolean
let isInsidePhpTag: boolean
let commentType: 'single' | 'multi' | 'html' | undefined
let openTagName: string | undefined

const resetState = () => {
  position = -1
  isInsideHtmlTag = false
  isInsidePhpTag = false
  commentType = undefined
  openTagName = undefined
}

const createTag = (data: Partial<Tag> = {}): Tag => ({
  name: '',
  attributes: [],
  isSelfClosing: false,
  startIndex: 0,
  endIndex: 0,
  lineCount: 0,
  indentBeforeEnd: '',
  ...data,
})
let tag = createTag()

const createAttribute = (data: Partial<Attribute> = {}): Attribute => ({
  name: '',
  value: '',
  isPhp: false,
  line: tag?.lineCount ?? 0,
  indent: getIndent(html, position),
  ...data,
})
let attribute = createAttribute()

const consume = () => html[++position]

const consumeUntil = (chars: string | string[], ignoreEscaped = false) => {
  let result = ''
  let prevChar = ''

  while (position < html.length - 1) {
    const isEscaped = prevChar === '\\'
    if (chars.includes(peek()) && (!ignoreEscaped || !isEscaped)) break

    const char = consume()
    result += char
    prevChar = char
  }

  return result
}

const peekBehind = (length = 1) => html.slice(position - length, position)

const peek = (length = 1) => html.slice(position + 1, position + 1 + length)

export const parse = (
  input: string,
  { onOpenTag, onCloseTag }: ParseOptions = {},
) => {
  resetState()
  html = input

  while (position < html.length - 1) {
    const char = consume()
    const nextChar = peek()
    const prevChar = peekBehind()

    const isEscaped = prevChar === '\\'
    if (isEscaped) continue

    if (char === '\n' && tag) tag.lineCount++

    // Quotes only have a special meaning inside HTML tags, like `<div id="fu">`,
    // inside PHP tags, like `<?= echo "?>" ?>` or between code tags,
    // like `<script>fu="<div>"</script>`.
    if (isInsideHtmlTag || isInsideHtmlTag || isCodeTag(openTagName)) {
      if (isQuote(char)) {
        // Read until the next unescaped quote (and consume the quote).
        const value = consumeUntil(char, true)
        consume()
        if (isInsideHtmlTag) {
          if (isInsidePhpTag) {
            // PHP tags inside HTML tags are stored as name-less attributes. So
            // we just add the quoted content to the PHP attribute.
            attribute.value += `${char}${value}${char}`
          } else {
            // A quote inside an HTML tag that is not inside a PHP tag can only
            // be an attribute value.
            attribute ??= createAttribute()
            tag.attributes.push({ ...attribute, value })
            attribute = undefined
          }
        }
        continue
      }
    }

    // Ignore comments inside code tags, like `<style>/* <div> */</style>`.
    if (isCodeTag(openTagName)) {
      // Single line comment
      if (!commentType && char === '/' && nextChar === '/') {
        commentType = 'single'
        continue
      }
      if (commentType === 'single') {
        if (char === '\n') commentType = undefined
        continue
      }

      // Multi line comment
      if (!commentType && char === '/' && nextChar === '*') {
        commentType = 'multi'
        continue
      }
      if (commentType === 'multi') {
        if (char === '*' && nextChar === '/') commentType = undefined
        continue
      }
    }

    // Ignore HTML comments.
    if (!commentType && char === '<' && peek(3) === '!--') {
      commentType = 'html'
      continue
    }
    if (commentType === 'html') {
      if (char === '>' && peekBehind(2) === '--') commentType = undefined
      continue
    }

    // Ignore PHP tags, unless the PHP tag is inside an HTML tag,
    // like `<img <?= classes('red') ?> />`. In this case we add it as a special
    // attribute with the `isPhp` flag.
    if (char === '<' && nextChar === '?') {
      isInsidePhpTag = true
      if (isInsideHtmlTag) attribute = createAttribute({ value: '<' })
      continue
    }
    if (isInsidePhpTag) {
      if (char === '>' && prevChar === '?') {
        isInsidePhpTag = false
        if (isInsideHtmlTag) {
          attribute.value += '>'
          tag.attributes.push({ ...attribute, isPhp: true })
          attribute = undefined
        }
      } else if (isInsideHtmlTag) {
        attribute ??= createAttribute()
        attribute.value += char
      }
      continue
    }

    // Inside an HTML tag we expect the tag ending or attributes.
    if (isInsideHtmlTag) {
      if (char === '>') {
        isInsideHtmlTag = false

        // Handle value-less attributes directly at the end of a tag,
        // like `<div aria-enabled>`.
        if (attribute?.name) tag.attributes.push({ ...attribute, value: '' })
        attribute = undefined

        const isCloseTag = tag.name.startsWith('/')
        const isSelfClosing = prevChar === '/'
        const name = tag.name.replace('/', '')
        tag.endIndex = position
        tag.indentBeforeEnd = isSelfClosing
          ? getIndent(html, position - 1)
          : getIndent(html, position)

        if (isCloseTag) {
          onCloseTag?.({ ...tag, name })
          openTagName = undefined
        } else {
          onOpenTag?.({ ...tag, name, isSelfClosing })
          if (!isSelfClosing) openTagName = name
        }
      } else if (isWhitespace(char)) {
        // Handle value-less attributes `<div aria-enabled class="fu">`.
        if (attribute?.name) tag.attributes.push({ ...attribute, value: '' })
        attribute = undefined
      } else if (char !== '=' && char !== '/') {
        attribute ??= createAttribute()
        attribute.name += char
      }
      continue
    }

    // Outside of an HTML tag we ignore everything and wait for a new tag.
    if (char === '<') {
      isInsideHtmlTag = true
      const startIndex = position
      const name = consumeUntil([' ', '\n', '\t', '>'])
      tag = createTag({ name, startIndex })
    }
  }
}
