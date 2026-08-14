/*
============================================================
FOTRANKR RANKING ENGINE
============================================================

The user provides opinions through:

1. An initial category
2. Head-to-head comparisons

The category establishes a starting point.

Head-to-head comparisons then refine the player's
position within and around that category.

============================================================
*/

// ============================================================
// SETTINGS
// ============================================================

const SETTINGS = {
  startingRating: 2000,

  startingUncertainty: 350,

  minimumUncertainty: 45,

  maxRating: 3000,

  minRating: 0,

  /*
  How strongly a new comparison should move a player.

  New players move more because we know less about them.
  Established players move less because their position is
  becoming more certain.
  */
 newPlayerK: 70,
 developingPlayerK: 45,
 establishedPlayerK: 25,
};

// ============================================================
// CATEGORY BOUNDARIES
// ============================================================

const CATEGORY_BOUNDARIES = [
  {
    name: 'Legendary',
    minimumScore: 9.80,
    minimumRating: 2960,
  },
  {
    name: 'Elite',
    minimumScore: 9.00,
    minimumRating: 2800,
  },
  {
    name: 'Very Good',
    minimumScore: 8.00,
    minimumRating: 2600,
  },
  {
    name: 'Good',
    minimumScore: 6.00,
    minimumRating: 2200,
  },
  {
    name: 'OK',
    minimumScore: 4.00,
    minimumRating: 1800,
  },
  {
    name: 'Bad',
    minimumScore: 0.00,
    minimumRating: 1000,
  },
];

// ============================================================
// CATEGORY → SOFT STARTING RATING
// ============================================================

const CATEGORY_STARTING_RATINGS = {
  Legendary: 2980,
  Elite: 2840,
  'Very Good': 2640,
  Good: 2340,
  OK: 2000,
  Bad: 1600,
};

function categoryToStartingRating(category) {
  return (
    CATEGORY_STARTING_RATINGS[category] ??
    SETTINGS.startingRating
  );
}

// ============================================================
// RATING → DISPLAY SCORE
// ============================================================

function ratingToScore(rating) {
  /*
  2000 = 5.00
  2200 = 6.00
  2600 = 8.00
  2800 = 9.00
  2960 = 9.80
  3000 = 10.00
  */

  const rawScore =
    5 +
    (rating - 2000) / 200;

  const limitedScore = Math.max(
    0,
    Math.min(10, rawScore)
  );

  return Number(
    limitedScore.toFixed(2)
  );
}

// ============================================================
// SCORE → CATEGORY
// ============================================================

function scoreToCategory(score) {
  for (const category of CATEGORY_BOUNDARIES) {
    if (score >= category.minimumScore) {
      return category.name;
    }
  }

  return 'Bad';
}

// ============================================================
// ADD DISPLAY INFORMATION
// ============================================================

function addDisplayInformation(player) {
  const score = ratingToScore(player.rating);

  const category = scoreToCategory(score);

  return {
    ...player,
    score,
    category,
  };
}

// ============================================================
// CREATE PLAYER
// ============================================================

function createPlayer(player, startingCategory = null) {

  const startingRating =
    startingCategory
      ? categoryToStartingRating(startingCategory)
      : SETTINGS.startingRating;

  const newPlayer = {

    id: player.id,

    name: player.name,

    nation: player.nation || '',

    position: player.position || '',

    specificPosition:
      player.specificPosition || '',

    rating: startingRating,

    uncertainty:
      SETTINGS.startingUncertainty,

    comparisons: 0,

    wins: 0,

    losses: 0,

    draws: 0,

    initialCategory:
      startingCategory || null,

  };

  return addDisplayInformation(
    newPlayer
  );
}

// ============================================================
// EXPECTED RESULT
// ============================================================

function expectedResult(
  ratingA,
  ratingB
) {
  return (
    1 /
    (
      1 +
      Math.pow(
        10,
        (ratingB - ratingA) / 400
      )
    )
  );
}

// ============================================================
// ADAPTIVE K FACTOR
// ============================================================

function getKFactor(player) {
  if (player.comparisons < 3) {
    return SETTINGS.newPlayerK;
  }

  if (player.comparisons < 7) {
    return SETTINGS.developingPlayerK;
  }

  return SETTINGS.establishedPlayerK;
}

// ============================================================
// UPDATE UNCERTAINTY
// ============================================================

