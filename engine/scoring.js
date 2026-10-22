/*
============================================================
FOTRANKR SCORING (v2)
============================================================

1. SCORES FROM THE WHOLE HISTORY
   Every head-to-head the user has answered is kept. Scores
   are worked out from ALL of them at once (a Bradley-Terry
   model, the maths behind chess-style ratings), separately
   for each category, and always stay inside that category's
   range. One odd answer is outweighed by the rest, and a
   score is a pure function of (categories + history), so it
   can be recalculated at any time.

   "Slightly / clearly / much better" count as 1 / 2 / 3
   wins, so decisive answers spread players further apart.

   Between the same two players, the LATEST answer counts
   most (older ones fade), and is always respected: the
   winner ends above the loser by a gap that grows with the
   margin. So changing your mind visibly moves them apart.

2. PLACEMENT (narrowing down)
   A player's automatic head-to-heads start against the
   middle player of their group and halve the remaining
   range each time, so 6 answers place them among up to 63
   players. Group = same category + same specific position
   ONLY (a Centre-Back only ever faces Centre-Backs).

3. PROMOTION / RELEGATION
   Beat everyone above you in your category -> a match
   against the bottom of the category above; win it to move
   up. Lose to everyone below -> a match against the top of
   the category below; lose it to move down.

4. CHECK-UPS
   After a ranking, re-ask pairs where a direct result
   disagrees with the scores, or near-ties never compared.
============================================================
*/

export const CATEGORY_RANGES = {
  Legendary: { min: 9.80, max: 10.00 },
  Elite: { min: 9.00, max: 9.79 },
  'Very Good': { min: 8.00, max: 8.99 },
  Good: { min: 6.00, max: 7.99 },
  OK: { min: 4.00, max: 5.99 },
  Bad: { min: 0.00, max: 3.99 },
};

// Low to high.
export const CATEGORY_ORDER = [
  'Bad',
  'OK',
  'Good',
  'Very Good',
  'Elite',
  'Legendary',
];

export const MARGINS = {
  slight: { label: 'SLIGHTLY', weight: 1 },
  clear: { label: 'CLEARLY', weight: 2 },
  much: { label: 'MUCH', weight: 3 },
};

// Results saved before margins existed.
const DEFAULT_WEIGHT = MARGINS.clear.weight;

// Pretend games against an average player, so a player with
// few results stays near the middle of the category.
const PRIOR_GAMES = 1;

const ITERATIONS = 150;

// How strongly strength differences spread scores out.
// Higher = gentler, so players fill the whole range instead
// of piling up at its top and bottom.
const SPREAD = 3;

// Between the same two players, each older answer counts
// this much of the one after it, so the latest answer
// decides when the user changes their mind.
const RECENCY_DECAY = 0.25;

// After a decisive latest answer, the winner always ends at
// least this share of the category's range above the loser
// (Good spans 2.00, so "clearly" = 0.08; Legendary only spans
// 0.20, so its gaps are smaller). Never less than 0.01.
const MIN_GAP_SHARE = { slight: 0.015, clear: 0.04, much: 0.075 };
const DEFAULT_GAP_SHARE = MIN_GAP_SHARE.clear;

// Within this of each other = "nearly tied" for check-ups.
const NEAR_TIE = 0.02;


// ==========================================================
// READING A SAVED RESULT
// ==========================================================

// { a, b, aWins, bWins } in "games", or null.
export function readResult(entry) {

  if (!entry || entry.playerA == null || entry.playerB == null) {
    return null;
  }

  const a = String(entry.playerA);
  const b = String(entry.playerB);

  const weight =
    MARGINS[entry.margin]?.weight || DEFAULT_WEIGHT;

  const result = String(entry.result || '').toLowerCase();

  if (['player', 'a', 'playera', 'win'].includes(result)) {
    return { a, b, aWins: weight, bWins: 0 };
  }

  if (['comparison', 'b', 'playerb', 'loss'].includes(result)) {
    return { a, b, aWins: 0, bWins: weight };
  }

  if (['equal', 'draw', 'tie'].includes(result)) {
    return { a, b, aWins: 0.5, bWins: 0.5 };
  }

  return null;
}


// ==========================================================
// 1. SCORES FROM THE WHOLE HISTORY
// ==========================================================

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);


