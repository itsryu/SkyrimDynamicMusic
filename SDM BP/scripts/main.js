import {
  world,
  system,
} from "@minecraft/server";

/**
 * @typedef {"exploration" | "night" | "combat" | "boss" | "cave" | "village" | "whiterun" | "nether" | "end" | "loading"} MusicMode
 */

/**
 * @typedef {Object} Track
 * @property {string} id - sound identifier.
 * @property {number} durationTicks - track duration in server ticks (20 ticks = 1 second).
 */

/**
 * @typedef {Object} PlayerMusicContext
 * @property {MusicMode} [mode] - currently active playing music mode.
 * @property {string} [currentTrack] - identifier of the active track.
 * @property {string} [previousTrack] - identifier of the previous track to avoid immediate repetition.
 * @property {number} nextTrackTick - tick timestamp when track transition checks occur.
 * @property {number} combatUntilTick - tick timestamp marking active combat state end.
 * @property {number} lastWarnTick - cooldown tick marker for console warning suppression.
 * @property {boolean} isLoading - indicates whether the player is in loading/menu state.
 * @property {import("@minecraft/server").SoundInstance} [atmosphereSound] - persistent background loop instance.
 * @property {boolean} isAtmosphereDumbed - track if background loop volume is lowered.
 */

const CONFIG = Object.freeze({
  /** polling loop interval in ticks (20 ticks = 1 sec) */
  POLL_TICKS: 20,
  /** duration of active combat state following damage events (15 sec) */
  COMBAT_GRACE_TICKS: 300,
  /** entity detection radius for boss mobs */
  BOSS_DETECTION_RADIUS: 40,
  /** entity detection radius for village detection */
  VILLAGE_DETECTION_RADIUS: 32,
  /** y-level threshold for subterranean cave music */
  CAVE_Y_THRESHOLD: 45,
  /** audio crossfade duration in seconds */
  FADE_SECONDS: 2,
  /** normal music track playback volume [0.0 - 1.0] */
  MUSIC_VOLUME: 0.72,
  /** background skyrim_atmospheres full volume */
  ATMOSPHERE_FULL_VOLUME: 0.25,
  /** background skyrim_atmospheres lowered volume during active soundtrack */
  ATMOSPHERE_DUCK_VOLUME: 0.05,
  /** background skyrim_atmospheres sound identifier */
  ATMOSPHERE_TRACK_ID: "skyrim:track.skyrim_atmospheres",
  /** menu & loading theme sound identifier */
  MENU_TRACK_ID: "skyrim:track.dragonborn",
  /** minimum gap between ambient tracks */
  EXPLORATION_GAP_MIN_TICKS: 100,
  /** maximum gap between ambient tracks */
  EXPLORATION_GAP_MAX_TICKS: 300,
  /** warning throttle interval per player */
  WARN_COOLDOWN_TICKS: 200,
});

/**
 * list of boss entity identifier strings.
 * @type {ReadonlyArray<string>}
 */
const BOSS_ENTITY_TYPES = Object.freeze([
  "minecraft:ender_dragon",
  "minecraft:wither",
  "minecraft:warden",
]);

/**
 * mobs that trigger combat mode when attacked by a player.
 * @type {ReadonlyArray<string>}
 */
const HOSTILE_ENTITY_TYPES = Object.freeze([
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
  "minecraft:elder_guardian",
  "minecraft:shulker",
  "minecraft:breeze",
  "minecraft:bogged",
]);

/**
 * helper utility to build track metadata objects.
 * 
 * @param {string[]} trackNames - names of tracks matching keys in sound_definitions.json.
 * @param {number} [durationTicks=4800] - duration in ticks (default: 4 minutes).
 * @returns {Track[]} array of Track objects.
 */
function makeTracks(trackNames, durationTicks = 4800) {
  return trackNames.map((name) => ({
    id: `skyrim:track.${name}`,
    durationTicks,
  }));
}

