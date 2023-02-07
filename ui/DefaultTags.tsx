'use client';
import { getURL } from '#/lib/utils';
import { usePathname } from 'next/navigation';

// Default <head> tags we want shared across the app
const url = getURL();
export function DefaultTags() {
  const pathname = usePathname();
  const href = url.slice(0, url.length - 1) + pathname!;
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link
        href="/favicon/apple-touch-icon.png"
        rel="apple-touch-icon"
        sizes="180x180"
      />
      <link
        href="/favicon/favicon-32x32.png"
        rel="icon"
        sizes="32x32"
        type="image/png"
      />
      <link
        href="/favicon/favicon-16x16.png"
        rel="icon"
        sizes="16x16"
        type="image/png"
      />
      <link href="/favicon/site.webmanifest" rel="manifest" />
      <link href="/favicon.ico" rel="shortcut icon" />
      <link rel="canonical" href={href} />
    </>
  );
}
