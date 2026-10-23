import players from '../players';

import { getGoldTitle } from './clubBadges';

import {
  getActiveStatus,
  getCurrentLeague,
  getSourcePlayer,
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
  every milestone badge     = MILESTONE_BADGE_XP extra
  The Patriot badge         = MILESTONE_BADGE_XP extra
  each POSITION_BADGES badge = MILESTONE_BADGE_XP extra
  every gold "TRUE ..." badge = GOLD_BADGE_XP extra
  every league Expert badge = MILESTONE_BADGE_XP extra
                              (every player in a league with
                              LEAGUE_EXPERT_MIN+ players)
  every level badge         = MILESTONE_BADGE_XP extra
                              (Plastic Fan for finishing
                              Level 1 ... The Oracle)
                              (The Wall, Maestro, Predator,
                              Buffon)
                              (PATRIOT_TARGET players from
                              one nation)
                              (every MILESTONE_EVERY ranked
                              players: Centurion, Ducenti...)

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

// Milestone badges (Centurion, Ducenti, ...) come every
// MILESTONE_EVERY ranked players and are worth
// MILESTONE_BADGE_XP each. Club badges are worth
// CLUB_BONUS_XP instead.
export const MILESTONE_EVERY = 100;

export const MILESTONE_BADGE_XP = 10;

// Each gold "TRUE ..." club badge.
export const GOLD_BADGE_XP = 10;


export function getMilestonesEarned(playersRanked) {
  return Math.floor(playersRanked / MILESTONE_EVERY);
}


// The Patriot: PATRIOT_TARGET players from one nation.
// Also worth MILESTONE_BADGE_XP.
export const PATRIOT_TARGET = 100;


// Position badges: `target` players ranked in a position.
// Each is worth MILESTONE_BADGE_XP.
export const POSITION_BADGES = [
  { id: 'wall', title: 'The Wall', icon: '🧱', position: 'Defence', label: 'defenders', target: 200 },
  { id: 'maestro', title: 'The Maestro', icon: '🎼', position: 'Midfield', label: 'midfielders', target: 200 },
  { id: 'predator', title: 'The Predator', icon: '🦈', position: 'Attack', label: 'attackers', target: 200 },
  { id: 'buffon', title: 'The Buffon', icon: '🧤', position: 'Goalkeeper', label: 'goalkeepers', target: 100 },
];


// How many ranked players in each position: { Defence: 12, ... }.
function getPositionCounts(rankedIds) {

  const counts = {};

  rankedIds.forEach(id => {

    const position = getSourcePlayer(id)?.position;

    if (position) {
      counts[position] = (counts[position] || 0) + 1;
    }
  });

  return counts;
}


// The nation with the most ranked players: { nation, count }.
function getTopNation(rankedIds) {

  const counts = {};

  rankedIds.forEach(id => {

    const nation = getSourcePlayer(id)?.nation;

    if (nation) {
      counts[nation] = (counts[nation] || 0) + 1;
    }
  });

  return Object.entries(counts).reduce(
    (best, [nation, count]) =>
      count > best.count ? { nation, count } : best,
    { nation: null, count: 0 }
  );
}


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
    title: 'Plastic Fan',
    badge: '🤓',
    unlocks: 'Premier League',
  },
  {
    level: 2,
    title: 'Casual Viewer',
    badge: '📺',
    unlocks: 'La Liga',
  },
  {
    level: 3,
    title: 'Clips Merchant',
    badge: '📱',
    unlocks: 'Ligue 1',
  },
  {
    level: 4,
    title: 'Matchday Regular',
    badge: '🎟️',
    unlocks: 'Serie A',
  },
  {
    level: 5,
    title: 'Pub Pundit',
    badge: '🍺',
    unlocks: 'Bundesliga',
  },
  {
    level: 6,
    title: 'Tactical Analyst',
    badge: '📋',
    unlocks: 'REST_OF_WORLD',
  },
  {
    level: 7,
    title: 'Ball Knowledge',
    badge: '🧠',
    unlocks: 'LEGENDS',
  },
  {
    level: 8,
    title: 'Studio Pundit',
    badge: '🎙️',
    unlocks: null,
  },
  {
    level: 9,
    title: 'Professor of Football',
    badge: '🎓',
    unlocks: null,
  },
  {
    level: 10,
    title: 'Walking Encyclopedia',
    badge: '📚',
    unlocks: null,
  },
  {
    level: 11,
    title: 'Cruyff Disciple',
    badge: '🧡',
    unlocks: null,
  },
  {
    level: 12,
    title: 'The Oracle',
    badge: '🔮',
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


// ======================================================
// EARNED HISTORY
// ======================================================
// XP and badges, once earned, are permanent: Rank Again
// briefly removes a player, and a ranked player can later be
// marked Unknown, but neither may take anything away.
//
// App keeps a record of every player ever properly ranked and
// every club ever completed (saved as 'fotrankrProgress',
// cleared with the rankings on a DATA_VERSION change) and
// hands it over with setEarnedHistory. Everything below
// counts the current rankings PLUS that record.

let earnedHistory = {
  rankedIds: new Set(),
  clubKeys: new Set(),
  goldClubKeys: new Set(),
  leagueKeys: new Set(),
};

export function setEarnedHistory({
  rankedIds = [],
  clubKeys = [],
  goldClubKeys = [],
  leagueKeys = [],
} = {}) {

  earnedHistory = {
    rankedIds: new Set(rankedIds.map(String)),
    clubKeys: new Set(clubKeys),
    goldClubKeys: new Set(goldClubKeys),
    leagueKeys: new Set(leagueKeys),
  };

  // The cached answer no longer applies.
  lastRankings = null;
}


export function clubKey(club) {
  return `${club.league || ''}|${club.club}`;
}


// Clubs completed by the current rankings alone (used by App
// to grow the earned record).
export function getClubsCompletedNow(myRankings) {

  const rankedIds = new Set(
    (myRankings || []).map(
      ranking => String(ranking.id)
    )
  );

  return CLUBS.filter(club =>
    club.playerIds.every(id => rankedIds.has(id))
  );
}


// Players properly ranked now (not Unknown).
export function getRankedIdsNow(myRankings) {
  return (myRankings || [])
    .filter(player => !isUnknown(player))
    .map(player => String(player.id));
}


// Every club completed now or at any point before.
export function getCompletedClubs(myRankings) {

  const now = new Set(
    getClubsCompletedNow(myRankings).map(clubKey)
  );

  return CLUBS.filter(club =>
    now.has(clubKey(club)) ||
    earnedHistory.clubKeys.has(clubKey(club))
  );
}


// Gold ("TRUE ...") clubs: Premier League clubs where every
// current player has been PROPERLY ranked (not Unknown), now
// or before. Used by App to grow the earned record.
export function getGoldClubsNow(myRankings) {

  const rankedIds = new Set([
    ...earnedHistory.rankedIds,
    ...getRankedIdsNow(myRankings),
  ]);

  return CLUBS.filter(club =>
    getGoldTitle(club.club) &&
    club.playerIds.every(id => rankedIds.has(id))
  );
}


// Every gold club earned now or at any point before.
export function getGoldClubs(myRankings) {

  const now = new Set(
    getGoldClubsNow(myRankings).map(clubKey)
  );

  return CLUBS.filter(club =>
    now.has(clubKey(club)) ||
    earnedHistory.goldClubKeys.has(clubKey(club))
  );
}


// ======================================================
// LEAGUE EXPERT BADGES
// ======================================================
// "<League> Expert" for ranking every current player in a
// league ("I DO NOT KNOW" counts, like club badges). Only
// leagues with at least LEAGUE_EXPERT_MIN players have one.
// Worth MILESTONE_BADGE_XP each.

export const LEAGUE_EXPERT_MIN = 10;

let leagueCache = null;

// [{ league, playerIds }] for leagues with a badge.
export function getExpertLeagues() {

  if (!leagueCache) {

    const byLeague = new Map();

    CLUBS.forEach(club => {

      if (!club.league) {
        return;
      }

      if (!byLeague.has(club.league)) {
        byLeague.set(club.league, []);
      }

      byLeague.get(club.league).push(...club.playerIds);
    });

    leagueCache = [...byLeague.entries()]
      .filter(([, ids]) => ids.length >= LEAGUE_EXPERT_MIN)
      .map(([league, playerIds]) => ({ league, playerIds }));
  }

  return leagueCache;
}


// Leagues fully ranked by the current rankings alone (used
// by App to grow the earned record).
export function getLeaguesCompletedNow(myRankings) {

  const rankedIds = new Set(
    (myRankings || []).map(
      ranking => String(ranking.id)
    )
  );

  return getExpertLeagues().filter(entry =>
    entry.playerIds.every(id => rankedIds.has(id))
  );
}


// Every league completed now or at any point before.
export function getCompletedLeagues(myRankings) {

  const now = new Set(
    getLeaguesCompletedNow(myRankings).map(
      entry => entry.league
    )
  );

  return getExpertLeagues().filter(entry =>
    now.has(entry.league) ||
    earnedHistory.leagueKeys.has(entry.league)
  );
}


// Level badges held at a level: one for each level finished,
// and The Oracle's on reaching the top level.
export function levelBadgeCount(level) {
  return level >= MAX_LEVEL ? MAX_LEVEL : level - 1;
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
  // towards completing a club). Anyone ever properly ranked
  // keeps counting.
  const rankedIds = new Set([
    ...earnedHistory.rankedIds,
    ...getRankedIdsNow(myRankings),
  ]);

  const playersRanked = rankedIds.size;

  const unknownCount = (myRankings || []).filter(
    player =>
      isUnknown(player) &&
      !rankedIds.has(String(player.id))
  ).length;

  const clubsCompleted =
    getCompletedClubs(myRankings).length;

  const milestonesEarned =
    getMilestonesEarned(playersRanked);

  const topNation = getTopNation(rankedIds);

  const patriotEarned =
    topNation.count >= PATRIOT_TARGET;

  const positionCounts = getPositionCounts(rankedIds);

  const goldClubsEarned =
    getGoldClubs(myRankings).length;

  const leaguesCompleted =
    getCompletedLeagues(myRankings).length;

  const positionBadgesEarned = POSITION_BADGES.filter(
    badge =>
      (positionCounts[badge.position] || 0) >= badge.target
  ).length;

  const xpBeforeLevelBadges =
    playersRanked * XP_PER_PLAYER +
    clubsCompleted * CLUB_BONUS_XP +
    milestonesEarned * MILESTONE_BADGE_XP +
    (patriotEarned ? MILESTONE_BADGE_XP : 0) +
    positionBadgesEarned * MILESTONE_BADGE_XP +
    goldClubsEarned * GOLD_BADGE_XP +
    leaguesCompleted * MILESTONE_BADGE_XP;

  // Level badges (one per level finished, plus The Oracle on
  // reaching the top) are worth MILESTONE_BADGE_XP each, and
  // that XP can itself finish a level, so settle it in a loop.
  let level = 1;
  let levelBadgesEarned = 0;
  let xp = xpBeforeLevelBadges;

  for (let pass = 0; pass <= MAX_LEVEL; pass++) {

    level = Math.min(
      Math.floor(xp / XP_PER_LEVEL) + 1,
      MAX_LEVEL
    );

    const badges = levelBadgeCount(level);

    if (badges === levelBadgesEarned) {
      break;
    }

    levelBadgesEarned = badges;

    xp =
      xpBeforeLevelBadges +
      levelBadgesEarned * MILESTONE_BADGE_XP;
  }

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
    milestonesEarned,
    topNation,
    patriotEarned,
    positionCounts,
    levelBadgesEarned,
    leaguesCompleted,
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
// ======================================================
// UNLOCK ALL LEAGUES (the "pay to win" option)
// ======================================================
// When on, no player is ever locked. Levels, XP and badges
// are unaffected. App sets it from storage.

let allLeaguesUnlocked = false;

export function setAllLeaguesUnlocked(value) {
  allLeaguesUnlocked = !!value;
}

export function hasAllLeagues() {
  return allLeaguesUnlocked;
}

// Can this player be ranked at this level?
export function isUnlocked(playerId, level) {
  return allLeaguesUnlocked || getUnlockLevel(playerId) <= level;
}


export function getLock(
  player,
  myRankings
) {

  if (allLeaguesUnlocked) {
    return null;
  }

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
        (allLeaguesUnlocked || info.level <= level) &&
        info.unlocks
    )
    .map(info => unlockName(info.unlocks));
}