/**
 * skyrim soundtrack playlist definitions mapped by music mode context.
 * @type {Readonly<Record<string, ReadonlyArray<Track>>>}
 */
const PLAYLISTS = Object.freeze({
  exploration: makeTracks([
    "far_horizons",
    "frostfall",
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
    "a_chance_meeting",
    "a_winter_s_tale",
    "seven_thousand_steps",
    "wind_guide_you",
    "tundra",
    "before_the_storm",
    "distant_horizons",
    "journey_s_end",
    "out_of_the_cold",
    "sky_above_voice_within",
  ]),

  night: makeTracks([
    "secunda",
    "masser",
    "aurora",
    "night_without_stars",
  ]),

  combat: makeTracks([
    "tooth_and_claw",
    "caught_off_guard",
    "death_or_sovngarde",
    "steel_on_steel",
    "blood_and_steel",
    "shattered_shields",
    "unbound",
  ]),

  boss: makeTracks([
    "dragonborn",
    "one_they_fear",
    "watch_the_skies",
  ]),

  cave: makeTracks([
    "into_darkness",
    "beneath_the_ice",
    "shadows_and_echoes",
    "silent_footsteps",
    "death_in_the_darkness",
    "silence_unbroken",
  ]),

  village: makeTracks([
    "the_city_gates",
    "the_streets_of_whiterun",
    "solitude",
    "imperial_throne",
    "around_the_fire",
    "a_chance_meeting",
  ]),

  whiterun: makeTracks([
    "the_streets_of_whiterun",
    "dragonsreach",
    "the_bannered_mare",
  ]),

  nether: makeTracks([
    "towers_and_shadows",
    "death_in_the_darkness",
    "the_gathering_storm",
  ]),

  end: makeTracks([
    "dragonborn",
    "watch_the_skies",
  ]),
});

/**
 * map holding audio tracking contexts indexed by player unique id.
 * @type {Map<string, PlayerMusicContext>}
 */
const playerContexts = new Map();

/**
 * retrieves or creates a tracking context for a given player.
 * 
 * @param {import("@minecraft/server").Player} player - target player instance.
 * @returns {PlayerMusicContext} mutable state context.
 */
function getContextForPlayer(player) {
  let context = playerContexts.get(player.id);

  if (!context) {
    context = {
      nextTrackTick: 0,
      combatUntilTick: 0,
      lastWarnTick: -CONFIG.WARN_COOLDOWN_TICKS,
      isLoading: true,
      isAtmosphereDumbed: false,
    };
    playerContexts.set(player.id, context);
  }

  return context;
}

/**
 * generates a random integer within inclusive bounds.
 * 
 * @param {number} min - lower bound.
 * @param {number} max - upper bound.
 * @returns {number} random integer.
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * throttled warning logger to prevent log spamming.
 * 
 * @param {import("@minecraft/server").Player} player - targeted player instance.
 * @param {unknown} error - caught error object.
 */
function warnPlayerError(player, error) {
  const context = getContextForPlayer(player);
  const currentTick = system.currentTick;

  if (currentTick - context.lastWarnTick < CONFIG.WARN_COOLDOWN_TICKS) {
    return;
  }

  context.lastWarnTick = currentTick;
  console.warn(`[SkyrimMusic] [${player.name}]:`, error);
}

/**
 * ensures skyrim_atmospheres is playing endlessly in the background.
 * 
 * @param {import("@minecraft/server").Player} player - target player.
 * @param {PlayerMusicContext} context - player context.
 * @param {boolean} shouldDuck - true to lower volume, false for normal volume.
 */
