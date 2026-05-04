import { Mark, markInputRule, mergeAttributes } from '@tiptap/core';

export const UnderlineMark = Mark.create({
  name: 'underline',
  parseHTML() { return [{ tag: 'u' }]; },
  renderHTML({ HTMLAttributes }) { return ['u', mergeAttributes(HTMLAttributes), 0]; },
});

export const TextStyleMark = Mark.create({
  name: 'textStyle',
  addOptions() { return { HTMLAttributes: {} }; },
  parseHTML() { return [{ tag: 'span' }]; },
  renderHTML({ HTMLAttributes }) { return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]; },
});

export const LinkMark = Mark.create({
  name: 'link',
  addAttributes() { return { href: { default: null } }; },
  parseHTML() { return [{ tag: 'a[href]' }]; },
  renderHTML({ HTMLAttributes }) { return ['a', mergeAttributes(HTMLAttributes), 0]; },
});
