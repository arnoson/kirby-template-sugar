export interface Options {
  outDir?: string
  outFile?: string
  root?: string
  /**
   * @deprecated Allows CSS var shorthands like `--y="--some-variable"` instead
   * of `--y="var(--some-variable)"`. This is enabled by default for backwards
   * compatibility, but will be removed in the next major version. Set this to
   * `false` to opt out and silence the deprecation warning.
   */
  cssVarShorthand?: boolean
}

export interface Attribute {
  name?: string
  value?: string
  isPhp: boolean
  line: number
  indent: string
}

export interface Tag {
  name: string
  attributes: Attribute[]
  isCloseTag: boolean
  isSelfClosing: boolean
  lineCount: number
  startIndex: number
  endIndex: number
  indentBeforeEnd: string
}

export interface ParseOptions {
  onOpenTag?: (tag: Tag) => void
  onCloseTag?: (tag: Tag) => void
}
