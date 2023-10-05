import type { Database } from 'sql.js';
import type { Node } from './nodes';

export function bodyToFile(body: string, filename: string) {
  const blob = new Blob([body], { type: 'text/plain' });
  const file = new File([blob], filename, { type: 'text/plain' });
  return file;
}
export async function readSavegame(file: File) {
  const initSqlJs = window.initSqlJs;
  if (!initSqlJs) {
    throw new Error('SQL.js not initialized');
  }
  const rawdb = await extractDatabase(file);
  const SQL = await initSqlJs({
    // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
    // You can omit locateFile completely when running in node
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });
  const db = await new SQL.Database(rawdb);
  const player = extractPlayer(db);
  return player;
}

export async function extractDatabase(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/save-file', {
    method: 'POST',
    body: formData,
  });
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

export function extractPlayer(db: Database): SavefilePlayer {
  const playerSelect = db.exec(
    `SELECT DataValue FROM MiscDataDynamic WHERE DataOwner = 'Player' AND DataName IN ('HouseID', 'LocX', 'LocY', 'LocZ', 'Pitch', 'PlayerFirstName', 'PlayerLastName', 'Roll', 'World', 'Yaw', 'Year');`,
  );
  const { values } = playerSelect[0];
  const player = {
    houseId: values[0].toString(),
    position: {
      x: +values[1],
      y: +values[2],
      z: +values[3],
      pitch: +values[4],
      roll: +values[7],
      yaw: +values[9],
      world: values[8].toString(),
    },
    firstName: values[5].toString(),
    lastName: values[6].toString(),
    year: +values[10],
  };

  const locations = extractMapLocationData(db);
  const dynamicWorldObjects = extractDynamicWorldObjects(db);

  return { ...player, locations, dynamicWorldObjects };
}

export function extractDynamicWorldObjects(db: Database) {
  const worldObjects = db.exec(
    `SELECT WorldObjectID, WorldObjectUID, XPos, YPos, ZPos FROM WorldObjectDynamic;`,
  );

  const { values } = worldObjects[0];
  const data = values.map(
    (item) =>
      ({
        id: item[1],
        x: item[2],
        y: item[3],
        z: item[4],
        nodeType: {
          value: item[0],
          title: item[0],
          icon: '/assets/icons/dynamic.webp',
        },
      } as Node),
  );
  return data;
}

export function extractMapLocationData(db: Database) {
  const mapLocationData = db.exec(
    `SELECT MapLocationID, State FROM MapLocationDataDynamic;`,
  );

  const { values } = mapLocationData[0];
  const data = (values as [string, number][]).map((value) => [
    value[0].toUpperCase(),
    value[1],
  ]) as [string, number][];
  const fastTravels = data.filter((value) => value[0].startsWith('FT_'));

  const chests = data.filter((value) => value[0].startsWith('CHEST_'));

  const collections = data.filter((value) => value[0].includes('COLLECT_'));

  const kio = data.filter((value) => value[0].startsWith('KIO_'));
  const sphinxPuzzles = data.filter((value) =>
    value[0].startsWith('SPHINXPUZZLE'),
  );
  const demiguiseStatuesOverland = data.filter((value) =>
    value[0].startsWith('KO_DEMIGUISE'),
  );
  const enemies = data.filter(
    (value) => value[0].startsWith('INT_KILL') || value[0].startsWith('KL_'),
  );
  const astronomyAltars = data.filter((value) =>
    value[0].includes('KO_ASTRONOMY'),
  );

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.data = data;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.db = db;
  }
  return {
    fastTravels: {
      values: fastTravels
        .filter((value) => value[1] !== 8)
        .map((value) => value[0]),
      max: fastTravels.length,
    },
    chests: {
      values: chests.filter((value) => value[1] !== 2).map((value) => value[0]),
      max: chests.length,
    },
    collections: {
      values: collections
        .filter((value) => value[1] !== 3)
        .map((value) => value[0]),
      max: collections.length,
    },
    fieldGuidePages: {
      values: kio.filter((value) => value[1] !== 3).map((value) => value[0]),
      max: kio.length,
    },
    sphinxPuzzles: {
      values: sphinxPuzzles
        .filter((value) => value[1] !== 3)
        .map((value) => value[0]),
      max: sphinxPuzzles.length,
    },
    demiguiseStatues: {
      values: demiguiseStatuesOverland
        .filter((value) => value[1] !== 3)
        .map((value) => value[0]),
      max: demiguiseStatuesOverland.length,
    },
    enemies: {
      values: enemies
        .filter((value) => value[1] !== 3)
        .map((value) => value[0]),
      max: enemies.length,
    },
    astronomyAltars: {
      values: astronomyAltars
        .filter((value) => value[1] !== 3)
        .map((value) => value[0]),
      max: astronomyAltars.length,
    },
  };
}

export type MapLocations = {
  fastTravels: {
    values: string[];
    max: number;
  };
  chests: {
    values: string[];
    max: number;
  };
  collections: {
    values: string[];
    max: number;
  };
  fieldGuidePages: {
    values: string[];
    max: number;
  };
  sphinxPuzzles: {
    values: string[];
    max: number;
  };
  demiguiseStatues: {
    values: string[];
    max: number;
  };
  enemies: {
    values: string[];
    max: number;
  };
  astronomyAltars: {
    values: string[];
    max: number;
  };
};
export type SavefilePlayer = {
  houseId: string;
  position: {
    x: number;
    y: number;
    z: number;
    pitch: number;
    roll: number;
    yaw: number;
    world: string;
  };
  firstName: string;
  lastName: string;
  year: number;
  locations: MapLocations;
  dynamicWorldObjects: Node[];
};
