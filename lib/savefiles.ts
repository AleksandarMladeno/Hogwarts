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

const MAGIC = new Uint8Array([0x47, 0x56, 0x41, 0x53]); // GVAS
const DB_START = new Uint8Array([
  0x52, 0x61, 0x77, 0x44, 0x61, 0x74, 0x61, 0x62, 0x61, 0x73, 0x65, 0x49, 0x6d,
  0x61, 0x67, 0x65,
]); // RawDatabaseImage

export async function extractDatabase(file: File) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);

  // Check magic
  const magic = new Uint8Array(buffer, 0, 4);
  if (magic.toString() !== MAGIC.toString()) {
    throw new Error('Invalid file');
  }

  // Find pointer to the "RawDatabaseImage" property
  const dbImageStart = aob(buffer, DB_START);
  if (dbImageStart === -1) {
    throw new Error('Invalid file');
  }

  const sizePtr = dbImageStart + 61; // There's 61 bytes of metadata before the size (including the name of the property)
  const offsetPtr = sizePtr + 4; // Size is 4 bytes long

  const size = view.getUint32(sizePtr, true);

  // Extract the raw data from the file
  return new Uint8Array(buffer, offsetPtr, size);
}

// Simple AOB implementaiton for ArrayBuffer
// (Search for binary pattern inside bigger binary array)
function aob(buffer: ArrayBuffer, search: Uint8Array) {
  const arr = new Uint8Array(buffer);
  const len = arr.length;
  const searchLen = search.length;
  let i = 0;
  while (i < len) {
    let j = 0;
    while (j < searchLen && arr[i + j] === search[j]) {
      j++;
    }
    if (j === searchLen) {
      return i;
    }
    i++;
  }
  return -1;
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
