import { Tag } from '../parser'

const match = ({ name }: Tag) => name.startsWith('slot')

const transformOpenTag = (tag: Tag) => {
  const [, name] = tag.name.split(':')
  return name ? `<?php slot('${name}'); ?>` : `<?php slot(); ?>`
}

const transformCloseTag = (tag: Tag) => {
  const [, name] = tag.name.split(':')
  return name ? `<?php endslot(/* ${name} */); ?>` : `<?php endslot(); ?>`
}

export const slot = { match, transformOpenTag, transformCloseTag }
