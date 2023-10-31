import type { OwAd } from '@overwolf/types/owads';
import { useAccountStore } from './lib/account';

declare global {
  interface Window {
    OwAd?: typeof OwAd;
  }
}

export default function Ads() {
  const div = document.createElement('div');
  let isPatron = useAccountStore.getState().isPatron;
  if (isPatron) {
    return;
  }
  function onOwAdReady() {
    if (typeof window.OwAd === 'undefined') {
      return;
    }

    div.className = 'ads';
    document.body.append(div);

    new window.OwAd(div, {
      size: { width: 400, height: 300 },
    });
  }
  const script = document.createElement('script');
  script.src = 'https://content.overwolf.com/libs/ads/latest/owads.min.js';
  script.async = true;
  script.onload = onOwAdReady;

  document.body.append(script);

  useAccountStore.subscribe((state) => {
    if (isPatron !== state.isPatron && state.isPatron) {
      isPatron = state.isPatron;
      script?.remove();
      div?.remove();
    }
  });
}
