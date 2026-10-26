import { TICKS_PER_SECOND } from "./constants.js";
import { Mode } from "./modes.js";

/**
 * @typedef {Object} Track
 * @property {string} id Evento de som registrado em `sound_definitions.json`.
 * @property {string} name
 * @property {string} displayName
 * @property {number} durationTicks
 */

/** @type {ReadonlyArray<readonly [name: string, seconds: number, displayName: string]>} */
const TRACK_TABLE = [
  ["far_horizons", 332, "Far Horizons"],
  ["the_jerall_mountains", 195, "The Jerall Mountains"],
  ["the_white_river", 210, "The White River"],
  ["awake", 94, "Awake"],
  ["dawn", 238, "Dawn"],
  ["ancient_stones", 284, "Ancient Stones"],
  ["standing_stones", 400, "Standing Stones"],
  ["kyne_s_peace", 230, "Kyne's Peace"],
  ["under_an_ancient_sun", 220, "Under an Ancient Sun"],
  ["unbroken_road", 385, "Unbroken Road"],
  ["from_past_to_present", 305, "From Past to Present"],
  ["seven_thousand_steps", 65, "Seven Thousand Steps"],
  ["wind_guide_you", 544, "Wind Guide You"],
  ["tundra", 231, "Tundra"],
  ["before_the_storm", 68, "Before the Storm"],
  ["distant_horizons", 234, "Distant Horizons"],
  ["journey_s_end", 249, "Journey's End"],
  ["sky_above_voice_within", 238, "Sky Above, Voice Within"],
  ["secunda", 124, "Secunda"],
  ["masser", 364, "Masser"],
  ["aurora", 442, "Aurora"],
  ["night_without_stars", 43, "Night Without Stars"],
  ["the_city_gates", 227, "The City Gates"],
  ["the_streets_of_whiterun", 246, "The Streets of Whiterun"],
  ["solitude", 131, "Solitude"],
  ["imperial_throne", 142, "Imperial Throne"],
  ["around_the_fire", 191, "Around the Fire"],
  ["a_chance_meeting", 191, "A Chance Meeting"],
  ["tooth_and_claw", 110, "Tooth and Claw"],
  ["caught_off_guard", 72, "Caught Off Guard"],
  ["death_or_sovngarde", 181, "Death or Sovngarde"],
  ["steel_on_steel", 104, "Steel on Steel"],
  ["blood_and_steel", 131, "Blood and Steel"],
  ["shattered_shields", 159, "Shattered Shields"],
  ["unbound", 94, "Unbound"],
  ["dragonborn", 236, "Dragonborn"],
  ["one_they_fear", 195, "One They Fear"],
  ["watch_the_skies", 142, "Watch the Skies"],
  ["into_darkness", 174, "Into Darkness"],
  ["beneath_the_ice", 255, "Beneath the Ice"],
  ["shadows_and_echoes", 140, "Shadows and Echoes"],
  ["silence_unbroken", 143, "Silence Unbroken"],
  ["silent_footsteps", 211, "Silent Footsteps"],
  ["death_in_the_darkness", 157, "Death in the Darkness"],
  ["frostfall", 207, "Frostfall"],
  ["the_gathering_storm", 174, "The Gathering Storm"],
  ["a_winter_s_tale", 201, "A Winter's Tale"],
  ["out_of_the_cold", 183, "Out of the Cold"],
  ["towers_and_shadows", 143, "Towers and Shadows"],
];

/** @type {ReadonlyMap<string, Readonly<Track>>} */
export const TRACKS_BY_NAME = new Map(
  TRACK_TABLE.map(([name, seconds, displayName]) => [
    name,
    Object.freeze({
      id: `skyrim:track.${name}`,
      name,
      displayName,
      durationTicks: seconds * TICKS_PER_SECOND,
    }),
  ])
);

/** @type {Readonly<Record<import("./modes.js").ModeId, readonly string[]>>} */
const PLAYLIST_NAMES = {
  [Mode.EXPLORATION]: [
    "far_horizons",
    "the_jerall_mountains",
    "the_white_river",
    "awake",
    "dawn",
    "ancient_stones",
    "standing_stones",
    "kyne_s_peace",
    "under_an_ancient_sun",
    "unbroken_road",
    "from_past_to_present",
    "seven_thousand_steps",
    "wind_guide_you",
    "tundra",
    "before_the_storm",
    "distant_horizons",
    "journey_s_end",
    "sky_above_voice_within",
  ],
  [Mode.NIGHT]: ["secunda", "masser", "aurora", "night_without_stars"],
  [Mode.VILLAGE]: [
    "the_city_gates",
    "the_streets_of_whiterun",
    "solitude",
    "imperial_throne",
    "around_the_fire",
    "a_chance_meeting",
  ],
  [Mode.COMBAT]: [
    "tooth_and_claw",
    "caught_off_guard",
    "death_or_sovngarde",
    "steel_on_steel",
    "blood_and_steel",
    "shattered_shields",
    "unbound",
  ],
  [Mode.BOSS]: ["dragonborn", "one_they_fear", "watch_the_skies"],
  [Mode.CAVE]: ["into_darkness", "beneath_the_ice", "shadows_and_echoes"],
  [Mode.DEEP_CAVE]: ["silence_unbroken", "silent_footsteps", "death_in_the_darkness"],
  [Mode.RAIN]: ["frostfall", "into_darkness", "death_in_the_darkness"],
  [Mode.STORM]: ["watch_the_skies", "the_gathering_storm", "caught_off_guard"],
  [Mode.SNOW]: ["a_winter_s_tale", "frostfall", "out_of_the_cold", "tundra"],
  [Mode.NETHER]: ["towers_and_shadows", "death_in_the_darkness", "the_gathering_storm"],
  [Mode.END]: ["dragonborn", "watch_the_skies"],
};

/**
 * @param {string} name
 * @returns {Readonly<Track>}
 */
function resolveTrack(name) {
  const track = TRACKS_BY_NAME.get(name);
  if (!track) throw new Error(`Faixa desconhecida no catálogo: ${name}`);
  return track;
}

/** @type {Readonly<Record<import("./modes.js").ModeId, readonly Readonly<Track>[]>>} */
export const PLAYLISTS = Object.freeze(
  /** @type {any} */ (
    Object.fromEntries(
      Object.entries(PLAYLIST_NAMES).map(([mode, names]) => [
        mode,
        Object.freeze(names.map(resolveTrack)),
      ])
    )
  )
);

/** @type {ReadonlyMap<string, Readonly<Track>>} */
const TRACKS_BY_ID = new Map([...TRACKS_BY_NAME.values()].map((track) => [track.id, track]));

/**
 * @param {string | null} id
 * @returns {Readonly<Track> | undefined}
 */
export function findTrackById(id) {
  return id === null ? undefined : TRACKS_BY_ID.get(id);
}
