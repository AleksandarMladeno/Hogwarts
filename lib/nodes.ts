import type { Database } from './database.types';
import supabase from './supabase-browser';

export const getNodes = async ({
  level,
}: {
  level: number;
}): Promise<Node[]> => {
  const bottomZValue = bottomZValues[level.toString()] ?? -100000;
  const topZValue = bottomZValues[(level + 1).toString()] ?? 0;

  const { data: nodes, error } = await supabase
    .from('nodes')
    .select()
    .gte('z', bottomZValue)
    .lt('z', topZValue)
    .eq('world', 'hogwarts');

  if (error) {
    throw error;
  }

  if (!nodes) {
    return [];
  }
  return nodes;
};

export type Node = Database['public']['Tables']['nodes']['Row'];

// Phoenix/Content/UI/Map/UI_DT_MiniMapNHogwartsLevelData.uasset
const bottomZValues: {
  [level: string]: number;
} = {
  '1': -91350.66,
  '2': -90550,
  '3': -89749,
  '4': -88975,
  '5': -88547,
  '6': -88047,
  '7': -87654,
  '8': -87398,
  '9': -86895,
  '10': -86420,
  '11': -85995,
  '12': -85450,
  '13': -84970.15,
  '14': -84600.2,
  '15': -84006.945,
  '16': -83810,
  '17': -83400,
  '18': -82889,
  '19': -82600,
  '20': -82200,
  '21': -81850,
  '22': -81500,
  '23': -81170,
  '24': -80860,
  '25': -80600,
  '26': -80350,
  '27': -80000,
  '28': -79051,
  '29': -78615,
  '30': -78350,
  '31': -78050,
  '32': -77440,
  '33': -76967,
  '34': -75885,
  '35': -75485,
  '36': -75390,
  '37': -74923,
  '38': -74500,
  '39': -74055,
  '40': -73690,
  '41': -73310,
  '42': -72885,
  '43': -71850,
  '44': -71000,
};
