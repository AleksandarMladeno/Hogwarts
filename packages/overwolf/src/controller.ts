import { useAccountStore } from './lib/account';
import { HOGWARTS_LEGACY_CLASS_ID } from './lib/config';
import { getRunningGameInfo } from './lib/games';
import { waitForOverwolf } from './lib/overwolf';
import {
  closeMainWindow,
  closeWindow,
  getPreferedWindowName,
  moveToOtherScreen,
  restoreWindow,
  toggleWindow,
  WINDOWS,
} from './lib/windows';

waitForOverwolf().then(() => {
  initController();
});

async function initController() {
  console.log('Init controller');
  const openApp = async (
    event?: overwolf.extensions.AppLaunchTriggeredEvent,
  ) => {
    let userId = useAccountStore.getState().userId;
    if (event?.origin === 'urlscheme') {
      const matchedUserId = decodeURIComponent(event.parameter).match(
        'userId=([^&]*)',
      );
      const newUserId = matchedUserId ? matchedUserId[1] : null;
      if (newUserId) {
        userId = newUserId;
      }
    }
    if (userId) {
      const accountStore = useAccountStore.getState();
      const response = await fetch(`https://www.th.gl/api/patreon/overwolf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: 'ejpjngplofkhhplmlfdhlaccobehhefmgbbojdno',
          userId,
        }),
      });
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
    }

    const runningGameInfo = await getRunningGameInfo(HOGWARTS_LEGACY_CLASS_ID);

    if (runningGameInfo) {
      const preferedWindowName = await getPreferedWindowName();
      const windowId = await restoreWindow(preferedWindowName);
      if (preferedWindowName === WINDOWS.DESKTOP) {
        moveToOtherScreen(windowId, runningGameInfo.monitorHandle.value);
      }
    } else {
      restoreWindow(WINDOWS.DESKTOP);
    }
  };
  openApp();

  overwolf.extensions.onAppLaunchTriggered.addListener(openApp);

  overwolf.settings.hotkeys.onPressed.addListener(async (event) => {
    if (event.name === 'toggle_app') {
      const preferedWindowName = await getPreferedWindowName();
      toggleWindow(preferedWindowName);
    }
  });

  overwolf.games.onGameInfoUpdated.addListener(async (event) => {
    if (
      event.runningChanged &&
      event.gameInfo?.classId === HOGWARTS_LEGACY_CLASS_ID
    ) {
      const preferedWindowName = await getPreferedWindowName();
      if (event.gameInfo.isRunning) {
        if (preferedWindowName === WINDOWS.OVERLAY) {
          restoreWindow(WINDOWS.OVERLAY);
          closeWindow(WINDOWS.DESKTOP);
        } else {
          restoreWindow(WINDOWS.DESKTOP);
          closeWindow(WINDOWS.OVERLAY);
        }
      } else if (preferedWindowName === WINDOWS.OVERLAY) {
        closeMainWindow();
      }
    }
  });
}