export function recomputeScores(myRankings, comparisonHistory) {

  const rankings = myRankings || [];

  const scoreById = new Map();

  const history = comparisonHistory || [];

  // How many NEWER answers each answer has for its pair, and
  // the latest decisive answer per pair.
  const newerCount = new Array(history.length).fill(0);
  const latestByPair = new Map();

  const seen = new Map();

  for (let index = history.length - 1; index >= 0; index--) {

    const game = readResult(history[index]);

    if (!game || game.a === game.b) {
      continue;
    }

    const key = pairKey(game.a, game.b);

    newerCount[index] = seen.get(key) || 0;
    seen.set(key, newerCount[index] + 1);

    if (!latestByPair.has(key)) {
      latestByPair.set(key, {
        game,
        margin: history[index].margin,
      });
    }
  }

  Object.entries(CATEGORY_RANGES).forEach(([category, range]) => {

    const ids = rankings
      .filter(player => player.category === category)
      .map(player => String(player.id));

    if (ids.length === 0) {
      return;
    }

    const inCategory = new Set(ids);

    // wins[i][j] = games i won against j.
    const wins = new Map(ids.map(id => [id, new Map()]));

    history.forEach((entry, index) => {

      const game = readResult(entry);

      if (
        !game ||
        game.a === game.b ||
        !inCategory.has(game.a) ||
        !inCategory.has(game.b)
      ) {
        return;
      }

      const fade = Math.pow(RECENCY_DECAY, newerCount[index]);

      const addWins = (winner, loser, amount) => {
        if (amount > 0) {
          const row = wins.get(winner);
          row.set(loser, (row.get(loser) || 0) + amount);
        }
      };

      addWins(game.a, game.b, game.aWins * fade);
      addWins(game.b, game.a, game.bWins * fade);
    });

    // Bradley-Terry strengths by minorise-maximise updates.
    // The average player has strength 1.
    const strength = new Map(ids.map(id => [id, 1]));

    for (let pass = 0; pass < ITERATIONS; pass++) {

      ids.forEach(i => {

        let won = PRIOR_GAMES / 2;
        let denominator =
          PRIOR_GAMES / (strength.get(i) + 1);

        const rowI = wins.get(i);

        ids.forEach(j => {

          if (i === j) {
            return;
          }

          const iBeatJ = rowI.get(j) || 0;
          const jBeatI = wins.get(j).get(i) || 0;
          const games = iBeatJ + jBeatI;

          if (games === 0) {
            return;
          }

          won += iBeatJ;
          denominator +=
            games / (strength.get(i) + strength.get(j));
        });

        strength.set(i, won / denominator);
      });
    }

    // Strength 1 -> middle of the range; the stronger, the
    // closer to the top (never outside it).
    const categoryScores = new Map();

    ids.forEach(id => {

      const p = Math.pow(strength.get(id), 1 / SPREAD);

      categoryScores.set(
        id,
        range.min + (range.max - range.min) * (p / (1 + p))
      );
    });


    // The latest decisive answer between two players always
    // shows: winner above loser by a margin-sized gap.
    // Repeat until settled (one fix can upset another).
    for (let pass = 0; pass < 60; pass++) {

      let changed = false;

      latestByPair.forEach(({ game, margin }) => {

        if (
          !inCategory.has(game.a) ||
          !inCategory.has(game.b) ||
          game.aWins === game.bWins
        ) {
          return;
        }

        const winner = game.aWins > game.bWins ? game.a : game.b;
        const loser = winner === game.a ? game.b : game.a;

        const gap = Math.max(
          0.01,
          (MIN_GAP_SHARE[margin] || DEFAULT_GAP_SHARE) *
            (range.max - range.min)
        );

        const winnerScore = categoryScores.get(winner);
        const loserScore = categoryScores.get(loser);

        if (winnerScore - loserScore >= gap - 1e-9) {
          return;
        }

        changed = true;

        // Split the move between them; at the top or bottom
        // of the range, move the other player instead so the
        // gap survives.
        const middle = Math.min(
          range.max - gap / 2,
          Math.max(range.min + gap / 2, (winnerScore + loserScore) / 2)
        );

        categoryScores.set(
          winner,
          Math.max(middle + gap / 2, winnerScore)
        );

        categoryScores.set(
          loser,
          Math.min(middle - gap / 2, loserScore)
        );
      });

      if (!changed) {
        break;
      }
    }


    categoryScores.forEach((score, id) => {
      scoreById.set(
        id,
        Math.min(
          range.max,
          Math.max(range.min, Math.round(score * 100) / 100)
        )
      );
    });
  });

  return rankings.map(player => {

    const score = scoreById.get(String(player.id));

    if (score === undefined) {
      return player;
    }

    return {
      ...player,
      score,
      rating: Math.round(score * 1000) / 10,
    };
  });
}


// ==========================================================
// 2. PLACEMENT
// ==========================================================

// Ranked players (not Unknown) in a category, best first.
function categoryPlayers(category, rankings, excludeId) {

  return (rankings || [])
    .filter(
      player =>
        player.category === category &&
        String(player.id) !== String(excludeId)
    )
    .sort((a, b) => b.score - a.score);
}


// Automatic head-to-heads are ONLY ever between players in
// the same specific position (e.g. Centre-Back vs
// Centre-Back), for placement and promotion/relegation.
function tiersFor(target, pool) {

  return [
    pool.filter(
      player =>
        player.position === target.position &&
        player.specificPosition === target.specificPosition
    ),
  ];
}


