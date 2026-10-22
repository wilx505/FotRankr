import { getSourcePlayer } from './listHelpers';

import { isUnknown } from './progression';

/*
============================================================
MY BEST XI (4-3-3)
============================================================

For a completed club, picks the user's highest-scored ranked
player for each slot of a 4-3-3. Exact positions are filled
first (every slot), then empty slots take the best player
from the nearest positions, so the team is always as full as
the squad allows. "I DO NOT KNOW" players are never picked.
============================================================
*/

// Rows from the attack down to the keeper, left to right.
// `positions`: exact position first, then fallbacks.
export const FORMATION_433 = [
  [
    { slot: 'LW', positions: ['Left Winger', 'Left Midfield', 'Right Winger', 'Second Striker', 'Attacking Midfield'] },
    { slot: 'ST', positions: ['Centre-Forward', 'Second Striker', 'Right Winger', 'Left Winger', 'Attacking Midfield'] },
    { slot: 'RW', positions: ['Right Winger', 'Right Midfield', 'Left Winger', 'Second Striker', 'Attacking Midfield'] },
  ],
  // Central midfielder always on the left, attacking
  // midfielder always in the middle.
  [
    { slot: 'CM', positions: ['Central Midfield', 'Defensive Midfield', 'Attacking Midfield', 'Left Midfield', 'Right Midfield'] },
    { slot: 'AM', positions: ['Attacking Midfield', 'Central Midfield', 'Second Striker', 'Defensive Midfield'] },
    { slot: 'DM', positions: ['Defensive Midfield', 'Central Midfield', 'Centre-Back', 'Attacking Midfield', 'Right Midfield'] },
  ],
  [
    { slot: 'LB', positions: ['Left-Back', 'Centre-Back', 'Right-Back', 'Left Midfield', 'Defensive Midfield'] },
    { slot: 'CB', positions: ['Centre-Back', 'Defensive Midfield', 'Left-Back', 'Right-Back'] },
    { slot: 'CB', positions: ['Centre-Back', 'Defensive Midfield', 'Right-Back', 'Left-Back'] },
    { slot: 'RB', positions: ['Right-Back', 'Centre-Back', 'Left-Back', 'Right Midfield', 'Defensive Midfield'] },
  ],
  [
    { slot: 'GK', positions: ['Goalkeeper'] },
  ],
];


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


// The XI as rows of { slot, player | null, exact }.
export function pickBestXI(club, league, myRankings) {

  const squad = getClubSquad(club, league, myRankings);

  const used = new Set();

  const rows = FORMATION_433.map(row =>
    row.map(spot => ({ ...spot, player: null, exact: false }))
  );

  const allSpots = rows.flat();

  const longest = Math.max(
    ...allSpots.map(spot => spot.positions.length)
  );

  // Pass 0 = everyone's exact position, then each fallback
  // level in turn, so a natural RB is never taken by the LB
  // slot's fallback before the RB slot gets him.
  for (let level = 0; level < longest; level++) {

    allSpots.forEach(spot => {

      if (spot.player || !spot.positions[level]) {
        return;
      }

      const best = squad.find(
        player =>
          !used.has(String(player.id)) &&
          player.specificPosition === spot.positions[level]
      );

      if (best) {
        spot.player = best;
        spot.exact = level === 0;
        used.add(String(best.id));
      }
    });
  }

  return rows;
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
