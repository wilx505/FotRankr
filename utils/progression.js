import {
  getActiveStatus,
  getCurrentLeague,
} from './listHelpers';

/*
============================================================
FOTRANKR PROGRESSION
============================================================

XP comes from how many players you have ranked:
every ranked player = XP_PER_PLAYER.

Every XP_PER_LEVEL takes you up a level, which changes
your title + badge and unlocks the next group of players.

XP is worked out live from myRankings, so it can never
drift out of sync (and a backup restore restores it too).

TO RENAME A TITLE, CHANGE A BADGE OR REORDER THE UNLOCKS,
EDIT LEVELS BELOW. NOTHING ELSE NEEDS TO CHANGE.
============================================================
*/

export const XP_PER_PLAYER = 20;

export const XP_PER_LEVEL = 1000;

export const PLAYERS_PER_LEVEL =
  XP_PER_LEVEL / XP_PER_PLAYER;


// unlocks: which players become rankable at this level.
//   a league name     = active players currently in it
//   'REST_OF_WORLD'   = active players in any other league
//   'LEGENDS'         = retired players
export const LEVELS = [
  {
    level: 1,
    title: 'Sunday League',
    badge: '🥾',
    unlocks: 'Premier League',
  },
  {
    level: 2,
    title: 'Academy Prospect',
    badge: '🎓',
    unlocks: 'La Liga',
  },
  {
    level: 3,
    title: 'Reserve',
    badge: '🪑',
    unlocks: 'Ligue 1',
  },
  {
    level: 4,
    title: 'First Team',
    badge: '👕',
    unlocks: 'Serie A',
  },
  {
    level: 5,
    title: 'Club Captain',
    badge: '©️',
    unlocks: 'Bundesliga',
  },
  {
    level: 6,
    title: 'International',
    badge: '🌍',
    unlocks: 'REST_OF_WORLD',
  },
  {
    level: 7,
    title: 'World Class',
    badge: '⭐',
    unlocks: 'LEGENDS',
  },
  {
    level: 8,
    title: "Ballon d'Or",
    badge: '🏆',
    unlocks: null,
  },
  {
    level: 9,
    title: 'Legend',
    badge: '👑',
    unlocks: null,
  },
];

export const MAX_LEVEL =
  LEVELS[LEVELS.length - 1].level;


const UNLOCK_NAMES = {
  REST_OF_WORLD: 'Rest of the World',
  LEGENDS: 'Legends',
};


// Display name for a level's unlock ("La Liga", "Legends").
export function unlockName(unlocks) {
  return UNLOCK_NAMES[unlocks] || unlocks;
}


export function getLevelInfo(level) {
  return LEVELS[
    Math.min(level, MAX_LEVEL) - 1
  ];
}


// Everything the profile screen needs, from the rankings.
export function getProgress(myRankings) {

  const playersRanked =
    (myRankings || []).length;

  const xp = playersRanked * XP_PER_PLAYER;

  const level = Math.min(
    Math.floor(xp / XP_PER_LEVEL) + 1,
    MAX_LEVEL
  );

  const isMaxLevel = level === MAX_LEVEL;

  const levelStartXp =
    (level - 1) * XP_PER_LEVEL;

  const xpIntoLevel = isMaxLevel
    ? XP_PER_LEVEL
    : xp - levelStartXp;

  const playersToNextLevel = isMaxLevel
    ? 0
    : Math.ceil(
        (XP_PER_LEVEL - xpIntoLevel) /
          XP_PER_PLAYER
      );

  return {
    playersRanked,
    xp,
    level,
    isMaxLevel,
    xpIntoLevel,
    playersToNextLevel,
    current: getLevelInfo(level),
    next: isMaxLevel
      ? null
      : getLevelInfo(level + 1),
  };
}


// The level at which a player becomes rankable.
export function getUnlockLevel(playerId) {

  const active = getActiveStatus(playerId);

  if (active === false) {
    return findUnlockLevel('LEGENDS');
  }

  const league = getCurrentLeague(playerId);

  const leagueLevel = league && LEVELS.find(
    level => level.unlocks === league
  );

  return leagueLevel
    ? leagueLevel.level
    : findUnlockLevel('REST_OF_WORLD');
}


function findUnlockLevel(unlocks) {
  return LEVELS.find(
    level => level.unlocks === unlocks
  ).level;
}


// null if the player can be ranked, otherwise what's
// needed: { level, title, badge, groupName }.
// Players already ranked are never locked.
export function getLock(
  player,
  myRankings
) {

  const alreadyRanked = (myRankings || []).some(
    ranking =>
      String(ranking.id) === String(player?.id)
  );

  if (alreadyRanked) {
    return null;
  }

  const { level } = getProgress(myRankings);

  const unlockLevel = getUnlockLevel(player?.id);

  if (unlockLevel <= level) {
    return null;
  }

  const info = getLevelInfo(unlockLevel);

  return {
    level: unlockLevel,
    title: info.title,
    badge: info.badge,
    groupName: unlockName(info.unlocks),
  };
}


// "La Liga players unlock at Level 2."
export function lockMessage(lock) {

  const who =
    lock.groupName === 'Legends'
      ? 'Legends (retired players)'
      : lock.groupName === 'Rest of the World'
        ? 'Players outside the top 5 leagues'
        : `${lock.groupName} players`;

  return `${who} unlock at Level ${lock.level}.`;
}


// Names of everything rankable so far, e.g.
// ['Premier League', 'La Liga'].
export function unlockedGroups(level) {
  return LEVELS
    .filter(
      info =>
        info.level <= level && info.unlocks
    )
    .map(info => unlockName(info.unlocks));
}
