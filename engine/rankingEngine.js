/*
============================================================
FOTRANKR RANKING ENGINE
============================================================

THE BIG CHANGE — FINAL STRUCTURE

Every automatic ranking pool is defined by THREE things:

1. CATEGORY
2. BROAD POSITION
3. SPECIFIC POSITION

Example:

Elite
Attack
Right Winger

Therefore:

Mohamed Salah
Elite + Attack + Right Winger

can ONLY be automatically compared with:

Elite + Attack + Right Winger

He cannot automatically face:

Elite + Attack + Striker
Elite + Midfielder + Central Midfielder
Very Good + Attack + Right Winger
Good + Attack + Right Winger

etc.

============================================================

IMPORTANT

Ratings are GLOBAL.

Therefore a player can move between categories.

Example:

Very Good
8.50

wins H2Hs

8.98
still Very Good

then:

9.01
→ Elite

When a player enters a new category, their automatic
H2H process starts again inside that new category.

============================================================

AUTOMATIC H2H LIMIT

Maximum 6 automatic H2Hs per player per category.

Challenge mode is NOT restricted by this limit.

============================================================
*/


// ============================================================
// SETTINGS
// ============================================================

const SETTINGS = {

  minRating: 0,

  maxRating: 1000,

  startingUncertainty: 350,

  minimumUncertainty: 45,

  maxMovementPerH2H: 5,

  maximumH2Hs: 6,

};


// ============================================================
// CATEGORY STARTING RATINGS
// ============================================================

const CATEGORY_STARTING_RATINGS = {

  Legendary: 990,

  Elite: 939,

  'Very Good': 850,

  Good: 700,

  OK: 500,

  Bad: 200,

};


// ============================================================
// CATEGORY RANGES
// ============================================================

const CATEGORY_RANGES = {

  Legendary: {
    minimumScore: 9.80,
    maximumScore: 10.00,
  },

  Elite: {
    minimumScore: 9.00,
    maximumScore: 9.79,
  },

  'Very Good': {
    minimumScore: 8.00,
    maximumScore: 8.99,
  },

  Good: {
    minimumScore: 6.00,
    maximumScore: 7.99,
  },

  OK: {
    minimumScore: 4.00,
    maximumScore: 5.99,
  },

  Bad: {
    minimumScore: 0.00,
    maximumScore: 3.99,
  },

};


// ============================================================
// CATEGORY → STARTING RATING
// ============================================================

function categoryToStartingRating(category) {

  return (
    CATEGORY_STARTING_RATINGS[category] ??
    CATEGORY_STARTING_RATINGS.OK
  );

}


// ============================================================
// RATING → SCORE
// ============================================================

function ratingToScore(rating) {

  const numericRating =
    Number(rating);

  const safeRating =
    Number.isFinite(numericRating)
      ? Math.max(
          SETTINGS.minRating,
          Math.min(
            SETTINGS.maxRating,
            numericRating
          )
        )
      : 0;

  return Number(
    (safeRating / 100).toFixed(2)
  );

}


// ============================================================
// SCORE → CATEGORY
// ============================================================

function scoreToCategory(score) {

  const numericScore =
    Number(score) || 0;

  if (numericScore >= 9.80) {
    return 'Legendary';
  }

  if (numericScore >= 9.00) {
    return 'Elite';
  }

  if (numericScore >= 8.00) {
    return 'Very Good';
  }

  if (numericScore >= 6.00) {
    return 'Good';
  }

  if (numericScore >= 4.00) {
    return 'OK';
  }

  return 'Bad';

}


// ============================================================
// ADD DISPLAY INFORMATION
// ============================================================

function addDisplayInformation(player) {

  if (!player) {
    return null;
  }

  const score =
    ratingToScore(
      player.rating
    );

  const category =
    scoreToCategory(score);

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

  if (!player) {
    throw new Error(
      'FotRankr createPlayer: player is undefined.'
    );
  }

  const category =
    startingCategory ||
    player.category ||
    player.initialCategory ||
    'OK';

  const startingRating =
    categoryToStartingRating(
      category
    );

  const newPlayer = {

    id:
      player.id,

    name:
      player.name || 'Unknown Player',

    nation:
      player.nation || '',

    position:
      player.position || '',

    specificPosition:
      player.specificPosition || '',

    club:
      player.club || '',

    rating:
      startingRating,

    category,

    initialCategory:
      category,

    uncertainty:
      SETTINGS.startingUncertainty,

    comparisons:
      0,

    wins:
      0,

    losses:
      0,

    draws:
      0,

    isAnchor:
      false,

    isRanked:
      true,

    /*
    Number of automatic H2Hs performed
    in the player's CURRENT category.
    */

    h2hCount:
      0,

    /*
    Category in which h2hCount applies.
    */

    h2hCategory:
      category,

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
    `FotRankr: Unknown comparison result: ${result}`
  );

}


