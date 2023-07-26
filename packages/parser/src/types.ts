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
}

export interface ParseOptions {
  onOpenTag?: (tag: Tag) => void
  onCloseTag?: (tag: Tag) => void
}
