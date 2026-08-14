/*
============================================================
FOTRANKR RANKING ENGINE
============================================================

PHILOSOPHY

FotRankr does NOT have its own opinion about footballers.

The user establishes rankings through:

1. An initial category
2. Head-to-head comparisons

The first player can act as an ANCHOR.

Every later comparison creates a relationship:

    A > B
    A = B
    B > A

Those relationships are used to position players relative
to one another.

The system is NOT standard Elo.

============================================================
*/

// ============================================================
// SETTINGS
// ============================================================

const SETTINGS = {

  minRating: 0,

  maxRating: 3000,

  startingUncertainty: 350,

  minimumUncertainty: 45,

  /*
  Maximum movement caused by one completed H2H set.
  Keeping this controlled prevents players jumping straight
  from Elite to Legendary after a handful of comparisons.
  */

  maxPositionMovement: 180,

};

// ============================================================
// CATEGORY STARTING RATINGS
// ============================================================

const CATEGORY_STARTING_RATINGS = {

  Legendary: 2980,

  Elite: 2840,

  'Very Good': 2640,

  Good: 2340,

  OK: 2000,

  Bad: 1600,

};

// ============================================================
// CATEGORY BOUNDARIES
// ============================================================

const CATEGORY_BOUNDARIES = [

  {
    name: 'Legendary',
    minimumScore: 9.80,
  },

  {
    name: 'Elite',
    minimumScore: 9.00,
  },

  {
    name: 'Very Good',
    minimumScore: 8.00,
  },

  {
    name: 'Good',
    minimumScore: 6.00,
  },

  {
    name: 'OK',
    minimumScore: 4.00,
  },

  {
    name: 'Bad',
    minimumScore: 0.00,
  },

];

// ============================================================
// CATEGORY → STARTING RATING
// ============================================================

function categoryToStartingRating(category) {

  return (
    CATEGORY_STARTING_RATINGS[category] ??
    2000
  );

}

// ============================================================
// RATING → DISPLAY SCORE
// ============================================================

function ratingToScore(rating) {

  /*
  Rating scale:

  1000 = 0.00
  1600 = 3.00
  1800 = 4.00
  2000 = 5.00
  2200 = 6.00
  2340 = 6.70
  2600 = 8.00
  2800 = 9.00
  2980 = 9.90
  3000 = 10.00
  */

  const rawScore =
    5 +
    ((rating - 2000) / 200);

  const limitedScore =
    Math.max(
      0,
      Math.min(
        10,
        rawScore
      )
    );

  return Number(
    limitedScore.toFixed(2)
  );

}

// ============================================================
// SCORE → CATEGORY
// ============================================================

function scoreToCategory(score) {

  for (
    const category
    of CATEGORY_BOUNDARIES
  ) {

    if (
      score >= category.minimumScore
    ) {

      return category.name;

    }

  }

  return 'Bad';

}

// ============================================================
// ADD DISPLAY INFORMATION
// ============================================================

function addDisplayInformation(player) {

  const score =
    ratingToScore(
      player.rating
    );

  const category =
    scoreToCategory(
      score
    );

  return {

    ...player,

    score,

    category,

  };

}

// ============================================================
// CREATE PLAYER
// ============================================================

