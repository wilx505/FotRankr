import { getSourcePlayer } from './listHelpers';

import { isUnknown } from './progression';

/*
============================================================
MY BEST XI
============================================================

For a completed club, picks the user's highest-scored ranked
player for each slot of a formation. Exact positions are
filled first (every slot), then empty slots take the best
player from the nearest positions, so the team is always as
full as the squad allows. "I DO NOT KNOW" players are never
picked.

Changing formation keeps the same 11 and moves each to the
closest slot in the new shape (positions never change).
============================================================
*/

// Central midfielders are interchangeable in the XI: the
// highest-rated ones fill the middle, whatever their type.
const CENTRAL_MIDFIELD = [
  'Defensive Midfield',
  'Central Midfield',
  'Attacking Midfield',
];

// Which positions can fill each kind of slot, closest first.
// An entry can be a list of equally good positions.
const SLOT_POSITIONS = {
  GK: ['Goalkeeper'],
  CB: ['Centre-Back', 'Defensive Midfield', 'Right-Back', 'Left-Back'],
  RB: ['Right-Back', 'Centre-Back', 'Right Midfield', 'Defensive Midfield'],
  LB: ['Left-Back', 'Centre-Back', 'Left Midfield', 'Defensive Midfield'],
  RWB: ['Right-Back', 'Right Midfield', 'Right Winger', 'Centre-Back'],
  LWB: ['Left-Back', 'Left Midfield', 'Left Winger', 'Centre-Back'],
  DM: [CENTRAL_MIDFIELD, 'Centre-Back', 'Left Midfield', 'Right Midfield'],
  CM: [CENTRAL_MIDFIELD, 'Left Midfield', 'Right Midfield', 'Second Striker'],
  AM: [CENTRAL_MIDFIELD, 'Second Striker', 'Left Midfield', 'Right Midfield'],
  LM: ['Left Midfield', 'Left Winger', 'Left-Back', 'Central Midfield', 'Attacking Midfield'],
  RM: ['Right Midfield', 'Right Winger', 'Right-Back', 'Central Midfield', 'Attacking Midfield'],
  LW: ['Left Winger', 'Left Midfield', 'Right Winger', 'Second Striker', 'Attacking Midfield'],
  RW: ['Right Winger', 'Right Midfield', 'Left Winger', 'Second Striker', 'Attacking Midfield'],
  SS: ['Second Striker', 'Attacking Midfield', 'Centre-Forward', 'Central Midfield'],
  ST: ['Centre-Forward', 'Second Striker', 'Right Winger', 'Left Winger', 'Attacking Midfield'],
};

// Rows from the attack down to the keeper, left to right.
export const FORMATIONS = {
  '4-3-3': [['LW', 'ST', 'RW'], ['CM', 'AM', 'DM'], ['LB', 'CB', 'CB', 'RB'], ['GK']],
  '4-4-2': [['ST', 'ST'], ['LM', 'CM', 'CM', 'RM'], ['LB', 'CB', 'CB', 'RB'], ['GK']],
  '4-2-3-1': [['ST'], ['LW', 'AM', 'RW'], ['CM', 'DM'], ['LB', 'CB', 'CB', 'RB'], ['GK']],
  '4-1-4-1': [['ST'], ['LM', 'CM', 'CM', 'RM'], ['DM'], ['LB', 'CB', 'CB', 'RB'], ['GK']],
  '4-5-1': [['ST'], ['LM', 'CM', 'AM', 'CM', 'RM'], ['LB', 'CB', 'CB', 'RB'], ['GK']],
  '4-4-1-1': [['ST'], ['SS'], ['LM', 'CM', 'CM', 'RM'], ['LB', 'CB', 'CB', 'RB'], ['GK']],
  '4-3-1-2': [['ST', 'ST'], ['AM'], ['CM', 'DM', 'CM'], ['LB', 'CB', 'CB', 'RB'], ['GK']],
  '4-1-2-1-2': [['ST', 'ST'], ['AM'], ['CM', 'CM'], ['DM'], ['LB', 'CB', 'CB', 'RB'], ['GK']],
  '4-3-2-1': [['ST'], ['AM', 'AM'], ['CM', 'DM', 'CM'], ['LB', 'CB', 'CB', 'RB'], ['GK']],
  '3-5-2': [['ST', 'ST'], ['LWB', 'CM', 'DM', 'CM', 'RWB'], ['CB', 'CB', 'CB'], ['GK']],
  '3-4-3': [['LW', 'ST', 'RW'], ['LWB', 'CM', 'CM', 'RWB'], ['CB', 'CB', 'CB'], ['GK']],
  '3-4-2-1': [['ST'], ['AM', 'AM'], ['LWB', 'CM', 'CM', 'RWB'], ['CB', 'CB', 'CB'], ['GK']],
  '5-3-2': [['ST', 'ST'], ['CM', 'DM', 'CM'], ['LWB', 'CB', 'CB', 'CB', 'RWB'], ['GK']],
  '5-4-1': [['ST'], ['LM', 'CM', 'CM', 'RM'], ['LWB', 'CB', 'CB', 'CB', 'RWB'], ['GK']],
};