function updateUncertainty(player) {
  const reduction =
    player.comparisons < 3
      ? 0.82
      : player.comparisons < 7
        ? 0.88
        : 0.93;

  const newUncertainty =
    player.uncertainty * reduction;

  return Math.max(
    SETTINGS.minimumUncertainty,
    newUncertainty
  );
}

// ============================================================
// NORMALISE RESULT
// ============================================================

function normaliseResult(result) {
  if (
    result === 'player' ||
    result === 'A' ||
    result === 'a'
  ) {
    return 'A';
  }

  if (
    result === 'comparison' ||
    result === 'B' ||
    result === 'b'
  ) {
    return 'B';
  }

  if (
    result === 'equal' ||
    result === 'draw' ||
    result === 'DRAW'
  ) {
    return 'DRAW';
  }

  throw new Error(
    `Unknown comparison result: ${result}`
  );
}

// ============================================================
// COMPARE PLAYERS — FOTRANKR ELO POSITIONING
// ============================================================

function comparePlayers(
  playerA,
  playerB,
  result
) {

  const outcome =
    normaliseResult(result);

  const ratingA =
    playerA.rating;

  const ratingB =
    playerB.rating;

  const comparisonsA =
    playerA.comparisons ?? 0;

  const comparisonsB =
    playerB.comparisons ?? 0;

  // ----------------------------------------------------------
  // EXPECTED RESULTS
  // ----------------------------------------------------------

  const expectedA =
    expectedResult(
      ratingA,
      ratingB
    );

  const expectedB =
    expectedResult(
      ratingB,
      ratingA
    );

  // ----------------------------------------------------------
  // ACTUAL RESULTS
  // ----------------------------------------------------------

  let actualA;
  let actualB;

  if (outcome === 'A') {

    actualA = 1;
    actualB = 0;

  } else if (outcome === 'B') {

    actualA = 0;
    actualB = 1;

  } else {

    actualA = 0.5;
    actualB = 0.5;
  }

  // ----------------------------------------------------------
  // K FACTOR
  // ----------------------------------------------------------
  //
  // New players move more.
  //
  // Once a player has several comparisons,
  // their rating becomes increasingly stable.
  //
  // This is deliberately much calmer than the old
  // 60 / 40 / 25 / 15 system.
  //

  const getPositionK =
    (comparisons) => {

      if (comparisons === 0) {
        return 32;
      }

      if (comparisons < 3) {
        return 28;
      }

      if (comparisons < 6) {
        return 24;
      }

      if (comparisons < 10) {
        return 20;
      }

      return 16;
    };

  const kA =
    getPositionK(
      comparisonsA
    );

  const kB =
    getPositionK(
      comparisonsB
    );

  // ----------------------------------------------------------
  // STANDARD ELO MOVEMENT
  // ----------------------------------------------------------

  let changeA =
    kA *
    (
      actualA -
      expectedA
    );

  let changeB =
    kB *
    (
      actualB -
      expectedB
    );

  // ----------------------------------------------------------
  // DRAW ADJUSTMENT
  // ----------------------------------------------------------
  //
  // A draw between two similarly-rated players should
  // barely move either player.
  //
  // A draw between very different players should move
  // the ratings slightly toward one another.
  //

  if (outcome === 'DRAW') {

    const ratingDifference =
      Math.abs(
        ratingA - ratingB
      );

    const maximumDrawMovement = 12;

    const drawMovement =
      Math.min(
        maximumDrawMovement,
        ratingDifference * 0.03
      );

    if (ratingA > ratingB) {

      changeA =
        -drawMovement;

      changeB =
        drawMovement;

    } else if (ratingB > ratingA) {

      changeA =
        drawMovement;

      changeB =
        -drawMovement;

    } else {

      changeA = 0;
      changeB = 0;
    }
  }

  // ----------------------------------------------------------
  // PREVENT EXTREME SINGLE-COMPARISON MOVEMENT
  // ----------------------------------------------------------
  //
  // Even beating a hugely stronger player shouldn't
  // completely destroy the rating system.
  //

  const maximumMovement = 35;

  changeA =
    Math.max(
      -maximumMovement,
      Math.min(
        maximumMovement,
        changeA
      )
    );

  changeB =
    Math.max(
      -maximumMovement,
      Math.min(
        maximumMovement,
        changeB
      )
    );

  // ----------------------------------------------------------
  // APPLY RATING CHANGES
  // ----------------------------------------------------------

  const newRatingA =
    Math.max(
      SETTINGS.minRating,
      Math.min(
        SETTINGS.maxRating,
        ratingA + changeA
      )
    );

  const newRatingB =
    Math.max(
      SETTINGS.minRating,
      Math.min(
        SETTINGS.maxRating,
        ratingB + changeB
      )
    );

  // ----------------------------------------------------------
  // UPDATED PLAYER A
  // ----------------------------------------------------------

  const updatedA = {

    ...playerA,

    rating:
      newRatingA,

    uncertainty:
      updateUncertainty(
        playerA
      ),

    comparisons:
      comparisonsA + 1,

    wins:
      playerA.wins +
      (
        outcome === 'A'
          ? 1
          : 0
      ),

    losses:
      playerA.losses +
      (
        outcome === 'B'
          ? 1
          : 0
      ),

    draws:
      playerA.draws +
      (
        outcome === 'DRAW'
          ? 1
          : 0
      ),
  };

  // ----------------------------------------------------------
  // UPDATED PLAYER B
  // ----------------------------------------------------------

  const updatedB = {

    ...playerB,

    rating:
      newRatingB,

    uncertainty:
      updateUncertainty(
        playerB
      ),

    comparisons:
      comparisonsB + 1,

    wins:
      playerB.wins +
      (
        outcome === 'B'
          ? 1
          : 0
      ),

    losses:
      playerB.losses +
      (
        outcome === 'A'
          ? 1
          : 0
      ),

    draws:
      playerB.draws +
      (
        outcome === 'DRAW'
          ? 1
          : 0
      ),
  };

  // ----------------------------------------------------------
  // RETURN UPDATED PLAYERS
  // ----------------------------------------------------------

  return {

    playerA:
      addDisplayInformation(
        updatedA
      ),

    playerB:
      addDisplayInformation(
        updatedB
      ),

    expectedA,

    expectedB,

    changeA,

    changeB,
  };
}