function createPlayer(
  player,
  startingCategory = null
) {

  const startingRating =
    startingCategory
      ? categoryToStartingRating(
          startingCategory
        )
      : 2000;

  const newPlayer = {

    id: player.id,

    name: player.name,

    nation:
      player.nation || '',

    position:
      player.position || '',

    specificPosition:
      player.specificPosition || '',

    rating:
      startingRating,

    uncertainty:
      SETTINGS.startingUncertainty,

    comparisons: 0,

    wins: 0,

    losses: 0,

    draws: 0,

    initialCategory:
      startingCategory || null,

    /*
    Anchor players establish the initial ranking
    and do not need six comparisons.
    */

    isAnchor: false,

  };

  return addDisplayInformation(
    newPlayer
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
// FIND BEST OPPONENT
// ============================================================

function findBestOpponent(
  targetPlayer,
  opponents,
  comparisonHistory = []
) {

  if (
    !targetPlayer ||
    !opponents ||
    opponents.length === 0
  ) {

    return null;

  }

  /*
  Only use players who are already genuinely ranked.

  This is extremely important.

  We do NOT want a temporary 2000-rated player
  becoming an accidental ranking anchor.
  */

  const rankedOpponents =
    opponents.filter(
      opponent =>
        opponent.isRanked === true ||
        opponent.isAnchor === true ||
        opponent.comparisons > 0
    );

  if (
    rankedOpponents.length === 0
  ) {

    return null;

  }

  /*
  Don't repeatedly ask the same H2H.
  */

  const alreadyCompared =
    new Set();

  comparisonHistory.forEach(
    comparison => {

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

    }
  );

  const availableOpponents =
    rankedOpponents.filter(
      opponent =>
        !alreadyCompared.has(
          String(opponent.id)
        )
    );

  if (
    availableOpponents.length === 0
  ) {

    return null;

  }

  /*
  Choose the player whose rating is closest.

  This gives the most useful comparison because
  the user is deciding between relatively similar
  footballers.
  */

  availableOpponents.sort(
    (a, b) => {

      const differenceA =
        Math.abs(
          a.rating -
          targetPlayer.rating
        );

      const differenceB =
        Math.abs(
          b.rating -
          targetPlayer.rating
        );

      return (
        differenceA -
        differenceB
      );

    }
  );

  return availableOpponents[0];

}

// ============================================================
// RELATIVE POSITION SCORE
// ============================================================

function getRelativeMovement(
  playerA,
  playerB,
  outcome
) {

  const ratingA =
    playerA.rating;

  const ratingB =
    playerB.rating;

  const difference =
    ratingA -
    ratingB;

  const absoluteDifference =
    Math.abs(
      difference
    );

  /*
  Players close together:

  A H2H is very informative.
  */

  if (
    absoluteDifference <= 100
  ) {

    if (
      outcome === 'A'
    ) {

      return 70;

    }

    if (
      outcome === 'B'
    ) {

      return -70;

    }

    return 0;

  }

  /*
  Moderate difference.
  */

  if (
    absoluteDifference <= 250
  ) {

    if (
      outcome === 'A'
    ) {

      return 50;

    }

    if (
      outcome === 'B'
    ) {

      return -50;

    }

    return 0;

  }

  /*
  Large difference.

  Still meaningful, but less influential.
  */

  if (
    absoluteDifference <= 500
  ) {

    if (
      outcome === 'A'
    ) {

      return 30;

    }

    if (
      outcome === 'B'
    ) {

      return -30;

    }

    return 0;

  }

  /*
  Huge difference.

  The result still matters, but only slightly.
  */

  if (
    outcome === 'A'
  ) {

    return 15;

  }

  if (
    outcome === 'B'
  ) {

    return -15;

  }

  return 0;

}

// ============================================================
// UPDATE UNCERTAINTY
// ============================================================

function updateUncertainty(
  player
) {

  const comparisons =
    player.comparisons ?? 0;

  let reduction;

  if (
    comparisons < 3
  ) {

    reduction = 0.82;

  } else if (
    comparisons < 6
  ) {

    reduction = 0.88;

  } else {

    reduction = 0.93;

  }

  const newUncertainty =
    player.uncertainty *
    reduction;

  return Math.max(
    SETTINGS.minimumUncertainty,
    newUncertainty
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
    normaliseResult(
      result
    );

  /*
  IMPORTANT:

  This function calculates a relationship.

  It does NOT assume that player B should become
  a permanent ranked player.

  App.js decides whether player B is saved.
  */

  let movement =
    getRelativeMovement(
      playerA,
      playerB,
      outcome
    );

  /*
  Reduce movement slightly for players who have
  already completed many comparisons.

  This gives early H2Hs more influence while making
  established rankings stable.
  */

  const comparisonsA =
    playerA.comparisons ?? 0;

  const comparisonsB =
    playerB.comparisons ?? 0;

  const experienceFactorA =
    Math.max(
      0.45,
      1 -
        (
          comparisonsA *
          0.07
        )
    );

  const experienceFactorB =
    Math.max(
      0.45,
      1 -
        (
          comparisonsB *
          0.07
        )
    );

  const movementA =
    movement *
    experienceFactorA;

  const movementB =
    movement *
    experienceFactorB;

  /*
  DRAW

  Pull the players slightly towards one another.
  */

  let changeA = 0;
  let changeB = 0;

  if (
    outcome === 'DRAW'
  ) {

    const difference =
      Math.abs(
        playerA.rating -
        playerB.rating
      );

    const adjustment =
      Math.min(
        30,
        difference * 0.08
      );

    if (
      playerA.rating >
      playerB.rating
    ) {

      changeA =
        -adjustment;

      changeB =
        adjustment;

    } else {

      changeA =
        adjustment;

      changeB =
        -adjustment;

    }

  }

  else {

    /*
    A wins.

    A moves up.
    B moves down.
    */

    if (
      outcome === 'A'
    ) {

      changeA =
        Math.abs(
          movementA
        );

      changeB =
        -Math.abs(
          movementB
        );

    }

    /*
    B wins.

    B moves up.
    A moves down.
    */

    else {

      changeA =
        -Math.abs(
          movementA
        );

      changeB =
        Math.abs(
          movementB
        );

    }

  }

  /*
  Don't allow one comparison to create a huge jump.
  */

  changeA =
    Math.max(
      -SETTINGS.maxPositionMovement,
      Math.min(
        SETTINGS.maxPositionMovement,
        changeA
      )
    );

  changeB =
    Math.max(
      -SETTINGS.maxPositionMovement,
      Math.min(
        SETTINGS.maxPositionMovement,
        changeB
      )
    );

  const newRatingA =
    Math.max(
      SETTINGS.minRating,
      Math.min(
        SETTINGS.maxRating,
        playerA.rating +
          changeA
      )
    );

  const newRatingB =
    Math.max(
      SETTINGS.minRating,
      Math.min(
        SETTINGS.maxRating,
        playerB.rating +
          changeB
      )
    );

  // ========================================================
  // UPDATED PLAYER A
  // ========================================================

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
      (playerA.wins ?? 0) +
      (
        outcome === 'A'
          ? 1
          : 0
      ),

    losses:
      (playerA.losses ?? 0) +
      (
        outcome === 'B'
          ? 1
          : 0
      ),

    draws:
      (playerA.draws ?? 0) +
      (
        outcome === 'DRAW'
          ? 1
          : 0
      ),

  };

  // ========================================================
  // UPDATED PLAYER B
  // ========================================================

  const updatedB = {

    ...playerB,

    rating:
      newRatingB,

    uncertainty:
      updateUncertainty(
        playerB
      ),

    comparisons:
      (playerB.comparisons ?? 0) + 1,

    wins:
      (playerB.wins ?? 0) +
      (
        outcome === 'B'
          ? 1
          : 0
      ),

    losses:
      (playerB.losses ?? 0) +
      (
        outcome === 'A'
          ? 1
          : 0
      ),

    draws:
      (playerB.draws ?? 0) +
      (
        outcome === 'DRAW'
          ? 1
          : 0
      ),

  };

  /*
  Add display information after calculating
  the new ratings.
  */

  const finalA =
    addDisplayInformation(
      updatedA
    );

  const finalB =
    addDisplayInformation(
      updatedB
    );

  return {

    playerA:
      finalA,

    playerB:
      finalB,

  };

}

// ============================================================
// CONFIDENCE
// ============================================================

function getConfidence(
  player
) {

  const uncertainty =
    player?.uncertainty ??
    SETTINGS.startingUncertainty;

  const confidence =
    1 -
    (
      uncertainty /
      SETTINGS.startingUncertainty
    );

  return Math.max(
    0,
    Math.min(
      1,
      Number(
        confidence.toFixed(2)
      )
    )
  );

}

// ============================================================
// SHOULD CONTINUE COMPARING
// ============================================================

function shouldContinueComparing(
  player
) {

  if (!player) {

    return false;

  }

  /*
  The anchor does not need H2Hs.
  */

  if (
    player.isAnchor
  ) {

    return false;

  }

  /*
  Six comparisons gives us the initial
  positioning information we want.
  */

  return (
    (player.comparisons ?? 0) <
    6
  );

}

// ============================================================
// EXPORTS
// ============================================================

export {

  categoryToStartingRating,

  comparePlayers,

  createPlayer,

  findBestOpponent,

  getConfidence,

  ratingToScore,

  scoreToCategory,

  shouldContinueComparing
};