// ============================================================
// SAME RANKING POOL
// ============================================================
//
// This is extremely important.
//
// Two players belong to the same automatic H2H pool ONLY
// if all three match:
//
// CATEGORY
// POSITION
// SPECIFIC POSITION
//
// ============================================================

function sameRankingPool(
  playerA,
  playerB
) {

  if (!playerA || !playerB) {
    return false;
  }

  return (

    playerA.category ===
    playerB.category

    &&

    playerA.position ===
    playerB.position

    &&

    playerA.specificPosition ===
    playerB.specificPosition

  );

}


// ============================================================
// FIND BEST OPPONENT
// ============================================================
//
// Automatic H2Hs only.
//
// Pool:
//
// CATEGORY
// +
// POSITION
// +
// SPECIFIC POSITION
//
// ============================================================

function findBestOpponent(
  targetPlayer,
  opponents,
  comparisonHistory = []
) {

  if (!targetPlayer) {

    console.log(
      'FOTRANKR: No target player.'
    );

    return null;

  }

  if (
    !Array.isArray(opponents) ||
    opponents.length === 0
  ) {

    console.log(
      'FOTRANKR: No opponents available.'
    );

    return null;

  }


  // ----------------------------------------------------------
  // TARGET POOL
  // ----------------------------------------------------------

  const targetCategory =
    targetPlayer.category;

  const targetPosition =
    targetPlayer.position;
    console.log(
  'FOTRANKR H2H TARGET:',
  {
    player: targetPlayer.name,
    category: targetCategory,
    position: targetPlayer.position,
    specificPosition: targetPlayer.specificPosition,
    h2hCount: targetPlayer.h2hCount,
  }
);

  const targetSpecificPosition =
    targetPlayer.specificPosition;


  /*
  Safety check.

  A player without these fields should not enter
  an automatic H2H pool.
  */

  if (
    !targetCategory ||
    !targetPosition ||
    !targetSpecificPosition
  ) {

    console.log(
      'FOTRANKR: Target player missing ranking-pool data.',
      {
        player:
          targetPlayer.name,

        category:
          targetCategory,

        position:
          targetPosition,

        specificPosition:
          targetSpecificPosition,
      }
    );

    return null;

  }


  // ----------------------------------------------------------
  // CURRENT AUTOMATIC H2H COUNT
  // ----------------------------------------------------------

  const currentH2HCount =

    targetPlayer.h2hCategory ===
    targetCategory

      ? (
          targetPlayer.h2hCount ??
          0
        )

      : 0;


  // ----------------------------------------------------------
  // SIX H2H LIMIT
  // ----------------------------------------------------------

  if (
    currentH2HCount >=
    SETTINGS.maximumH2Hs
  ) {

    console.log(
      'FOTRANKR: Automatic H2H limit reached.',
      {
        player:
          targetPlayer.name,

        category:
          targetCategory,

        h2hCount:
          currentH2HCount,
      }
    );

    return null;

  }


  // ----------------------------------------------------------
  // BUILD SET OF ALREADY USED OPPONENTS
  // ----------------------------------------------------------

  const alreadyCompared =
    new Set();


  if (
    Array.isArray(comparisonHistory)
  ) {

    comparisonHistory.forEach(
      comparison => {

        if (!comparison) {
          return;
        }

        if (
          comparison.category !==
          targetCategory
        ) {

          return;

        }


        const playerA =
          String(
            comparison.playerA
          );

        const playerB =
          String(
            comparison.playerB
          );

        const targetId =
          String(
            targetPlayer.id
          );


        if (
          playerA ===
          targetId
        ) {

          alreadyCompared.add(
            playerB
          );

        }


        if (
          playerB ===
          targetId
        ) {

          alreadyCompared.add(
            playerA
          );

        }

      }
    );

  }


  // ----------------------------------------------------------
  // BUILD VALID OPPONENT POOL
  // ----------------------------------------------------------
  //
  // ALL THREE RESTRICTIONS ARE REQUIRED.
  //
  // ----------------------------------------------------------

  const availableOpponents =
    opponents.filter(
      opponent => {

        if (!opponent) {
          return false;
        }


        // Cannot play yourself.

        if (
          String(opponent.id) ===
          String(targetPlayer.id)
        ) {

          return false;

        }


        // Must be ranked.

        if (
          opponent.isRanked !== true &&
          opponent.isAnchor !== true
        ) {

          return false;

        }


        // ----------------------------------------------------
        // CATEGORY
        // ----------------------------------------------------

        if (
          opponent.category !==
          targetCategory
        ) {

          return false;

        }


        // ----------------------------------------------------
        // BROAD POSITION
        // ----------------------------------------------------

        if (
          opponent.position !==
          targetPosition
        ) {

          return false;

        }


        // ----------------------------------------------------
        // SPECIFIC POSITION
        // ----------------------------------------------------

        if (
          opponent.specificPosition !==
          targetSpecificPosition
        ) {

          return false;

        }


        // ----------------------------------------------------
        // NO REPEAT H2H
        // ----------------------------------------------------

        if (
          alreadyCompared.has(
            String(opponent.id)
          )
        ) {

          return false;

        }


        return true;

      }
    );


  // ----------------------------------------------------------
  // NO VALID OPPONENTS
  // ----------------------------------------------------------

  if (
    availableOpponents.length === 0
  ) {

    console.log(
      'FOTRANKR: No valid same-pool opponent.',
      {
        player:
          targetPlayer.name,

        category:
          targetCategory,

        position:
          targetPosition,

        specificPosition:
          targetSpecificPosition,
      }
    );

    return null;

  }


  // ----------------------------------------------------------
  // FIND BEST RATING MATCH
  // ----------------------------------------------------------
  //
  // We want an opponent whose rating is close to the
  // target's rating.
  //
  // As the database grows, this becomes increasingly useful
  // because there will be more players around every rating.
  //
  // ----------------------------------------------------------

  const targetRating =
    Number(
      targetPlayer.rating
    ) || 500;


  const sortedOpponents =
    [...availableOpponents].sort(
      (a, b) => {

        const ratingA =
          Number(a.rating) || 500;

        const ratingB =
          Number(b.rating) || 500;

        const distanceA =
          Math.abs(
            ratingA -
            targetRating
          );

        const distanceB =
          Math.abs(
            ratingB -
            targetRating
          );

        return (
          distanceA -
          distanceB
        );

      }
    );


  // ----------------------------------------------------------
  // SELECT CLOSEST INFORMATIVE OPPONENT
  // ----------------------------------------------------------

  const selectedOpponent =
    sortedOpponents[0];


  if (!selectedOpponent) {
    return null;
  }


  console.log(
    'FOTRANKR AUTOMATIC H2H SELECTED:',
    {
      player:
        targetPlayer.name,

      opponent:
        selectedOpponent.name,

      category:
        targetCategory,

      position:
        targetPosition,

      specificPosition:
        targetSpecificPosition,

      targetRating,

      opponentRating:
        selectedOpponent.rating,

      h2hCount:
        currentH2HCount,

      remainingOpponents:
        availableOpponents.length,
    }
  );


  return selectedOpponent;

}


