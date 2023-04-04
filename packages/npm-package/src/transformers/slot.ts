const match = (tag: string) => tag.startsWith('slot')

const transformOpenTag = (tag: string) => {
  const name = tag.slice(5)
  return name ? `<?php slot('${name}'); ?>` : `<?php slot(); ?>`
}

const transformCloseTag = (tag: string) => {
  const name = tag.slice(5)
  return name ? `<?php endslot(/* ${name} */); ?>` : `<?php endslot(); ?>`
}

export const slot = { match, transformOpenTag, transformCloseTag }
