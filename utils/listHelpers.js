import players from '../players';

/*
============================================================
FOTRANKR LIST HELPERS
============================================================

A list stores ONLY player IDs.

Names, scores, categories and order always come live from
myRankings, so a list can never go out of date.

League + active/retired status are NOT stored on ranked
players (createPlayer doesn't copy them), so they're looked
up from the ../players data by ID.

IF YOUR players FILE USES DIFFERENT FIELD NAMES, CHANGE
getLeagues() AND getActiveStatus() BELOW. NOTHING ELSE.
============================================================
*/

const sourceById = new Map(
  players.map(player => [
    String(player.id),
    player,
  ])
);


export function getSourcePlayer(id) {
  return sourceById.get(String(id));
}


// Returns an array of league names ([] if unknown).
export function getLeagues(id) {

  const source = getSourcePlayer(id);

  if (!source) {
    return [];
  }

  if (Array.isArray(source.leagues)) {
    return source.leagues;
  }

  if (source.league) {
    return [source.league];
  }

  return [];
}


// The league a player is in right now (null if retired or unknown).
export function getCurrentLeague(id) {

  const source = getSourcePlayer(id);

  return source?.currentLeague || null;
}


// true = active, false = retired, null = unknown.
export function getActiveStatus(id) {

  const source = getSourcePlayer(id);

  if (!source) {
    return null;
  }

  if (typeof source.active === 'boolean') {
    return source.active;
  }

  if (typeof source.isActive === 'boolean') {
    return source.isActive;
  }

  if (typeof source.retired === 'boolean') {
    return !source.retired;
  }

  return null;
}


export function hasStatusData(rankings) {
  return (rankings || []).some(
    player => getActiveStatus(player.id) !== null
  );
}


// scope: 'ALL_TIME' = every league played in,
//        'CURRENT'  = league they play in right now.
export function distinctLeagues(
  rankings,
  scope = 'ALL_TIME'
) {

  const leagues = new Set();

  (rankings || []).forEach(player => {

    if (scope === 'CURRENT') {

      const current = getCurrentLeague(player.id);

      if (current) {
        leagues.add(current);
      }

      return;
    }

    getLeagues(player.id).forEach(
      league => leagues.add(league)
    );
  });

  return [...leagues].sort();
}


// Converts old lists ({ players: [...] }) into the new
// shape ({ playerIds: [...] }). Safe to run repeatedly.
export function normaliseList(list) {

  if (!list) {
    return list;
  }

  const playerIds = Array.isArray(list.playerIds)
    ? list.playerIds
    : (list.players || []).map(player => player.id);

  const { players: oldPlayers, ...rest } = list;

  return {
    ...rest,
    playerIds: playerIds.map(String),
  };
}


// The list's players, joined to live rankings, best first.
export function getListPlayers(list, myRankings) {

  const rankingById = new Map(
    (myRankings || []).map(player => [
      String(player.id),
      player,
    ])
  );

  return (list?.playerIds || [])
    .map(id => rankingById.get(String(id)))
    .filter(Boolean)
    .sort((a, b) => b.rating - a.rating);
}


// status: 'ALL' | 'ACTIVE' | 'RETIRED'
export function matchesFilters(
  player,
  {
    status = 'ALL',
    league = null,
    leagueScope = 'ALL_TIME',
    position = null,
    category = null,
  } = {}
) {

  if (status !== 'ALL') {

    const active = getActiveStatus(player.id);

    if (active === null) {
      return false;
    }

    if (status === 'ACTIVE' && !active) {
      return false;
    }

    if (status === 'RETIRED' && active) {
      return false;
    }
  }

  if (league) {

    const inLeague =
      leagueScope === 'CURRENT'
        ? getCurrentLeague(player.id) === league
        : getLeagues(player.id).includes(league);

    if (!inLeague) {
      return false;
    }
  }

  if (position && player.position !== position) {
    return false;
  }

  if (category && player.category !== category) {
    return false;
  }

  return true;
}