function updateAtmosphereState(player, context, shouldDuck) {
  try {
    if (!context.atmosphereSound) {
      context.atmosphereSound = player.playSound(CONFIG.ATMOSPHERE_TRACK_ID, {
        volume: shouldDuck ? CONFIG.ATMOSPHERE_DUCK_VOLUME : CONFIG.ATMOSPHERE_FULL_VOLUME,
        loopCount: -1,
      });
      context.isAtmosphereDumbed = shouldDuck;
      return;
    }

    if (context.isAtmosphereDumbed !== shouldDuck) {
      if (typeof context.atmosphereSound.setVolume === "function") {
        context.atmosphereSound.setVolume(
          shouldDuck ? CONFIG.ATMOSPHERE_DUCK_VOLUME : CONFIG.ATMOSPHERE_FULL_VOLUME
        );
      } else {
        context.atmosphereSound.stop();
        context.atmosphereSound = player.playSound(CONFIG.ATMOSPHERE_TRACK_ID, {
          volume: shouldDuck ? CONFIG.ATMOSPHERE_DUCK_VOLUME : CONFIG.ATMOSPHERE_FULL_VOLUME,
          loopCount: -1,
        });
      }
      context.isAtmosphereDumbed = shouldDuck;
    }
  } catch (error) {
    warnPlayerError(player, error);
    context.atmosphereSound = undefined;
  }
}

/**
 * picks a track from a playlist, avoiding the track played immediately prior if possible.
 * 
 * @param {ReadonlyArray<Track>} playlist - source playlist.
 * @param {string} [previousTrackId] - last played track ID.
 * @returns {Track} selected track definition.
 */
function chooseTrack(playlist, previousTrackId) {
  if (!playlist || playlist.length === 0) {
    throw new Error("Cannot select track from empty or undefined playlist.");
  }

  const availableTracks =
    playlist.length > 1
      ? playlist.filter((track) => track.id !== previousTrackId)
      : playlist;

  const randomIndex = getRandomInt(0, availableTracks.length - 1);
  return availableTracks[randomIndex];
}

/**
 * evaluates player state and environment to determine active MusicMode.
 * 
 * @param {import("@minecraft/server").Player} player - target player.
 * @returns {MusicMode} resolved music mode.
 */
function resolveMusicMode(player) {
  const context = getContextForPlayer(player);
  const currentTick = system.currentTick;
  const dimensionId = player.dimension.id;

  if (context.isLoading) {
    return "loading";
  }

  try {
    const nearbyBosses = player.dimension.getEntities({
      location: player.location,
      maxDistance: CONFIG.BOSS_DETECTION_RADIUS,
    });

    const hasBossNearby = nearbyBosses.some((entity) =>
      BOSS_ENTITY_TYPES.includes(entity.typeId)
    );

    if (hasBossNearby) {
      return "boss";
    }
  } catch (error) {
    warnPlayerError(player, error);
  }
  
  if (currentTick < context.combatUntilTick) {
    return "combat";
  }

  if (dimensionId === "minecraft:nether") return "nether";
  if (dimensionId === "minecraft:the_end") return "end";

  if (player.location.y < CONFIG.CAVE_Y_THRESHOLD) {
    return "cave";
  }

  try {
    const nearbyVillagers = player.dimension.getEntities({
      type: "minecraft:villager",
      location: player.location,
      maxDistance: CONFIG.VILLAGE_DETECTION_RADIUS,
    });

    if (nearbyVillagers.length > 0) {
      return "village";
    }
  } catch (error) {
    warnPlayerError(player, error);
  }

  const timeOfDay = world.getTimeOfDay();
  if (timeOfDay >= 13000 && timeOfDay < 23000) {
    return "night";
  }

  return "exploration";
}

/**
 * plays music track corresponding to the given mode and schedules next tick check.
 * 
 * @param {import("@minecraft/server").Player} player - target player.
 * @param {PlayerMusicContext} context - target player state.
 * @param {MusicMode} mode - music mode to play.
 */
