export const CONFIG = Object.freeze({
  POLL_TICKS: 20,
  COMBAT_GRACE_TICKS: 300,
  BOSS_DETECTION_RADIUS: 40,
  VILLAGE_DETECTION_RADIUS: 32,
  CAVE_Y_THRESHOLD: 45,
  DEEP_CAVE_Y_THRESHOLD: 0,
  FADE_SECONDS: 3,
  ATMOSPHERE_TRACK_ID: "skyrim:track.skyrim_atmospheres",
  EXPLORATION_GAP_MIN_TICKS: 300,
  EXPLORATION_GAP_MAX_TICKS: 900,
});

export const ENTITY_DICTIONARY = Object.freeze({
  BOSSES: new Set([
    "minecraft:ender_dragon",
    "minecraft:wither",
    "minecraft:warden",
    "minecraft:elder_guardian",
  ]),
  HOSTILES: new Set([
    "minecraft:zombie",
    "minecraft:skeleton",
    "minecraft:creeper",
    "minecraft:spider",
    "minecraft:cave_spider",
    "minecraft:witch",
    "minecraft:enderman",
    "minecraft:zombified_piglin",
    "minecraft:piglin",
    "minecraft:piglin_brute",
    "minecraft:hoglin",
    "minecraft:blaze",
    "minecraft:ghast",
    "minecraft:wither_skeleton",
    "minecraft:drowned",
    "minecraft:husk",
    "minecraft:stray",
    "minecraft:phantom",
    "minecraft:pillager",
    "minecraft:vindicator",
    "minecraft:evoker",
    "minecraft:ravager",
    "minecraft:guardian",
    "minecraft:shulker",
    "minecraft:breeze",
    "minecraft:bogged",
    "minecraft:creaking",
  ]),
});

export class Track {
  constructor(name, durationSeconds, displayName = null) {
    this.id = `skyrim:track.${name}`;
    this.durationTicks = durationSeconds * 20;

    this.displayName =
      displayName ||
      name
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }
}

export const PLAYLISTS = Object.freeze({
  exploration: [
    new Track("far_horizons", 332, "Far Horizons"),
    new Track("the_jerall_mountains", 195, "The Jerall Mountains"),
    new Track("the_white_river", 210, "The White River"),
    new Track("awake", 94, "Awake"),
    new Track("dawn", 238, "Dawn"),
    new Track("ancient_stones", 284, "Ancient Stones"),
    new Track("standing_stones", 400, "Standing Stones"),
    new Track("kyne_s_peace", 230, "Kyne's Peace"),
    new Track("under_an_ancient_sun", 220, "Under an Ancient Sun"),
    new Track("unbroken_road", 385, "Unbroken Road"),
    new Track("from_past_to_present", 305, "From Past to Present"),
    new Track("seven_thousand_steps", 65),
    new Track("wind_guide_you", 544, "Wind Guide You"),
    new Track("tundra", 231, "Tundra"),
    new Track("before_the_storm", 68),
    new Track("distant_horizons", 234, "Distant Horizons"),
    new Track("journey_s_end", 249, "Journey's End"),
    new Track("sky_above_voice_within", 238, "Sky Above, Voice Within"),
  ],
  night: [
    new Track("secunda", 124, "Secunda"),
    new Track("masser", 364, "Masser"),
    new Track("aurora", 442, "Aurora"),
    new Track("night_without_stars", 43),
  ],
  village: [
    new Track("the_city_gates", 227, "The City Gates"),
    new Track("the_streets_of_whiterun", 246, "The Streets of Whiterun"),
    new Track("solitude", 131, "Solitude"),
    new Track("imperial_throne", 142),
    new Track("around_the_fire", 191, "Around the Fire"),
    new Track("a_chance_meeting", 191),
  ],
  combat: [
    new Track("tooth_and_claw", 110),
    new Track("caught_off_guard", 72),
    new Track("death_or_sovngarde", 181),
    new Track("steel_on_steel", 104),
    new Track("blood_and_steel", 131),
    new Track("shattered_shields", 159),
    new Track("unbound", 94),
  ],
  boss: [
    new Track("dragonborn", 236, "Dragonborn"),
    new Track("one_they_fear", 195, "One They Fear"),
    new Track("watch_the_skies", 142),
  ],
  cave: [
    new Track("into_darkness", 174),
    new Track("beneath_the_ice", 255, "Beneath the Ice"),
    new Track("shadows_and_echoes", 140),
  ],
  deep_cave: [
    new Track("silence_unbroken", 143),
    new Track("silent_footsteps", 211),
    new Track("death_in_the_darkness", 157),
  ],
  rain: [
    new Track("frostfall", 207, "Frostfall"),
    new Track("into_darkness", 174),
    new Track("death_in_the_darkness", 157),
  ],
  storm: [
    new Track("watch_the_skies", 142),
    new Track("the_gathering_storm", 174, "The Gathering Storm"),
    new Track("caught_off_guard", 72),
  ],
  snow: [
    new Track("a_winter_s_tale", 201, "A Winter's Tale"),
    new Track("frostfall", 207, "Frostfall"),
    new Track("out_of_the_cold", 183, "Out of the Cold"),
    new Track("tundra", 231, "Tundra"),
  ],
  nether: [
    new Track("towers_and_shadows", 143),
    new Track("death_in_the_darkness", 157),
    new Track("the_gathering_storm", 174),
  ],
  end: [
    new Track("dragonborn", 236, "Dragonborn"),
    new Track("watch_the_skies", 142),
  ],
});