// ============================================================
// UPDATE UNCERTAINTY
// ============================================================

function updateUncertainty(player) {

  const comparisons =
    player?.comparisons ?? 0;

  let reduction;

  if (
    comparisons < 2
  ) {

    reduction = 0.82;

  }

  else if (
    comparisons < 4
  ) {

    reduction = 0.88;

  }

  else {

    reduction = 0.93;

  }


  return Math.max(

    SETTINGS.minimumUncertainty,

    (
      player?.uncertainty ??
      SETTINGS.startingUncertainty
    ) *
    reduction

  );

}


// ============================================================
// COMPARE PLAYERS
// ============================================================
//
// IMPORTANT:
//
// Automatic H2H:
//
// CATEGORY must match
// POSITION must match
// SPECIFIC POSITION must match
//
// Manual Challenge:
//
// Can compare regardless of pool.
//
// ============================================================

function comparePlayers(
  playerA,
  playerB,
  result,
  isAutomatic = true
) {

  if (!playerA) {

    throw new Error(
      'FotRankr comparePlayers: playerA is undefined.'
    );

  }

  if (!playerB) {

    throw new Error(
      'FotRankr comparePlayers: playerB is undefined.'
    );

  }


  const outcome =
    normaliseResult(result);


  // ----------------------------------------------------------
  // AUTOMATIC POOL SAFETY
  // ----------------------------------------------------------

  if (
    isAutomatic &&
    !sameRankingPool(
      playerA,
      playerB
    )
  ) {

    throw new Error(

      `FotRankr H2H blocked: ` +

      `${playerA.name} (${playerA.category} / ` +
      `${playerA.position} / ` +
      `${playerA.specificPosition}) ` +

      `cannot automatically face ` +

      `${playerB.name} (${playerB.category} / ` +
      `${playerB.position} / ` +
      `${playerB.specificPosition}).`

    );

  }


  // ----------------------------------------------------------
  // RATINGS
  // ----------------------------------------------------------

  const ratingA =
    Number(
      playerA.rating
    ) || 500;

  const ratingB =
    Number(
      playerB.rating
    ) || 500;


  const comparisonsA =
    playerA.comparisons ?? 0;

  const comparisonsB =
    playerB.comparisons ?? 0;


  // ----------------------------------------------------------
  // EXPERIENCE
  // ----------------------------------------------------------

  const experienceFactorA =
    Math.max(
      0.45,
      1 -
      (
        comparisonsA *
        0.08
      )
    );


  const experienceFactorB =
    Math.max(
      0.45,
      1 -
      (
        comparisonsB *
        0.08
      )
    );


  // ----------------------------------------------------------
  // BASE MOVEMENT
  // ----------------------------------------------------------

  const baseMovementA =
    getTopEndMovement(
      ratingA
    );

  const baseMovementB =
    getTopEndMovement(
      ratingB
    );


  // ----------------------------------------------------------
  // RESULT MOVEMENT
  // ----------------------------------------------------------

  let changeA = 0;

  let changeB = 0;


  // ----------------------------------------------------------
  // DRAW
  // ----------------------------------------------------------

  if (
    outcome === 'DRAW'
  ) {

    const averageRating =
      (
        ratingA +
        ratingB
      ) / 2;


    changeA =
      (
        averageRating -
        ratingA
      ) *
      0.5;


    changeB =
      (
        averageRating -
        ratingB
      ) *
      0.5;

  }


  // ----------------------------------------------------------
  // A WINS
  // ----------------------------------------------------------

  else if (
    outcome === 'A'
  ) {

    const multiplier =
      getMovementMultiplier(
        ratingA,
        ratingB,
        true
      );


    changeA =
      baseMovementA *
      multiplier *
      experienceFactorA;


    changeB =
      -(
        baseMovementB *
        multiplier *
        experienceFactorB
      );

  }


  // ----------------------------------------------------------
  // B WINS
  // ----------------------------------------------------------

  else {

    const multiplier =
      getMovementMultiplier(
        ratingA,
        ratingB,
        false
      );


    changeA =
      -(
        baseMovementA *
        multiplier *
        experienceFactorA
      );


    changeB =
      baseMovementB *
      multiplier *
      experienceFactorB;

  }


  // ----------------------------------------------------------
  // NEW GLOBAL RATINGS
  // ----------------------------------------------------------

  let finalRatingA =
    Math.max(
      SETTINGS.minRating,
      Math.min(
        SETTINGS.maxRating,
        ratingA +
        changeA
      )
    );


  let finalRatingB =
    Math.max(
      SETTINGS.minRating,
      Math.min(
        SETTINGS.maxRating,
        ratingB +
        changeB
      )
    );


  // ----------------------------------------------------------
  // WINNER MUST FINISH ABOVE LOSER
  // ----------------------------------------------------------
  //
  // This keeps the actual ranking order consistent with
  // the user's decision.
  //
  // ----------------------------------------------------------

  if (
    outcome === 'A' &&
    finalRatingA <= finalRatingB
  ) {

    finalRatingA =
      Math.min(
        SETTINGS.maxRating,
        finalRatingB + 0.01
      );

  }


  if (
    outcome === 'B' &&
    finalRatingB <= finalRatingA
  ) {

    finalRatingB =
      Math.min(
        SETTINGS.maxRating,
        finalRatingA + 0.01
      );

  }


  // ----------------------------------------------------------
  // NEW SCORES
  // ----------------------------------------------------------

  const scoreA =
    ratingToScore(
      finalRatingA
    );

  const scoreB =
    ratingToScore(
      finalRatingB
    );


  // ----------------------------------------------------------
  // NEW CATEGORIES
  // ----------------------------------------------------------

  const newCategoryA =
    scoreToCategory(
      scoreA
    );

  const newCategoryB =
    scoreToCategory(
      scoreB
    );


  // ----------------------------------------------------------
  // H2H COUNTERS
  // ----------------------------------------------------------
  //
  // If a player remains in the same category:
  //
  //     count + 1
  //
  // If a player moves category:
  //
  //     count resets to 1
  //
  // ----------------------------------------------------------

  const newH2HCountA =
    isAutomatic

      ? (
          playerA.h2hCategory ===
          newCategoryA

            ? (
                playerA.h2hCount ??
                0
              ) + 1

            : 1
        )

      : (
          playerA.h2hCount ??
          0
        );


  const newH2HCountB =
    isAutomatic

      ? (
          playerB.h2hCategory ===
          newCategoryB

            ? (
                playerB.h2hCount ??
                0
              ) + 1

            : 1
        )

      : (
          playerB.h2hCount ??
          0
        );


  // ----------------------------------------------------------
  // UPDATED PLAYER A
  // ----------------------------------------------------------

  const updatedA = {

    ...playerA,

    rating:
      finalRatingA,

    category:
      newCategoryA,

    score:
      scoreA,

    uncertainty:
      updateUncertainty(
        playerA
      ),

    comparisons:
      comparisonsA + 1,

    h2hCount:
      newH2HCountA,

    h2hCategory:
      newCategoryA,

    wins:
      (
        playerA.wins ??
        0
      ) +
      (
        outcome === 'A'
          ? 1
          : 0
      ),

    losses:
      (
        playerA.losses ??
        0
      ) +
      (
        outcome === 'B'
          ? 1
          : 0
      ),

    draws:
      (
        playerA.draws ??
        0
      ) +
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
      finalRatingB,

    category:
      newCategoryB,

    score:
      scoreB,

    uncertainty:
      updateUncertainty(
        playerB
      ),

    comparisons:
      comparisonsB + 1,

    h2hCount:
      newH2HCountB,

    h2hCategory:
      newCategoryB,

    wins:
      (
        playerB.wins ??
        0
      ) +
      (
        outcome === 'B'
          ? 1
          : 0
      ),

    losses:
      (
        playerB.losses ??
        0
      ) +
      (
        outcome === 'A'
          ? 1
          : 0
      ),

    draws:
      (
        playerB.draws ??
        0
      ) +
      (
        outcome === 'DRAW'
          ? 1
          : 0
      ),

  };


  // ----------------------------------------------------------
  // RETURN
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

  };

}


