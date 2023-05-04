import useDidUpdate from '#/lib/hooks/use-did-update';
import { useSetSelectedNode } from '#/lib/hooks/use-selected-node';
import type { Translations } from '#/lib/i18n/types';
import type { Node } from '#/lib/nodes';
import { IconSearch } from '@tabler/icons-react';
import Image from 'next/image';
import { memo, useCallback, useMemo, useState } from 'react';
import AppLink from './AppLink';
import Button from './Button';
import Dialog from './Dialog';
import Divider from './Divider';
import { getNodeType } from '../lib/node-types';

export default function Search({
  translations,
  nodes,
}: {
  translations: Translations;
  nodes: Node[];
}) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const close = useCallback(() => setOpen(false), []);

  useDidUpdate(() => {
    const timeoutId = setTimeout(() => setSearch(value), 100);
    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button className="mx-2">
          <IconSearch size={20} /> {translations.quickSearch}
        </Button>
      }
      tooltip={translations.quickSearchTooltip}
      className="w-full max-w-2xl rounded overflow-hidden flex flex-col"
    >
      <label className="flex gap-2 p-2">
        <IconSearch className="stroke-gray-500" />{' '}
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="flex-1 outline-0 bg-transparent"
          autoFocus
          placeholder={translations.quickSearchTooltip}
        />
      </label>
      <Divider />
      <SearchResults search={search} nodes={nodes} onClick={close} />
    </Dialog>
  );
}

const SearchResults = memo(function SearchResults({
  search,
  nodes,
  onClick,
}: {
  search: string;
  nodes: Node[];
  onClick: () => void;
}) {
  const regExp = useMemo(
    () => (search ? new RegExp(search, 'i') : null),
    [search],
  );
  const setNode = useSetSelectedNode();

  const filteredNodes = useMemo(() => {
    const result: Node[] = [];
    for (const node of nodes) {
      if (result.length >= 5) {
        break;
      }
      if (!node.title) {
        continue;
      }
      if (regExp) {
        if (node.title.match(regExp)) {
          result.push(node);
        }
      } else {
        result.push(node);
      }
    }
    return result;
  }, [nodes, regExp]);

  return (
    <ul className="overflow-auto flex-1 ">
      {filteredNodes.map((node) => {
        return (
          <li key={node.id} onClick={onClick}>
            <NodeResult node={node} onClick={() => setNode(node)} />
          </li>
        );
      })}

      {filteredNodes.length === 0 && <li className="p-2">No results</li>}
    </ul>
  );
});

function NodeResult({ node, onClick }: { node: Node; onClick: () => void }) {
  const nodeType = node.nodeType ?? getNodeType(node.type);

  return (
    <AppLink
      className="p-2 flex gap-4 items-center hover:bg-gray-600"
      href={`/`}
      onClick={onClick}
    >
      <Image
        src={nodeType.icon}
        alt=""
        width={50}
        height={50}
        className="object-contain shrink-0"
        loading="lazy"
      />
      <div>
        <p className="font-semibold">{node.title || nodeType.title}</p>
        <p className="text-brand-400 text-sm">{nodeType.title}</p>
        <p className="capitalize text-gray-200 text-sm">
          {node.world}
          {node.level && ` Level ${node.level}`}
          <span className="text-gray-400 truncate ml-1">{`X: ${node.x} Y: ${node.y} Z: ${node.z}`}</span>
        </p>
      </div>
    </AppLink>
  );
}
