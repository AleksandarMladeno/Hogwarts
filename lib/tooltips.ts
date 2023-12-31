import type { Node } from './nodes';
import { getNodeType } from './node-types';

export const createNodeTooltip = (
  node: Pick<
    Node,
    'id' | 'title' | 'titleId' | 'description' | 'nodeType' | 'type'
  >,
  discovered: boolean | null = null,
) => {
  let tooltip = '';
  const nodeType = node.nodeType ?? getNodeType(node.type);

  if (node.title) {
    tooltip += `<p class="font-bold">${node.title}</p>`;
  }
  tooltip += `<p class="text-brand-400">${nodeType.title}</p>`;
  if (node.description) {
    tooltip += `<p class="whitespace-normal w-80">${node.description}</p>`;
  }
  if (discovered) {
    tooltip += `<p class="text-bold text-discovered">Discovered</p>`;
  }

  return tooltip;
};