// What this session's results say about the target:
// { above, below, drew, faced }
//   above = lowest score of anyone the target LOST to
//   below = highest score of anyone the target BEAT
function sessionBounds(sessionResults, rankings) {

  const scoreOf = id =>
    (rankings || []).find(
      player => String(player.id) === String(id)
    )?.score;

  let above = Infinity;
  let below = -Infinity;
  let drew = false;

  const faced = new Set();

  (sessionResults || []).forEach(result => {

    faced.add(String(result.opponentId));

    const score = scoreOf(result.opponentId);

    if (score === undefined) {
      return;
    }

    if (result.outcome === 'win') {
      below = Math.max(below, score);
    } else if (result.outcome === 'loss') {
      above = Math.min(above, score);
    } else {
      drew = true;
    }
  });

  return { above, below, drew, faced };
}


// The next opponent to narrow the target down, or null when
// they're placed (or there's nobody left to ask about).
export function nextPlacementOpponent({
  target,
  category,
  rankings,
  sessionResults,
}) {

  const { above, below, drew, faced } =
    sessionBounds(sessionResults, rankings);

  // "They're equal" = placed right next to that player.
  if (drew) {
    return null;
  }

  const pool = categoryPlayers(category, rankings, target.id)
    .filter(player => !faced.has(String(player.id)));

  for (const tier of tiersFor(target, pool)) {

    const candidates = tier.filter(
      player => player.score > below && player.score < above
    );

    if (candidates.length > 0) {
      return candidates[Math.floor(candidates.length / 2)];
    }
  }

  return null;
}


// Lowest (or highest) scored player in a category, matching
// the target's position as closely as possible.
function edgePlayer(target, category, rankings, wantLowest) {

  const pool = categoryPlayers(category, rankings, target.id);

  for (const tier of tiersFor(target, pool)) {
    if (tier.length > 0) {
      return wantLowest ? tier[tier.length - 1] : tier[0];
    }
  }

  return null;
}


// Once placement is done: { type, toCategory, opponent } for
// a promotion/relegation match, or null.
export function promotionMatch({
  target,
  category,
  rankings,
  sessionResults,
}) {

  const { above, below, drew } =
    sessionBounds(sessionResults, rankings);

  if (drew) {
    return null;
  }

  const others = categoryPlayers(category, rankings, target.id);

  const index = CATEGORY_ORDER.indexOf(category);

  // Beat someone, lost to nobody, nobody left above.
  if (
    below > -Infinity &&
    above === Infinity &&
    !others.some(player => player.score > below)
  ) {

    const toCategory = CATEGORY_ORDER[index + 1];

    const opponent = toCategory &&
      edgePlayer(target, toCategory, rankings, true);

    return opponent
      ? { type: 'promotion', toCategory, opponent }
      : null;
  }

  // Lost to someone, beat nobody, nobody left below.
  if (
    above < Infinity &&
    below === -Infinity &&
    !others.some(player => player.score < above)
  ) {

    const toCategory = index > 0 && CATEGORY_ORDER[index - 1];

    const opponent = toCategory &&
      edgePlayer(target, toCategory, rankings, false);

    return opponent
      ? { type: 'relegation', toCategory, opponent }
      : null;
  }

  return null;
}


// ==========================================================
// 4. CHECK-UPS
// ==========================================================

// Up to `limit` players worth re-checking against the target:
// [{ opponent, reason: 'contradiction' | 'close' }]
export function findCheckups({
  target,
  category,
  rankings,
  comparisonHistory,
  limit = 2,
}) {

  const me = (rankings || []).find(
    player => String(player.id) === String(target.id)
  );

  if (!me || me.category !== category) {
    return [];
  }

  const others = categoryPlayers(category, rankings, me.id);

  const byId = new Map(
    others.map(player => [String(player.id), player])
  );

  const compared = new Set();
  const checks = [];
  const used = new Set();

  (comparisonHistory || []).forEach(entry => {

    const game = readResult(entry);

    if (!game) {
      return;
    }

    const myId = String(me.id);

    if (game.a !== myId && game.b !== myId) {
      return;
    }

    const otherId = game.a === myId ? game.b : game.a;

    compared.add(otherId);

    const other = byId.get(otherId);

    if (!other || used.has(otherId)) {
      return;
    }

    // A direct result the scores now disagree with.
    const iWon =
      game.a === myId ? game.aWins > game.bWins : game.bWins > game.aWins;

    const iLost =
      game.a === myId ? game.aWins < game.bWins : game.bWins < game.aWins;

    if (
      (iWon && me.score < other.score) ||
      (iLost && me.score > other.score)
    ) {
      checks.push({ opponent: other, reason: 'contradiction' });
      used.add(otherId);
    }
  });

  // Nearly tied with someone in the same position, never
  // compared directly.
  others
    .filter(
      player =>
        player.specificPosition === me.specificPosition &&
        !compared.has(String(player.id)) &&
        !used.has(String(player.id)) &&
        Math.abs(player.score - me.score) <= NEAR_TIE
    )
    .forEach(player => {
      checks.push({ opponent: player, reason: 'close' });
      used.add(String(player.id));
    });

  return checks.slice(0, limit);
}
