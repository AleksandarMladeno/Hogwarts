'use client';
import type { Translations } from '#/lib/i18n/types';
import { useAccountStore } from '#/lib/store/account';
import dynamic from 'next/dynamic';
import DiscordLink from '../DiscordLink';
import GitHubLink from '../GitHubLink';

const OverwolfStatus = dynamic(() => import('./OverwolfStatus'), {
  ssr: false,
});

const WebsiteStatus = dynamic(() => import('./WebsiteStatus'), {
  ssr: false,
});

const NitroAds = dynamic(() => import('./NitroAds'), {
  ssr: false,
});

export default function ContextSwitch({
  translations,
}: {
  translations: Translations;
}) {
  const accountStore = useAccountStore();

  const isOverwolfIframe =
    window.top && navigator.userAgent.includes('OverwolfClient');

  return (
    <>
      <div className="flex-1 border-b border-gray-800 overflow-auto flex flex-col gap-2 p-2">
        {isOverwolfIframe ? (
          <OverwolfStatus translations={translations} />
        ) : (
          <WebsiteStatus translations={translations} />
        )}
        <DiscordLink />
        <GitHubLink />
      </div>
      {!accountStore.isPatron && (
        <>
          <a
            href="https://www.th.gl/support-me"
            target="_blank"
            className="text-center"
            data-i18n
          >
            Get rid of ads and support me on Patreon
          </a>
          {isOverwolfIframe ? (
            <div
              className={`w-[400px] h-[300px] bg-gray-900 bg-[url('/assets/ads-bg.jpg')] bg-cover bg-center bg-no-repeat grayscale brightness-75 `}
            />
          ) : (
            <NitroAds />
          )}
        </>
      )}
    </>
  );
}
