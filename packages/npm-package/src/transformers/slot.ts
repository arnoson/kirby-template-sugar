import { Tag } from '../types'

const match = ({ name }: Tag) => name.startsWith('k:slot')

const transformOpenTag = (tag: Tag) => {
  const name = tag.attributes.find((v) => v.name === 'name')?.value
  return name ? `<?php slot('${name}'); ?>` : `<?php slot(); ?>`
}

const transformCloseTag = () => `<?php endslot(); ?>`

export const slot = { match, transformOpenTag, transformCloseTag }
