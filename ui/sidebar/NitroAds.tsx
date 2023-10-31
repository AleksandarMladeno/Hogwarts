'use client';
import { useAccountStore } from '#/lib/store/account';
import Cookies from 'js-cookie';
import Script from 'next/script';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type NitroAds = {
  // eslint-disable-next-line no-unused-vars
  createAd: (id: string, options: any) => void;
  addUserToken: () => void;
  queue: ([string, any, (value: unknown) => void] | [string, any])[];
};

interface MyWindow extends Window {
  nitroAds: NitroAds;
}
declare let window: MyWindow;

window.nitroAds = window.nitroAds || {
  createAd: function () {
    return new Promise(function (e) {
      // eslint-disable-next-line prefer-rest-params
      window.nitroAds.queue.push(['createAd', arguments, e]);
    });
  },
  addUserToken: function () {
    // eslint-disable-next-line prefer-rest-params
    window.nitroAds.queue.push(['addUserToken', arguments]);
  },
  queue: [],
};

export default function NitroAds() {
  const accountStore = useAccountStore();

  useEffect(() => {
    let userId = Cookies.get('userId');
    const refreshState = async () => {
      if (!userId) {
        const state = useAccountStore.getState();
        if (state.isPatron) {
          accountStore.setIsPatron(false);
        }
        return;
      }

      const response = await fetch(
        `https://www.th.gl/api/patreon?appId=ejpjngplofkhhplmlfdhlaccobehhefmgbbojdno`,
        { credentials: 'include' },
      );
      try {
        const body = await response.json();
        if (!response.ok) {
          console.warn(body);
          accountStore.setIsPatron(false);
        } else {
          console.log(`Patreon successfully activated`);
          accountStore.setIsPatron(true, userId);
        }
      } catch (err) {
        console.error(err);
        accountStore.setIsPatron(false);
      }
    };
    refreshState();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const newUserId = Cookies.get('userId');
        if (newUserId !== userId) {
          userId = newUserId;
          refreshState();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  function createAd() {
    window['nitroAds'].createAd('hogwarts-video-nc', {
      format: 'video-nc',
      video: {},
    });
  }

  const isMd = window.matchMedia('(min-width: 768px)');

  if (accountStore.isPatron) {
    return <></>;
  }

  if (isMd.matches) {
    return (
      <>
        <div id="hogwarts-video-nc" />
        <Script
          onReady={createAd}
          data-cfasync="false"
          async
          src="https://s.nitropay.com/ads-1487.js"
        />
      </>
    );
  }
  return createPortal(
    <>
      <div id="hogwarts-video-nc" className="mt-2" />
      <Script
        onReady={createAd}
        data-cfasync="false"
        async
        src="https://s.nitropay.com/ads-1487.js"
      />
    </>,
    document.querySelector('#nitro-floating')!,
  );
}
