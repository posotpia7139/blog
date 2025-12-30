import { visit } from 'unist-util-visit';

export function rehypeMidlineEllipsis() {
  return (tree) => {
    visit(tree, 'text', (node) => {
      let value = node.value;
      let modified = false;

      // 1. U+2026 (…) -> U+22EF (⋯)
      if (value.includes('…')) {
        value = value.replace(/…/g, '⋯');
        modified = true;
      }

      // 2. ... (점 3개) -> U+22EF (⋯)
      if (value.includes('...')) {
        value = value.replace(/\.{3,}/g, (match) => {
            const count = Math.floor(match.length / 3);
            const remainder = match.length % 3;
            return '⋯'.repeat(count) + '.'.repeat(remainder);
        });
        modified = true;
      }

      if (modified) {
        node.value = value;
      }
    });
  };
}