// ============================================================
// MOVEMENT MULTIPLIER
// ============================================================
//
// Unexpected results cause greater movement.
//
// Expected results cause smaller movement.
//
// ============================================================

function getMovementMultiplier(
  ratingA,
  ratingB,
  winnerIsA
) {

  const gap =
    Math.abs(
      ratingA -
      ratingB
    );


  let expectedMultiplier;


  if (
    gap <= 25
  ) {

    expectedMultiplier = 1;

  }

  else if (
    gap <= 75
  ) {

    expectedMultiplier = 0.90;

  }

  else if (
    gap <= 150
  ) {

    expectedMultiplier = 0.75;

  }

  else if (
    gap <= 250
  ) {

    expectedMultiplier = 0.60;

  }

  else {

    expectedMultiplier = 0.50;

  }


  const higherRatedPlayerIsA =
    ratingA >= ratingB;


  const expectedWinnerIsA =
    higherRatedPlayerIsA;


  const expectedResult =
    winnerIsA ===
    expectedWinnerIsA;


  if (
    expectedResult
  ) {

    return expectedMultiplier;

  }


  return Math.min(
    1.5,
    2 -
    expectedMultiplier
  );

}


// ============================================================
// TOP-END MOVEMENT
// ============================================================

function getTopEndMovement(
  rating
) {

  if (
    rating >= 998
  ) {

    return 0.25;

  }


  if (
    rating >= 990
  ) {

    return 1;

  }


  if (
    rating >= 980
  ) {

    return 2;

  }


  if (
    rating >= 950
  ) {

    return 3;

  }


  return SETTINGS.maxMovementPerH2H;

}


// ============================================================
// CONFIDENCE
// ============================================================

function getConfidence(
  player
) {

  if (!player) {
    return 0;
  }


  const uncertainty =
    player.uncertainty ??
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
  Anchors establish the starting point and don't need
  automatic calibration.
  */

  if (
    player.isAnchor
  ) {

    return false;

  }


  return (

    (
      player.h2hCount ??
      0
    )

    <

    SETTINGS.maximumH2Hs

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