// ============================================================
// FIND BEST OPPONENT
// ============================================================
//
// Selects the best available opponent for the current
// head-to-head comparison.
//
// Priority:
// 1. Same specific position
// 2. Already ranked players
// 3. Closest rating
// 4. Never previously compared against this player
//
// ============================================================

function findBestOpponent(
  targetPlayer,
  opponents,
  comparisonHistory = []
) {

  if (!targetPlayer || !Array.isArray(opponents)) {
    return null;
  }

  // ----------------------------------------------------------
  // PLAYERS ALREADY COMPARED AGAINST TARGET
  // ----------------------------------------------------------

  const alreadyCompared = new Set();

  comparisonHistory.forEach(comparison => {

    if (
      String(comparison.playerA) ===
      String(targetPlayer.id)
    ) {

      alreadyCompared.add(
        String(comparison.playerB)
      );

    }

    if (
      String(comparison.playerB) ===
      String(targetPlayer.id)
    ) {

      alreadyCompared.add(
        String(comparison.playerA)
      );

    }

  });

  // ----------------------------------------------------------
  // REMOVE PLAYERS ALREADY COMPARED
  // ----------------------------------------------------------

  const availableOpponents =
    opponents.filter(opponent => {

      if (!opponent) {
        return false;
      }

      if (
        String(opponent.id) ===
        String(targetPlayer.id)
      ) {
        return false;
      }

      return !alreadyCompared.has(
        String(opponent.id)
      );

    });

  if (availableOpponents.length === 0) {
    return null;
  }

  // ----------------------------------------------------------
  // SAME POSITION FIRST
  // ----------------------------------------------------------

  const samePosition =
    availableOpponents.filter(opponent =>

      targetPlayer.specificPosition &&
      opponent.specificPosition &&
      opponent.specificPosition ===
      targetPlayer.specificPosition

    );

  const pool =
    samePosition.length > 0
      ? samePosition
      : availableOpponents;

  // ----------------------------------------------------------
  // FIND CLOSEST RATING
  // ----------------------------------------------------------

  const targetRating =
    Number(targetPlayer.rating ?? 2000);

  const sorted =
    [...pool].sort((a, b) => {

      const ratingA =
        Math.abs(
          Number(a.rating ?? 2000) -
          targetRating
        );

      const ratingB =
        Math.abs(
          Number(b.rating ?? 2000) -
          targetRating
        );

      return ratingA - ratingB;

    });

  return sorted[0] ?? null;
}

// ============================================================
// EXPORTS
// ============================================================

export {
  categoryToStartingRating,
  comparePlayers,
  createPlayer,
  findBestOpponent,
  ratingToScore,
  scoreToCategory
};