function playContextTrack(player, context, mode) {
  let trackId = "";
  let trackDuration = 4800; // 4 min

  if (mode === "loading") {
    trackId = CONFIG.MENU_TRACK_ID;
    trackDuration = 3600; // 3 min
  } else {
    const playlist = PLAYLISTS[mode];
    if (!playlist || playlist.length === 0) return;
    const track = chooseTrack(playlist, context.previousTrack);
    trackId = track.id;
    trackDuration = track.durationTicks;
  }

  try {
    player.playMusic(trackId, {
      fade: CONFIG.FADE_SECONDS,
      loop: false,
      volume: CONFIG.MUSIC_VOLUME,
    });

    context.mode = mode;
    context.currentTrack = trackId;
    context.previousTrack = trackId;

    const gapTicks =
      mode === "exploration" || mode === "night"
        ? getRandomInt(CONFIG.EXPLORATION_GAP_MIN_TICKS, CONFIG.EXPLORATION_GAP_MAX_TICKS)
        : 0;

    context.nextTrackTick = system.currentTick + trackDuration + gapTicks;

    updateAtmosphereState(player, context, true);
  } catch (error) {
    warnPlayerError(player, error);
    context.nextTrackTick = system.currentTick + 100;
  }
}

/**
 * performs tick update pass for an individual player.
 * 
 * @param {import("@minecraft/server").Player} player - active player instance.
 */
function updatePlayerMusic(player) {
  if (!player.isValid()) return;

  const context = getContextForPlayer(player);
  const currentMode = resolveMusicMode(player);
  const modeChanged = context.mode !== currentMode;

  if (modeChanged) {
    playContextTrack(player, context, currentMode);
    return;
  }

  if (system.currentTick >= context.nextTrackTick) {
    updateAtmosphereState(player, context, false);

    if (system.currentTick >= context.nextTrackTick) {
      playContextTrack(player, context, currentMode);
    }
  }
}

// combat
world.afterEvents.entityHurt.subscribe((event) => {
  const currentTick = system.currentTick;
  const targetEntity = event.hurtEntity;
  const attackerEntity = event.damageSource?.damagingEntity;

  if (targetEntity && targetEntity.typeId === "minecraft:player" && attackerEntity) {
    /** @type {import("@minecraft/server").Player} */
    const player = /** @type {any} */ (targetEntity);
    if (player.isValid()) {
      getContextForPlayer(player).combatUntilTick =
        currentTick + CONFIG.COMBAT_GRACE_TICKS;
    }
  }

  if (attackerEntity && attackerEntity.typeId === "minecraft:player" && targetEntity) {
    /** @type {import("@minecraft/server").Player} */
    const player = /** @type {any} */ (attackerEntity);
    
    const isTargetHostile =
      HOSTILE_ENTITY_TYPES.includes(targetEntity.typeId) ||
      BOSS_ENTITY_TYPES.includes(targetEntity.typeId) ||
      targetEntity.typeId === "minecraft:player";

    if (player.isValid() && isTargetHostile) {
      getContextForPlayer(player).combatUntilTick =
        currentTick + CONFIG.COMBAT_GRACE_TICKS;
    }
  }
});

// multiplayer
world.afterEvents.playerSpawn.subscribe((event) => {
  const { player, initialSpawn } = event;
  if (!player.isValid()) return;

  const context = getContextForPlayer(player);

  if (initialSpawn) {
    context.isLoading = true;
    playContextTrack(player, context, "loading");

    system.runTimeout(() => {
      if (player.isValid()) {
        context.isLoading = false;
      }
    }, 100);
  }
});

system.runInterval(() => {
  const onlinePlayers = world.getPlayers();
  const onlinePlayerIds = new Set(onlinePlayers.map((p) => p.id));

  for (const player of onlinePlayers) {
    try {
      updatePlayerMusic(player);
    } catch (error) {
      warnPlayerError(player, error);
    }
  }

  for (const [playerId, context] of playerContexts.entries()) {
    if (onlinePlayerIds.has(playerId)) continue;

    try {
      context.atmosphereSound?.stop();
    } catch {}

    playerContexts.delete(playerId);
  }
}, CONFIG.POLL_TICKS);