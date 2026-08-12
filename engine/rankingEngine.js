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

  return {
    id: player.id,

    name: player.name,

    nation: player.nation || '',

    position: player.position || '',
   
    specificPosition:
      player.specificPosition || '',

    rating: startingRating,

    uncertainty:
      startingCategory
        ? SETTINGS.startingUncertainty
        : SETTINGS.startingUncertainty,

    comparisons: 0,

    wins: 0,

    losses: 0,

    draws: 0,

    initialCategory:
      startingCategory || null,
  };
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
// COMPARE PLAYERS
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

  const kA =
    getKFactor(playerA);

  const kB =
    getKFactor(playerB);

  /*
  Standard Elo movement.

  A player who beats someone much higher rated
  moves more than a player who beats someone
  they were already expected to beat.
  */

  const changeA =
    kA *
    (
      actualA -
      expectedA
    );

  const changeB =
    kB *
    (
      actualB -
      expectedB
    );

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

  const updatedA = {
    ...playerA,

    rating:
      newRatingA,

    uncertainty:
      updateUncertainty(
        playerA
      ),

    comparisons:
      playerA.comparisons + 1,

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

  const updatedB = {
    ...playerB,

    rating:
      newRatingB,

    uncertainty:
      updateUncertainty(
        playerB
      ),

    comparisons:
      playerB.comparisons + 1,

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
// CATEGORY FOR RATING
// ============================================================

function getRatingCategory(rating) {
  return scoreToCategory(
    ratingToScore(rating)
  );
}

// ============================================================
// FIND BEST NEXT OPPONENT
// ============================================================

function findBestOpponent(
  targetPlayer,
  availablePlayers,
  comparisonHistory = []
) {

  // ==========================================================
  // AUTOMATIC RANKING LIMIT
  // ==========================================================

  const comparisons =
    targetPlayer.comparisons ?? 0;

  // A player can have a maximum of 6
  // automatic ranking comparisons.
  //
  // Challenge comparisons bypass this function
  // and therefore remain unlimited.

 

  if (
    !availablePlayers ||
    availablePlayers.length === 0
  ) {
    return null;
  }

  // ==========================================================
  // EXACT SPECIFIC-POSITION POOL
  // ==========================================================

  const targetSpecificPosition =
    targetPlayer.specificPosition;

  let candidates =
    availablePlayers.filter(
      player => {

        // Never compare a player against themselves.
        if (
          player.id ===
          targetPlayer.id
        ) {
          return false;
        }

        // Specific position is a hard requirement.
        //
        // Example:
        // Alisson -> Goalkeeper
        // Theo Hernandez -> Left-Back
        // Rodri -> Defensive Midfielder
        if (
          targetSpecificPosition &&
          player.specificPosition !==
            targetSpecificPosition
        ) {
          return false;
        }

        // Never repeat an automatic H2H.
        const hasCompared =
          comparisonHistory.some(
            comparison =>

              (
                comparison.playerA ===
                  targetPlayer.id &&
                comparison.playerB ===
                  player.id
              ) ||

              (
                comparison.playerB ===
                  targetPlayer.id &&
                comparison.playerA ===
                  player.id
              )
          );

        return !hasCompared;
      }
    );

  // No eligible opponent.
  if (
    candidates.length === 0
  ) {
    return null;
  }

  // ==========================================================
  // CURRENT PLAYER INFORMATION
  // ==========================================================

  const targetRating =
    targetPlayer.rating;

  const targetCategory =
    getRatingCategory(
      targetRating
    );

  // ==========================================================
  // SORT BY RATING DISTANCE
  // ==========================================================

  const closestPlayers =
    [...candidates].sort(
      (a, b) => {

        const distanceA =
          Math.abs(
            a.rating -
            targetRating
          );

        const distanceB =
          Math.abs(
            b.rating -
            targetRating
          );

        return (
          distanceA -
          distanceB
        );
      }
    );

  // ==========================================================
  // SAME CATEGORY
  // ==========================================================

  const sameCategory =
    closestPlayers.filter(
      player =>
        getRatingCategory(
          player.rating
        ) === targetCategory
    );

  // ==========================================================
  // ABOVE / BELOW PLAYER
  // ==========================================================

  const playersAbove =
    closestPlayers.filter(
      player =>
        player.rating >
        targetRating
    );

  const playersBelow =
    closestPlayers.filter(
      player =>
        player.rating <
        targetRating
    );

  // ==========================================================
  // SIX-STAGE AUTOMATIC RANKING
  // ==========================================================

  // ----------------------------------------------------------
  // H2H 1
  // Establish a rough position.
  // Prefer someone in the same category.
  // ----------------------------------------------------------

  if (
    comparisons === 0
  ) {

    if (
      sameCategory.length > 0
    ) {
      return sameCategory[0];
    }

    return closestPlayers[0];
  }

  // ----------------------------------------------------------
  // H2H 2
  // Find another close opponent.
  // ----------------------------------------------------------

  if (
    comparisons === 1
  ) {

    if (
      sameCategory.length > 0
    ) {
      return sameCategory[0];
    }

    return closestPlayers[0];
  }

  // ----------------------------------------------------------
  // H2H 3
  // TEST ABOVE
  //
  // Deliberately challenge the player against someone
  // rated higher than them.
  // ----------------------------------------------------------

  if (
    comparisons === 2
  ) {

    if (
      playersAbove.length > 0
    ) {
      return playersAbove[0];
    }

    return closestPlayers[0];
  }

  // ----------------------------------------------------------
  // H2H 4
  // TEST BELOW
  //
  // Deliberately challenge the player against someone
  // rated lower than them.
  // ----------------------------------------------------------

  if (
    comparisons === 3
  ) {

    if (
      playersBelow.length > 0
    ) {
      return playersBelow[0];
    }

    return closestPlayers[0];
  }

  // ----------------------------------------------------------
  // H2H 5
  // REFINE
  //
  // At this point the rating should have moved based on
  // the first four results.
  //
  // Find the closest remaining player to the new rating.
  // ----------------------------------------------------------

  if (
    comparisons === 4
  ) {
    return closestPlayers[0];
  }

  // ----------------------------------------------------------
  // H2H 6
  // FINAL CONFIRMATION
  //
  // Again use the closest remaining player.
  // ----------------------------------------------------------

  if (
    comparisons === 5
  ) {
    return closestPlayers[0];
  }

  // Safety fallback.
  return closestPlayers[0];
}

// ============================================================
// CATEGORY BOUNDARY DISTANCE
// ============================================================

function getCategoryBoundaryDistance(
  player
) {
  const score =
    ratingToScore(
      player.rating
    );

  const category =
    scoreToCategory(
      score
    );

  const currentIndex =
    CATEGORY_BOUNDARIES.findIndex(
      item =>
        item.name === category
    );

  if (
    currentIndex === -1
  ) {
    return null;
  }

  const categoryData =
    CATEGORY_BOUNDARIES[
      currentIndex
    ];

  const nextCategory =
    CATEGORY_BOUNDARIES[
      currentIndex - 1
    ];

  if (
    !nextCategory
  ) {
    return null;
  }

  return (
    nextCategory.minimumRating -
    player.rating
  );
}

// ============================================================
// CONFIDENCE
// ============================================================

function getConfidence(player) {
  const uncertainty =
    player.uncertainty ??
    SETTINGS.startingUncertainty;

  const comparisons =
    player.comparisons ?? 0;

  /*
  We want both things to matter:

  - More comparisons = better confidence
  - Lower uncertainty = better confidence
  */

  if (
    comparisons >= 7 &&
    uncertainty <= 100
  ) {
    return 'High';
  }

  if (
    comparisons >= 3 &&
    uncertainty <= 200
  ) {
    return 'Medium';
  }

  return 'Low';
}

// ============================================================
// SHOULD CONTINUE COMPARING
// ============================================================

function shouldContinueComparing(
  player
) {
  const confidence =
    getConfidence(
      player
    );

  return confidence !== 'High';
}

// ============================================================
// EXPORTS
// ============================================================

export {
  categoryToStartingRating, comparePlayers, createPlayer, findBestOpponent,
  getConfidence, ratingToScore,
  scoreToCategory, shouldContinueComparing
};
