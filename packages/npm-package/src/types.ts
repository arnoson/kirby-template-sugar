export interface Options {
  outDir?: string
  outFile?: string
  root?: string
}

export interface Attribute {
  name: string
  value: string
  isPhp: boolean
  line: number
  indent: string
}

export interface Tag {
  name: string
  attributes: Attribute[]
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
