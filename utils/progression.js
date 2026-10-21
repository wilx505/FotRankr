import players from '../players';

import {
  getActiveStatus,
  getCurrentLeague,
} from './listHelpers';

/*
============================================================
FOTRANKR PROGRESSION
============================================================

XP:
  every ranked player       = XP_PER_PLAYER
  every club fully ranked   = CLUB_BONUS_XP extra
                              (every current player at that
                              club, e.g. all of Arsenal)

Every XP_PER_LEVEL takes you up a level, which changes
your title + badge and may unlock the next group of
players. Unlocks depend ONLY on total XP, and every ranked
player counts, whatever league they are from.

XP is worked out live from myRankings, so it can never
drift out of sync (and a backup restore restores it too).

TO RENAME A TITLE, CHANGE A BADGE OR REORDER THE UNLOCKS,
EDIT LEVELS BELOW. NOTHING ELSE NEEDS TO CHANGE.
============================================================
*/

export const XP_PER_PLAYER = 5;

export const CLUB_BONUS_XP = 10;

export const XP_PER_LEVEL = 1000;


// "I DO NOT KNOW" players: saved in myRankings with this
// category and a score of 0. They count as ranked for club
// completion and locks, but earn no player XP and are never
// used as opponents.
export const UNKNOWN_CATEGORY = 'Unknown';

export function isUnknown(player) {
  return player?.category === UNKNOWN_CATEGORY;
}


// unlocks: which players become rankable at this level.
//   a league name     = active players currently in it
//   'REST_OF_WORLD'   = active players in any other league
//   'LEGENDS'         = retired players
//   null              = new title + badge only
export const LEVELS = [
  {
    level: 1,
    title: 'Amateur Baller',
    badge: '⚽',
    unlocks: 'Premier League',
  },
  {
    level: 2,
    title: 'Sunday League Pro',
    badge: '🥾',
    unlocks: 'La Liga',
  },
  {
    level: 3,
    title: 'Academy Prospect',
    badge: '🎓',
    unlocks: 'Ligue 1',
  },
  {
    level: 4,
    title: 'Benchwarmer',
    badge: '🪑',
    unlocks: 'Serie A',
  },
  {
    level: 5,
    title: 'First Team Talent',
    badge: '👕',
    unlocks: 'Bundesliga',
  },
  {
    level: 6,
    title: 'Captain',
    badge: '©️',
    unlocks: 'REST_OF_WORLD',
  },
  {
    level: 7,
    title: 'International',
    badge: '🌍',
    unlocks: 'LEGENDS',
  },
  {
    level: 8,
    title: 'Club Legend',
    badge: '🏟️',
    unlocks: null,
  },
  {
    level: 9,
    title: "Ballon d'Or Winner",
    badge: '🏆',
    unlocks: null,
  },
  {
    level: 10,
    title: 'Icon',
    badge: '⭐',
    unlocks: null,
  },
  {
    level: 11,
    title: 'Legend',
    badge: '👑',
    unlocks: null,
  },
  {
    level: 12,
    title: 'GOAT',
    badge: '🐐',
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


// Every current club and its players' IDs, built once.
// Retired players have no club, so they never count.
const CLUBS = (() => {

  const clubs = new Map();

  players.forEach(player => {

    if (player.active === false || !player.club) {
      return;
    }

    const key =
      `${player.currentLeague || ''}|${player.club}`;

    if (!clubs.has(key)) {
      clubs.set(key, {
        club: player.club,
        league: player.currentLeague,
        playerIds: [],
      });
    }

    clubs.get(key).playerIds.push(String(player.id));
  });

  return [...clubs.values()];
})();


// Clubs where every current player has been ranked.
export function getCompletedClubs(myRankings) {

  const rankedIds = new Set(
    (myRankings || []).map(
      ranking => String(ranking.id)
    )
  );

  return CLUBS.filter(club =>
    club.playerIds.every(id => rankedIds.has(id))
  );
}


// Everything the profile screen needs, from the rankings.
// Remembers the last answer, because Search asks once per
// player in a list.
let lastRankings = null;
let lastProgress = null;

export function getProgress(myRankings) {

  if (myRankings && myRankings === lastRankings) {
    return lastProgress;
  }

  // Unknown players earn no XP of their own (but do count
  // towards completing a club).
  const playersRanked = (myRankings || []).filter(
    player => !isUnknown(player)
  ).length;

  const unknownCount =
    (myRankings || []).length - playersRanked;

  const clubsCompleted =
    getCompletedClubs(myRankings).length;

  const xp =
    playersRanked * XP_PER_PLAYER +
    clubsCompleted * CLUB_BONUS_XP;

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

  const progress = {
    playersRanked,
    unknownCount,
    clubsCompleted,
    xp,
    level,
    isMaxLevel,
    xpIntoLevel,
    xpToNextLevel: isMaxLevel
      ? 0
      : XP_PER_LEVEL - xpIntoLevel,
    current: getLevelInfo(level),
    next: isMaxLevel
      ? null
      : getLevelInfo(level + 1),
  };

  lastRankings = myRankings;
  lastProgress = progress;

  return progress;
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
