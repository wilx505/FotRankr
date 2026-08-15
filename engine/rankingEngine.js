/*
============================================================
FOTRANKR RANKING ENGINE
============================================================

THE BIG CHANGE

Categories are H2H pools.

A player's category determines who they can initially
face in a head-to-head.

However, ratings are GLOBAL.

Therefore:

Very Good players can rise into Elite.
Elite players can fall into Very Good.
Very Good players can fall into Good.
etc.

When a player crosses into a new category, their next
automatic H2H process begins inside that new category.

The 6 H2H limit applies to the automatic H2H process
within the player's CURRENT category.

Challenge mode is NOT capped by this limit.

============================================================
*/

const SETTINGS = {

  minRating: 0,
  maxRating: 1000,

  startingUncertainty: 350,
  minimumUncertainty: 45,

  maxMovementPerH2H: 90,

  maximumH2Hs: 6,

};


// ============================================================
// CATEGORY STARTING RATINGS
// ============================================================
//
// These are GLOBAL ratings.
//
// They correspond approximately to:
//
// Legendary = 9.90
// Elite     = 9.39
// Very Good = 8.50
// Good      = 7.00
// OK        = 5.00
// Bad       = 2.00
//
// A player can move across these boundaries.
//

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
//
// GLOBAL SCALE.
//
// 0    = 0.00
// 200  = 2.00
// 500  = 5.00
// 700  = 7.00
// 850  = 8.50
// 939  = 9.39
// 980  = 9.80
// 1000 = 10.00
//
// This is what allows players to cross categories.
//

function ratingToScore(
  rating,
  category = null
) {

  const safeRating =
    Math.max(
      0,
      Math.min(
        1000,
        Number(rating) || 0
      )
    );

  const categoryRanges = {

    Legendary: {
      minimum: 9.80,
      maximum: 10.00,
    },

    Elite: {
      minimum: 9.00,
      maximum: 9.79,
    },

    'Very Good': {
      minimum: 8.00,
      maximum: 8.99,
    },

    Good: {
      minimum: 6.00,
      maximum: 7.99,
    },

    OK: {
      minimum: 4.00,
      maximum: 5.99,
    },

    Bad: {
      minimum: 0.00,
      maximum: 3.99,
    },

  };

  const range =
    categoryRanges[category] ||
    categoryRanges.OK;

  const score =
    range.minimum +
    (
      safeRating / 1000
    ) *
    (
      range.maximum -
      range.minimum
    );

  return Number(
    score.toFixed(2)
  );

}


// ============================================================
// SCORE → CATEGORY
// ============================================================

function scoreToCategory(score) {

  if (score >= 9.80) {
    return 'Legendary';
  }

  if (score >= 9.00) {
    return 'Elite';
  }

  if (score >= 8.00) {
    return 'Very Good';
  }

  if (score >= 6.00) {
    return 'Good';
  }

  if (score >= 4.00) {
    return 'OK';
  }

  return 'Bad';

}


// ============================================================
// ADD DISPLAY INFORMATION
// ============================================================
//
// IMPORTANT:
//
// Category is now determined from the GLOBAL rating.
//
// This means category can change after an H2H.
//

function addDisplayInformation(player) {

  const category =
    player.category ||
    player.initialCategory ||
    'OK';

  const score =
    ratingToScore(
      player.rating,
      category
    );

  return {

    ...player,

    category,

    score,

  };

}


// ============================================================
// CREATE PLAYER
// ============================================================

function createPlayer(
  player,
  startingCategory = null
) {

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
      player.name,

    nation:
      player.nation || '',

    position:
      player.position || '',

    specificPosition:
      player.specificPosition || '',

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

    // Number of automatic H2Hs in the
    // player's CURRENT category.
    h2hCount:
      0,

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
    `Unknown comparison result: ${result}`
  );

}


