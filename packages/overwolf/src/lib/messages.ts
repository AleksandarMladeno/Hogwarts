import { useAccountStore } from './account';
import { HOGWARTS_LEGACY_CLASS_ID } from './config';
import { listenToGameInfo, listenToOverlayEnablement } from './games';
import { listenToHotkeyBinding } from './hotkeys';
import { listenToSavegamesFolder } from './io';
import type { HLHook } from './plugins';
import { loadHLHookPlugin } from './plugins';
import { setLastIFramePathname } from './storage';
import {
  getPreferedWindowName,
  togglePreferedWindow,
  WINDOWS,
} from './windows';

export type MESSAGE_STATUS = {
  type: 'status';
  toggleAppHotkeyBinding: string;
  savegame: {
    name: string;
    path: string;
    body: string;
    lastUpdate: string;
  } | null;
  overlay: boolean;
  overwolfOverlayDisabled: boolean;
};

const status: MESSAGE_STATUS = {
  type: 'status',
  toggleAppHotkeyBinding: '',
  savegame: null,
  overlay: true,
  overwolfOverlayDisabled: false,
};

export type MESSAGE_REALTIME = {
  type: 'realtime';
  hlIsRunning: boolean;
  position: {
    x: number;
    y: number;
    z: number;
    pitch: number;
    roll: number;
    yaw: number;
  } | null;
};

const realtime: MESSAGE_REALTIME = {
  type: 'realtime',
  hlIsRunning: false,
  position: null,
};

export type MESSAGE_IS_PATRON = {
  type: 'isPatron';
  value: boolean;
};

export async function communicate(
  iframe: HTMLIFrameElement,
  callback: () => void,
) {
  const postMessage = iframe.contentWindow!.postMessage;
  let isListening = false;

  async function refreshPreferedWindowName() {
    const preferedWindowName = await getPreferedWindowName();
    status.overlay = preferedWindowName === WINDOWS.OVERLAY;
    postMessage(status, '*');
  }

  async function postStatus() {
    if (isListening) {
      postMessage(status, '*');
      return;
    }
    isListening = true;

    await refreshPreferedWindowName();

    listenToSavegamesFolder((savegame) => {
      status.savegame = savegame;
      postMessage(status, '*');
    });

    listenToHotkeyBinding('toggle_app', (binding) => {
      status.toggleAppHotkeyBinding = binding;
      postMessage(status, '*');
    });

    listenToOverlayEnablement(HOGWARTS_LEGACY_CLASS_ID, (enabled) => {
      status.overwolfOverlayDisabled = !enabled;
      postMessage(status, '*');
    });
  }

  window.addEventListener('message', (message) => {
    const data = message.data as unknown;
    if (
      !data ||
      typeof data !== 'object' ||
      !('type' in data) ||
      typeof data.type !== 'string'
    ) {
      return;
    }
    switch (data.type) {
      case 'status':
        {
          postStatus();
          postMessage(realtime, '*');
          let isPatron = useAccountStore.getState().isPatron;
          postMessage(
            {
              type: 'isPatron',
              value: isPatron,
            },
            '*',
          );

          useAccountStore.subscribe((state) => {
            if (isPatron !== state.isPatron && state.isPatron) {
              isPatron = state.isPatron;
              postMessage(
                {
                  type: 'isPatron',
                  value: isPatron,
                },
                '*',
              );
            }
          });
          callback();
        }
        break;
      case 'hotkey_binding':
        location.href = `overwolf://settings/games-overlay?hotkey=toggle_app&gameId=${HOGWARTS_LEGACY_CLASS_ID}`;
        break;
      case 'overwolf_settings':
        location.href = `overwolf://store/game-settings/game-id/${HOGWARTS_LEGACY_CLASS_ID}`;
        break;
      case 'href':
        if ('href' in data && typeof data.href === 'string') {
          setLastIFramePathname(data.href);
        }
        break;
      case 'overlay':
        togglePreferedWindow().then(() => {
          refreshPreferedWindowName();
        });
        break;
    }
  });

  function listenToPlugin(plugin: HLHook) {
    plugin.InitializeOverwolf((error) => {
      if (error) {
        console.error('Failed initialization');
        setTimeout(() => {
          if (realtime.hlIsRunning) {
            listenToPlugin(plugin);
          }
        }, 1000);
      } else {
        let lastPosition: MESSAGE_REALTIME['position'] | null = null;
        const refreshPosition = () => {
          plugin.GetPlayerPositionAndRotationOverwolf((pos, rot) => {
            if (pos.X !== 0) {
              realtime.position = {
                x: +pos.X.toFixed(2),
                y: +pos.Y.toFixed(2),
                z: +pos.Z.toFixed(2),
                pitch: rot.Pitch,
                roll: rot.Roll,
                yaw: rot.Yaw,
              };
              if (
                lastPosition?.x !== realtime.position.x ||
                lastPosition.y !== realtime.position.y
              ) {
                lastPosition = realtime.position;
                postMessage(realtime, '*');
              }
            }
            if (realtime.hlIsRunning) {
              setTimeout(refreshPosition, 200);
            }
          });
        };
        setTimeout(refreshPosition, 200);
      }
    });
  }
  try {
    const plugin = await loadHLHookPlugin();
    listenToGameInfo((gameInfo) => {
      const hlIsRunning = gameInfo?.classId === HOGWARTS_LEGACY_CLASS_ID;
      if (!realtime.hlIsRunning && hlIsRunning) {
        postMessage(realtime, '*');
        listenToPlugin(plugin);
      } else if (realtime.hlIsRunning && !hlIsRunning) {
        postMessage(realtime, '*');
      }
      realtime.hlIsRunning = hlIsRunning;
    });
  } catch (error) {
    console.error(error);
  }
}
