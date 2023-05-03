import nodes from './data/locations.json' assert { type: 'json' };
import { getLocales } from './locales';
import { getLevelByZ } from './map';
import type { NodeType } from './node-types';

export const getNodes = ({ language }: { language: string }): Node[] => {
  const keys = [
    'LOCK_LEVEL_1',
    'LOCK_LEVEL_2',
    'LOCK_LEVEL_3',
    ...nodes
      .filter((node) => node.title)
      .map((node) => node.title!.toUpperCase()),
  ];
  const terms = getLocales({
    keys,
    language,
  });

  return nodes.map((node) => {
    const level = node.world === 'hogwarts' ? getLevelByZ(node.z) : null;

    const titleId = node.title;
    const isChest = node.type === 'mediumGearChest';
    const result = { ...node, level };
    if (isChest) {
      // Not sure how to find out which lock level is correct
      // const title = terms.find((term) => term.key === 'LOCK_LEVEL_1')!.value;
      // return {
      //   ...result,
      //   title,
      //   titleId,
      // };
    }
    if (!titleId) {
      return { ...result, titleId };
    }
    const term = terms.find((term) => term.key === titleId.toUpperCase())!;
    return {
      ...result,
      title: term.value,
      titleId,
      description: term.description,
    };
  });
};

export type Node = (typeof nodes)[number] & {
  level: number | null;
  description?: string | null;
  titleId?: string | null;
  nodeType?: NodeType;
};