export const FORMATION_NAMES = Object.keys(FORMATIONS);

export const DEFAULT_FORMATION = '4-3-3';

export const SLOT_COUNT = 11;


// Kept for older callers.
export const FORMATION_433 = FORMATIONS['4-3-3'].map(row =>
  row.map(slot => ({ slot, positions: SLOT_POSITIONS[slot] }))
);


function formationRows(formationName) {
  return FORMATIONS[formationName] || FORMATIONS[DEFAULT_FORMATION];
}


// The user's ranked players currently at this club, best
// first (Unknown players left out).
export function getClubSquad(club, league, myRankings) {

  return (myRankings || [])
    .filter(player => {

      const source = getSourcePlayer(player.id);

      return (
        !isUnknown(player) &&
        source &&
        source.active !== false &&
        source.club === club &&
        (source.currentLeague || null) === (league || null)
      );
    })
    .sort((a, b) => b.score - a.score);
}


// Put `pool` (best first) into the formation's slots:
// exact positions first everywhere, then each fallback level
// in turn. With fillRest, anyone left over takes any empty
// slot (used when re-arranging a chosen 11).
function assign(pool, formationName, fillRest) {

  const used = new Set();

  const rows = formationRows(formationName).map(row =>
    row.map(slot => ({
      slot,
      positions: SLOT_POSITIONS[slot],
      player: null,
      exact: false,
    }))
  );

  const spots = rows.flat();

  const longest = Math.max(
    ...spots.map(spot => spot.positions.length)
  );

  for (let level = 0; level < longest; level++) {

    spots.forEach(spot => {

      if (spot.player || !spot.positions[level]) {
        return;
      }

      const wanted = spot.positions[level];

      const best = pool.find(
        player =>
          !used.has(String(player.id)) &&
          (Array.isArray(wanted)
            ? wanted.includes(player.specificPosition)
            : player.specificPosition === wanted)
      );

      if (best) {
        spot.player = best;
        spot.exact = level === 0;
        used.add(String(best.id));
      }
    });
  }

  if (fillRest) {

    const leftover = pool.filter(
      player => !used.has(String(player.id))
    );

    spots.forEach(spot => {
      if (!spot.player && leftover.length > 0) {
        spot.player = leftover.shift();
      }
    });
  }

  return rows;
}


// The top-rated XI as rows of { slot, player | null, exact }.
export function pickBestXI(club, league, myRankings, formationName) {
  return assign(
    getClubSquad(club, league, myRankings),
    formationName,
    false
  );
}


// The same players moved into another formation, each to the
// closest slot. Returns 11 ids (null for empty slots).
export function rearrange(playerList, formationName) {

  const pool = playerList
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return assign(pool, formationName, true)
    .flat()
    .map(spot => (spot.player ? String(spot.player.id) : null));
}


// Slot codes in order (attack first), e.g. for labels.
export function formationSlots(formationName) {
  return formationRows(formationName);
}


const NAME_PARTICLES = new Set([
  'van', 'von', 'de', 'der', 'den', 'da', 'das', 'do', 'dos',
  'di', 'del', 'della', 'le', 'la', 'ter', 'ten', 'mac', 'bin',
  'el', 'al',
]);


// "Virgil van Dijk" -> "van Dijk", "Alisson" -> "Alisson".
export function lastName(name) {

  const parts = (name || '').trim().split(/\s+/);

  if (parts.length <= 1) {
    return parts[0] || '';
  }

  let start = parts.length - 1;

  while (
    start > 1 &&
    NAME_PARTICLES.has(parts[start - 1].toLowerCase())
  ) {
    start--;
  }

  return parts.slice(start).join(' ');
}