// ============================================================
// FIND BEST OPPONENT
// ============================================================
//
// Same CURRENT category only.
//
// This is the automatic H2H process.
//
// Challenge mode can bypass this limit.
//

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


  const targetCategory =
    targetPlayer.category;


  // ----------------------------------------------------------
  // H2H COUNT
  // ----------------------------------------------------------

  const currentH2HCount =
    targetPlayer.h2hCategory === targetCategory
      ? (targetPlayer.h2hCount ?? 0)
      : 0;


  if (
    currentH2HCount >=
    SETTINGS.maximumH2Hs
  ) {

    return null;

  }


  // ----------------------------------------------------------
  // FIND EXISTING H2Hs
  // ----------------------------------------------------------

  const alreadyCompared =
    new Set();


  comparisonHistory.forEach(
    comparison => {

      if (
        comparison.category !==
        targetCategory
      ) {

        return;

      }


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


  // ----------------------------------------------------------
  // SAME CATEGORY ONLY
  // ----------------------------------------------------------

  const availableOpponents =
    opponents.filter(
      opponent => {

        if (
          String(opponent.id) ===
          String(targetPlayer.id)
        ) {

          return false;

        }


        if (
          opponent.category !==
          targetCategory
        ) {

          return false;

        }


        if (
          opponent.isRanked !== true &&
          opponent.isAnchor !== true
        ) {

          return false;

        }


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


  if (
    availableOpponents.length === 0
  ) {

    return null;

  }


  // ----------------------------------------------------------
  // CLOSEST PLAYER
  // ----------------------------------------------------------

  availableOpponents.sort(
    (a, b) => {

      const differenceA =
        Math.abs(
          (a.rating ?? 500) -
          (targetPlayer.rating ?? 500)
        );


      const differenceB =
        Math.abs(
          (b.rating ?? 500) -
          (targetPlayer.rating ?? 500)
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
// UPDATE UNCERTAINTY
// ============================================================

function updateUncertainty(player) {

  const comparisons =
    player.comparisons ?? 0;


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
      player.uncertainty ??
      SETTINGS.startingUncertainty
    ) *
    reduction
  );

}


// ============================================================
// COMPARE PLAYERS
// ============================================================
//
// Players MUST begin in the same category.
//
// AFTER the comparison, however, either player can
// cross into another category.
//

function comparePlayers(
  playerA,
  playerB,
  result
) {

  const outcome =
    normaliseResult(result);


  const categoryA =
    playerA.category;

  const categoryB =
    playerB.category;


  // ----------------------------------------------------------
  // SAFETY CHECK
  // ----------------------------------------------------------

  if (
    categoryA !==
    categoryB
  ) {

    throw new Error(
      `FotRankr H2H blocked: ${playerA.name} is ${categoryA} but ${playerB.name} is ${categoryB}.`
    );

  }


  const ratingA =
    playerA.rating ?? 500;

  const ratingB =
    playerB.rating ?? 500;


  const comparisonsA =
    playerA.comparisons ?? 0;

  const comparisonsB =
    playerB.comparisons ?? 0;


  // ----------------------------------------------------------
  // MOVEMENT
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


  const baseMovement =
    SETTINGS.maxMovementPerH2H;


  let changeA = 0;
  let changeB = 0;


  // ----------------------------------------------------------
  // DRAW
  // ----------------------------------------------------------

  if (
    outcome === 'DRAW'
  ) {

    const difference =
      Math.abs(
        ratingA -
        ratingB
      );


    const adjustment =
      Math.min(
        25,
        difference *
        0.08
      );


    if (
      ratingA >
      ratingB
    ) {

      changeA =
        -adjustment;

      changeB =
        adjustment;

    }
    else {

      changeA =
        adjustment;

      changeB =
        -adjustment;

    }

  }


  // ----------------------------------------------------------
  // A WINS
  // ----------------------------------------------------------

  else if (
    outcome === 'A'
  ) {

    changeA =
      baseMovement *
      experienceFactorA;

    changeB =
      -(
        baseMovement *
        experienceFactorB
      );

  }


  // ----------------------------------------------------------
  // B WINS
  // ----------------------------------------------------------

  else {

    changeA =
      -(
        baseMovement *
        experienceFactorA
      );

    changeB =
      baseMovement *
      experienceFactorB;

  }


  // ----------------------------------------------------------
  // GLOBAL RATING
  // ----------------------------------------------------------

  const newRatingA =
    Math.max(
      SETTINGS.minRating,
      Math.min(
        SETTINGS.maxRating,
        ratingA +
        changeA
      )
    );


  const newRatingB =
    Math.max(
      SETTINGS.minRating,
      Math.min(
        SETTINGS.maxRating,
        ratingB +
        changeB
      )
    );

  // ----------------------------------------------------------
  // CATEGORY IS LOCKED
  // ----------------------------------------------------------
  //
  // The user selected the category.
  //
  // H2Hs only move players INSIDE that category.
  // An H2H can never change a player's category.
  //
  // ----------------------------------------------------------

  const scoreA =
  ratingToScore(
    newRatingA
  );

const scoreB =
  ratingToScore(
    newRatingB
  );

const newCategoryA =
  scoreToCategory(
    scoreA
  );

const newCategoryB =
  scoreToCategory(
    scoreB
  );

  // ----------------------------------------------------------
  // CATEGORY H2H COUNTER
  // ----------------------------------------------------------
  //
  // Count the H2H within the player's current category.
  //
  // IMPORTANT:
  // This counter is for the automatic ranking process.
  // It does NOT cap the Challenge feature.
  //
  // ----------------------------------------------------------

  const newH2HCountA =
    (playerA.h2hCount ?? 0) + 1;

  const newH2HCountB =
    (playerB.h2hCount ?? 0) + 1;
 


  // ----------------------------------------------------------
  // UPDATED A
  // ----------------------------------------------------------

  const updatedA = {

    ...playerA,

    rating:
      newRatingA,

    category:
      newCategoryA,

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


  // ----------------------------------------------------------
  // UPDATED B
  // ----------------------------------------------------------

  const updatedB = {

    ...playerB,

    rating:
      newRatingB,

    category:
      newCategoryB,

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
// CONFIDENCE
// ============================================================

function getConfidence(player) {

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

function shouldContinueComparing(player) {

  if (!player) {
    return false;
  }


  if (player.isAnchor) {
    return false;
  }


  return (
    (player.h2hCount ?? 0) <
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
