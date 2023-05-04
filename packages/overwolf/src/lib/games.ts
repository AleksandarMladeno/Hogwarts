export function getRunningGameInfo(
  gameId: number,
): Promise<overwolf.games.GetRunningGameInfoResult | null> {
  return new Promise((resolve) => {
    overwolf.games.getRunningGameInfo((result) => {
      resolve(result && result.classId === gameId ? result : null);
    });
  });
}

export function listenToGameInfo(
  callback: (gameInfo: overwolf.games.RunningGameInfo | undefined) => void,
) {
  overwolf.games.onGameInfoUpdated.addListener((event) => {
    if (event.gameChanged) {
      callback(event.gameInfo);
    }
  });

  overwolf.games.getRunningGameInfo((result) => {
    callback(result);
  });
}

export function listenToOverlayEnablement(
  gameId: number,
  callback: (enabled: boolean) => void,
) {
  overwolf.settings.games.onOverlayEnablementChanged.addListener((event) => {
    if (event.gameId === gameId) {
      callback(event.enabled);
    }
  });

  overwolf.settings.games.getOverlayEnabled(gameId, (event) => {
    callback(event.enabled);
  });
}
