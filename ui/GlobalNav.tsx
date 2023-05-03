'use client';

import type { Translations } from '#/lib/i18n/types';
import type { Node } from '#/lib/nodes';
import { cn } from '#/lib/utils';
import Icon from '#/public/assets/icon.png';
import { IconMenu2, IconX } from '@tabler/icons-react';
import Image from 'next/image';
import { useState } from 'react';
import AppLink from './AppLink';
import LanguageSelect from './LanguageSelect';
import Search from './Search';

export default function GlobalNav({
  translations,
  nodes,
}: {
  translations: Translations;
  nodes: Node[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);
  return (
    <div className="fixed z-auto top-0 flex w-full border-b border-gray-800 bg-black">
      <LogoNavItem onClick={close} />
      <button
        type="button"
        className="group absolute right-0 top-0 flex h-14 items-center gap-x-2 px-4 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="font-medium text-gray-100 group-hover:text-gray-400">
          {translations.menu}
        </div>
        {isOpen ? (
          <IconX className="block w-6 text-gray-400" />
        ) : (
          <IconMenu2 className="block w-6 text-gray-400" />
        )}
      </button>

      <div
        className={cn(
          'text-center px-4 grow md:flex md:items-center md:justify-end py-4 md:py-0 space-y-3 md:space-y-0 md:h-14',
          {
            'fixed md:static inset-x-0 bottom-0 top-14 mt-px bg-black': isOpen,
            hidden: !isOpen,
          },
        )}
      >
        <div className="md:order-last flex flex-col md:flex-row items-center gap-2">
          <Search translations={translations} nodes={nodes} />
          <LanguageSelect />
        </div>
      </div>
    </div>
  );
}

function LogoNavItem({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex h-14 items-center py-4 px-4">
      <AppLink
        href="/"
        className="flex w-full items-center gap-x-2"
        onClick={onClick}
      >
        <Image src={Icon} alt="Hogwarts.gg" height={48} />
        <p className="font-serif tracking-wide pt-1 text-brand">Hogwart$.gg</p>
      </AppLink>
    </div>
  );
}
