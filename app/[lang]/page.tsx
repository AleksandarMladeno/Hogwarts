import { getAlternates, loadDictionary } from '#/lib/i18n/settings';
import { getNodes } from '#/lib/nodes';
import { getURL } from '#/lib/utils';
import FixedBox from '#/ui/FixedBox';
import HogwartsLevelSelect from '#/ui/map/HogwartsLevelSelect';
import Nodes from '#/ui/map/Nodes';
import Player from '#/ui/map/Player';
import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
const HogwartsMap = nextDynamic(() => import('#/ui/map/HogwartsMap'), {
  ssr: false,
});

export async function generateMetadata({
  params: { lang },
}: {
  params: { lang: string };
}): Promise<Metadata> {
  const { global: globalTranslations } = await loadDictionary(lang);

  return {
    title: globalTranslations.map,
    alternates: {
      canonical: getURL(`/${lang}`),
      languages: getAlternates(),
    },
  };
}

export default async function Page({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const nodes = getNodes({ language: lang });
  return (
    <div className="h-full-height w-full relative">
      <HogwartsMap>
        <FixedBox className="left-4 bottom-0 flex justify-center space-x-2">
          <HogwartsLevelSelect />
          <Player />
        </FixedBox>
        <Nodes nodes={nodes} />
      </HogwartsMap>
    </div>
  );
}
